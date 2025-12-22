#!/bin/bash
# AWS Infrastructure Deployment Script - Huntaze
# Region: us-east-2
# Usage: ./scripts/aws-deploy-infrastructure.sh [phase]
# Phases: vpc, rds, redis, s3, secrets, amplify, all

set -e
export AWS_DEFAULT_REGION=us-east-2
export AWS_PAGER=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Configuration
APP_NAME="huntaze"
VPC_CIDR="10.0.0.0/16"
SUBNET_1_CIDR="10.0.1.0/24"
SUBNET_2_CIDR="10.0.2.0/24"
SUBNET_3_CIDR="10.0.10.0/24"  # Public subnet for NAT
SUBNET_4_CIDR="10.0.11.0/24"  # Public subnet 2

# ============================================
# PHASE 1: VPC & Networking
# ============================================
deploy_vpc() {
  log "Creating VPC..."
  
  # Check if VPC exists
  EXISTING_VPC=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${APP_NAME}-vpc" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")
  
  if [ "$EXISTING_VPC" != "None" ] && [ "$EXISTING_VPC" != "null" ]; then
    log "VPC already exists: $EXISTING_VPC"
    VPC_ID=$EXISTING_VPC
  else
    VPC_ID=$(aws ec2 create-vpc \
      --cidr-block $VPC_CIDR \
      --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${APP_NAME}-vpc}]" \
      --query 'Vpc.VpcId' --output text)
    log "Created VPC: $VPC_ID"
    
    # Enable DNS
    aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
    aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
  fi
  
  # Create Internet Gateway
  log "Creating Internet Gateway..."
  IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || echo "None")
  
  if [ "$IGW_ID" == "None" ] || [ "$IGW_ID" == "null" ]; then
    IGW_ID=$(aws ec2 create-internet-gateway \
      --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${APP_NAME}-igw}]" \
      --query 'InternetGateway.InternetGatewayId' --output text)
    aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
    log "Created and attached IGW: $IGW_ID"
  else
    log "IGW already exists: $IGW_ID"
  fi
  
  # Create Private Subnets
  log "Creating subnets..."
  
  SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=cidr-block,Values=$SUBNET_1_CIDR" --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
  if [ "$SUBNET_1" == "None" ] || [ "$SUBNET_1" == "null" ]; then
    SUBNET_1=$(aws ec2 create-subnet \
      --vpc-id $VPC_ID \
      --cidr-block $SUBNET_1_CIDR \
      --availability-zone us-east-2a \
      --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-private-1}]" \
      --query 'Subnet.SubnetId' --output text)
    log "Created private subnet 1: $SUBNET_1"
  fi
  
  SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=cidr-block,Values=$SUBNET_2_CIDR" --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
  if [ "$SUBNET_2" == "None" ] || [ "$SUBNET_2" == "null" ]; then
    SUBNET_2=$(aws ec2 create-subnet \
      --vpc-id $VPC_ID \
      --cidr-block $SUBNET_2_CIDR \
      --availability-zone us-east-2b \
      --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-private-2}]" \
      --query 'Subnet.SubnetId' --output text)
    log "Created private subnet 2: $SUBNET_2"
  fi
  
  # Create Public Subnet (for NAT Gateway)
  SUBNET_PUBLIC=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=cidr-block,Values=$SUBNET_3_CIDR" --query 'Subnets[0].SubnetId' --output text 2>/dev/null || echo "None")
  if [ "$SUBNET_PUBLIC" == "None" ] || [ "$SUBNET_PUBLIC" == "null" ]; then
    SUBNET_PUBLIC=$(aws ec2 create-subnet \
      --vpc-id $VPC_ID \
      --cidr-block $SUBNET_3_CIDR \
      --availability-zone us-east-2a \
      --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-1}]" \
      --query 'Subnet.SubnetId' --output text)
    aws ec2 modify-subnet-attribute --subnet-id $SUBNET_PUBLIC --map-public-ip-on-launch
    log "Created public subnet: $SUBNET_PUBLIC"
  fi
  
  # Create Security Group for RDS/Redis
  log "Creating security groups..."
  SG_DB=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=${APP_NAME}-db-sg" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")
  
  if [ "$SG_DB" == "None" ] || [ "$SG_DB" == "null" ]; then
    SG_DB=$(aws ec2 create-security-group \
      --group-name ${APP_NAME}-db-sg \
      --description "Security group for RDS and ElastiCache" \
      --vpc-id $VPC_ID \
      --query 'GroupId' --output text)
    
    # Allow PostgreSQL from VPC
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_DB \
      --protocol tcp \
      --port 5432 \
      --cidr $VPC_CIDR
    
    # Allow Redis from VPC
    aws ec2 authorize-security-group-ingress \
      --group-id $SG_DB \
      --protocol tcp \
      --port 6379 \
      --cidr $VPC_CIDR
    
    log "Created security group: $SG_DB"
  fi
  
  # Save outputs
  echo "VPC_ID=$VPC_ID" > .aws-infra-outputs
  echo "SUBNET_PRIVATE_1=$SUBNET_1" >> .aws-infra-outputs
  echo "SUBNET_PRIVATE_2=$SUBNET_2" >> .aws-infra-outputs
  echo "SUBNET_PUBLIC=$SUBNET_PUBLIC" >> .aws-infra-outputs
  echo "SG_DB=$SG_DB" >> .aws-infra-outputs
  echo "IGW_ID=$IGW_ID" >> .aws-infra-outputs
  
  log "VPC setup complete!"
}

# ============================================
# PHASE 2: RDS PostgreSQL
# ============================================
deploy_rds() {
  log "Deploying RDS PostgreSQL..."
  source .aws-infra-outputs 2>/dev/null || error "Run 'vpc' phase first"
  
  # Create DB Subnet Group
  aws rds describe-db-subnet-groups --db-subnet-group-name ${APP_NAME}-db-subnet 2>/dev/null || \
  aws rds create-db-subnet-group \
    --db-subnet-group-name ${APP_NAME}-db-subnet \
    --db-subnet-group-description "Huntaze RDS subnets" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2
  
  # Check if RDS exists
  EXISTING_RDS=$(aws rds describe-db-instances --db-instance-identifier ${APP_NAME}-prod --query 'DBInstances[0].DBInstanceIdentifier' --output text 2>/dev/null || echo "None")
  
  if [ "$EXISTING_RDS" != "None" ]; then
    log "RDS instance already exists"
  else
    # Generate password
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    
    aws rds create-db-instance \
      --db-instance-identifier ${APP_NAME}-prod \
      --db-instance-class db.t3.micro \
      --engine postgres \
      --engine-version 16.4 \
      --master-username ${APP_NAME}_admin \
      --master-user-password "$DB_PASSWORD" \
      --allocated-storage 20 \
      --storage-type gp3 \
      --vpc-security-group-ids $SG_DB \
      --db-subnet-group-name ${APP_NAME}-db-subnet \
      --backup-retention-period 7 \
      --no-multi-az \
      --no-publicly-accessible \
      --storage-encrypted \
      --db-name huntaze
    
    log "RDS instance creating... (takes ~10 min)"
    log "DB Password saved - STORE THIS SECURELY: $DB_PASSWORD"
    echo "DB_PASSWORD=$DB_PASSWORD" >> .aws-infra-outputs
  fi
}

# ============================================
# PHASE 3: ElastiCache Redis
# ============================================
deploy_redis() {
  log "Deploying ElastiCache Redis..."
  source .aws-infra-outputs 2>/dev/null || error "Run 'vpc' phase first"
  
  # Create Cache Subnet Group
  aws elasticache describe-cache-subnet-groups --cache-subnet-group-name ${APP_NAME}-cache-subnet 2>/dev/null || \
  aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name ${APP_NAME}-cache-subnet \
    --cache-subnet-group-description "Huntaze Redis subnets" \
    --subnet-ids $SUBNET_PRIVATE_1 $SUBNET_PRIVATE_2
  
  # Check if Redis exists
  EXISTING_REDIS=$(aws elasticache describe-cache-clusters --cache-cluster-id ${APP_NAME}-redis --query 'CacheClusters[0].CacheClusterId' --output text 2>/dev/null || echo "None")
  
  if [ "$EXISTING_REDIS" != "None" ]; then
    log "Redis cluster already exists"
  else
    aws elasticache create-cache-cluster \
      --cache-cluster-id ${APP_NAME}-redis \
      --cache-node-type cache.t3.micro \
      --engine redis \
      --engine-version 7.1 \
      --num-cache-nodes 1 \
      --cache-subnet-group-name ${APP_NAME}-cache-subnet \
      --security-group-ids $SG_DB
    
    log "Redis cluster creating... (takes ~5 min)"
  fi
}

# ============================================
# PHASE 4: S3 Bucket
# ============================================
deploy_s3() {
  log "Creating S3 bucket..."
  
  BUCKET_NAME="${APP_NAME}-assets-prod-${AWS_DEFAULT_REGION}"
  
  if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    log "S3 bucket already exists: $BUCKET_NAME"
  else
    aws s3api create-bucket \
      --bucket $BUCKET_NAME \
      --create-bucket-configuration LocationConstraint=$AWS_DEFAULT_REGION
    
    aws s3api put-bucket-versioning \
      --bucket $BUCKET_NAME \
      --versioning-configuration Status=Enabled
    
    aws s3api put-public-access-block \
      --bucket $BUCKET_NAME \
      --public-access-block-configuration \
        BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    
    log "Created S3 bucket: $BUCKET_NAME"
  fi
  
  echo "S3_BUCKET=$BUCKET_NAME" >> .aws-infra-outputs
}

# ============================================
# PHASE 5: Secrets Manager
# ============================================
deploy_secrets() {
  log "Creating secrets..."
  source .aws-infra-outputs 2>/dev/null || warn "No outputs file found"
  
  # Database secret
  if ! aws secretsmanager describe-secret --secret-id ${APP_NAME}/prod/database 2>/dev/null; then
    aws secretsmanager create-secret \
      --name ${APP_NAME}/prod/database \
      --description "Huntaze production database credentials" \
      --secret-string "{\"username\":\"${APP_NAME}_admin\",\"password\":\"REPLACE_ME\",\"host\":\"REPLACE_ME\",\"port\":\"5432\",\"dbname\":\"huntaze\"}"
    log "Created database secret - UPDATE WITH REAL VALUES"
  fi
  
  # NextAuth secret
  if ! aws secretsmanager describe-secret --secret-id ${APP_NAME}/prod/nextauth 2>/dev/null; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    aws secretsmanager create-secret \
      --name ${APP_NAME}/prod/nextauth \
      --description "NextAuth secret" \
      --secret-string "{\"secret\":\"$NEXTAUTH_SECRET\"}"
    log "Created NextAuth secret"
  fi
  
  log "Secrets created!"
}

# ============================================
# PHASE 6: Amplify App
# ============================================
deploy_amplify() {
  log "Creating Amplify app..."
  
  EXISTING_APP=$(aws amplify list-apps --query "apps[?name=='${APP_NAME}-prod'].appId" --output text 2>/dev/null)
  
  if [ -n "$EXISTING_APP" ] && [ "$EXISTING_APP" != "None" ]; then
    log "Amplify app already exists: $EXISTING_APP"
    APP_ID=$EXISTING_APP
  else
    APP_ID=$(aws amplify create-app \
      --name ${APP_NAME}-prod \
      --platform WEB_COMPUTE \
      --build-spec "$(cat amplify.yml)" \
      --query 'app.appId' --output text)
    log "Created Amplify app: $APP_ID"
  fi
  
  echo "AMPLIFY_APP_ID=$APP_ID" >> .aws-infra-outputs
  
  log "Amplify app ready!"
  log "Next steps:"
  log "  1. Go to https://us-east-2.console.aws.amazon.com/amplify/apps/$APP_ID"
  log "  2. Connect your GitHub repository"
  log "  3. Add environment variables"
  log "  4. Deploy!"
}

# ============================================
# MAIN
# ============================================
PHASE=${1:-help}

case $PHASE in
  vpc)
    deploy_vpc
    ;;
  rds)
    deploy_rds
    ;;
  redis)
    deploy_redis
    ;;
  s3)
    deploy_s3
    ;;
  secrets)
    deploy_secrets
    ;;
  amplify)
    deploy_amplify
    ;;
  all)
    deploy_vpc
    deploy_s3
    deploy_secrets
    deploy_rds
    deploy_redis
    deploy_amplify
    ;;
  status)
    log "Checking infrastructure status..."
    source .aws-infra-outputs 2>/dev/null || warn "No outputs file"
    echo ""
    echo "=== VPC ==="
    aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${APP_NAME}-vpc" --query 'Vpcs[*].[VpcId,State]' --output table
    echo ""
    echo "=== RDS ==="
    aws rds describe-db-instances --db-instance-identifier ${APP_NAME}-prod --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' --output table 2>/dev/null || echo "Not found"
    echo ""
    echo "=== ElastiCache ==="
    aws elasticache describe-cache-clusters --cache-cluster-id ${APP_NAME}-redis --query 'CacheClusters[*].[CacheClusterId,CacheClusterStatus]' --output table 2>/dev/null || echo "Not found"
    echo ""
    echo "=== S3 ==="
    aws s3 ls | grep ${APP_NAME} || echo "Not found"
    echo ""
    echo "=== Amplify ==="
    aws amplify list-apps --query "apps[?contains(name,'${APP_NAME}')].[name,appId,defaultDomain]" --output table
    ;;
  *)
    echo "Usage: $0 [phase]"
    echo ""
    echo "Phases:"
    echo "  vpc      - Create VPC, subnets, security groups"
    echo "  rds      - Create RDS PostgreSQL instance"
    echo "  redis    - Create ElastiCache Redis cluster"
    echo "  s3       - Create S3 bucket"
    echo "  secrets  - Create Secrets Manager secrets"
    echo "  amplify  - Create Amplify app"
    echo "  all      - Deploy everything"
    echo "  status   - Check infrastructure status"
    ;;
esac
