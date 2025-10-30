#!/bin/bash

# ============================================================================
# CloudWatch Alarms Validation Script
# ============================================================================
# Validates CloudWatch alarms configuration and status
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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CloudWatch Alarms Validation${NC}"
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
# 1. Validate SNS Topics
# ============================================================================

echo -e "${YELLOW}1. Validating SNS Topics...${NC}"

# Check ops-alerts topic
OPS_TOPIC=$(aws sns list-topics \
    --region "$AWS_REGION" \
    --query 'Topics[?contains(TopicArn, `ops-alerts`)].TopicArn' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$OPS_TOPIC" != "NOT_FOUND" ] && [ -n "$OPS_TOPIC" ]; then
    check_success "Ops alerts SNS topic exists"
    
    # Check subscriptions
    SUBS_COUNT=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$OPS_TOPIC" \
        --region "$AWS_REGION" \
        --query 'length(Subscriptions)' \
        --output text)
    
    echo -e "${BLUE}  Subscriptions: $SUBS_COUNT${NC}"
    
    # List subscriptions
    aws sns list-subscriptions-by-topic \
        --topic-arn "$OPS_TOPIC" \
        --region "$AWS_REGION" \
        --query 'Subscriptions[].{Protocol:Protocol,Endpoint:Endpoint,Status:SubscriptionArn}' \
        --output table
else
    check_warning "Ops alerts SNS topic not found"
fi

echo ""

# ============================================================================
# 2. Validate ECS Alarms
# ============================================================================

echo -e "${YELLOW}2. Validating ECS Alarms...${NC}"

ECS_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "ecs-" \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ECS_ALARMS" ]; then
    check_warning "No ECS alarms found"
else
    ECS_ALARM_COUNT=$(echo "$ECS_ALARMS" | wc -w)
    check_success "ECS alarms configured: $ECS_ALARM_COUNT alarms"
    
    echo -e "${BLUE}ECS Alarms Status:${NC}"
    for ALARM in $ECS_ALARMS; do
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
# 3. Validate RDS Alarms
# ============================================================================

echo -e "${YELLOW}3. Validating RDS Alarms...${NC}"

RDS_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "rds-" \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$RDS_ALARMS" ]; then
    check_warning "No RDS alarms found"
else
    RDS_ALARM_COUNT=$(echo "$RDS_ALARMS" | wc -w)
    check_success "RDS alarms configured: $RDS_ALARM_COUNT alarms"
    
    echo -e "${BLUE}RDS Alarms Status:${NC}"
    for ALARM in $RDS_ALARMS; do
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
# 4. Validate SQS Alarms
# ============================================================================

echo -e "${YELLOW}4. Validating SQS Alarms...${NC}"

SQS_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "sqs-" \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$SQS_ALARMS" ]; then
    check_warning "No SQS alarms found"
else
    SQS_ALARM_COUNT=$(echo "$SQS_ALARMS" | wc -w)
    check_success "SQS alarms configured: $SQS_ALARM_COUNT alarms"
    
    echo -e "${BLUE}SQS Alarms Status:${NC}"
    for ALARM in $SQS_ALARMS; do
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
# 5. Validate Composite Alarms
# ============================================================================

echo -e "${YELLOW}5. Validating Composite Alarms...${NC}"

COMPOSITE_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-types CompositeAlarm \
    --region "$AWS_REGION" \
    --query 'CompositeAlarms[].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$COMPOSITE_ALARMS" ]; then
    echo -e "${BLUE}No composite alarms configured${NC}"
else
    COMPOSITE_ALARM_COUNT=$(echo "$COMPOSITE_ALARMS" | wc -w)
    check_success "Composite alarms configured: $COMPOSITE_ALARM_COUNT alarms"
    
    echo -e "${BLUE}Composite Alarms Status:${NC}"
    for ALARM in $COMPOSITE_ALARMS; do
        STATE=$(aws cloudwatch describe-alarms \
            --alarm-names "$ALARM" \
            --alarm-types CompositeAlarm \
            --region "$AWS_REGION" \
            --query 'CompositeAlarms[0].StateValue' \
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
# 6. Check Alarms in ALARM State
# ============================================================================

echo -e "${YELLOW}6. Checking for Active Alarms...${NC}"

ACTIVE_ALARMS=$(aws cloudwatch describe-alarms \
    --state-value ALARM \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[].{Name:AlarmName,Reason:StateReason}' \
    --output json 2>/dev/null || echo "[]")

ACTIVE_COUNT=$(echo "$ACTIVE_ALARMS" | jq '. | length')

if [ "$ACTIVE_COUNT" -eq 0 ]; then
    check_success "No alarms in ALARM state"
else
    echo -e "${RED}⚠ $ACTIVE_COUNT alarms in ALARM state:${NC}"
    echo "$ACTIVE_ALARMS" | jq -r '.[] | "  - \(.Name): \(.Reason)"'
fi

echo ""

# ============================================================================
# 7. Validate CloudWatch Dashboard
# ============================================================================

echo -e "${YELLOW}7. Validating CloudWatch Dashboard...${NC}"

DASHBOARD_EXISTS=$(aws cloudwatch list-dashboards \
    --region "$AWS_REGION" \
    --query 'DashboardEntries[?DashboardName==`Huntaze-Alarms-Overview`].DashboardName' \
    --output text 2>/dev/null || echo "")

if [ -n "$DASHBOARD_EXISTS" ]; then
    check_success "Alarms dashboard exists: Huntaze-Alarms-Overview"
    echo -e "${BLUE}  URL: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=Huntaze-Alarms-Overview${NC}"
else
    check_warning "Alarms dashboard not found"
fi

echo ""

# ============================================================================
# 8. Test Alarm Actions
# ============================================================================

echo -e "${YELLOW}8. Validating Alarm Actions...${NC}"

# Check if alarms have actions configured
ALARMS_WITHOUT_ACTIONS=$(aws cloudwatch describe-alarms \
    --region "$AWS_REGION" \
    --query 'MetricAlarms[?length(AlarmActions)==`0`].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ALARMS_WITHOUT_ACTIONS" ]; then
    check_success "All alarms have actions configured"
else
    ALARMS_WITHOUT_ACTIONS_COUNT=$(echo "$ALARMS_WITHOUT_ACTIONS" | wc -w)
    check_warning "$ALARMS_WITHOUT_ACTIONS_COUNT alarms without actions:"
    for ALARM in $ALARMS_WITHOUT_ACTIONS; do
        echo -e "  ${YELLOW}- $ALARM${NC}"
    done
fi

echo ""

# ============================================================================
# 9. Alarm Coverage Summary
# ============================================================================

echo -e "${YELLOW}9. Alarm Coverage Summary...${NC}"

# Count alarms by service
TOTAL_ALARMS=$(aws cloudwatch describe-alarms \
    --region "$AWS_REGION" \
    --query 'length(MetricAlarms)' \
    --output text)

echo -e "${BLUE}Alarm Coverage:${NC}"
echo "  ECS alarms: $ECS_ALARM_COUNT"
echo "  RDS alarms: $RDS_ALARM_COUNT"
echo "  SQS alarms: $SQS_ALARM_COUNT"
echo "  Composite alarms: $COMPOSITE_ALARM_COUNT"
echo "  Total alarms: $TOTAL_ALARMS"

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Validation Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• Total alarms: $TOTAL_ALARMS"
echo "• Active alarms: $ACTIVE_COUNT"
echo "• SNS topics: $([ -n "$OPS_TOPIC" ] && echo "1" || echo "0")"
echo "• Dashboards: $([ -n "$DASHBOARD_EXISTS" ] && echo "1" || echo "0")"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review any alarms in ALARM state"
echo "2. Confirm SNS email subscriptions"
echo "3. Test alarm notifications"
echo "4. Review CloudWatch Dashboard"
echo "5. Adjust thresholds if needed"
echo ""
