#!/bin/bash

# Deploy Cost Monitoring to AWS
# Usage: ./scripts/deploy-cost-monitoring.sh

set -e

REGION="us-east-1"
STACK_NAME="huntaze-prisma-skeleton"

echo "🚀 Deploying Cost Monitoring..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Build SAM template
echo "2️⃣ Building SAM template..."
cd sam
if ! sam build --region "$REGION"; then
    echo "❌ SAM build failed"
    exit 1
fi
echo "✅ SAM build successful"
echo ""

# Deploy SAM template
echo "3️⃣ Deploying SAM template..."
echo "   This will update the existing stack with cost monitoring resources..."
echo ""

if sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        DatabaseSecretArn="arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:huntaze/database"; then
    
    echo "✅ SAM deployment successful"
else
    echo "❌ SAM deployment failed"
    exit 1
fi
echo ""

# Wait for stack to be ready
echo "4️⃣ Waiting for stack to be ready..."
aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION" 2>/dev/null || true
echo "✅ Stack ready"
echo ""

# Verify deployment
echo "5️⃣ Verifying cost monitoring setup..."
cd ..
./scripts/verify-cost-monitoring.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cost Monitoring Deployed Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was deployed:"
echo "   • AWS Budget: \$100/month with 50%, 80%, 100% alerts"
echo "   • Cost Anomaly Detection: \$10 threshold"
echo "   • SNS alerts to huntaze-production-alerts topic"
echo "   • CloudWatch dashboard widgets"
echo ""
echo "📧 Next Steps:"
echo "   1. Check your email for SNS confirmation (if not already confirmed)"
echo "   2. View budget: https://console.aws.amazon.com/billing/home?region=$REGION#/budgets"
echo "   3. View anomalies: https://console.aws.amazon.com/cost-management/home?region=$REGION#/anomaly-detection"
echo "   4. View dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=huntaze-prisma-migration"
echo ""
echo "📖 Documentation:"
echo "   • Cost Monitoring Guide: sam/COST_MONITORING_GUIDE.md"
echo "   • Verify setup: ./scripts/verify-cost-monitoring.sh"
echo ""
