#!/bin/bash

# Deploy Core Services via CLI
set -e

echo "🚀 Deploying Huntaze Core Services via AWS CLI"
echo "============================================"

# Variables
ENVIRONMENT="production"
REDIS_NAME="huntaze-redis-${ENVIRONMENT}"
RDS_NAME="huntaze-postgres-${ENVIRONMENT}"
API_NAME="Huntaze-API-${ENVIRONMENT}"

# 1. Create Security Groups
echo "🔐 Creating security groups..."

# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --profile huntaze --region us-east-1)
echo "Using VPC: $VPC_ID"

# Create Redis security group
REDIS_SG=$(aws ec2 create-security-group \
  --group-name "huntaze-redis-sg-${ENVIRONMENT}" \
  --description "Redis security group" \
  --vpc-id $VPC_ID \
  --profile huntaze \
  --region us-east-1 \
  --output text \
  --query 'GroupId' 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=huntaze-redis-sg-${ENVIRONMENT}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --profile huntaze \
    --region us-east-1)

echo "Redis SG: $REDIS_SG"

# Allow Redis port from anywhere (for dev)
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG \
  --protocol tcp \
  --port 6379 \
  --cidr 0.0.0.0/0 \
  --profile huntaze \
  --region us-east-1 2>/dev/null || echo "Redis SG rule already exists"

# Create RDS security group
RDS_SG=$(aws ec2 create-security-group \
  --group-name "huntaze-rds-sg-${ENVIRONMENT}" \
  --description "RDS security group" \
  --vpc-id $VPC_ID \
  --profile huntaze \
  --region us-east-1 \
  --output text \
  --query 'GroupId' 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=huntaze-rds-sg-${ENVIRONMENT}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --profile huntaze \
    --region us-east-1)

echo "RDS SG: $RDS_SG"

# Allow PostgreSQL port
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --profile huntaze \
  --region us-east-1 2>/dev/null || echo "RDS SG rule already exists"

# 2. Create ElastiCache Subnet Group
echo "🌐 Creating subnet groups..."

aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name "huntaze-cache-subnet-${ENVIRONMENT}" \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids subnet-0e48ea131e6267bea subnet-003088e522e36eaa8 \
  --profile huntaze \
  --region us-east-1 2>/dev/null || echo "Cache subnet group already exists"

# 3. Create Redis Cluster
echo "🗄️ Creating Redis cache..."

REDIS_ENDPOINT=$(aws elasticache create-cache-cluster \
  --cache-cluster-id $REDIS_NAME \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name "huntaze-cache-subnet-${ENVIRONMENT}" \
  --security-group-ids $REDIS_SG \
  --profile huntaze \
  --region us-east-1 \
  --query 'CacheCluster.CacheClusterId' \
  --output text 2>/dev/null || echo "$REDIS_NAME")

echo "Redis cluster: $REDIS_ENDPOINT"

# 4. Create RDS Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name "huntaze-db-subnet-${ENVIRONMENT}" \
  --db-subnet-group-description "Subnet group for RDS" \
  --subnet-ids subnet-0e48ea131e6267bea subnet-003088e522e36eaa8 \
  --profile huntaze \
  --region us-east-1 2>/dev/null || echo "DB subnet group already exists"

# 5. Get DB password from Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id huntaze-db-password-${ENVIRONMENT} \
  --query 'SecretString' \
  --output text \
  --profile huntaze \
  --region us-east-1 | jq -r '.password')

# 6. Create RDS PostgreSQL
echo "🐘 Creating PostgreSQL database..."

aws rds create-db-instance \
  --db-instance-identifier $RDS_NAME \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username huntazeadmin \
  --master-user-password "$DB_PASSWORD" \
  --db-name huntaze \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids $RDS_SG \
  --db-subnet-group-name "huntaze-db-subnet-${ENVIRONMENT}" \
  --backup-retention-period 7 \
  --publicly-accessible \
  --storage-encrypted \
  --profile huntaze \
  --region us-east-1 2>/dev/null || echo "RDS instance already exists or creating"

# 7. Create API Gateway
echo "🌐 Creating API Gateway..."

API_ID=$(aws apigateway create-rest-api \
  --name $API_NAME \
  --description "Huntaze API with rate limiting" \
  --endpoint-configuration types=REGIONAL \
  --profile huntaze \
  --region us-east-1 \
  --query 'id' \
  --output text 2>/dev/null || \
  aws apigateway get-rest-apis \
    --profile huntaze \
    --region us-east-1 \
    --query "items[?name=='$API_NAME'].id | [0]" \
    --output text)

echo "API Gateway ID: $API_ID"

# 8. Wait for services and get endpoints
echo ""
echo "⏳ Waiting for services to be ready..."
echo "This may take 5-10 minutes for RDS..."

# Wait for Redis
aws elasticache wait cache-cluster-available \
  --cache-cluster-id $REDIS_NAME \
  --profile huntaze \
  --region us-east-1 || true

# Get Redis endpoint
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id $REDIS_NAME \
  --show-cache-node-info \
  --profile huntaze \
  --region us-east-1 \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

echo "✅ Redis ready: $REDIS_ENDPOINT:6379"

# Wait for RDS (this takes longer)
echo "Waiting for PostgreSQL (this may take 5-10 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier $RDS_NAME \
  --profile huntaze \
  --region us-east-1 || true

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $RDS_NAME \
  --profile huntaze \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "✅ PostgreSQL ready: $RDS_ENDPOINT:5432"

# 9. Save configuration
cat > .env.core-services <<EOF
# Huntaze Core Services
# Generated: $(date)

# Redis
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379
REDIS_URL=redis://$REDIS_ENDPOINT:6379

# PostgreSQL
POSTGRES_HOST=$RDS_ENDPOINT
POSTGRES_PORT=5432
POSTGRES_USER=huntazeadmin
POSTGRES_DB=huntaze
DATABASE_URL=postgresql://huntazeadmin:$DB_PASSWORD@$RDS_ENDPOINT:5432/huntaze

# API Gateway
API_GATEWAY_ID=$API_ID
API_GATEWAY_URL=https://$API_ID.execute-api.us-east-1.amazonaws.com/production

# Security Groups
REDIS_SG=$REDIS_SG
RDS_SG=$RDS_SG
EOF

echo ""
echo "✅ All services deployed successfully!"
echo ""
echo "📝 Configuration saved to .env.core-services"
echo ""
echo "🔗 Service Endpoints:"
echo "  Redis: $REDIS_ENDPOINT:6379"
echo "  PostgreSQL: $RDS_ENDPOINT:5432"
echo "  API Gateway: https://$API_ID.execute-api.us-east-1.amazonaws.com/production"
echo ""
echo "🔧 Test connections:"
echo "  redis-cli -h $REDIS_ENDPOINT ping"
echo "  psql -h $RDS_ENDPOINT -U huntazeadmin -d huntaze"
echo ""