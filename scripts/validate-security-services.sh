#!/bin/bash

# ============================================================================
# Security Services Validation Script
# ============================================================================
# Validates that GuardDuty, Security Hub, and CloudTrail are properly configured
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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Security Services Validation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check command success
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
# 1. Validate GuardDuty
# ============================================================================

echo -e "${YELLOW}1. Validating GuardDuty...${NC}"

# Check if GuardDuty is enabled
GUARDDUTY_DETECTOR=$(aws guardduty list-detectors \
    --region "$AWS_REGION" \
    --query 'DetectorIds[0]' \
    --output text 2>/dev/null || echo "NONE")

if [ "$GUARDDUTY_DETECTOR" != "NONE" ] && [ -n "$GUARDDUTY_DETECTOR" ]; then
    check_success "GuardDuty is enabled"
    
    # Get detector details
    DETECTOR_STATUS=$(aws guardduty get-detector \
        --detector-id "$GUARDDUTY_DETECTOR" \
        --region "$AWS_REGION" \
        --query 'Status' \
        --output text)
    
    if [ "$DETECTOR_STATUS" = "ENABLED" ]; then
        check_success "GuardDuty detector is active"
    else
        check_warning "GuardDuty detector status: $DETECTOR_STATUS"
    fi
    
    # Check S3 protection
    S3_PROTECTION=$(aws guardduty get-detector \
        --detector-id "$GUARDDUTY_DETECTOR" \
        --region "$AWS_REGION" \
        --query 'DataSources.S3Logs.Status' \
        --output text)
    
    if [ "$S3_PROTECTION" = "ENABLED" ]; then
        check_success "GuardDuty S3 protection enabled"
    else
        check_warning "GuardDuty S3 protection not enabled"
    fi
    
    # Check findings count
    FINDINGS_COUNT=$(aws guardduty list-findings \
        --detector-id "$GUARDDUTY_DETECTOR" \
        --region "$AWS_REGION" \
        --query 'length(FindingIds)' \
        --output text 2>/dev/null || echo "0")
    
    echo -e "${BLUE}  Current findings: $FINDINGS_COUNT${NC}"
    
else
    check_warning "GuardDuty is not enabled"
fi

echo ""

# ============================================================================
# 2. Validate Security Hub
# ============================================================================

echo -e "${YELLOW}2. Validating Security Hub...${NC}"

# Check if Security Hub is enabled
SECURITYHUB_STATUS=$(aws securityhub describe-hub \
    --region "$AWS_REGION" \
    --query 'HubArn' \
    --output text 2>/dev/null || echo "NOT_ENABLED")

if [ "$SECURITYHUB_STATUS" != "NOT_ENABLED" ]; then
    check_success "Security Hub is enabled"
    
    # Check enabled standards
    STANDARDS=$(aws securityhub get-enabled-standards \
        --region "$AWS_REGION" \
        --query 'StandardsSubscriptions[*].StandardsArn' \
        --output text)
    
    if echo "$STANDARDS" | grep -q "aws-foundational-security-best-practices"; then
        check_success "AWS FSBP standard is enabled"
    else
        check_warning "AWS FSBP standard not enabled"
    fi
    
    # Check compliance status
    FAILED_CONTROLS=$(aws securityhub get-compliance-summary-by-resource-type \
        --region "$AWS_REGION" \
        --query 'SummaryByResourceType[0].ComplianceSummary.Failed.Count' \
        --output text 2>/dev/null || echo "0")
    
    PASSED_CONTROLS=$(aws securityhub get-compliance-summary-by-resource-type \
        --region "$AWS_REGION" \
        --query 'SummaryByResourceType[0].ComplianceSummary.Passed.Count' \
        --output text 2>/dev/null || echo "0")
    
    echo -e "${BLUE}  Compliance: ${GREEN}$PASSED_CONTROLS passed${NC}, ${RED}$FAILED_CONTROLS failed${NC}"
    
    # Get high/critical findings
    HIGH_CRITICAL_FINDINGS=$(aws securityhub get-findings \
        --region "$AWS_REGION" \
        --filters '{"SeverityLabel":[{"Value":"HIGH","Comparison":"EQUALS"},{"Value":"CRITICAL","Comparison":"EQUALS"}],"RecordState":[{"Value":"ACTIVE","Comparison":"EQUALS"}]}' \
        --query 'length(Findings)' \
        --output text 2>/dev/null || echo "0")
    
    if [ "$HIGH_CRITICAL_FINDINGS" -eq 0 ]; then
        check_success "No high/critical findings"
    else
        check_warning "$HIGH_CRITICAL_FINDINGS high/critical findings detected"
    fi
    
else
    check_warning "Security Hub is not enabled"
fi

echo ""

# ============================================================================
# 3. Validate CloudTrail
# ============================================================================

echo -e "${YELLOW}3. Validating CloudTrail...${NC}"

# Check if CloudTrail is enabled
CLOUDTRAIL_STATUS=$(aws cloudtrail describe-trails \
    --region "$AWS_REGION" \
    --query 'trailList[?Name==`huntaze-production-trail`].Name' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CLOUDTRAIL_STATUS" != "NOT_FOUND" ] && [ -n "$CLOUDTRAIL_STATUS" ]; then
    check_success "CloudTrail trail exists"
    
    # Get trail details
    TRAIL_DETAILS=$(aws cloudtrail get-trail-status \
        --name "huntaze-production-trail" \
        --region "$AWS_REGION" 2>/dev/null)
    
    IS_LOGGING=$(echo "$TRAIL_DETAILS" | jq -r '.IsLogging')
    
    if [ "$IS_LOGGING" = "true" ]; then
        check_success "CloudTrail is actively logging"
    else
        check_warning "CloudTrail is not logging"
    fi
    
    # Check multi-region
    IS_MULTI_REGION=$(aws cloudtrail describe-trails \
        --region "$AWS_REGION" \
        --query 'trailList[?Name==`huntaze-production-trail`].IsMultiRegionTrail' \
        --output text)
    
    if [ "$IS_MULTI_REGION" = "True" ]; then
        check_success "Multi-region trail enabled"
    else
        check_warning "Multi-region trail not enabled"
    fi
    
    # Check log file validation
    LOG_VALIDATION=$(aws cloudtrail describe-trails \
        --region "$AWS_REGION" \
        --query 'trailList[?Name==`huntaze-production-trail`].LogFileValidationEnabled' \
        --output text)
    
    if [ "$LOG_VALIDATION" = "True" ]; then
        check_success "Log file validation enabled"
    else
        check_warning "Log file validation not enabled"
    fi
    
    # Check encryption
    KMS_KEY=$(aws cloudtrail describe-trails \
        --region "$AWS_REGION" \
        --query 'trailList[?Name==`huntaze-production-trail`].KmsKeyId' \
        --output text)
    
    if [ -n "$KMS_KEY" ] && [ "$KMS_KEY" != "None" ]; then
        check_success "CloudTrail logs are encrypted with KMS"
    else
        check_warning "CloudTrail logs not encrypted with KMS"
    fi
    
    # Check CloudWatch Logs integration
    CLOUDWATCH_ARN=$(aws cloudtrail describe-trails \
        --region "$AWS_REGION" \
        --query 'trailList[?Name==`huntaze-production-trail`].CloudWatchLogsLogGroupArn' \
        --output text)
    
    if [ -n "$CLOUDWATCH_ARN" ] && [ "$CLOUDWATCH_ARN" != "None" ]; then
        check_success "CloudWatch Logs integration enabled"
    else
        check_warning "CloudWatch Logs integration not enabled"
    fi
    
    # Check recent events
    LATEST_EVENT=$(aws cloudtrail lookup-events \
        --region "$AWS_REGION" \
        --max-results 1 \
        --query 'Events[0].EventTime' \
        --output text 2>/dev/null || echo "NONE")
    
    if [ "$LATEST_EVENT" != "NONE" ]; then
        echo -e "${BLUE}  Latest event: $LATEST_EVENT${NC}"
        check_success "CloudTrail is receiving events"
    else
        check_warning "No recent CloudTrail events found"
    fi
    
else
    check_warning "CloudTrail trail not found"
fi

echo ""

# ============================================================================
# 4. Validate SNS Topics and Subscriptions
# ============================================================================

echo -e "${YELLOW}4. Validating SNS Topics...${NC}"

# Check GuardDuty SNS topic
GUARDDUTY_TOPIC=$(aws sns list-topics \
    --region "$AWS_REGION" \
    --query 'Topics[?contains(TopicArn, `guardduty-findings`)].TopicArn' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$GUARDDUTY_TOPIC" != "NOT_FOUND" ] && [ -n "$GUARDDUTY_TOPIC" ]; then
    check_success "GuardDuty SNS topic exists"
    
    # Check subscriptions
    GUARDDUTY_SUBS=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$GUARDDUTY_TOPIC" \
        --region "$AWS_REGION" \
        --query 'length(Subscriptions)' \
        --output text)
    
    echo -e "${BLUE}  GuardDuty subscriptions: $GUARDDUTY_SUBS${NC}"
else
    check_warning "GuardDuty SNS topic not found"
fi

# Check Security Hub SNS topic
SECURITYHUB_TOPIC=$(aws sns list-topics \
    --region "$AWS_REGION" \
    --query 'Topics[?contains(TopicArn, `securityhub-findings`)].TopicArn' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$SECURITYHUB_TOPIC" != "NOT_FOUND" ] && [ -n "$SECURITYHUB_TOPIC" ]; then
    check_success "Security Hub SNS topic exists"
    
    # Check subscriptions
    SECURITYHUB_SUBS=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SECURITYHUB_TOPIC" \
        --region "$AWS_REGION" \
        --query 'length(Subscriptions)' \
        --output text)
    
    echo -e "${BLUE}  Security Hub subscriptions: $SECURITYHUB_SUBS${NC}"
else
    check_warning "Security Hub SNS topic not found"
fi

echo ""

# ============================================================================
# 5. Validate EventBridge Rules
# ============================================================================

echo -e "${YELLOW}5. Validating EventBridge Rules...${NC}"

# Check GuardDuty EventBridge rule
GUARDDUTY_RULE=$(aws events list-rules \
    --region "$AWS_REGION" \
    --query 'Rules[?contains(Name, `guardduty`)].Name' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$GUARDDUTY_RULE" != "NOT_FOUND" ] && [ -n "$GUARDDUTY_RULE" ]; then
    check_success "GuardDuty EventBridge rule exists"
    
    RULE_STATE=$(aws events describe-rule \
        --name "$GUARDDUTY_RULE" \
        --region "$AWS_REGION" \
        --query 'State' \
        --output text)
    
    if [ "$RULE_STATE" = "ENABLED" ]; then
        check_success "GuardDuty rule is enabled"
    else
        check_warning "GuardDuty rule is disabled"
    fi
else
    check_warning "GuardDuty EventBridge rule not found"
fi

# Check Security Hub EventBridge rule
SECURITYHUB_RULE=$(aws events list-rules \
    --region "$AWS_REGION" \
    --query 'Rules[?contains(Name, `securityhub`)].Name' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$SECURITYHUB_RULE" != "NOT_FOUND" ] && [ -n "$SECURITYHUB_RULE" ]; then
    check_success "Security Hub EventBridge rule exists"
    
    RULE_STATE=$(aws events describe-rule \
        --name "$SECURITYHUB_RULE" \
        --region "$AWS_REGION" \
        --query 'State' \
        --output text)
    
    if [ "$RULE_STATE" = "ENABLED" ]; then
        check_success "Security Hub rule is enabled"
    else
        check_warning "Security Hub rule is disabled"
    fi
else
    check_warning "Security Hub EventBridge rule not found"
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
echo "• GuardDuty: $([ "$GUARDDUTY_DETECTOR" != "NONE" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Not Enabled${NC}")"
echo "• Security Hub: $([ "$SECURITYHUB_STATUS" != "NOT_ENABLED" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Not Enabled${NC}")"
echo "• CloudTrail: $([ "$CLOUDTRAIL_STATUS" != "NOT_FOUND" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Not Enabled${NC}")"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review any warnings above"
echo "2. Confirm SNS email subscriptions"
echo "3. Review Security Hub findings"
echo "4. Monitor GuardDuty for threats"
echo ""
