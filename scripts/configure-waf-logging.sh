#!/bin/bash

# Configure WAF Logging
# Usage: ./scripts/configure-waf-logging.sh

set -e

REGION="us-east-1"
STACK_NAME="huntaze-waf-protection"

echo "📝 Configuring WAF Logging..."
echo ""

# Get WAF Web ACL ARN
WEB_ACL_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebACLArn`].OutputValue' \
    --output text)

LOG_GROUP_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WAFLogGroupName`].OutputValue' \
    --output text)

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Construct proper log group ARN for WAF
LOG_GROUP_ARN="arn:aws:logs:$REGION:$ACCOUNT_ID:log-group:$LOG_GROUP_NAME:*"

echo "WAF Web ACL: $WEB_ACL_ARN"
echo "Log Group: $LOG_GROUP_ARN"
echo ""

# Configure logging
echo "Enabling WAF logging..."
aws wafv2 put-logging-configuration \
    --logging-configuration \
        ResourceArn="$WEB_ACL_ARN",\
LogDestinationConfigs="$LOG_GROUP_ARN",\
RedactedFields='[{SingleHeader={Name=authorization}},{SingleHeader={Name=cookie}}]' \
    --region "$REGION"

echo "✅ WAF logging configured successfully"
echo ""
echo "View logs at:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/\$252Faws\$252Fwafv2\$252Fhuntaze-api"
