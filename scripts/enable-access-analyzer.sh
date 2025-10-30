#!/bin/bash

# Enable IAM Access Analyzer
# Usage: ./scripts/enable-access-analyzer.sh

set -e

REGION="us-east-1"
ANALYZER_NAME="huntaze-access-analyzer"

echo "🔍 Enabling IAM Access Analyzer..."
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

# Check if Access Analyzer already exists
echo "2️⃣ Checking Access Analyzer status..."
ANALYZER_ARN=$(aws accessanalyzer list-analyzers \
    --region "$REGION" \
    --query "analyzers[?name=='$ANALYZER_NAME'].arn" \
    --output text 2>/dev/null || echo "")

if [ -n "$ANALYZER_ARN" ]; then
    echo "✅ Access Analyzer already enabled"
    echo "   Analyzer ARN: $ANALYZER_ARN"
else
    echo "📦 Creating Access Analyzer..."
    
    ANALYZER_ARN=$(aws accessanalyzer create-analyzer \
        --analyzer-name "$ANALYZER_NAME" \
        --type ACCOUNT \
        --region "$REGION" \
        --query 'arn' \
        --output text)
    
    if [ -n "$ANALYZER_ARN" ]; then
        echo "✅ Access Analyzer created successfully"
        echo "   Analyzer ARN: $ANALYZER_ARN"
        
        # Wait for analyzer to be active
        echo "   Waiting for analyzer to become active..."
        sleep 10
    else
        echo "❌ Failed to create Access Analyzer"
        exit 1
    fi
fi
echo ""

# Get analyzer status
echo "3️⃣ Checking analyzer status..."
STATUS=$(aws accessanalyzer get-analyzer \
    --analyzer-name "$ANALYZER_NAME" \
    --region "$REGION" \
    --query 'analyzer.status' \
    --output text)

echo "   Status: $STATUS"
echo ""

# List initial findings
echo "4️⃣ Checking for findings..."
FINDINGS_COUNT=$(aws accessanalyzer list-findings \
    --analyzer-arn "$ANALYZER_ARN" \
    --region "$REGION" \
    --query 'findings | length(@)' \
    --output text 2>/dev/null || echo "0")

echo "   Current findings: $FINDINGS_COUNT"

if [ "$FINDINGS_COUNT" -gt "0" ]; then
    echo ""
    echo "   ⚠️  Found $FINDINGS_COUNT access findings:"
    
    aws accessanalyzer list-findings \
        --analyzer-arn "$ANALYZER_ARN" \
        --region "$REGION" \
        --query 'findings[*].[resourceType,status,resource]' \
        --output table
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IAM Access Analyzer Enabled Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was enabled:"
echo "   • IAM Access Analyzer (ACCOUNT type)"
echo "   • Continuous monitoring of resource access"
echo ""
echo "🔍 What it detects:"
echo "   • S3 buckets accessible from outside your account"
echo "   • IAM roles that can be assumed externally"
echo "   • KMS keys shared with external accounts"
echo "   • Lambda functions with external permissions"
echo "   • SQS queues with cross-account access"
echo "   • Secrets Manager secrets shared externally"
echo ""
echo "📧 Next Steps:"
echo "   1. View findings: https://console.aws.amazon.com/access-analyzer/home?region=$REGION#/findings"
echo "   2. Review and resolve any ACTIVE findings"
echo "   3. Archive expected external access as RESOLVED"
echo ""
echo "💰 Cost:"
echo "   • IAM Access Analyzer: Free for account-level analysis"
echo ""
echo "📖 Documentation:"
echo "   • https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html"
echo ""
