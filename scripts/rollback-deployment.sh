#!/bin/bash
# ============================================================================
# Huntaze Beta - Script de Rollback
# ============================================================================
# Supprime toutes les ressources AWS créées par le déploiement
# ATTENTION: Cette action est IRRÉVERSIBLE
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

# ============================================================================
# Confirmation
# ============================================================================

echo "============================================================================"
log_warning "ATTENTION: Rollback du déploiement Huntaze Beta"
echo "============================================================================"
echo ""
log_warning "Cette action va SUPPRIMER toutes les ressources AWS:"
echo "  - RDS PostgreSQL (huntaze-beta-db)"
echo "  - ElastiCache Redis (huntaze-beta-redis)"
echo "  - S3 Bucket (huntaze-beta-assets)"
echo "  - Lambda Functions"
echo "  - API Gateway"
echo "  - CloudWatch Alarms"
echo "  - Security Groups"
echo ""
log_error "Cette action est IRRÉVERSIBLE"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (tapez 'yes' pour confirmer): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Rollback annulé"
    exit 0
fi

echo ""
log_info "Début du rollback..."
echo ""

# ============================================================================
# Delete Lambda Functions
# ============================================================================

log_info "Suppression Lambda Functions..."

LAMBDA_FUNCTION_NAME="${PROJECT_NAME}-ai-router"
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION &> /dev/null; then
    aws lambda delete-function \
        --function-name $LAMBDA_FUNCTION_NAME \
        --region $REGION
    log_success "Lambda $LAMBDA_FUNCTION_NAME supprimée"
else
    log_warning "Lambda $LAMBDA_FUNCTION_NAME n'existe pas"
fi

# ============================================================================
# Delete API Gateway
# ============================================================================

log_info "Suppression API Gateway..."

API_NAME="${PROJECT_NAME}-ai-router"
API_ID=$(aws apigatewayv2 get-apis \
    --query "Items[?Name=='$API_NAME'].ApiId" \
    --output text \
    --region $REGION 2>/dev/null)

if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
    aws apigatewayv2 delete-api \
        --api-id $API_ID \
        --region $REGION
    log_success "API Gateway $API_NAME supprimé"
else
    log_warning "API Gateway $API_NAME n'existe pas"
fi

# ============================================================================
# Delete CloudWatch Alarms
# ============================================================================

log_info "Suppression CloudWatch Alarms..."

ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix $PROJECT_NAME \
    --query 'MetricAlarms[*].AlarmName' \
    --output text \
    --region $REGION)

if [ ! -z "$ALARMS" ]; then
    for alarm in $ALARMS; do
        aws cloudwatch delete-alarms \
            --alarm-names $alarm \
            --region $REGION
        log_success "Alarme $alarm supprimée"
    done
else
    log_warning "Aucune alarme à supprimer"
fi

# ============================================================================
# Delete RDS PostgreSQL
# ============================================================================

log_info "Suppression RDS PostgreSQL..."

if aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --region $REGION &> /dev/null; then
    
    # Delete without final snapshot (for beta)
    aws rds delete-db-instance \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --skip-final-snapshot \
        --region $REGION \
        > /dev/null
    
    log_info "Attente suppression RDS (5-10 min)..."
    aws rds wait db-instance-deleted \
        --db-instance-identifier ${PROJECT_NAME}-db \
        --region $REGION
    
    log_success "RDS ${PROJECT_NAME}-db supprimé"
else
    log_warning "RDS ${PROJECT_NAME}-db n'existe pas"
fi

# ============================================================================
# Delete ElastiCache Redis
# ============================================================================

log_info "Suppression ElastiCache Redis..."

if aws elasticache describe-cache-clusters \
    --cache-cluster-id ${PROJECT_NAME}-redis \
    --region $REGION &> /dev/null; then
    
    aws elasticache delete-cache-cluster \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --region $REGION \
        > /dev/null
    
    log_info "Attente suppression Redis (5-10 min)..."
    # Wait for deletion (no wait command for ElastiCache)
    while aws elasticache describe-cache-clusters \
        --cache-cluster-id ${PROJECT_NAME}-redis \
        --region $REGION &> /dev/null; do
        sleep 10
    done
    
    log_success "Redis ${PROJECT_NAME}-redis supprimé"
else
    log_warning "Redis ${PROJECT_NAME}-redis n'existe pas"
fi

# ============================================================================
# Delete S3 Bucket
# ============================================================================

log_info "Suppression S3 Bucket..."

BUCKET_NAME="${PROJECT_NAME}-assets"
if aws s3 ls s3://$BUCKET_NAME 2>/dev/null; then
    # Empty bucket first
    aws s3 rm s3://$BUCKET_NAME --recursive --region $REGION
    
    # Delete bucket
    aws s3 rb s3://$BUCKET_NAME --region $REGION
    
    log_success "S3 bucket $BUCKET_NAME supprimé"
else
    log_warning "S3 bucket $BUCKET_NAME n'existe pas"
fi

# ============================================================================
# Delete Security Groups
# ============================================================================

log_info "Suppression Security Groups..."

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

if [ "$SG_ID" != "None" ] && [ ! -z "$SG_ID" ]; then
    # Wait a bit for resources to be fully deleted
    sleep 30
    
    aws ec2 delete-security-group \
        --group-id $SG_ID \
        --region $REGION 2>/dev/null || log_warning "Security Group encore utilisé, skip..."
    
    log_success "Security Group $SG_NAME supprimé"
else
    log_warning "Security Group $SG_NAME n'existe pas"
fi

# ============================================================================
# Delete IAM Roles
# ============================================================================

log_info "Suppression IAM Roles..."

LAMBDA_ROLE_NAME="HuntazeLambdaAIRouterRole"
if aws iam get-role --role-name $LAMBDA_ROLE_NAME &> /dev/null; then
    # Detach policies first
    POLICIES=$(aws iam list-attached-role-policies \
        --role-name $LAMBDA_ROLE_NAME \
        --query 'AttachedPolicies[*].PolicyArn' \
        --output text)
    
    for policy in $POLICIES; do
        aws iam detach-role-policy \
            --role-name $LAMBDA_ROLE_NAME \
            --policy-arn $policy
    done
    
    # Delete role
    aws iam delete-role --role-name $LAMBDA_ROLE_NAME
    
    log_success "IAM Role $LAMBDA_ROLE_NAME supprimé"
else
    log_warning "IAM Role $LAMBDA_ROLE_NAME n'existe pas"
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "============================================================================"
log_success "Rollback terminé !"
echo "============================================================================"
echo ""
echo "📊 Ressources supprimées:"
echo "  - RDS PostgreSQL"
echo "  - ElastiCache Redis"
echo "  - S3 Bucket"
echo "  - Lambda Functions"
echo "  - API Gateway"
echo "  - CloudWatch Alarms"
echo "  - Security Groups"
echo "  - IAM Roles"
echo ""
log_warning "N'oubliez pas de:"
echo "  1. Supprimer le déploiement Vercel: vercel rm"
echo "  2. Supprimer le compte Upstash (si créé)"
echo "  3. Supprimer .env.production.local"
echo ""
echo "============================================================================"
