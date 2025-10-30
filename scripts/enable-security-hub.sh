#!/bin/bash

# Enable AWS Security Hub with standards
# Usage: ./scripts/enable-security-hub.sh

set -e

REGION="us-east-1"

echo "🔐 Enabling AWS Security Hub..."
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

# Check if Security Hub is already enabled
echo "2️⃣ Checking Security Hub status..."
if aws securityhub describe-hub --region "$REGION" &> /dev/null; then
    echo "✅ Security Hub already enabled"
    HUB_ARN=$(aws securityhub describe-hub --region "$REGION" --query 'HubArn' --output text)
    echo "   Hub ARN: $HUB_ARN"
else
    echo "📦 Enabling Security Hub..."
    
    if aws securityhub enable-security-hub --region "$REGION"; then
        echo "✅ Security Hub enabled successfully"
        
        # Wait a moment for initialization
        sleep 5
    else
        echo "❌ Failed to enable Security Hub"
        exit 1
    fi
fi
echo ""

# Enable AWS Foundational Security Best Practices
echo "3️⃣ Enabling AWS Foundational Security Best Practices..."
FSBP_ARN="arn:aws:securityhub:$REGION::standards/aws-foundational-security-best-practices/v/1.0.0"

if aws securityhub get-enabled-standards --region "$REGION" \
    --query "StandardsSubscriptions[?StandardsArn=='$FSBP_ARN']" \
    --output text | grep -q "$FSBP_ARN"; then
    echo "✅ FSBP already enabled"
else
    echo "📦 Enabling FSBP standard..."
    
    if aws securityhub batch-enable-standards \
        --region "$REGION" \
        --standards-subscription-requests StandardsArn="$FSBP_ARN" &> /dev/null; then
        echo "✅ FSBP standard enabled"
    else
        echo "⚠️  Failed to enable FSBP (may already be enabled)"
    fi
fi
echo ""

# Enable CIS AWS Foundations Benchmark
echo "4️⃣ Enabling CIS AWS Foundations Benchmark v3.0.0..."
CIS_ARN="arn:aws:securityhub:$REGION::standards/cis-aws-foundations-benchmark/v/3.0.0"

if aws securityhub get-enabled-standards --region "$REGION" \
    --query "StandardsSubscriptions[?StandardsArn=='$CIS_ARN']" \
    --output text | grep -q "$CIS_ARN"; then
    echo "✅ CIS Benchmark already enabled"
else
    echo "📦 Enabling CIS Benchmark..."
    
    if aws securityhub batch-enable-standards \
        --region "$REGION" \
        --standards-subscription-requests StandardsArn="$CIS_ARN" &> /dev/null; then
        echo "✅ CIS Benchmark enabled"
    else
        echo "⚠️  Failed to enable CIS (may already be enabled)"
    fi
fi
echo ""

# List enabled standards
echo "5️⃣ Enabled standards:"
aws securityhub get-enabled-standards \
    --region "$REGION" \
    --query 'StandardsSubscriptions[*].[StandardsArn,StandardsStatus]' \
    --output table
echo ""

# Get initial findings count
echo "6️⃣ Initial findings summary..."
FINDINGS=$(aws securityhub get-findings \
    --region "$REGION" \
    --max-results 1 \
    --query 'Findings | length(@)' \
    --output text 2>/dev/null || echo "0")

echo "   Findings will start appearing within 2 hours"
echo "   Current findings: $FINDINGS"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Security Hub Enabled Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was enabled:"
echo "   • Security Hub"
echo "   • AWS Foundational Security Best Practices (FSBP)"
echo "   • CIS AWS Foundations Benchmark v3.0.0"
echo ""
echo "📧 Next Steps:"
echo "   1. Wait 2 hours for initial security checks to complete"
echo "   2. View findings: https://console.aws.amazon.com/securityhub/home?region=$REGION#/findings"
echo "   3. View compliance: https://console.aws.amazon.com/securityhub/home?region=$REGION#/compliance"
echo "   4. Enable GuardDuty: ./scripts/enable-guardduty.sh"
echo ""
echo "💰 Cost:"
echo "   • Security Hub: ~\$0.0010 per check = ~\$5-10/month"
echo "   • First 30 days: Free trial"
echo ""
