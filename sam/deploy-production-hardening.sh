#!/bin/bash

set -e

echo "🔧 Deploying Production Hardening Optimizations"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGION="us-east-1"
STACK_NAME="huntaze-prisma-skeleton"
EMAIL_ALERTS="alerts@huntaze.com"  # Replace with actual email

echo -e "${BLUE}📋 Pre-deployment Checks${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    echo -e "${RED}❌ SAM CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
aws sts get-caller-identity > /dev/null || {
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
}

echo -e "${GREEN}✅ AWS credentials OK${NC}"

# Check current stack status
echo "📊 Checking current stack status..."
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$STACK_STATUS" = "NOT_FOUND" ]; then
    echo -e "${RED}❌ Stack $STACK_NAME not found${NC}"
    exit 1
fi

if [ "$STACK_STATUS" != "CREATE_COMPLETE" ] && [ "$STACK_STATUS" != "UPDATE_COMPLETE" ]; then
    echo -e "${RED}❌ Stack in invalid state: $STACK_STATUS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Stack status: $STACK_STATUS${NC}"

echo -e "\n${BLUE}🔧 Step 1: Backup Current Configuration${NC}"

# Create backup directory
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup current template
cp template.yaml $BACKUP_DIR/template.yaml.backup
echo "✅ Template backed up to $BACKUP_DIR"

echo -e "\n${BLUE}🔧 Step 2: Update Template with Optimizations${NC}"

# Prompt user to update email
echo -e "${YELLOW}⚠️  Update the email address in production-optimizations.yaml${NC}"
echo "Current: alerts@huntaze.com"
read -p "Enter your email for alerts: " USER_EMAIL

if [ ! -z "$USER_EMAIL" ]; then
    sed -i.bak "s/alerts@huntaze.com/$USER_EMAIL/g" production-optimizations.yaml
    echo -e "${GREEN}✅ Email updated to $USER_EMAIL${NC}"
fi

echo -e "\n${BLUE}🔧 Step 3: Validate Template${NC}"

sam validate --region $REGION || {
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Template is valid${NC}"

echo -e "\n${BLUE}🔧 Step 4: Deploy Optimizations${NC}"

# Build
echo "📦 Building Lambda functions..."
sam build --region $REGION

# Deploy with changeset
echo "🚀 Deploying stack..."
sam deploy \
    --stack-name $STACK_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset \
    --parameter-overrides \
        DatabaseSecretArn="arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database"

echo -e "${GREEN}✅ Deployment complete${NC}"

echo -e "\n${BLUE}🔧 Step 5: Enable RDS Performance Insights${NC}"

# Get RDS instance identifier
RDS_INSTANCE="huntaze-prod"

echo "Enabling Performance Insights on $RDS_INSTANCE..."
aws rds modify-db-instance \
    --db-instance-identifier $RDS_INSTANCE \
    --enable-performance-insights \
    --performance-insights-retention-period 7 \
    --region $REGION \
    --apply-immediately || {
    echo -e "${YELLOW}⚠️  Performance Insights may already be enabled${NC}"
}

echo -e "${GREEN}✅ Performance Insights enabled${NC}"

echo -e "\n${BLUE}🔧 Step 6: Verify Deployment${NC}"

# Check alarm status
echo "📊 Checking CloudWatch alarms..."
aws cloudwatch describe-alarms \
    --alarm-names "huntaze-lambda-error-rate-metric-math" \
    --region $REGION \
    --query 'MetricAlarms[0].StateValue' \
    --output text

# Check log groups
echo "📝 Checking log retention..."
aws logs describe-log-groups \
    --log-group-name-prefix "/aws/lambda/huntaze" \
    --region $REGION \
    --query 'logGroups[*].[logGroupName,retentionInDays]' \
    --output table

echo -e "\n${GREEN}✅ Production Hardening Deployment Complete!${NC}"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Confirm SNS subscription email"
echo "2. Review CloudWatch dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=huntaze-prisma-migration"
echo "3. Monitor RDS Performance Insights: https://console.aws.amazon.com/rds/home?region=$REGION#performance-insights:"
echo "4. Consider enabling Prisma Accelerate for connection pooling"
echo "5. Review costs in AWS Cost Explorer after 24h"

echo -e "\n${YELLOW}⚠️  Remember to:${NC}"
echo "- Confirm SNS email subscription"
echo "- Update ACCELERATE_URL if using Prisma Accelerate"
echo "- Monitor costs for first week"
echo "- Plan Mock code removal after 7 days of stability"
