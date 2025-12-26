#!/bin/bash
# 🚀 OF Scraper - DEPLOY ALL (App Runner + Redis + Test)
# Run from: of-scraper-service/

set -e

REGION="us-east-2"
SERVICE_NAME="huntaze-of-scraper"
ECR_REPO="317805897534.dkr.ecr.us-east-2.amazonaws.com/huntaze-of-scraper"
AWS_ACCOUNT="317805897534"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🛡️  OF Scraper - FULL DEPLOYMENT                           ║"
echo "║  App Runner + BullMQ + Stealth Mode                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: Build & Push Docker Image
# ============================================================
echo "📋 Step 1: Building Docker image..."

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO

# Create ECR repo if not exists
aws ecr describe-repositories --repository-names huntaze-of-scraper --region $REGION 2>/dev/null || \
    aws ecr create-repository --repository-name huntaze-of-scraper --region $REGION

# Build and push
echo "   Building image..."
docker build --platform linux/amd64 -t $ECR_REPO:latest .

echo "   Pushing to ECR..."
docker push $ECR_REPO:latest

echo "✅ Docker image pushed"
echo ""

# ============================================================
# STEP 2: Create AWS ElastiCache Redis (Serverless)
# ============================================================
echo "📋 Step 2: Setting up AWS ElastiCache Redis..."

REDIS_CLUSTER_NAME="huntaze-redis"
REDIS_SG_NAME="huntaze-redis-sg"

# Check if Redis already exists
EXISTING_REDIS=$(aws elasticache describe-serverless-caches --region $REGION \
    --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].ServerlessCacheName" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_REDIS" ] && [ "$EXISTING_REDIS" != "None" ]; then
    echo "   Redis cluster already exists: $REDIS_CLUSTER_NAME"
    
    # Get endpoint
    REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches --region $REGION \
        --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].Endpoint.Address" \
        --output text)
    REDIS_PORT=$(aws elasticache describe-serverless-caches --region $REGION \
        --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].Endpoint.Port" \
        --output text)
    
    REDIS_URL="rediss://${REDIS_ENDPOINT}:${REDIS_PORT}"
else
    echo "   Creating ElastiCache Serverless Redis..."
    
    # Get default VPC
    VPC_ID=$(aws ec2 describe-vpcs --region $REGION \
        --filters "Name=isDefault,Values=true" \
        --query "Vpcs[0].VpcId" --output text)
    
    # Get subnets
    SUBNET_IDS=$(aws ec2 describe-subnets --region $REGION \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --query "Subnets[*].SubnetId" --output text | tr '\t' ',')
    
    # Create security group for Redis
    SG_ID=$(aws ec2 describe-security-groups --region $REGION \
        --filters "Name=group-name,Values=$REDIS_SG_NAME" \
        --query "SecurityGroups[0].GroupId" --output text 2>/dev/null || echo "None")
    
    if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
        echo "   Creating security group..."
        SG_ID=$(aws ec2 create-security-group --region $REGION \
            --group-name "$REDIS_SG_NAME" \
            --description "Security group for Huntaze Redis" \
            --vpc-id "$VPC_ID" \
            --query "GroupId" --output text)
        
        # Allow Redis port from anywhere (App Runner needs this)
        aws ec2 authorize-security-group-ingress --region $REGION \
            --group-id "$SG_ID" \
            --protocol tcp --port 6379 --cidr 0.0.0.0/0
    fi
    
    echo "   Security Group: $SG_ID"
    
    # Create ElastiCache Serverless
    aws elasticache create-serverless-cache --region $REGION \
        --serverless-cache-name "$REDIS_CLUSTER_NAME" \
        --engine redis \
        --cache-usage-limits '{
            "DataStorage": {"Maximum": 1, "Unit": "GB"},
            "ECPUPerSecond": {"Maximum": 1000}
        }' \
        --security-group-ids "$SG_ID" \
        --subnet-ids $(echo $SUBNET_IDS | tr ',' ' ') \
        --output text > /dev/null
    
    echo "   Waiting for Redis to be available (2-3 min)..."
    
    # Wait for Redis to be available
    STATUS="creating"
    while [ "$STATUS" != "available" ]; do
        sleep 15
        STATUS=$(aws elasticache describe-serverless-caches --region $REGION \
            --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].Status" \
            --output text 2>/dev/null || echo "creating")
        echo "   Status: $STATUS"
    done
    
    # Get endpoint
    REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches --region $REGION \
        --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].Endpoint.Address" \
        --output text)
    REDIS_PORT=$(aws elasticache describe-serverless-caches --region $REGION \
        --query "ServerlessCaches[?ServerlessCacheName=='$REDIS_CLUSTER_NAME'].Endpoint.Port" \
        --output text)
    
    REDIS_URL="rediss://${REDIS_ENDPOINT}:${REDIS_PORT}"
fi

echo "✅ Redis ready: $REDIS_URL"
echo ""

# ============================================================
# STEP 3: Create/Update App Runner Service
# ============================================================
echo "📋 Step 3: Deploying to App Runner..."

# Check if service exists
EXISTING_ARN=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ARN" ] && [ "$EXISTING_ARN" != "None" ]; then
    echo "   Service exists, updating..."
    
    aws apprunner update-service --region $REGION \
        --service-arn "$EXISTING_ARN" \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'"$ECR_REPO:latest"'",
                "ImageRepositoryType": "ECR",
                "ImageConfiguration": {
                    "Port": "8080",
                    "RuntimeEnvironmentVariables": {
                        "NODE_ENV": "production",
                        "REDIS_URL": "'"$REDIS_URL"'"
                    }
                }
            },
            "AutoDeploymentsEnabled": false,
            "AuthenticationConfiguration": {
                "AccessRoleArn": "arn:aws:iam::'"$AWS_ACCOUNT"':role/AppRunnerECRAccessRole"
            }
        }' \
        --output text > /dev/null
    
    SERVICE_ARN="$EXISTING_ARN"
else
    echo "   Creating new service..."
    
    # Create IAM role for ECR access if not exists
    aws iam get-role --role-name AppRunnerECRAccessRole 2>/dev/null || \
    aws iam create-role --role-name AppRunnerECRAccessRole \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "build.apprunner.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }' 2>/dev/null || true
    
    aws iam attach-role-policy --role-name AppRunnerECRAccessRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess 2>/dev/null || true
    
    sleep 5
    
    SERVICE_ARN=$(aws apprunner create-service --region $REGION \
        --service-name "$SERVICE_NAME" \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "'"$ECR_REPO:latest"'",
                "ImageRepositoryType": "ECR",
                "ImageConfiguration": {
                    "Port": "8080",
                    "RuntimeEnvironmentVariables": {
                        "NODE_ENV": "production",
                        "REDIS_URL": "'"$REDIS_URL"'"
                    }
                }
            },
            "AutoDeploymentsEnabled": false,
            "AuthenticationConfiguration": {
                "AccessRoleArn": "arn:aws:iam::'"$AWS_ACCOUNT"':role/AppRunnerECRAccessRole"
            }
        }' \
        --instance-configuration '{
            "Cpu": "1024",
            "Memory": "2048"
        }' \
        --health-check-configuration '{
            "Protocol": "HTTP",
            "Path": "/health",
            "Interval": 10,
            "Timeout": 5,
            "HealthyThreshold": 1,
            "UnhealthyThreshold": 5
        }' \
        --query 'Service.ServiceArn' \
        --output text)
fi

echo "   Service ARN: $SERVICE_ARN"
echo ""

# ============================================================
# STEP 4: Wait for deployment
# ============================================================
echo "📋 Step 4: Waiting for deployment (3-5 min for Playwright)..."

STATUS="OPERATION_IN_PROGRESS"
while [ "$STATUS" = "OPERATION_IN_PROGRESS" ]; do
    sleep 15
    STATUS=$(aws apprunner list-services --region $REGION \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].Status" \
        --output text 2>/dev/null || echo "UNKNOWN")
    echo "   Status: $STATUS"
done

if [ "$STATUS" != "RUNNING" ]; then
    echo "❌ Deployment failed. Status: $STATUS"
    echo "   Check logs: aws apprunner list-operations --service-arn $SERVICE_ARN --region $REGION"
    exit 1
fi

# Get service URL
SERVICE_URL=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" \
    --output text)

echo "✅ Service is RUNNING!"
echo "   URL: https://$SERVICE_URL"
echo ""

# ============================================================
# STEP 5: Test health endpoint
# ============================================================
echo "📋 Step 5: Testing health endpoint..."
sleep 5

HEALTH=$(curl -s "https://$SERVICE_URL/health" 2>/dev/null || echo '{"error":"timeout"}')
echo "   Response: $HEALTH"

if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check may need a moment. Try again in 30s."
fi
echo ""

# ============================================================
# STEP 6: Update .env.local
# ============================================================
echo "📋 Step 6: Updating .env.local..."

ENV_FILE="../.env.local"

# Update or add REDIS_URL
if grep -q "^REDIS_URL=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^REDIS_URL=.*|REDIS_URL=$REDIS_URL|" "$ENV_FILE"
else
    echo "" >> "$ENV_FILE"
    echo "# Redis for BullMQ (Upstash)" >> "$ENV_FILE"
    echo "REDIS_URL=$REDIS_URL" >> "$ENV_FILE"
fi

# Update OF_SCRAPER_WORKER_URL
if grep -q "^OF_SCRAPER_WORKER_URL=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^OF_SCRAPER_WORKER_URL=.*|OF_SCRAPER_WORKER_URL=https://$SERVICE_URL|" "$ENV_FILE"
fi

echo "✅ .env.local updated"
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE!                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 Service URL: https://$SERVICE_URL"
echo "🔴 Redis: AWS ElastiCache Serverless (us-east-2)"
echo "🛡️  Mode: Stealth + BullMQ Async"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ADD TO VERCEL (Dashboard → Settings → Environment Variables):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "OF_SCRAPER_WORKER_URL=https://$SERVICE_URL"
echo "REDIS_URL=$REDIS_URL"
echo "SCRAPER_CALLBACK_SECRET=huntaze-scraper-callback-2025"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Test commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# Health check"
echo "curl https://$SERVICE_URL/health"
echo ""
echo "# Test scrape (needs valid OF cookies)"
echo "curl -X POST https://$SERVICE_URL/scrape \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"cookies\":\"sess=xxx\",\"endpoint\":\"/api2/v2/users/me\"}'"
echo ""
