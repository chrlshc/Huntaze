#!/bin/bash
# ============================================================================
# Huntaze Beta - Script de Déploiement Automatisé
# ============================================================================
# Ce script déploie l'infrastructure complète Huntaze Beta sur AWS + Vercel
# Budget: $64-87/mois
# Durée: ~30-45 minutes
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-2"
PROJECT_NAME="huntaze-beta"
ACCOUNT_ID="317805897534"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 n'est pas installé. Installez-le et réessayez."
        exit 1
    fi
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

log_info "Vérification des pré-requis..."

check_command aws
check_command node
check_command npm
check_command psql
check_command redis-cli
check_command vercel

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials non configurées. Exécutez: aws configure"
    exit 1
fi

log_success "Tous les pré-requis sont installés"

# ============================================================================
# Phase 1: Generate Secrets
# ============================================================================

log_info "Phase 1: Génération des secrets..."

DB_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

log_success "Secrets générés"

# ============================================================================
# Phase 2: Create RDS PostgreSQL
# ============================================================================

log_info "Phase 2: Création RDS PostgreSQL..."

# Check if RDS already exists
if aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --region $REGION &> /dev/null; then
    log_warning "RDS ${PROJECT_NAME}-db existe déjà, skip..."
else
    aws rds create-db-instance \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --db-instance-class db.t4g.micro \
        --engine postgres \
        --engine-version 16.1 \
        --master-username huntaze \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp3 \
        --storage-encrypted \
        --backup-retention-period 7 \
        --publicly-accessible \
        --region $REGION \
        --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta \
        > /dev/null

    log_info "Attente RDS disponible (5-10 min)..."
    aws rds wait db-instance-available \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --region $REGION
fi

# Get RDS endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $REGION)

DATABASE_URL="postgresql://huntaze:$DB_PASSWORD@$DB_ENDPOINT:5432/huntaze"

log_success "RDS créé: $DB_ENDPOINT"

# ============================================================================
# Phase 3: Create ElastiCache Redis
# ============================================================================

log_info "Phase 3: Création ElastiCache Redis..."

# Check if Redis already exists
if aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --region $REGION &> /dev/null; then
    log_warning "Redis ${PROJECT_NAME}-redis existe déjà, skip..."
else
    aws elasticache create-cache-cluster \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --cache-node-type cache.t4g.micro \
        --engine redis \
        --engine-version 7.1 \
        --num-cache-nodes 1 \
        --region $REGION \
        --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta \
        > /dev/null

    log_info "Attente Redis disponible (5-10 min)..."
    aws elasticache wait cache-cluster-available \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --region $REGION
fi

# Get Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text \
    --region $REGION)

REDIS_URL="redis://$REDIS_ENDPOINT:6379"

log_success "Redis créé: $REDIS_ENDPOINT"

# ============================================================================
# Phase 4: Create S3 Bucket
# ============================================================================

log_info "Phase 4: Création S3 bucket..."

BUCKET_NAME="${PROJECT_NAME}-assets"

# Check if bucket exists
if aws s3 ls s3://$BUCKET_NAME 2>/dev/null; then
    log_warning "Bucket $BUCKET_NAME existe déjà, skip..."
else
    aws s3 mb s3://$BUCKET_NAME --region $REGION
fi

# Configure CORS
cat > /tmp/s3-cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.huntaze.com", "https://*.vercel.app"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
    --bucket $BUCKET_NAME \
    --cors-configuration file:///tmp/s3-cors.json \
    --region $REGION

# Configure lifecycle
cat > /tmp/s3-lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": { "Days": 7 }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET_NAME \
    --lifecycle-configuration file:///tmp/s3-lifecycle.json \
    --region $REGION

log_success "S3 bucket créé: $BUCKET_NAME"

# ============================================================================
# Phase 5: Configure Security Groups
# ============================================================================

log_info "Phase 5: Configuration Security Groups..."

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text \
    --region $REGION)

# Check if security group exists
SG_NAME="${PROJECT_NAME}-db-redis"
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    # Create security group
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Allow PostgreSQL and Redis from anywhere (beta only)" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' \
        --output text)

    # Allow PostgreSQL (5432)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0 \
        --region $REGION

    # Allow Redis (6379)
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 6379 \
        --cidr 0.0.0.0/0 \
        --region $REGION

    log_success "Security Group créé: $SG_ID"
else
    log_warning "Security Group $SG_NAME existe déjà: $SG_ID"
fi

# Apply to RDS
aws rds modify-db-instance \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --vpc-security-group-ids $SG_ID \
    --apply-immediately \
    --region $REGION \
    > /dev/null

# Apply to Redis
aws elasticache modify-cache-cluster \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --security-group-ids $SG_ID \
    --apply-immediately \
    --region $REGION \
    > /dev/null

log_success "Security Groups appliqués"

# ============================================================================
# Phase 6: Deploy AI Router Lambda
# ============================================================================

log_info "Phase 6: Déploiement AI Router Lambda..."

# Check if Azure credentials are set
if [ -z "$AZURE_AI_CHAT_ENDPOINT" ] || [ -z "$AZURE_AI_CHAT_KEY" ]; then
    log_warning "AZURE_AI_CHAT_ENDPOINT ou AZURE_AI_CHAT_KEY non définis"
    log_warning "Le AI Router ne sera pas déployé. Définissez ces variables et relancez."
else
    # Create IAM role if not exists
    LAMBDA_ROLE_NAME="HuntazeLambdaAIRouterRole"
    if aws iam get-role --role-name $LAMBDA_ROLE_NAME &> /dev/null; then
        log_warning "IAM Role $LAMBDA_ROLE_NAME existe déjà"
    else
        cat > /tmp/lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

        aws iam create-role \
            --role-name $LAMBDA_ROLE_NAME \
            --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
            --region $REGION \
            > /dev/null

        aws iam attach-role-policy \
            --role-name $LAMBDA_ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --region $REGION

        log_success "IAM Role créé: $LAMBDA_ROLE_NAME"
        
        # Wait for role to propagate
        log_info "Attente propagation IAM (10 sec)..."
        sleep 10
    fi

    LAMBDA_ROLE_ARN=$(aws iam get-role \
        --role-name $LAMBDA_ROLE_NAME \
        --query 'Role.Arn' \
        --output text)

    # Build Lambda package
    log_info "Build Lambda package..."
    LAMBDA_BUILD_DIR="/tmp/lambda-ai-router-$$"
    mkdir -p $LAMBDA_BUILD_DIR
    
    # Copy AI Router code
    cp -r lib/ai/router/* $LAMBDA_BUILD_DIR/
    
    # Create lambda_handler.py
    cat > $LAMBDA_BUILD_DIR/lambda_handler.py <<'EOF'
from mangum import Mangum
from main import app

# Wrapper Lambda
handler = Mangum(app, lifespan="off")
EOF

    # Install dependencies
    cd $LAMBDA_BUILD_DIR
    pip install -r requirements.txt -t . --platform manylinux2014_x86_64 --only-binary=:all: --quiet
    
    # Create ZIP
    zip -r lambda-ai-router.zip . -x "*.pyc" -x "__pycache__/*" > /dev/null
    
    cd - > /dev/null

    # Create or update Lambda function
    LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-ai-router"
    if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION &> /dev/null; then
        log_warning "Lambda $LAMBDA_FUNCTION_NAME existe déjà, mise à jour..."
        aws lambda update-function-code \
            --function-name $LAMBDA_FUNCTION_NAME \
            --zip-file fileb://$LAMBDA_BUILD_DIR/lambda-ai-router.zip \
            --region $REGION \
            > /dev/null
    else
        aws lambda create-function \
            --function-name $LAMBDA_FUNCTION_NAME \
            --runtime python3.11 \
            --role $LAMBDA_ROLE_ARN \
            --handler lambda_handler.handler \
            --zip-file fileb://$LAMBDA_BUILD_DIR/lambda-ai-router.zip \
            --timeout 30 \
            --memory-size 512 \
            --environment Variables="{AZURE_AI_CHAT_ENDPOINT=$AZURE_AI_CHAT_ENDPOINT,AZURE_AI_CHAT_KEY=$AZURE_AI_CHAT_KEY}" \
            --region $REGION \
            > /dev/null
    fi

    # Cleanup
    rm -rf $LAMBDA_BUILD_DIR

    log_success "Lambda AI Router déployée"

    # Create API Gateway
    API_NAME="${PROJECT_NAME}-ai-router"
    API_ID=$(aws apigatewayv2 get-apis \
        --query "Items[?Name=='$API_NAME'].ApiId" \
        --output text \
        --region $REGION)

    if [ -z "$API_ID" ] || [ "$API_ID" == "None" ]; then
        API_ID=$(aws apigatewayv2 create-api \
            --name $API_NAME \
            --protocol-type HTTP \
            --target arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$LAMBDA_FUNCTION_NAME \
            --query 'ApiId' \
            --output text \
            --region $REGION)

        # Give API Gateway permission to invoke Lambda
        aws lambda add-permission \
            --function-name $LAMBDA_FUNCTION_NAME \
            --statement-id apigateway-invoke \
            --action lambda:InvokeFunction \
            --principal apigateway.amazonaws.com \
            --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*" \
            --region $REGION \
            > /dev/null

        log_success "API Gateway créé: $API_ID"
    else
        log_warning "API Gateway $API_NAME existe déjà: $API_ID"
    fi

    AI_ROUTER_URL=$(aws apigatewayv2 get-apis \
        --query "Items[?Name=='$API_NAME'].ApiEndpoint" \
        --output text \
        --region $REGION)

    log_success "AI Router URL: $AI_ROUTER_URL"
fi

# ============================================================================
# Phase 7: Save Environment Variables
# ============================================================================

log_info "Phase 7: Sauvegarde des variables d'environnement..."

cat > .env.production.local <<EOF
# ============================================================================
# Huntaze Beta - Production Environment Variables
# Generated: $(date)
# ============================================================================

# Database
DATABASE_URL="$DATABASE_URL"
REDIS_URL="$REDIS_URL"

# Auth
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
ENCRYPTION_KEY="$ENCRYPTION_KEY"

# AWS
AWS_REGION="$REGION"
AWS_S3_BUCKET="$BUCKET_NAME"
CDN_URL="https://$BUCKET_NAME.s3.$REGION.amazonaws.com"

# AI Router
AI_ROUTER_URL="$AI_ROUTER_URL"

# Azure AI Foundry (à compléter)
AZURE_AI_CHAT_ENDPOINT="$AZURE_AI_CHAT_ENDPOINT"
AZURE_AI_CHAT_KEY="$AZURE_AI_CHAT_KEY"

# Upstash QStash (à compléter manuellement)
# QSTASH_TOKEN="your-token-here"
# QSTASH_CURRENT_SIGNING_KEY="your-signing-key"
# QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"

# Feature Flags
NODE_ENV="production"
ENABLE_RATE_LIMITING="true"
ENABLE_CACHING="true"
EOF

log_success "Variables sauvegardées dans .env.production.local"

# ============================================================================
# Phase 8: CloudWatch Alarms
# ============================================================================

log_info "Phase 8: Configuration CloudWatch Alarms..."

# RDS CPU Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-rds-cpu \
    --alarm-description "RDS CPU > 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=DBInstanceIdentifier,Value=${PROJECT_NAME}-db \
    --region $REGION \
    > /dev/null

# Redis Memory Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name ${PROJECT_NAME}-redis-memory \
    --alarm-description "Redis Memory > 90%" \
    --metric-name DatabaseMemoryUsagePercentage \
    --namespace AWS/ElastiCache \
    --statistic Average \
    --period 300 \
    --threshold 90 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=CacheClusterId,Value=${PROJECT_NAME}-redis \
    --region $REGION \
    > /dev/null

# Lambda Errors Alarm (if Lambda exists)
if [ ! -z "$AI_ROUTER_URL" ]; then
    aws cloudwatch put-metric-alarm \
        --alarm-name ${PROJECT_NAME}-lambda-errors \
        --alarm-description "Lambda Errors > 5" \
        --metric-name Errors \
        --namespace AWS/Lambda \
        --statistic Sum \
        --period 300 \
        --threshold 5 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --dimensions Name=FunctionName,Value=${PROJECT_NAME}-ai-router \
        --region $REGION \
        > /dev/null
fi

log_success "CloudWatch Alarms configurées"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "============================================================================"
log_success "Déploiement AWS terminé !"
echo "============================================================================"
echo ""
echo "📊 Ressources créées:"
echo "  - RDS PostgreSQL: $DB_ENDPOINT"
echo "  - ElastiCache Redis: $REDIS_ENDPOINT"
echo "  - S3 Bucket: $BUCKET_NAME"
if [ ! -z "$AI_ROUTER_URL" ]; then
    echo "  - AI Router Lambda: $AI_ROUTER_URL"
fi
echo ""
echo "💾 Credentials sauvegardés dans: .env.production.local"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Compléter les variables Azure AI Foundry dans .env.production.local"
echo "  2. Créer compte Upstash et ajouter QSTASH_* dans .env.production.local"
echo "  3. Déployer sur Vercel: vercel --prod"
echo "  4. Run migrations: npx prisma migrate deploy"
echo "  5. Tester: curl https://app.huntaze.com/api/health"
echo ""
echo "💰 Coût estimé: \$64-87/mois"
echo ""
echo "============================================================================"
