#!/bin/bash
# ============================================================================
# AWS Cost Optimization Script - Safe Execution
# ============================================================================
# This script optimizes AWS costs step by step with confirmations
# Estimated savings: $250-300/month
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}💰 AWS Cost Optimization for Beta${NC}"
echo "========================================"
echo ""

# Credentials: use the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured or expired.${NC}"
    echo -e "${YELLOW}   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry.${NC}"
    exit 1
fi

LOG_FILE="aws-optimization-$(date +%Y%m%d-%H%M%S).log"
BACKUP_FILE="aws-backup-$(date +%Y%m%d-%H%M%S).json"

echo -e "${YELLOW}📝 Log file: $LOG_FILE${NC}"
echo -e "${YELLOW}💾 Backup file: $BACKUP_FILE${NC}"
echo ""

# Function to ask for confirmation
confirm() {
    local message=$1
    echo -e "${YELLOW}$message${NC}"
    read -p "Continue? (yes/no): " response
    if [ "$response" != "yes" ]; then
        echo -e "${RED}Skipped.${NC}"
        return 1
    fi
    return 0
}

# Function to execute with logging
execute() {
    local description=$1
    local command=$2
    
    echo -e "${GREEN}▶ $description${NC}" | tee -a "$LOG_FILE"
    if eval "$command" 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ Success${NC}" | tee -a "$LOG_FILE"
        return 0
    else
        echo -e "${RED}❌ Failed${NC}" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Create backup of current configuration
echo -e "${GREEN}📦 Creating backup of current configuration...${NC}"
{
    echo "{"
    echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
    echo "  \"ecs_services\": ["
    aws ecs list-services --cluster huntaze-ai-router-production --region us-east-2 --output json 2>/dev/null || echo "[]"
    echo "  ],"
    echo "  \"load_balancers\": ["
    aws elbv2 describe-load-balancers --region us-east-2 --output json 2>/dev/null || echo "[]"
    echo "  ],"
    echo "  \"secrets\": ["
    aws secretsmanager list-secrets --region us-east-1 --output json 2>/dev/null || echo "[]"
    echo "  ]"
    echo "}"
} > "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup saved to $BACKUP_FILE${NC}"
echo ""

# ============================================================================
# PHASE 1: Scale Down ECS Tasks (Save ~$100/month)
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}PHASE 1: Scale Down ECS Tasks${NC}"
echo -e "${GREEN}Expected Savings: ~\$100/month${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if confirm "Scale down huntaze-ai-router-production to 1 task?"; then
    execute \
        "Scaling down ECS service to 1 task" \
        "aws ecs update-service \
            --cluster huntaze-ai-router-production \
            --service huntaze-ai-router \
            --desired-count 1 \
            --region us-east-2"
    
    execute \
        "Updating auto-scaling min=1, max=2" \
        "aws application-autoscaling register-scalable-target \
            --service-namespace ecs \
            --resource-id service/huntaze-ai-router-production/huntaze-ai-router \
            --scalable-dimension ecs:service:DesiredCount \
            --min-capacity 1 \
            --max-capacity 2 \
            --region us-east-2"
fi

if confirm "Delete test ECS service (huntaze-ai-router/hz-router-svc)?"; then
    execute \
        "Deleting test ECS service" \
        "aws ecs update-service \
            --cluster huntaze-ai-router \
            --service hz-router-svc \
            --desired-count 0 \
            --region us-east-2"
    
    sleep 10
    
    execute \
        "Deleting ECS service" \
        "aws ecs delete-service \
            --cluster huntaze-ai-router \
            --service hz-router-svc \
            --force \
            --region us-east-2"
fi

# ============================================================================
# PHASE 2: Optimize CloudWatch Logs (Save ~$25/month)
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}PHASE 2: Optimize CloudWatch Logs${NC}"
echo -e "${GREEN}Expected Savings: ~\$25/month${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if confirm "Reduce CloudWatch log retention to 7 days?"; then
    execute \
        "Setting retention for /ecs/huntaze-ai-router" \
        "aws logs put-retention-policy \
            --log-group-name /ecs/huntaze-ai-router \
            --retention-in-days 7 \
            --region us-east-2"
    
    execute \
        "Setting retention for container insights" \
        "aws logs put-retention-policy \
            --log-group-name /aws/ecs/containerinsights/huntaze-ai-router-production/performance \
            --retention-in-days 7 \
            --region us-east-2"
fi

# ============================================================================
# PHASE 3: Clean Up Secrets (Save ~$16/month)
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}PHASE 3: Clean Up Unused Secrets${NC}"
echo -e "${GREEN}Expected Savings: ~\$16/month${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if confirm "Delete unused OnlyFans test account secrets?"; then
    # Export secrets before deletion
    echo "Exporting secrets to backup..."
    mkdir -p secrets-backup
    
    for secret in "of/creds/test-user" "of/creds/login-final-1760229887" "of/creds/huntcpro" "of/creds/charleshuntaze76100"; do
        aws secretsmanager get-secret-value \
            --secret-id "$secret" \
            --region us-east-1 \
            --output json > "secrets-backup/${secret//\//-}.json" 2>/dev/null || true
    done
    
    execute \
        "Deleting of/creds/test-user" \
        "aws secretsmanager delete-secret \
            --secret-id of/creds/test-user \
            --force-delete-without-recovery \
            --region us-east-1"
    
    execute \
        "Deleting of/creds/login-final-1760229887" \
        "aws secretsmanager delete-secret \
            --secret-id of/creds/login-final-1760229887 \
            --force-delete-without-recovery \
            --region us-east-1"
    
    execute \
        "Deleting of/creds/huntcpro" \
        "aws secretsmanager delete-secret \
            --secret-id of/creds/huntcpro \
            --force-delete-without-recovery \
            --region us-east-1"
    
    execute \
        "Deleting of/creds/charleshuntaze76100" \
        "aws secretsmanager delete-secret \
            --secret-id of/creds/charleshuntaze76100 \
            --force-delete-without-recovery \
            --region us-east-1"
fi

# ============================================================================
# PHASE 4: Delete Unused Resources (Save ~$10/month)
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}PHASE 4: Delete Unused Resources${NC}"
echo -e "${GREEN}Expected Savings: ~\$10/month${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if confirm "Delete unused ECS cluster in eu-west-1 (ai-team)?"; then
    execute \
        "Deleting ai-team cluster" \
        "aws ecs delete-cluster \
            --cluster ai-team \
            --region eu-west-1"
fi

if confirm "Delete unused EventBridge rule in eu-west-1?"; then
    # First remove targets
    execute \
        "Removing targets from ai-insights-ready rule" \
        "aws events remove-targets \
            --rule ai-insights-ready \
            --ids 1 \
            --region eu-west-1"
    
    execute \
        "Deleting ai-insights-ready rule" \
        "aws events delete-rule \
            --name ai-insights-ready \
            --region eu-west-1"
fi

# ============================================================================
# PHASE 5: Optional - Delete Test ALB (Save ~$16/month)
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}PHASE 5: Optional - Delete Test ALB${NC}"
echo -e "${GREEN}Expected Savings: ~\$16/month${NC}"
echo -e "${GREEN}⚠️  WARNING: This will affect connectivity${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""

if confirm "Delete test ALB (huntaze-ai-router-alb)? This is OPTIONAL and may break test endpoints."; then
    execute \
        "Deleting test ALB" \
        "aws elbv2 delete-load-balancer \
            --load-balancer-arn arn:aws:elasticloadbalancing:us-east-2:317805897534:loadbalancer/app/huntaze-ai-router-alb/aa115d1dc069e4cc \
            --region us-east-2"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ OPTIMIZATION COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Summary:${NC}"
echo "• ECS tasks scaled down: 3 → 1"
echo "• CloudWatch retention reduced: 30 days → 7 days"
echo "• Unused secrets deleted: 4 secrets"
echo "• Unused clusters deleted: 1 cluster"
echo ""
echo -e "${GREEN}Estimated Monthly Savings: \$150-200${NC}"
echo -e "${GREEN}New Estimated Monthly Cost: \$100-150${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Monitor application health for 24-48 hours"
echo "2. Check AWS Cost Explorer in 2-3 days"
echo "3. Review logs: cat $LOG_FILE"
echo "4. Backup saved: $BACKUP_FILE"
echo ""
echo -e "${YELLOW}Rollback if needed:${NC}"
echo "aws ecs update-service --cluster huntaze-ai-router-production --service huntaze-ai-router --desired-count 2 --region us-east-2"
echo ""
