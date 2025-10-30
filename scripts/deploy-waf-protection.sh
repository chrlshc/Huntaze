#!/bin/bash

# Deploy WAF Protection
# Usage: ./scripts/deploy-waf-protection.sh

set -e

REGION="us-east-1"
STACK_NAME="huntaze-waf-protection"

echo "🛡️  Deploying WAF Protection..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Deploy WAF stack
echo "2️⃣ Deploying WAF CloudFormation stack..."
aws cloudformation deploy \
    --template-file sam/waf-protection.yaml \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        Environment=production \
        RateLimitPerIP=2000

if [ $? -eq 0 ]; then
    echo "✅ WAF stack deployed successfully"
else
    echo "❌ WAF deployment failed"
    exit 1
fi
echo ""

# Get WAF Web ACL ARN
echo "3️⃣ Getting WAF Web ACL details..."
WEB_ACL_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebACLArn`].OutputValue' \
    --output text)

WEB_ACL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebACLId`].OutputValue' \
    --output text)

echo "✅ WAF Web ACL created"
echo "   ARN: $WEB_ACL_ARN"
echo "   ID: $WEB_ACL_ID"
echo ""

# Verify WAF rules
echo "4️⃣ Verifying WAF rules..."
RULES_COUNT=$(aws wafv2 get-web-acl \
    --name huntaze-api-protection \
    --scope REGIONAL \
    --id "$WEB_ACL_ID" \
    --region "$REGION" \
    --query 'WebACL.Rules | length(@)' \
    --output text)

echo "✅ WAF rules configured: $RULES_COUNT rules"
echo ""

# List rules
echo "5️⃣ Configured rules:"
aws wafv2 get-web-acl \
    --name huntaze-api-protection \
    --scope REGIONAL \
    --id "$WEB_ACL_ID" \
    --region "$REGION" \
    --query 'WebACL.Rules[*].[Name,Priority]' \
    --output table
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ WAF Protection Deployed Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was deployed:"
echo "   • WAF Web ACL: huntaze-api-protection"
echo "   • Rate Limiting: 2000 requests per IP per 5 minutes"
echo "   • AWS Managed Rules:"
echo "     - Core Rule Set (SQL injection, XSS, etc.)"
echo "     - Known Bad Inputs"
echo "     - Amazon IP Reputation List"
echo "     - SQL Injection Protection"
echo "   • CloudWatch Logs: /aws/wafv2/huntaze-api"
echo "   • CloudWatch Alarms:"
echo "     - High block rate (> 10%)"
echo "     - Rate limit triggers"
echo ""
echo "📧 Next Steps:"
echo "   1. Associate WAF with API Gateway (when deployed):"
echo "      aws wafv2 associate-web-acl \\"
echo "        --web-acl-arn $WEB_ACL_ARN \\"
echo "        --resource-arn arn:aws:apigateway:$REGION::/restapis/API_ID/stages/STAGE_NAME \\"
echo "        --region $REGION"
echo ""
echo "   2. View WAF metrics:"
echo "      https://console.aws.amazon.com/wafv2/homev2/web-acl/huntaze-api-protection/$WEB_ACL_ID/metrics?region=$REGION"
echo ""
echo "   3. View WAF logs:"
echo "      https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/\$252Faws\$252Fwafv2\$252Fhuntaze-api"
echo ""
echo "   4. Test WAF protection:"
echo "      ./scripts/test-waf-protection.sh"
echo ""
echo "💰 Cost:"
echo "   • WAF Web ACL: \$5/month"
echo "   • Rules: \$1/rule/month = \$5/month (5 rules)"
echo "   • Requests: \$0.60 per million requests"
echo "   • Logs: ~\$0.50/GB ingested"
echo "   • Total: ~\$10-15/month (depends on traffic)"
echo ""
