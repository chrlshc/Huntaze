#!/bin/bash

# ============================================================================
# HUNTAZE BETA - AWS MINIMAL INFRASTRUCTURE DEPLOYMENT
# ============================================================================
# Crée uniquement l'infrastructure AWS nécessaire pour Vercel + Azure Workers
# Budget: ~$100/mois
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-2"
PROJECT_NAME="huntaze-beta"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}HUNTAZE BETA - AWS MINIMAL INFRASTRUCTURE${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Account ID:${NC} $ACCOUNT_ID"
echo -e "${YELLOW}Region:${NC} $AWS_REGION"
echo -e "${YELLOW}Project:${NC} $PROJECT_NAME"
echo ""
echo -e "${YELLOW}Ce script va créer:${NC}"
echo "  1. RDS PostgreSQL (db.t4g.micro) - ~$15-20/mois"
echo "  2. ElastiCache Redis (cache.t4g.micro) - ~$15-20/mois"
echo "  3. S3 Bucket (vidéos + assets) - ~$10-20/mois"
echo "  4. CloudFront Distribution - ~$20-30/mois"
echo "  5. Secrets Manager - ~$3-5/mois"
echo ""
echo -e "${YELLOW}Budget total estimé: ~$100/mois${NC}"
echo ""
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Déploiement annulé${NC}"
    exit 1
fi

# ============================================================================
# 1. VPC & NETWORKING
# ============================================================================
echo ""
echo -e "${BLUE}[1/6] Création VPC & Networking...${NC}"

# Vérifier si VPC existe déjà
VPC_ID=$(aws ec2 describe-vpcs \
    --region $AWS_REGION \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-vpc" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "None")

if [ "$VPC_ID" == "None" ]; then
    echo "Création VPC..."
    VPC_ID=$(aws ec2 create-vpc \
        --region $AWS_REGION \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc}]" \
        --query 'Vpc.VpcId' \
        --output text)
    
    # Enable DNS
    aws ec2 modify-vpc-attribute --region $AWS_REGION --vpc-id $VPC_ID --enable-dns-hostnames
    aws ec2 modify-vpc-attribute --region $AWS_REGION --vpc-id $VPC_ID --enable-dns-support
    
    echo -e "${GREEN}✓ VPC créé: $VPC_ID${NC}"
else
    echo -e "${GREEN}✓ VPC existe déjà: $VPC_ID${NC}"
fi

# Internet Gateway
IGW_ID=$(aws ec2 describe-internet-gateways \
    --region $AWS_REGION \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-igw" \
    --query 'InternetGateways[0].InternetGatewayId' \
    --output text 2>/dev/null || echo "None")

if [ "$IGW_ID" == "None" ]; then
    echo "Création Internet Gateway..."
    IGW_ID=$(aws ec2 create-internet-gateway \
        --region $AWS_REGION \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text)
    
    aws ec2 attach-internet-gateway --region $AWS_REGION --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
    echo -e "${GREEN}✓ Internet Gateway créé: $IGW_ID${NC}"
else
    echo -e "${GREEN}✓ Internet Gateway existe déjà: $IGW_ID${NC}"
fi

# Subnets (2 public pour RDS Multi-AZ)
SUBNET_1_ID=$(aws ec2 describe-subnets \
    --region $AWS_REGION \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-subnet-1" \
    --query 'Subnets[0].SubnetId' \
    --output text 2>/dev/null || echo "None")

if [ "$SUBNET_1_ID" == "None" ]; then
    echo "Création Subnets..."
    SUBNET_1_ID=$(aws ec2 create-subnet \
        --region $AWS_REGION \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.1.0/24 \
        --availability-zone ${AWS_REGION}a \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-subnet-1}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    
    SUBNET_2_ID=$(aws ec2 create-subnet \
        --region $AWS_REGION \
        --vpc-id $VPC_ID \
        --cidr-block 10.0.2.0/24 \
        --availability-zone ${AWS_REGION}b \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-subnet-2}]" \
        --query 'Subnet.SubnetId' \
        --output text)
    
    echo -e "${GREEN}✓ Subnets créés: $SUBNET_1_ID, $SUBNET_2_ID${NC}"
else
    echo -e "${GREEN}✓ Subnets existent déjà${NC}"
    SUBNET_2_ID=$(aws ec2 describe-subnets \
        --region $AWS_REGION \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-subnet-2" \
        --query 'Subnets[0].SubnetId' \
        --output text)
fi

# Route Table
RTB_ID=$(aws ec2 describe-route-tables \
    --region $AWS_REGION \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-rtb" \
    --query 'RouteTables[0].RouteTableId' \
    --output text 2>/dev/null || echo "None")

if [ "$RTB_ID" == "None" ]; then
    echo "Création Route Table..."
    RTB_ID=$(aws ec2 create-route-table \
        --region $AWS_REGION \
        --vpc-id $VPC_ID \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-rtb}]" \
        --query 'RouteTable.RouteTableId' \
        --output text)
    
    aws ec2 create-route --region $AWS_REGION --route-table-id $RTB_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
    aws ec2 associate-route-table --region $AWS_REGION --subnet-id $SUBNET_1_ID --route-table-id $RTB_ID
    aws ec2 associate-route-table --region $AWS_REGION --subnet-id $SUBNET_2_ID --route-table-id $RTB_ID
    
    echo -e "${GREEN}✓ Route Table créée: $RTB_ID${NC}"
else
    echo -e "${GREEN}✓ Route Table existe déjà: $RTB_ID${NC}"
fi

# ============================================================================
# 2. SECURITY GROUPS
# ============================================================================
echo ""
echo -e "${BLUE}[2/6] Création Security Groups...${NC}"

# RDS Security Group
RDS_SG_ID=$(aws ec2 describe-security-groups \
    --region $AWS_REGION \
    --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$RDS_SG_ID" == "None" ]; then
    echo "Création RDS Security Group..."
    RDS_SG_ID=$(aws ec2 create-security-group \
        --region $AWS_REGION \
        --group-name "${PROJECT_NAME}-rds-sg" \
        --description "Security group for RDS PostgreSQL" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)
    
    # Allow PostgreSQL from anywhere (Vercel IPs are dynamic)
    aws ec2 authorize-security-group-ingress \
        --region $AWS_REGION \
        --group-id $RDS_SG_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0
    
    echo -e "${GREEN}✓ RDS Security Group créé: $RDS_SG_ID${NC}"
else
    echo -e "${GREEN}✓ RDS Security Group existe déjà: $RDS_SG_ID${NC}"
fi

# Redis Security Group
REDIS_SG_ID=$(aws ec2 describe-security-groups \
    --region $AWS_REGION \
    --filters "Name=group-name,Values=${PROJECT_NAME}-redis-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$REDIS_SG_ID" == "None" ]; then
    echo "Création Redis Security Group..."
    REDIS_SG_ID=$(aws ec2 create-security-group \
        --region $AWS_REGION \
        --group-name "${PROJECT_NAME}-redis-sg" \
        --description "Security group for ElastiCache Redis" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)
    
    # Allow Redis from anywhere (Vercel IPs are dynamic)
    aws ec2 authorize-security-group-ingress \
        --region $AWS_REGION \
        --group-id $REDIS_SG_ID \
        --protocol tcp \
        --port 6379 \
        --cidr 0.0.0.0/0
    
    echo -e "${GREEN}✓ Redis Security Group créé: $REDIS_SG_ID${NC}"
else
    echo -e "${GREEN}✓ Redis Security Group existe déjà: $REDIS_SG_ID${NC}"
fi

# ============================================================================
# 3. RDS POSTGRESQL
# ============================================================================
echo ""
echo -e "${BLUE}[3/6] Création RDS PostgreSQL...${NC}"

# DB Subnet Group
DB_SUBNET_GROUP="${PROJECT_NAME}-db-subnet-group"
aws rds describe-db-subnet-groups \
    --region $AWS_REGION \
    --db-subnet-group-name $DB_SUBNET_GROUP \
    >/dev/null 2>&1 || \
aws rds create-db-subnet-group \
    --region $AWS_REGION \
    --db-subnet-group-name $DB_SUBNET_GROUP \
    --db-subnet-group-description "Subnet group for Huntaze Beta RDS" \
    --subnet-ids $SUBNET_1_ID $SUBNET_2_ID

# Générer mot de passe aléatoire
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Créer RDS instance
DB_INSTANCE_ID="${PROJECT_NAME}-db"
RDS_EXISTS=$(aws rds describe-db-instances \
    --region $AWS_REGION \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text 2>/dev/null || echo "None")

if [ "$RDS_EXISTS" == "None" ]; then
    echo "Création RDS PostgreSQL (db.t4g.micro)..."
    echo -e "${YELLOW}⏳ Cela peut prendre 5-10 minutes...${NC}"
    
    aws rds create-db-instance \
        --region $AWS_REGION \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-instance-class db.t4g.micro \
        --engine postgres \
        --engine-version 15.4 \
        --master-username huntaze \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp3 \
        --db-subnet-group-name $DB_SUBNET_GROUP \
        --vpc-security-group-ids $RDS_SG_ID \
        --publicly-accessible \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "mon:04:00-mon:05:00" \
        --no-multi-az \
        --storage-encrypted \
        --tags Key=Name,Value=${PROJECT_NAME}-db
    
    # Attendre que RDS soit disponible
    echo "Attente de la disponibilité de RDS..."
    aws rds wait db-instance-available --region $AWS_REGION --db-instance-identifier $DB_INSTANCE_ID
    
    echo -e "${GREEN}✓ RDS PostgreSQL créé${NC}"
else
    echo -e "${GREEN}✓ RDS PostgreSQL existe déjà (status: $RDS_EXISTS)${NC}"
fi

# Récupérer endpoint RDS
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --region $AWS_REGION \
    --db-instance-identifier $DB_INSTANCE_ID \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}RDS Endpoint: $RDS_ENDPOINT${NC}"

# Sauvegarder le mot de passe dans Secrets Manager
echo "Sauvegarde du mot de passe RDS dans Secrets Manager..."
aws secretsmanager create-secret \
    --region $AWS_REGION \
    --name "${PROJECT_NAME}/rds/password" \
    --description "RDS PostgreSQL password for Huntaze Beta" \
    --secret-string "$DB_PASSWORD" \
    2>/dev/null || \
aws secretsmanager update-secret \
    --region $AWS_REGION \
    --secret-id "${PROJECT_NAME}/rds/password" \
    --secret-string "$DB_PASSWORD"

# ============================================================================
# 4. ELASTICACHE REDIS
# ============================================================================
echo ""
echo -e "${BLUE}[4/6] Création ElastiCache Redis...${NC}"

# Cache Subnet Group
CACHE_SUBNET_GROUP="${PROJECT_NAME}-cache-subnet-group"
aws elasticache describe-cache-subnet-groups \
    --region $AWS_REGION \
    --cache-subnet-group-name $CACHE_SUBNET_GROUP \
    >/dev/null 2>&1 || \
aws elasticache create-cache-subnet-group \
    --region $AWS_REGION \
    --cache-subnet-group-name $CACHE_SUBNET_GROUP \
    --cache-subnet-group-description "Subnet group for Huntaze Beta Redis" \
    --subnet-ids $SUBNET_1_ID $SUBNET_2_ID

# Créer Redis cluster
REDIS_CLUSTER_ID="${PROJECT_NAME}-redis"
REDIS_EXISTS=$(aws elasticache describe-cache-clusters \
    --region $AWS_REGION \
    --cache-cluster-id $REDIS_CLUSTER_ID \
    --query 'CacheClusters[0].CacheClusterStatus' \
    --output text 2>/dev/null || echo "None")

if [ "$REDIS_EXISTS" == "None" ]; then
    echo "Création ElastiCache Redis (cache.t4g.micro)..."
    echo -e "${YELLOW}⏳ Cela peut prendre 5-10 minutes...${NC}"
    
    aws elasticache create-cache-cluster \
        --region $AWS_REGION \
        --cache-cluster-id $REDIS_CLUSTER_ID \
        --cache-node-type cache.t4g.micro \
        --engine redis \
        --engine-version 7.0 \
        --num-cache-nodes 1 \
        --cache-subnet-group-name $CACHE_SUBNET_GROUP \
        --security-group-ids $REDIS_SG_ID \
        --preferred-maintenance-window "mon:05:00-mon:06:00" \
        --snapshot-retention-limit 1 \
        --snapshot-window "04:00-05:00" \
        --tags Key=Name,Value=${PROJECT_NAME}-redis
    
    # Attendre que Redis soit disponible
    echo "Attente de la disponibilité de Redis..."
    aws elasticache wait cache-cluster-available --region $AWS_REGION --cache-cluster-id $REDIS_CLUSTER_ID
    
    echo -e "${GREEN}✓ ElastiCache Redis créé${NC}"
else
    echo -e "${GREEN}✓ ElastiCache Redis existe déjà (status: $REDIS_EXISTS)${NC}"
fi

# Récupérer endpoint Redis
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --region $AWS_REGION \
    --cache-cluster-id $REDIS_CLUSTER_ID \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}Redis Endpoint: $REDIS_ENDPOINT${NC}"

# ============================================================================
# 5. S3 BUCKET
# ============================================================================
echo ""
echo -e "${BLUE}[5/6] Création S3 Bucket...${NC}"

S3_BUCKET="${PROJECT_NAME}-assets"

# Créer bucket S3
aws s3api head-bucket --bucket $S3_BUCKET --region $AWS_REGION 2>/dev/null || \
aws s3api create-bucket \
    --bucket $S3_BUCKET \
    --region $AWS_REGION \
    --create-bucket-configuration LocationConstraint=$AWS_REGION

# Configurer CORS
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $S3_BUCKET --cors-configuration file:///tmp/cors.json
rm /tmp/cors.json

# Bloquer accès public (on utilisera CloudFront)
aws s3api put-public-access-block \
    --bucket $S3_BUCKET \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo -e "${GREEN}✓ S3 Bucket créé: s3://$S3_BUCKET${NC}"

# ============================================================================
# 6. CLOUDFRONT DISTRIBUTION
# ============================================================================
echo ""
echo -e "${BLUE}[6/6] Création CloudFront Distribution...${NC}"

# Créer Origin Access Identity
OAI_ID=$(aws cloudfront list-cloud-front-origin-access-identities \
    --query "CloudFrontOriginAccessIdentityList.Items[?Comment=='${PROJECT_NAME}-oai'].Id" \
    --output text 2>/dev/null || echo "")

if [ -z "$OAI_ID" ]; then
    echo "Création Origin Access Identity..."
    OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
        --cloud-front-origin-access-identity-config \
        "CallerReference=$(date +%s),Comment=${PROJECT_NAME}-oai" \
        --query 'CloudFrontOriginAccessIdentity.Id' \
        --output text)
    
    echo -e "${GREEN}✓ OAI créé: $OAI_ID${NC}"
else
    echo -e "${GREEN}✓ OAI existe déjà: $OAI_ID${NC}"
fi

# Bucket policy pour CloudFront
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json

# Créer CloudFront distribution
DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='${PROJECT_NAME}-cdn'].Id" \
    --output text 2>/dev/null || echo "")

if [ -z "$DIST_ID" ]; then
    echo "Création CloudFront Distribution..."
    echo -e "${YELLOW}⏳ Cela peut prendre 10-15 minutes...${NC}"
    
    cat > /tmp/cf-config.json <<EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "${PROJECT_NAME}-cdn",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${S3_BUCKET}",
        "DomainName": "${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/${OAI_ID}"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${S3_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  }
}
EOF
    
    DIST_ID=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cf-config.json \
        --query 'Distribution.Id' \
        --output text)
    
    rm /tmp/cf-config.json
    
    echo -e "${GREEN}✓ CloudFront Distribution créée: $DIST_ID${NC}"
else
    echo -e "${GREEN}✓ CloudFront Distribution existe déjà: $DIST_ID${NC}"
fi

# Récupérer domain CloudFront
CF_DOMAIN=$(aws cloudfront get-distribution \
    --id $DIST_ID \
    --query 'Distribution.DomainName' \
    --output text)

echo -e "${GREEN}CloudFront Domain: $CF_DOMAIN${NC}"

# ============================================================================
# RÉSUMÉ
# ============================================================================
echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✓ DÉPLOIEMENT AWS TERMINÉ${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${YELLOW}📋 INFORMATIONS DE CONNEXION:${NC}"
echo ""
echo -e "${BLUE}RDS PostgreSQL:${NC}"
echo "  Host: $RDS_ENDPOINT"
echo "  Port: 5432"
echo "  Database: postgres"
echo "  Username: huntaze"
echo "  Password: (stocké dans Secrets Manager: ${PROJECT_NAME}/rds/password)"
echo ""
echo -e "${BLUE}DATABASE_URL:${NC}"
echo "  postgresql://huntaze:$DB_PASSWORD@$RDS_ENDPOINT:5432/postgres"
echo ""
echo -e "${BLUE}ElastiCache Redis:${NC}"
echo "  Host: $REDIS_ENDPOINT"
echo "  Port: 6379"
echo ""
echo -e "${BLUE}REDIS_URL:${NC}"
echo "  redis://$REDIS_ENDPOINT:6379"
echo ""
echo -e "${BLUE}S3 Bucket:${NC}"
echo "  Bucket: $S3_BUCKET"
echo "  Region: $AWS_REGION"
echo ""
echo -e "${BLUE}CloudFront:${NC}"
echo "  Domain: $CF_DOMAIN"
echo "  Distribution ID: $DIST_ID"
echo ""
echo -e "${YELLOW}💰 COÛT ESTIMÉ:${NC}"
echo "  RDS (db.t4g.micro): ~\$15-20/mois"
echo "  Redis (cache.t4g.micro): ~\$15-20/mois"
echo "  S3: ~\$10-20/mois"
echo "  CloudFront: ~\$20-30/mois"
echo "  Secrets Manager: ~\$3-5/mois"
echo "  ────────────────────────────"
echo "  TOTAL: ~\$100/mois"
echo ""
echo -e "${YELLOW}📝 PROCHAINES ÉTAPES:${NC}"
echo "  1. Copier DATABASE_URL et REDIS_URL dans Vercel"
echo "  2. Ajouter AWS_REGION=$AWS_REGION dans Vercel"
echo "  3. Ajouter S3_BUCKET=$S3_BUCKET dans Vercel"
echo "  4. Ajouter CLOUDFRONT_DOMAIN=$CF_DOMAIN dans Vercel"
echo "  5. Créer la base de données: npx prisma migrate deploy"
echo ""
echo -e "${GREEN}✓ Infrastructure AWS prête pour Vercel + Azure Workers!${NC}"
echo ""

# Sauvegarder les infos dans un fichier
cat > deployment-beta-50users/AWS-DEPLOYMENT-INFO.txt <<EOF
# ============================================================================
# HUNTAZE BETA - AWS INFRASTRUCTURE INFO
# ============================================================================
# Date: $(date)
# Region: $AWS_REGION
# Account: $ACCOUNT_ID
# ============================================================================

# RDS PostgreSQL
RDS_ENDPOINT=$RDS_ENDPOINT
DATABASE_URL=postgresql://huntaze:$DB_PASSWORD@$RDS_ENDPOINT:5432/postgres

# ElastiCache Redis
REDIS_ENDPOINT=$REDIS_ENDPOINT
REDIS_URL=redis://$REDIS_ENDPOINT:6379

# S3 & CloudFront
S3_BUCKET=$S3_BUCKET
CLOUDFRONT_DOMAIN=$CF_DOMAIN
CLOUDFRONT_DISTRIBUTION_ID=$DIST_ID

# AWS Config
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID

# VPC
VPC_ID=$VPC_ID
SUBNET_1_ID=$SUBNET_1_ID
SUBNET_2_ID=$SUBNET_2_ID

# Security Groups
RDS_SG_ID=$RDS_SG_ID
REDIS_SG_ID=$REDIS_SG_ID

# ============================================================================
# VARIABLES D'ENVIRONNEMENT POUR VERCEL
# ============================================================================

DATABASE_URL="postgresql://huntaze:$DB_PASSWORD@$RDS_ENDPOINT:5432/postgres"
REDIS_URL="redis://$REDIS_ENDPOINT:6379"
AWS_REGION="$AWS_REGION"
AWS_S3_BUCKET="$S3_BUCKET"
S3_BUCKET="$S3_BUCKET"
S3_REGION="$AWS_REGION"
CLOUDFRONT_DOMAIN="$CF_DOMAIN"
CDN_URL="https://$CF_DOMAIN"

# ============================================================================
EOF

echo -e "${GREEN}✓ Informations sauvegardées dans: deployment-beta-50users/AWS-DEPLOYMENT-INFO.txt${NC}"
