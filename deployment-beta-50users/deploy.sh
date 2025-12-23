#!/bin/bash
# ============================================================================
# Huntaze Beta - Déploiement 50 Users
# Budget: $150-180/mois
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-2"
PROJECT_NAME="huntaze-beta"
ACCOUNT_ID="317805897534"

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ============================================================================
# Pre-flight Checks
# ============================================================================

log_info "Vérification des pré-requis..."

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI non installé"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI non installé: npm i -g vercel"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials non configurées"
    exit 1
fi

log_success "Pré-requis OK"

# ============================================================================
# Generate Secrets
# ============================================================================

log_info "Génération des secrets..."

DB_PASSWORD=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

log_success "Secrets générés"

# ============================================================================
# Create RDS PostgreSQL (db.t4g.small)
# ============================================================================

log_info "Création RDS PostgreSQL (db.t4g.small)..."

if aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --region $REGION &> /dev/null; then
    log_warning "RDS existe déjà"
else
    aws rds create-db-instance \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --db-instance-class db.t4g.small \
        --engine postgres \
        --engine-version 16.1 \
        --master-username huntaze \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 50 \
        --storage-type gp3 \
        --storage-encrypted \
        --backup-retention-period 7 \
        --publicly-accessible \
        --region $REGION \
        --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta \
        > /dev/null

    log_info "Attente RDS (5-10 min)..."
    aws rds wait db-instance-available \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --region $REGION
fi

DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $REGION)

DATABASE_URL="postgresql://huntaze:$DB_PASSWORD@$DB_ENDPOINT:5432/huntaze"

log_success "RDS créé: $DB_ENDPOINT"

# ============================================================================
# Create ElastiCache Redis (cache.t4g.small)
# ============================================================================

log_info "Création ElastiCache Redis (cache.t4g.small)..."

if aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --region $REGION &> /dev/null; then
    log_warning "Redis existe déjà"
else
    aws elasticache create-cache-cluster \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --cache-node-type cache.t4g.small \
        --engine redis \
        --engine-version 7.1 \
        --num-cache-nodes 1 \
        --region $REGION \
        --tags Key=Project,Value=Huntaze Key=Environment,Value=Beta \
        > /dev/null

    log_info "Attente Redis (5-10 min)..."
    aws elasticache wait cache-cluster-available \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --region $REGION
fi

REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --show-cache-node-info \
    --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
    --output text \
    --region $REGION)

REDIS_URL="redis://$REDIS_ENDPOINT:6379"

log_success "Redis créé: $REDIS_ENDPOINT"

# ============================================================================
# Create S3 Bucket
# ============================================================================

log_info "Création S3 bucket..."

BUCKET_NAME="${PROJECT_NAME}-assets"

if aws s3 ls s3://$BUCKET_NAME 2>/dev/null; then
    log_warning "Bucket existe déjà"
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
      "Id": "IntelligentTiering",
      "Status": "Enabled",
      "Transitions": [
        { "Days": 30, "StorageClass": "INTELLIGENT_TIERING" }
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
# Configure Security Groups
# ============================================================================

log_info "Configuration Security Groups..."

VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text \
    --region $REGION)

SG_NAME="${PROJECT_NAME}-db-redis"
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region $REGION 2>/dev/null)

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    SG_ID=$(aws ec2 create-security-group \
        --group-name $SG_NAME \
        --description "Allow PostgreSQL and Redis" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' \
        --output text)

    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0 \
        --region $REGION

    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 6379 \
        --cidr 0.0.0.0/0 \
        --region $REGION

    log_success "Security Group créé: $SG_ID"
else
    log_warning "Security Group existe déjà: $SG_ID"
fi

aws rds modify-db-instance \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --vpc-security-group-ids $SG_ID \
    --apply-immediately \
    --region $REGION \
    > /dev/null

aws elasticache modify-cache-cluster \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --security-group-ids $SG_ID \
    --apply-immediately \
    --region $REGION \
    > /dev/null

log_success "Security Groups appliqués"

# ============================================================================
# CloudWatch Alarms
# ============================================================================

log_info "Configuration CloudWatch Alarms..."

# RDS CPU
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

# Redis Memory
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

log_success "CloudWatch Alarms configurées"

# ============================================================================
# Save Environment Variables
# ============================================================================

log_info "Sauvegarde des variables d'environnement..."

cat > .env.production.local <<EOF
# Huntaze Beta - 50 Users
# Generated: $(date)

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

# Azure AI Foundry (à compléter)
AZURE_AI_CHAT_ENDPOINT="https://your-endpoint.eastus2.inference.ai.azure.com"
AZURE_AI_CHAT_KEY="your-azure-ai-key"

# Upstash QStash (à compléter)
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"

# Feature Flags
NODE_ENV="production"
ENABLE_RATE_LIMITING="true"
ENABLE_CACHING="true"
EOF

log_success "Variables sauvegardées dans .env.production.local"

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "============================================================================"
log_success "Déploiement AWS terminé !"
echo "============================================================================"
echo ""
echo "📊 Ressources créées:"
echo "  - RDS PostgreSQL (db.t4g.small): $DB_ENDPOINT"
echo "  - ElastiCache Redis (cache.t4g.small): $REDIS_ENDPOINT"
echo "  - S3 Bucket: $BUCKET_NAME"
echo ""
echo "💰 Budget estimé: \$150-180/mois"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Compléter Azure AI Foundry dans .env.production.local"
echo "  2. Créer compte Upstash et ajouter credentials"
echo "  3. Déployer sur Vercel: vercel --prod"
echo "  4. Run migrations: npx prisma migrate deploy"
echo "  5. Vérifier: ./verify.sh"
echo ""
echo "============================================================================"
