#!/bin/bash

set -e

echo "🚀 Huntaze Prisma Walking Skeleton - Deployment Script"
echo "======================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
STACK_NAME="huntaze-prisma-skeleton"
REGION="us-east-1"
DATABASE_SECRET_ARN="arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database"

echo -e "${BLUE}📋 Step 1: Install Lambda dependencies${NC}"
cd ../lambda
npm install
cd ../sam

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${BLUE}📦 Step 2: Build SAM application${NC}"
sam build

echo -e "${GREEN}✅ Build completed${NC}"

echo -e "${BLUE}🚀 Step 3: Deploy SAM stack${NC}"
sam deploy \
  --stack-name $STACK_NAME \
  --region $REGION \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides DatabaseSecretArn=$DATABASE_SECRET_ARN \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo -e "${GREEN}✅ Stack deployed${NC}"

# Get stack outputs
echo -e "${BLUE}📊 Step 4: Retrieve stack outputs${NC}"
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`AppConfigAppId`].OutputValue' \
  --output text)

ENV_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`AppConfigEnvId`].OutputValue' \
  --output text)

PROFILE_ID=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`AppConfigProfileId`].OutputValue' \
  --output text)

echo -e "${GREEN}✅ AppConfig IDs retrieved${NC}"
echo "  App ID: $APP_ID"
echo "  Env ID: $ENV_ID"
echo "  Profile ID: $PROFILE_ID"

echo -e "${BLUE}🎯 Step 5: Create initial feature flag configuration${NC}"
VERSION=$(aws appconfig create-hosted-configuration-version \
  --application-id $APP_ID \
  --configuration-profile-id $PROFILE_ID \
  --content file://feature-flags.json \
  --content-type "application/json" \
  --region $REGION \
  --query 'VersionNumber' \
  --output text)

echo -e "${GREEN}✅ Configuration version created: $VERSION${NC}"

echo -e "${BLUE}📝 Step 6: Deploy feature flag (disabled by default)${NC}"
DEPLOYMENT=$(aws appconfig start-deployment \
  --application-id $APP_ID \
  --environment-id $ENV_ID \
  --deployment-strategy-id "AppConfig.AllAtOnce.(Quick)" \
  --configuration-profile-id $PROFILE_ID \
  --configuration-version $VERSION \
  --region $REGION \
  --query 'DeploymentNumber' \
  --output text)

echo -e "${GREEN}✅ Deployment started: $DEPLOYMENT${NC}"

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}======================${NC}"
echo ""
echo -e "${BLUE}📊 CloudWatch Dashboard:${NC}"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=huntaze-prisma-migration"
echo ""
echo -e "${BLUE}🔍 X-Ray Traces:${NC}"
echo "https://console.aws.amazon.com/xray/home?region=$REGION#/traces"
echo ""
echo -e "${BLUE}🚨 CloudWatch Alarm:${NC}"
echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:alarm/huntaze-lambda-error-rate-gt-2pct"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test the Mock Lambda (flag disabled):"
echo "   aws lambda invoke --function-name huntaze-mock-read --payload '{\"userId\":\"user-1\"}' response.json"
echo ""
echo "2. Enable Prisma canary (1%):"
echo "   ./enable-canary.sh"
echo ""
echo "3. Monitor shadow traffic logs:"
echo "   sam logs -n huntaze-mock-read --tail"
echo ""
echo "4. Check error rate alarm:"
echo "   aws cloudwatch describe-alarms --alarm-names huntaze-lambda-error-rate-gt-2pct"
