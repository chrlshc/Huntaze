#!/bin/bash

# ============================================================================
# Enable Container Insights on ECS Clusters
# ============================================================================
# Enables enhanced Container Insights on all Huntaze ECS clusters
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
AWS_ACCOUNT_ID="317805897534"
CLUSTERS=("ai-team" "huntaze-cluster" "huntaze-of-fargate")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Enable Container Insights${NC}"
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

# ============================================================================
# 1. Set Account-Level Default
# ============================================================================

echo -e "${YELLOW}1. Setting account-level default...${NC}"

aws ecs put-account-setting \
  --name containerInsights \
  --value enhanced \
  --principal-arn "arn:aws:iam::$AWS_ACCOUNT_ID:root" \
  --region "$AWS_REGION"

check_success "Account-level default set to 'enhanced'"
echo ""

# ============================================================================
# 2. Enable on Existing Clusters
# ============================================================================

echo -e "${YELLOW}2. Enabling Container Insights on clusters...${NC}"

for CLUSTER in "${CLUSTERS[@]}"; do
    echo -e "${BLUE}Processing cluster: $CLUSTER${NC}"
    
    # Check if cluster exists
    CLUSTER_EXISTS=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --region "$AWS_REGION" \
        --query 'clusters[0].clusterName' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$CLUSTER_EXISTS" = "NOT_FOUND" ] || [ -z "$CLUSTER_EXISTS" ]; then
        echo -e "${YELLOW}  Cluster not found, skipping${NC}"
        continue
    fi
    
    # Enable Container Insights
    aws ecs update-cluster-settings \
        --cluster "$CLUSTER" \
        --settings name=containerInsights,value=enhanced \
        --region "$AWS_REGION" > /dev/null
    
    check_success "  Container Insights enabled: $CLUSTER"
    
    # Verify setting
    CI_SETTING=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --include SETTINGS \
        --region "$AWS_REGION" \
        --query 'clusters[0].settings[?name==`containerInsights`].value' \
        --output text)
    
    echo -e "${BLUE}    Current setting: $CI_SETTING${NC}"
    echo ""
done

# ============================================================================
# 3. Verify Metrics
# ============================================================================

echo -e "${YELLOW}3. Verifying metrics (may take a few minutes)...${NC}"

echo -e "${BLUE}Waiting 30 seconds for metrics to start publishing...${NC}"
sleep 30

METRICS_COUNT=$(aws cloudwatch list-metrics \
    --namespace "ECS/ContainerInsights" \
    --region "$AWS_REGION" \
    --query 'length(Metrics)' \
    --output text 2>/dev/null || echo "0")

if [ "$METRICS_COUNT" -gt 0 ]; then
    check_success "Container Insights metrics available: $METRICS_COUNT metrics"
else
    echo -e "${YELLOW}⚠ No metrics yet (may take 5-10 minutes after enabling)${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Container Insights Enabled${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Account-level default: enhanced"
echo "• Clusters processed: ${#CLUSTERS[@]}"
echo "• Metrics available: $METRICS_COUNT"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Wait 5-10 minutes for metrics to populate"
echo "2. View metrics in CloudWatch Console:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#metricsV2:graph=~();namespace=ECS/ContainerInsights"
echo "3. View dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=Huntaze-ECS-Container-Insights"
echo "4. Run validation: ./scripts/validate-container-insights.sh"
echo ""
