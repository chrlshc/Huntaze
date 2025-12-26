#!/bin/bash

# ============================================================================
# 🚀 AWS Infrastructure Deployment - Beta 50 Users
# ============================================================================
# 
# Ce script crée l'infrastructure AWS minimale pour Huntaze:
# - RDS PostgreSQL (db.t4g.micro)
# - ElastiCache Redis Serverless
# - S3 Bucket avec lifecycle policies
# - Secrets Manager
# - Security Groups
#
# Coût estimé: ~$60-80/mois
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="huntaze"
ENVIRONMENT="beta"
REGION="${AWS_REGION:-us-east-2}"
DB_NAME="huntaze_production"
DB_USERNAME="huntaze_admin"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🚀 Huntaze AWS Infrastructure Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Region:${NC} $REGION"
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT"
echo ""

# ============================================================================
# 1. Generate Passwords
# ============================================================================
echo -e "${BLUE}📝 Generating secure passwords...${NC}"

DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
REDIS_AUTH_TOKEN=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo -e "${GREEN}✓ Passwords generated${NC}"

# ============================================================================
# 2. Create VPC and Subnets (if not exists)
# ============================================================================
echo -e "${BLUE}🌐 Setting up VPC...${NC}"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs \
  --region $REGION \
  --filters "Name=isDefault,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
  echo -e "${RED}✗ No default VPC found. Creating one...${NC}"
  VPC_ID=$(aws ec2 create-default-vpc --region $REGION --query 'Vpc.VpcId' --output text)
fi

echo -e "${GREEN}✓ VPC ID: $VPC_ID${NC}"

# Get subnets
SUBNET_IDS=$(aws ec2 describe-subnets \
  --region $REGION \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text)

SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')

echo -e "${GREEN}✓ Subnets: $SUBNET_1, $SUBNET_2${NC}"

# ============================================================================
# 3. Create Security Groups
# ============================================================================
echo -e "${BLUE}🔒 Creating Security Groups...${NC}"

# RDS Security Group
RDS_SG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-rds-sg"
RDS_SG_ID=$(aws ec2 describe-security-groups \
  --region $REGION \
  --filters "Name=group-name,Values=$RDS_SG_NAME" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "")

if [ "$RDS_SG_ID" == "None" ] || [ -z "$RDS_SG_ID" ]; then
  RDS_SG_ID=$(aws ec2 create-security-group \
    --region $REGION \
    --group-name $RDS_SG_NAME \
    --description "Security group for Huntaze RDS PostgreSQL" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)
  
  # Allow PostgreSQL from anywhere (beta only - restrict in production!)
  aws ec2 authorize-security-group-ingress \
    --region $REGION \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 5432 \
    --cidr 0.0.0.0/0
  
  echo -e "${GREEN}✓ Created RDS Security Group: $RDS_SG_ID${NC}"
else
  echo -e "${YELLOW}⚠ RDS Security Group already exists: $RDS_SG_ID${NC}"
fi

# Redis Security Group
REDIS_SG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-redis-sg"
REDIS_SG_ID=$(aws ec2 describe-security-groups \
  --region $REGION \
  --filters "Name=group-name,Values=$REDIS_SG_NAME" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "")

if [ "$REDIS_SG_ID" == "None" ] || [ -z "$REDIS_SG_ID" ]; then
  REDIS_SG_ID=$(aws ec2 create-security-group \
    --region $REGION \
    --group-name $REDIS_SG_NAME \
    --description "Security group for Huntaze Redis" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)
  
  # Allow Redis from anywhere (beta only - restrict in production!)
  aws ec2 authorize-security-group-ingress \
    --region $REGION \
    --group-id $REDIS_SG_ID \
    --protocol tcp \
    --port 6379 \
    --cidr 0.0.0.0/0
  
  echo -e "${GREEN}✓ Created Redis Security Group: $REDIS_SG_ID${NC}"
else
  echo -e "${YELLOW}⚠ Redis Security Group already exists: $REDIS_SG_ID${NC}"
fi

# ============================================================================
# 4. Create DB Subnet Group
# ============================================================================
echo -e "${BLUE}🗄️  Creating DB Subnet Group...${NC}"

DB_SUBNET_GROUP="${PROJECT_NAME}-${ENVIRONMENT}-db-subnet"

aws rds create-db-subnet-group \
  --region $REGION \
  --db-subnet-group-name $DB_SUBNET_GROUP \
  --db-subnet-group-description "Subnet group for Huntaze RDS" \
  --subnet-ids $SUBNET_1 $SUBNET_2 \
  --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=$ENVIRONMENT" \
  2>/dev/null || echo -e "${YELLOW}⚠ DB Subnet Group already exists${NC}"

echo -e "${GREEN}✓ DB Subnet Group ready${NC}"

# ============================================================================
# 5. Create RDS PostgreSQL
# ============================================================================
echo -e "${BLUE}🐘 Creating RDS PostgreSQL...${NC}"

DB_INSTANCE_ID="${PROJECT_NAME}-${ENVIRONMENT}-db"

# Check if DB exists
DB_EXISTS=$(aws rds describe-db-instances \
  --region $REGION \
  --db-instance-identifier $DB_INSTANCE_ID \
  --query 'DBInstances[0].DBInstanceIdentifier' \
  --output text 2>/dev/null || echo "")

if [ "$DB_EXISTS" == "$DB_INSTANCE_ID" ]; then
  echo -e "${YELLOW}⚠ RDS instance already exists: $DB_INSTANCE_ID${NC}"
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --region $REGION \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
else
  echo -e "${YELLOW}Creating RDS instance (this takes ~10 minutes)...${NC}"
  
  aws rds create-db-instance \
    --region $REGION \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t4g.micro \
    --engine postgres \
    --engine-version 16.11 \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name $DB_SUBNET_GROUP \
    --publicly-accessible \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "mon:04:00-mon:05:00" \
    --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=$ENVIRONMENT" \
    --no-multi-az \
    --storage-encrypted
  
  echo -e "${YELLOW}Waiting for RDS to be available...${NC}"
  aws rds wait db-instance-available \
    --region $REGION \
    --db-instance-identifier $DB_INSTANCE_ID
  
  DB_ENDPOINT=$(aws rds describe-db-instances \
    --region $REGION \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)
  
  echo -e "${GREEN}✓ RDS PostgreSQL created: $DB_ENDPOINT${NC}"
fi

# ============================================================================
# 6. Create ElastiCache Redis Serverless
# ============================================================================
echo -e "${BLUE}🔴 Creating ElastiCache Redis Serverless...${NC}"

REDIS_CLUSTER_ID="${PROJECT_NAME}-${ENVIRONMENT}-redis"

# Check if Redis exists
REDIS_EXISTS=$(aws elasticache describe-serverless-caches \
  --region $REGION \
  --serverless-cache-name $REDIS_CLUSTER_ID \
  --query 'ServerlessCaches[0].ServerlessCacheName' \
  --output text 2>/dev/null || echo "")

if [ "$REDIS_EXISTS" == "$REDIS_CLUSTER_ID" ]; then
  echo -e "${YELLOW}⚠ Redis cluster already exists: $REDIS_CLUSTER_ID${NC}"
  REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches \
    --region $REGION \
    --serverless-cache-name $REDIS_CLUSTER_ID \
    --query 'ServerlessCaches[0].Endpoint.Address' \
    --output text)
else
  echo -e "${YELLOW}Creating Redis Serverless (this takes ~5 minutes)...${NC}"
  
  aws elasticache create-serverless-cache \
    --region $REGION \
    --serverless-cache-name $REDIS_CLUSTER_ID \
    --engine redis \
    --daily-snapshot-time "03:00" \
    --security-group-ids $REDIS_SG_ID \
    --subnet-ids $SUBNET_1 $SUBNET_2 \
    --tags Key=Project,Value=$PROJECT_NAME Key=Environment,Value=$ENVIRONMENT
  
  # Wait for Redis to be available
  echo -e "${YELLOW}Waiting for Redis to be available...${NC}"
  sleep 300  # Redis Serverless takes ~5 minutes
  
  REDIS_ENDPOINT=$(aws elasticache describe-serverless-caches \
    --region $REGION \
    --serverless-cache-name $REDIS_CLUSTER_ID \
    --query 'ServerlessCaches[0].Endpoint.Address' \
    --output text)
  
  echo -e "${GREEN}✓ Redis Serverless created: $REDIS_ENDPOINT${NC}"
fi

# ============================================================================
# 7. Create S3 Bucket
# ============================================================================
echo -e "${BLUE}📦 Creating S3 Bucket...${NC}"

S3_BUCKET="${PROJECT_NAME}-${ENVIRONMENT}-storage-$(date +%s)"

aws s3api create-bucket \
  --region $REGION \
  --bucket $S3_BUCKET \
  --create-bucket-configuration LocationConstraint=$REGION \
  --acl private 2>/dev/null || echo -e "${YELLOW}⚠ Bucket might already exist${NC}"

# Enable versioning
aws s3api put-bucket-versioning \
  --region $REGION \
  --bucket $S3_BUCKET \
  --versioning-configuration Status=Enabled

# Add lifecycle policy
cat > /tmp/lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteTempFiles",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Prefix": "videos/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "INTELLIGENT_TIERING"
        }
      ]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --region $REGION \
  --bucket $S3_BUCKET \
  --lifecycle-configuration file:///tmp/lifecycle.json

echo -e "${GREEN}✓ S3 Bucket created: $S3_BUCKET${NC}"

# ============================================================================
# 8. Store Secrets in AWS Secrets Manager
# ============================================================================
echo -e "${BLUE}🔐 Storing secrets in Secrets Manager...${NC}"

# Database URL
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}"

aws secretsmanager create-secret \
  --region $REGION \
  --name "${PROJECT_NAME}/${ENVIRONMENT}/database-url" \
  --description "Huntaze Database URL" \
  --secret-string "$DATABASE_URL" \
  --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=$ENVIRONMENT" \
  2>/dev/null || \
aws secretsmanager update-secret \
  --region $REGION \
  --secret-id "${PROJECT_NAME}/${ENVIRONMENT}/database-url" \
  --secret-string "$DATABASE_URL"

# Redis URL
REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

aws secretsmanager create-secret \
  --region $REGION \
  --name "${PROJECT_NAME}/${ENVIRONMENT}/redis-url" \
  --description "Huntaze Redis URL" \
  --secret-string "$REDIS_URL" \
  --tags "Key=Project,Value=$PROJECT_NAME" "Key=Environment,Value=$ENVIRONMENT" \
  2>/dev/null || \
aws secretsmanager update-secret \
  --region $REGION \
  --secret-id "${PROJECT_NAME}/${ENVIRONMENT}/redis-url" \
  --secret-string "$REDIS_URL"

echo -e "${GREEN}✓ Secrets stored in Secrets Manager${NC}"

# ============================================================================
# 9. Save Configuration
# ============================================================================
echo -e "${BLUE}💾 Saving configuration...${NC}"

CONFIG_FILE="deployment-beta-50users/aws-infrastructure-config.env"

cat > $CONFIG_FILE <<EOF
# AWS Infrastructure Configuration
# Generated: $(date)

# Region
AWS_REGION=$REGION

# RDS PostgreSQL
DB_INSTANCE_ID=$DB_INSTANCE_ID
DB_ENDPOINT=$DB_ENDPOINT
DB_NAME=$DB_NAME
DB_USERNAME=$DB_USERNAME
DATABASE_URL=$DATABASE_URL

# ElastiCache Redis
REDIS_CLUSTER_ID=$REDIS_CLUSTER_ID
REDIS_ENDPOINT=$REDIS_ENDPOINT
REDIS_URL=$REDIS_URL

# S3
S3_BUCKET=$S3_BUCKET

# Security Groups
RDS_SG_ID=$RDS_SG_ID
REDIS_SG_ID=$REDIS_SG_ID

# VPC
VPC_ID=$VPC_ID
SUBNET_1=$SUBNET_1
SUBNET_2=$SUBNET_2
EOF

echo -e "${GREEN}✓ Configuration saved to: $CONFIG_FILE${NC}"

# ============================================================================
# 10. Summary
# ============================================================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ AWS Infrastructure Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 Resources Created:${NC}"
echo ""
echo -e "${YELLOW}RDS PostgreSQL:${NC}"
echo -e "  Instance: $DB_INSTANCE_ID"
echo -e "  Endpoint: $DB_ENDPOINT"
echo -e "  Database: $DB_NAME"
echo -e "  Username: $DB_USERNAME"
echo ""
echo -e "${YELLOW}ElastiCache Redis:${NC}"
echo -e "  Cluster: $REDIS_CLUSTER_ID"
echo -e "  Endpoint: $REDIS_ENDPOINT"
echo ""
echo -e "${YELLOW}S3 Bucket:${NC}"
echo -e "  Bucket: $S3_BUCKET"
echo ""
echo -e "${YELLOW}Secrets Manager:${NC}"
echo -e "  ${PROJECT_NAME}/${ENVIRONMENT}/database-url"
echo -e "  ${PROJECT_NAME}/${ENVIRONMENT}/redis-url"
echo ""
echo -e "${BLUE}💰 Estimated Monthly Cost: \$60-80${NC}"
echo ""
echo -e "${BLUE}🔑 Environment Variables for Vercel:${NC}"
echo ""
echo -e "DATABASE_URL=$DATABASE_URL"
echo -e "REDIS_URL=$REDIS_URL"
echo -e "AWS_S3_BUCKET=$S3_BUCKET"
echo -e "AWS_REGION=$REGION"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo -e "1. Save these credentials securely!"
echo -e "2. Add them to Vercel: Settings → Environment Variables"
echo -e "3. Run Prisma migrations: npx prisma migrate deploy"
echo -e "4. Test connections before deploying"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. source $CONFIG_FILE"
echo -e "2. npx prisma migrate deploy"
echo -e "3. Deploy to Vercel"
echo ""
