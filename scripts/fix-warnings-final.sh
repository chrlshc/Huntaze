#!/bin/bash
# Fix Final Warnings - Zero Downtime
# 1. Enable RDS Performance Insights (no restart)
# 2. Create CloudWatch Synthetics Canaries

set -e

REGION="us-east-1"
ACCOUNT_ID="317805897534"
DB_ID="huntaze-postgres-production-encrypted"
CANARY_BUCKET="huntaze-synthetics-artifacts-${ACCOUNT_ID}"

echo "🔧 FIXING FINAL WARNINGS (Zero Downtime)"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1️⃣  ENABLING RDS PERFORMANCE INSIGHTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📊 Activating Performance Insights (7 days free retention)..."
echo "   Note: No restart or downtime required"

aws rds modify-db-instance \
  --db-instance-identifier "$DB_ID" \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --apply-immediately \
  --region "$REGION" >/dev/null

echo -e "${GREEN}✅ Performance Insights enabled${NC}"
echo ""

# Verify
PI_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_ID" \
  --region "$REGION" \
  --query 'DBInstances[0].{PI:PerformanceInsightsEnabled,Retention:PerformanceInsightsRetentionPeriod}' \
  --output json)

echo "Verification:"
echo "$PI_STATUS" | jq .
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2️⃣  CREATING CLOUDWATCH SYNTHETICS CANARIES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if role exists
echo "🔍 Checking for CloudWatchSyntheticsRole..."
ROLE_EXISTS=$(aws iam get-role --role-name CloudWatchSyntheticsRole 2>/dev/null || echo "")

if [ -z "$ROLE_EXISTS" ]; then
    echo "⚠️  CloudWatchSyntheticsRole not found. Creating it..."
    
    # Create trust policy
    cat > /tmp/synthetics-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "synthetics.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
      --role-name CloudWatchSyntheticsRole \
      --assume-role-policy-document file:///tmp/synthetics-trust-policy.json \
      --description "Role for CloudWatch Synthetics Canaries"
    
    # Attach managed policy
    aws iam attach-role-policy \
      --role-name CloudWatchSyntheticsRole \
      --policy-arn arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess
    
    # Add S3 permissions
    cat > /tmp/synthetics-s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::${CANARY_BUCKET}/*",
        "arn:aws:s3:::${CANARY_BUCKET}"
      ]
    }
  ]
}
EOF

    aws iam put-role-policy \
      --role-name CloudWatchSyntheticsRole \
      --policy-name SyntheticsS3Access \
      --policy-document file:///tmp/synthetics-s3-policy.json
    
    echo "✅ CloudWatchSyntheticsRole created"
    echo "⏳ Waiting 10 seconds for IAM propagation..."
    sleep 10
else
    echo "✅ CloudWatchSyntheticsRole found"
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/CloudWatchSyntheticsRole"
echo ""

# Ensure bucket exists
echo "📦 Ensuring S3 bucket exists for canary artifacts..."
aws s3api head-bucket --bucket "$CANARY_BUCKET" 2>/dev/null || \
  aws s3api create-bucket --bucket "$CANARY_BUCKET" --region "$REGION" 2>/dev/null || \
  echo "  Bucket already exists"

echo ""

# Create Canary 1: API Health Check
echo "🕊️ Creating Canary 1: huntaze-api-health..."

# Check if canary already exists
CANARY_EXISTS=$(aws synthetics get-canary --name huntaze-api-health --region "$REGION" 2>/dev/null || echo "")

if [ -z "$CANARY_EXISTS" ]; then
    # Create canary script
    cat > /tmp/canary-health.js <<'EOF'
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
    const url = 'https://huntaze.com/api/health';
    
    let requestOptions = {
        hostname: 'huntaze.com',
        method: 'GET',
        path: '/api/health',
        port: 443,
        protocol: 'https:',
        headers: {
            'User-Agent': synthetics.getCanaryUserAgentString()
        }
    };
    
    let stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true
    };
    
    await synthetics.executeHttpStep('Verify API Health', requestOptions, null, stepConfig);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
EOF

    # Zip the script
    cd /tmp && zip -q canary-health.zip canary-health.js
    
    # Create canary
    aws synthetics create-canary \
      --name huntaze-api-health \
      --artifact-s3-location "s3://${CANARY_BUCKET}" \
      --execution-role-arn "$ROLE_ARN" \
      --runtime-version syn-nodejs-puppeteer-9.0 \
      --schedule Expression="rate(1 minute)" \
      --code ZipFile=fileb:///tmp/canary-health.zip \
      --region "$REGION"
    
    # Start canary
    aws synthetics start-canary --name huntaze-api-health --region "$REGION"
    
    echo "✅ Canary 'huntaze-api-health' created and started"
else
    echo "✅ Canary 'huntaze-api-health' already exists"
fi

echo ""

# Create Canary 2: OnlyFans Endpoint Check
echo "🕊️ Creating Canary 2: huntaze-of-endpoint..."

CANARY2_EXISTS=$(aws synthetics get-canary --name huntaze-of-endpoint --region "$REGION" 2>/dev/null || echo "")

if [ -z "$CANARY2_EXISTS" ]; then
    # Create canary script
    cat > /tmp/canary-of.js <<'EOF'
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
    const url = 'https://huntaze.com/api/v2/onlyfans/stats';
    
    let requestOptions = {
        hostname: 'huntaze.com',
        method: 'GET',
        path: '/api/v2/onlyfans/stats',
        port: 443,
        protocol: 'https:',
        headers: {
            'User-Agent': synthetics.getCanaryUserAgentString()
        }
    };
    
    let stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true
    };
    
    await synthetics.executeHttpStep('Verify OF Endpoint', requestOptions, null, stepConfig);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
EOF

    # Zip the script
    cd /tmp && zip -q canary-of.zip canary-of.js
    
    # Create canary
    aws synthetics create-canary \
      --name huntaze-of-endpoint \
      --artifact-s3-location "s3://${CANARY_BUCKET}" \
      --execution-role-arn "$ROLE_ARN" \
      --runtime-version syn-nodejs-puppeteer-9.0 \
      --schedule Expression="rate(1 minute)" \
      --code ZipFile=fileb:///tmp/canary-of.zip \
      --region "$REGION"
    
    # Start canary
    aws synthetics start-canary --name huntaze-of-endpoint --region "$REGION"
    
    echo "✅ Canary 'huntaze-of-endpoint' created and started"
else
    echo "✅ Canary 'huntaze-of-endpoint' already exists"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ALL WARNINGS FIXED${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  ✅ RDS Performance Insights: Enabled (7 days retention)"
echo "  ✅ Canary 1: huntaze-api-health (1/min)"
echo "  ✅ Canary 2: huntaze-of-endpoint (1/min)"
echo ""
echo "Next: Re-run audit to verify 0 warnings"
echo "  ./scripts/go-no-go-audit.sh"
echo ""
