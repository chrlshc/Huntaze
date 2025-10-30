#!/bin/bash

# ============================================================================
# Container Insights & CloudWatch Logs Validation Script
# ============================================================================
# Validates Container Insights configuration and log retention policies
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
CLUSTERS=("ai-team" "huntaze-cluster" "huntaze-of-fargate")

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Container Insights & Logs Validation${NC}"
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

# Function to check warning
check_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================================================
# 1. Validate Container Insights on ECS Clusters
# ============================================================================

echo -e "${YELLOW}1. Validating Container Insights...${NC}"

for CLUSTER in "${CLUSTERS[@]}"; do
    echo -e "${BLUE}Checking cluster: $CLUSTER${NC}"
    
    # Check if cluster exists
    CLUSTER_EXISTS=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --region "$AWS_REGION" \
        --query 'clusters[0].clusterName' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$CLUSTER_EXISTS" = "NOT_FOUND" ] || [ -z "$CLUSTER_EXISTS" ]; then
        check_warning "  Cluster not found: $CLUSTER"
        continue
    fi
    
    # Check Container Insights setting
    CI_SETTING=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --include SETTINGS \
        --region "$AWS_REGION" \
        --query 'clusters[0].settings[?name==`containerInsights`].value' \
        --output text 2>/dev/null || echo "NOT_CONFIGURED")
    
    if [ "$CI_SETTING" = "enhanced" ]; then
        check_success "  Container Insights: enhanced"
    elif [ "$CI_SETTING" = "enabled" ]; then
        check_warning "  Container Insights: enabled (consider upgrading to enhanced)"
    else
        check_warning "  Container Insights: not enabled"
    fi
    
    # Check task count
    TASK_COUNT=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --region "$AWS_REGION" \
        --query 'clusters[0].runningTasksCount' \
        --output text)
    
    echo -e "${BLUE}    Running tasks: $TASK_COUNT${NC}"
    
    echo ""
done

# ============================================================================
# 2. Validate Container Insights Metrics
# ============================================================================

echo -e "${YELLOW}2. Validating Container Insights Metrics...${NC}"

# Check if metrics are being published
METRICS_AVAILABLE=$(aws cloudwatch list-metrics \
    --namespace "ECS/ContainerInsights" \
    --region "$AWS_REGION" \
    --query 'length(Metrics)' \
    --output text 2>/dev/null || echo "0")

if [ "$METRICS_AVAILABLE" -gt 0 ]; then
    check_success "Container Insights metrics available: $METRICS_AVAILABLE metrics"
    
    # List key metrics
    echo -e "${BLUE}Key metrics:${NC}"
    aws cloudwatch list-metrics \
        --namespace "ECS/ContainerInsights" \
        --region "$AWS_REGION" \
        --query 'Metrics[?MetricName==`CpuUtilized` || MetricName==`MemoryUtilized` || MetricName==`RunningTaskCount`].{Metric:MetricName,Cluster:Dimensions[?Name==`ClusterName`].Value|[0]}' \
        --output table | head -20
else
    check_warning "No Container Insights metrics found (may take a few minutes after enabling)"
fi

echo ""

# ============================================================================
# 3. Validate CloudWatch Log Groups
# ============================================================================

echo -e "${YELLOW}3. Validating CloudWatch Log Groups...${NC}"

# List all ECS log groups
LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/ecs/huntaze" \
    --region "$AWS_REGION" \
    --query 'logGroups[].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$LOG_GROUPS" ]; then
    check_warning "No ECS log groups found with prefix /ecs/huntaze"
else
    LOG_GROUP_COUNT=$(echo "$LOG_GROUPS" | wc -w)
    echo -e "${BLUE}Found $LOG_GROUP_COUNT log groups${NC}"
    echo ""
    
    for LOG_GROUP in $LOG_GROUPS; do
        echo -e "${BLUE}Checking: $LOG_GROUP${NC}"
        
        # Get retention policy
        RETENTION=$(aws logs describe-log-groups \
            --log-group-name "$LOG_GROUP" \
            --region "$AWS_REGION" \
            --query 'logGroups[0].retentionInDays' \
            --output text 2>/dev/null || echo "null")
        
        if [ "$RETENTION" = "null" ] || [ -z "$RETENTION" ]; then
            check_warning "  Retention: Never expire (consider setting retention)"
        else
            check_success "  Retention: $RETENTION days"
        fi
        
        # Get storage size
        STORED_BYTES=$(aws logs describe-log-groups \
            --log-group-name "$LOG_GROUP" \
            --region "$AWS_REGION" \
            --query 'logGroups[0].storedBytes' \
            --output text 2>/dev/null || echo "0")
        
        STORED_MB=$((STORED_BYTES / 1024 / 1024))
        echo -e "${BLUE}    Storage: ${STORED_MB} MB${NC}"
        
        echo ""
    done
fi

# ============================================================================
# 4. Validate Lambda Log Groups
# ============================================================================

echo -e "${YELLOW}4. Validating Lambda Log Groups...${NC}"

LAMBDA_LOG_GROUPS=$(aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --region "$AWS_REGION" \
    --query 'logGroups[].logGroupName' \
    --output text 2>/dev/null || echo "")

if [ -z "$LAMBDA_LOG_GROUPS" ]; then
    echo -e "${BLUE}No Lambda log groups found with prefix /aws/lambda/huntaze${NC}"
else
    LAMBDA_LOG_GROUP_COUNT=$(echo "$LAMBDA_LOG_GROUPS" | wc -w)
    echo -e "${BLUE}Found $LAMBDA_LOG_GROUP_COUNT Lambda log groups${NC}"
    echo ""
    
    for LOG_GROUP in $LAMBDA_LOG_GROUPS; do
        echo -e "${BLUE}Checking: $LOG_GROUP${NC}"
        
        RETENTION=$(aws logs describe-log-groups \
            --log-group-name "$LOG_GROUP" \
            --region "$AWS_REGION" \
            --query 'logGroups[0].retentionInDays' \
            --output text 2>/dev/null || echo "null")
        
        if [ "$RETENTION" = "null" ] || [ -z "$RETENTION" ]; then
            check_warning "  Retention: Never expire"
        else
            check_success "  Retention: $RETENTION days"
        fi
        
        echo ""
    done
fi

# ============================================================================
# 5. Validate CloudWatch Alarms
# ============================================================================

echo -e "${YELLOW}5. Validating CloudWatch Alarms...${NC}"

# Check for Container Insights alarms
CI_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "ecs-" \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[?Namespace==`ECS/ContainerInsights`].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$CI_ALARMS" ]; then
    check_warning "No Container Insights alarms found"
else
    ALARM_COUNT=$(echo "$CI_ALARMS" | wc -w)
    check_success "Container Insights alarms configured: $ALARM_COUNT alarms"
    
    echo -e "${BLUE}Alarms:${NC}"
    for ALARM in $CI_ALARMS; do
        STATE=$(aws cloudwatch describe-alarms \
            --alarm-names "$ALARM" \
            --region "$AWS_REGION" \
            --query 'MetricAlarms[0].StateValue' \
            --output text)
        
        if [ "$STATE" = "OK" ]; then
            echo -e "  ${GREEN}✓ $ALARM: $STATE${NC}"
        elif [ "$STATE" = "ALARM" ]; then
            echo -e "  ${RED}✗ $ALARM: $STATE${NC}"
        else
            echo -e "  ${YELLOW}⚠ $ALARM: $STATE${NC}"
        fi
    done
fi

echo ""

# ============================================================================
# 6. Validate CloudWatch Dashboard
# ============================================================================

echo -e "${YELLOW}6. Validating CloudWatch Dashboard...${NC}"

DASHBOARD_EXISTS=$(aws cloudwatch list-dashboards \
    --region "$AWS_REGION" \
    --query 'DashboardEntries[?DashboardName==`Huntaze-ECS-Container-Insights`].DashboardName' \
    --output text 2>/dev/null || echo "")

if [ -n "$DASHBOARD_EXISTS" ]; then
    check_success "CloudWatch Dashboard exists: Huntaze-ECS-Container-Insights"
    echo -e "${BLUE}  URL: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=Huntaze-ECS-Container-Insights${NC}"
else
    check_warning "CloudWatch Dashboard not found"
fi

echo ""

# ============================================================================
# 7. Cost Estimation
# ============================================================================

echo -e "${YELLOW}7. Estimating Costs...${NC}"

# Calculate total log storage
TOTAL_STORAGE_BYTES=0
ALL_LOG_GROUPS=$(aws logs describe-log-groups \
    --region "$AWS_REGION" \
    --query 'logGroups[?starts_with(logGroupName, `/ecs/huntaze`) || starts_with(logGroupName, `/aws/lambda/huntaze`)].storedBytes' \
    --output text 2>/dev/null || echo "0")

for BYTES in $ALL_LOG_GROUPS; do
    TOTAL_STORAGE_BYTES=$((TOTAL_STORAGE_BYTES + BYTES))
done

TOTAL_STORAGE_GB=$((TOTAL_STORAGE_BYTES / 1024 / 1024 / 1024))
STORAGE_COST=$(echo "scale=2; $TOTAL_STORAGE_GB * 0.03" | bc)

echo -e "${BLUE}Total log storage: ${TOTAL_STORAGE_GB} GB${NC}"
echo -e "${BLUE}Estimated monthly cost: \$${STORAGE_COST}${NC}"
echo -e "${BLUE}Container Insights: \$0.00 (included with ECS)${NC}"

echo ""

# ============================================================================
# 8. Recommendations
# ============================================================================

echo -e "${YELLOW}8. Recommendations...${NC}"

# Check for log groups without retention
NO_RETENTION_COUNT=$(aws logs describe-log-groups \
    --region "$AWS_REGION" \
    --query 'logGroups[?retentionInDays==null && (starts_with(logGroupName, `/ecs/huntaze`) || starts_with(logGroupName, `/aws/lambda/huntaze`))] | length(@)' \
    --output text 2>/dev/null || echo "0")

if [ "$NO_RETENTION_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ $NO_RETENTION_COUNT log groups have no retention policy${NC}"
    echo -e "${BLUE}  Run: ./scripts/set-log-retention.sh to fix${NC}"
fi

# Check for clusters without Container Insights
NO_CI_COUNT=0
for CLUSTER in "${CLUSTERS[@]}"; do
    CI_SETTING=$(aws ecs describe-clusters \
        --clusters "$CLUSTER" \
        --include SETTINGS \
        --region "$AWS_REGION" \
        --query 'clusters[0].settings[?name==`containerInsights`].value' \
        --output text 2>/dev/null || echo "NOT_CONFIGURED")
    
    if [ "$CI_SETTING" != "enhanced" ] && [ "$CI_SETTING" != "enabled" ]; then
        NO_CI_COUNT=$((NO_CI_COUNT + 1))
    fi
done

if [ "$NO_CI_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ $NO_CI_COUNT clusters do not have Container Insights enabled${NC}"
    echo -e "${BLUE}  Run: ./scripts/enable-container-insights.sh to fix${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Validation Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Clusters checked: ${#CLUSTERS[@]}"
echo "• Container Insights metrics: $METRICS_AVAILABLE"
echo "• ECS log groups: $LOG_GROUP_COUNT"
echo "• Lambda log groups: $LAMBDA_LOG_GROUP_COUNT"
echo "• CloudWatch alarms: $(echo "$CI_ALARMS" | wc -w)"
echo "• Total log storage: ${TOTAL_STORAGE_GB} GB"
echo "• Estimated monthly cost: \$${STORAGE_COST}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review any warnings above"
echo "2. Set retention policies on log groups without retention"
echo "3. Enable Container Insights on clusters if not enabled"
echo "4. Review CloudWatch Dashboard for insights"
echo "5. Configure additional alarms as needed"
echo ""
