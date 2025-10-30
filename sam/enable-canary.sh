#!/bin/bash

set -e

echo "🎯 Enable Prisma Canary Deployment (1%)"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

STACK_NAME="huntaze-prisma-skeleton"
REGION="us-east-1"

# Get AppConfig IDs
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

echo -e "${BLUE}📝 Creating enabled configuration...${NC}"

# Create enabled configuration
cat > /tmp/feature-flags-enabled.json << EOF
{
  "version": "1",
  "flags": {
    "prismaAdapter": {
      "name": "prismaAdapter",
      "_description": "Enable Prisma database adapter - CANARY 1%",
      "attributes": {
        "enabled": {
          "constraints": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "values": {
    "prismaAdapter": {
      "enabled": true
    }
  }
}
EOF

VERSION=$(aws appconfig create-hosted-configuration-version \
  --application-id $APP_ID \
  --configuration-profile-id $PROFILE_ID \
  --content file:///tmp/feature-flags-enabled.json \
  --content-type "application/json" \
  --region $REGION \
  --query 'VersionNumber' \
  --output text)

echo -e "${GREEN}✅ Configuration version created: $VERSION${NC}"

# Get deployment strategy ID
STRATEGY_ID=$(aws appconfig list-deployment-strategies \
  --region $REGION \
  --query 'Items[?Name==`Canary1Percent5Minutes`].Id' \
  --output text)

if [ -z "$STRATEGY_ID" ]; then
  echo -e "${YELLOW}⚠️  Using default canary strategy${NC}"
  STRATEGY_ID="AppConfig.Canary10Percent20Minutes"
fi

echo -e "${BLUE}🚀 Starting canary deployment...${NC}"

DEPLOYMENT=$(aws appconfig start-deployment \
  --application-id $APP_ID \
  --environment-id $ENV_ID \
  --deployment-strategy-id $STRATEGY_ID \
  --configuration-profile-id $PROFILE_ID \
  --configuration-version $VERSION \
  --description "Enable Prisma canary - 1% rollout" \
  --region $REGION \
  --query 'DeploymentNumber' \
  --output text)

echo -e "${GREEN}✅ Canary deployment started: $DEPLOYMENT${NC}"
echo ""
echo -e "${YELLOW}📊 Monitor deployment:${NC}"
echo "aws appconfig get-deployment \\"
echo "  --application-id $APP_ID \\"
echo "  --environment-id $ENV_ID \\"
echo "  --deployment-number $DEPLOYMENT \\"
echo "  --region $REGION"
echo ""
echo -e "${YELLOW}🔍 Watch logs for shadow traffic:${NC}"
echo "sam logs -n huntaze-mock-read --tail"
echo ""
echo -e "${YELLOW}⏱️  Deployment will complete in ~10 minutes (5 min deploy + 5 min bake)${NC}"
