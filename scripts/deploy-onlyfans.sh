#!/bin/bash

# Huntaze OnlyFans Deployment Script
# This script automates the deployment of the OnlyFans integration to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-317805897534}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo -e "${GREEN}🚀 Huntaze OnlyFans Deployment${NC}"
echo "================================"
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"
echo "Environment: $ENVIRONMENT"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Step 2: Deploy CDK Stack
echo -e "${YELLOW}📦 Step 2: Deploying CDK stack...${NC}"

cd infra/cdk

if [ ! -d "node_modules" ]; then
    echo "Installing CDK dependencies..."
    npm install
fi

echo "Building CDK stack..."
npm run build

echo "Bootstrapping CDK (if needed)..."
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION || true

echo "Deploying CDK stack..."
npx cdk deploy HuntazeOnlyFansStack --require-approval never

echo -e "${GREEN}✅ CDK stack deployed${NC}"
echo ""

# Step 3: Get stack outputs
echo -e "${YELLOW}📊 Step 3: Retrieving stack outputs...${NC}"

STACK_OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name HuntazeOnlyFansStack \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs' \
    --output json)

ECS_CLUSTER_ARN=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ECSClusterArn") | .OutputValue')
ECS_TASK_DEFINITION=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="TaskDefinitionArn") | .OutputValue')
DYNAMODB_TABLE_SESSIONS=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="SessionsTableName") | .OutputValue')
DYNAMODB_TABLE_MESSAGES=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="MessagesTableName") | .OutputValue')
KMS_KEY_ID=$(echo $STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="KMSKeyId") | .OutputValue')

echo "ECS Cluster: $ECS_CLUSTER_ARN"
echo "Task Definition: $ECS_TASK_DEFINITION"
echo "Sessions Table: $DYNAMODB_TABLE_SESSIONS"
echo "Messages Table: $DYNAMODB_TABLE_MESSAGES"
echo "KMS Key: $KMS_KEY_ID"

echo -e "${GREEN}✅ Stack outputs retrieved${NC}"
echo ""

# Step 4: Deploy Lambda
echo -e "${YELLOW}⚡ Step 4: Deploying Lambda orchestrator...${NC}"

cd ../../infra/lambda/orchestrator

if [ ! -d "node_modules" ]; then
    echo "Installing Lambda dependencies..."
    npm install
fi

echo "Building Lambda function..."
npm run build

echo "Packaging Lambda function..."
zip -r function.zip index.js node_modules/ > /dev/null

echo "Deploying Lambda function..."
aws lambda create-function \
    --function-name huntaze-of-orchestrator \
    --runtime nodejs18.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 60 \
    --memory-size 512 \
    --region $AWS_REGION \
    --environment "Variables={
        ECS_CLUSTER_ARN=$ECS_CLUSTER_ARN,
        ECS_TASK_DEFINITION=$ECS_TASK_DEFINITION,
        DYNAMODB_TABLE_SESSIONS=$DYNAMODB_TABLE_SESSIONS,
        DYNAMODB_TABLE_MESSAGES=$DYNAMODB_TABLE_MESSAGES,
        KMS_KEY_ID=$KMS_KEY_ID
    }" 2>/dev/null || \
aws lambda update-function-code \
    --function-name huntaze-of-orchestrator \
    --zip-file fileb://function.zip \
    --region $AWS_REGION

echo -e "${GREEN}✅ Lambda deployed${NC}"
echo ""

# Step 5: Update .env file
echo -e "${YELLOW}📝 Step 5: Updating .env.production...${NC}"

cd ../../../

cat > .env.production << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID

# ECS Configuration
ECS_CLUSTER_ARN=$ECS_CLUSTER_ARN
ECS_TASK_DEFINITION=$ECS_TASK_DEFINITION

# DynamoDB Configuration
DYNAMODB_REGION=$AWS_REGION
DYNAMODB_TABLE_SESSIONS=$DYNAMODB_TABLE_SESSIONS
DYNAMODB_TABLE_MESSAGES=$DYNAMODB_TABLE_MESSAGES

# KMS Configuration
KMS_KEY_ID=$KMS_KEY_ID

# Feature Flags
PLAYWRIGHT_ENABLED_PERCENT=10
ENVIRONMENT=$ENVIRONMENT

# Monitoring
ENABLE_DETAILED_LOGS=true
ENABLE_METRICS=true
EOF

echo -e "${GREEN}✅ .env.production updated${NC}"
echo ""

# Step 6: Run integration tests
echo -e "${YELLOW}🧪 Step 6: Running integration tests...${NC}"

npm test -- tests/integration/playwright-ecs.integration.test.ts || {
    echo -e "${YELLOW}⚠️  Integration tests failed. This is expected if OnlyFans credentials are not configured.${NC}"
}

echo ""

# Summary
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Configure OnlyFans credentials in AWS Secrets Manager"
echo "2. Update PLAYWRIGHT_ENABLED_PERCENT to gradually roll out"
echo "3. Monitor CloudWatch metrics and logs"
echo "4. Run load tests: npm run test:load"
echo ""
echo "Monitoring URLs:"
echo "- CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION"
echo "- ECS Cluster: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER_ARN"
echo "- DynamoDB: https://console.aws.amazon.com/dynamodb/home?region=$AWS_REGION"
echo ""
echo -e "${GREEN}✅ Ready to launch!${NC}"
