#!/bin/bash

# ============================================================================
# Set CloudWatch Logs Retention Policy
# ============================================================================
# Configures retention policies on CloudWatch Log Groups
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-1"
DEFAULT_RETENTION_DAYS=30
BATCH_RETENTION_DAYS=14
SECURITY_RETENTION_DAYS=90

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Set CloudWatch Logs Retention${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Function to set retention
set_retention() {
    local LOG_GROUP=$1
    local RETENTION_DAYS=$2
    
    aws logs put-retention-policy \
        --log-group-name "$LOG_GROUP" \
        --retention-in-days "$RETENTION_DAYS" \
        --region "$AWS_REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ Set retention to $RETENTION_DAYS days${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed to set retention${NC}"
        return 1
    fi
}

# ============================================================================
# 1. ECS Application Logs (30 days)
# ============================================================================

echo -e "${YELLOW}1. Setting retention for ECS application logs (30 days)...${NC}"

ECS_APP_LOGS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/ecs/huntaze" \
    --region "$AWS_REGION" \
    --query 'logGroups[?!contains(logGroupName, `batch`) && !contains(logGroupName, `playwright`)].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ECS_APP_LOGS" ]; then
    echo -e "${BLUE}No ECS application log groups found${NC}"
else
    for LOG_GROUP in $ECS_APP_LOGS; do
        echo -e "${BLUE}Processing: $LOG_GROUP${NC}"
        set_retention "$LOG_GROUP" "$DEFAULT_RETENTION_DAYS"
    done
fi

echo ""

# ============================================================================
# 2. ECS Batch/Job Logs (14 days)
# ============================================================================

echo -e "${YELLOW}2. Setting retention for ECS batch logs (14 days)...${NC}"

ECS_BATCH_LOGS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/ecs/huntaze" \
    --region "$AWS_REGION" \
    --query 'logGroups[?contains(logGroupName, `batch`) || contains(logGroupName, `playwright`)].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ECS_BATCH_LOGS" ]; then
    echo -e "${BLUE}No ECS batch log groups found${NC}"
else
    for LOG_GROUP in $ECS_BATCH_LOGS; do
        echo -e "${BLUE}Processing: $LOG_GROUP${NC}"
        set_retention "$LOG_GROUP" "$BATCH_RETENTION_DAYS"
    done
fi

echo ""

# ============================================================================
# 3. Lambda Logs (30 days)
# ============================================================================

echo -e "${YELLOW}3. Setting retention for Lambda logs (30 days)...${NC}"

LAMBDA_LOGS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --region "$AWS_REGION" \
    --query 'logGroups[].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$LAMBDA_LOGS" ]; then
    echo -e "${BLUE}No Lambda log groups found${NC}"
else
    for LOG_GROUP in $LAMBDA_LOGS; do
        echo -e "${BLUE}Processing: $LOG_GROUP${NC}"
        set_retention "$LOG_GROUP" "$DEFAULT_RETENTION_DAYS"
    done
fi

echo ""

# ============================================================================
# 4. RDS Logs (30 days)
# ============================================================================

echo -e "${YELLOW}4. Setting retention for RDS logs (30 days)...${NC}"

RDS_LOGS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/rds" \
    --region "$AWS_REGION" \
    --query 'logGroups[?contains(logGroupName, `huntaze`)].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$RDS_LOGS" ]; then
    echo -e "${BLUE}No RDS log groups found${NC}"
else
    for LOG_GROUP in $RDS_LOGS; do
        echo -e "${BLUE}Processing: $LOG_GROUP${NC}"
        set_retention "$LOG_GROUP" "$DEFAULT_RETENTION_DAYS"
    done
fi

echo ""

# ============================================================================
# 5. Security Logs (90 days)
# ============================================================================

echo -e "${YELLOW}5. Setting retention for security logs (90 days)...${NC}"

SECURITY_LOGS=$(aws logs describe-log-groups \
    --region "$AWS_REGION" \
    --query 'logGroups[?contains(logGroupName, `cloudtrail`) || contains(logGroupName, `guardduty`) || contains(logGroupName, `securityhub`)].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$SECURITY_LOGS" ]; then
    echo -e "${BLUE}No security log groups found${NC}"
else
    for LOG_GROUP in $SECURITY_LOGS; do
        echo -e "${BLUE}Processing: $LOG_GROUP${NC}"
        set_retention "$LOG_GROUP" "$SECURITY_RETENTION_DAYS"
    done
fi

echo ""

# ============================================================================
# 6. Find Log Groups Without Retention
# ============================================================================

echo -e "${YELLOW}6. Finding log groups without retention...${NC}"

NO_RETENTION=$(aws logs describe-log-groups \
    --region "$AWS_REGION" \
    --query 'logGroups[?retentionInDays==null && (starts_with(logGroupName, `/ecs/huntaze`) || starts_with(logGroupName, `/aws/lambda/huntaze`) || starts_with(logGroupName, `/aws/rds`) || contains(logGroupName, `huntaze`))].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$NO_RETENTION" ]; then
    check_success "All relevant log groups have retention policies"
else
    NO_RETENTION_COUNT=$(echo "$NO_RETENTION" | wc -w)
    echo -e "${YELLOW}⚠ Found $NO_RETENTION_COUNT log groups without retention:${NC}"
    for LOG_GROUP in $NO_RETENTION; do
        echo -e "${BLUE}  $LOG_GROUP${NC}"
        echo -e "${YELLOW}    Set retention manually or add to this script${NC}"
    done
fi

echo ""

# ============================================================================
# 7. Calculate Cost Savings
# ============================================================================

echo -e "${YELLOW}7. Calculating cost savings...${NC}"

# Get total storage before (assuming no retention = 1 year of data)
TOTAL_STORAGE_BYTES=0
ALL_LOG_GROUPS=$(aws logs describe-log-groups \
    --region "$AWS_REGION" \
    --query 'logGroups[?starts_with(logGroupName, `/ecs/huntaze`) || starts_with(logGroupName, `/aws/lambda/huntaze`)].storedBytes' \
    --output text 2>/dev/null || echo "0")

for BYTES in $ALL_LOG_GROUPS; do
    TOTAL_STORAGE_BYTES=$((TOTAL_STORAGE_BYTES + BYTES))
done

TOTAL_STORAGE_GB=$((TOTAL_STORAGE_BYTES / 1024 / 1024 / 1024))

# Estimate savings (assuming 30-day retention vs 365-day retention)
SAVINGS_PERCENT=92  # (365-30)/365 * 100
ESTIMATED_SAVINGS=$(echo "scale=2; $TOTAL_STORAGE_GB * 0.03 * $SAVINGS_PERCENT / 100" | bc)

echo -e "${BLUE}Current storage: ${TOTAL_STORAGE_GB} GB${NC}"
echo -e "${BLUE}Estimated monthly savings: \$${ESTIMATED_SAVINGS} (${SAVINGS_PERCENT}% reduction)${NC}"

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Log Retention Configuration Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• ECS application logs: $DEFAULT_RETENTION_DAYS days"
echo "• ECS batch logs: $BATCH_RETENTION_DAYS days"
echo "• Lambda logs: $DEFAULT_RETENTION_DAYS days"
echo "• RDS logs: $DEFAULT_RETENTION_DAYS days"
echo "• Security logs: $SECURITY_RETENTION_DAYS days"
echo "• Estimated monthly savings: \$${ESTIMATED_SAVINGS}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify retention policies: ./scripts/validate-container-insights.sh"
echo "2. Monitor storage costs in Cost Explorer"
echo "3. Adjust retention periods as needed"
echo "4. Consider archiving to S3 for long-term storage"
echo ""
echo -e "${YELLOW}Note: Log deletion takes effect within 72 hours${NC}"
echo ""
