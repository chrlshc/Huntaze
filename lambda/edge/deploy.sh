#!/bin/bash

# Lambda@Edge Deployment Script
# Deploys viewer-request and origin-response functions to CloudFront

set -e

echo "🚀 Deploying Lambda@Edge Functions..."

# Configuration
REGION="us-east-1"  # Lambda@Edge must be in us-east-1
VIEWER_REQUEST_FUNCTION="huntaze-viewer-request"
ORIGIN_RESPONSE_FUNCTION="huntaze-origin-response"
ROLE_NAME="huntaze-lambda-edge-role"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building functions...${NC}"

# Build TypeScript files
cd "$(dirname "$0")"
npx tsc viewer-request.ts --target ES2020 --module commonjs --outDir ./dist
npx tsc origin-response.ts --target ES2020 --module commonjs --outDir ./dist

echo -e "${GREEN}✓ Functions built${NC}"

echo -e "${YELLOW}Step 2: Creating deployment packages...${NC}"

# Create zip files
cd dist
zip -r ../viewer-request.zip viewer-request.js
zip -r ../origin-response.zip origin-response.js
cd ..

echo -e "${GREEN}✓ Deployment packages created${NC}"

echo -e "${YELLOW}Step 3: Creating IAM role (if not exists)...${NC}"

# Create IAM role for Lambda@Edge
aws iam get-role --role-name $ROLE_NAME 2>/dev/null || \
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  2>/dev/null || true

echo -e "${GREEN}✓ IAM role ready${NC}"

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

echo -e "${YELLOW}Step 4: Creating/Updating Lambda functions...${NC}"

# Wait for role to be ready
sleep 10

# Create or update viewer-request function
aws lambda get-function --function-name $VIEWER_REQUEST_FUNCTION --region $REGION 2>/dev/null && \
aws lambda update-function-code \
  --function-name $VIEWER_REQUEST_FUNCTION \
  --zip-file fileb://viewer-request.zip \
  --region $REGION || \
aws lambda create-function \
  --function-name $VIEWER_REQUEST_FUNCTION \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler viewer-request.handler \
  --zip-file fileb://viewer-request.zip \
  --timeout 5 \
  --memory-size 128 \
  --region $REGION

# Create or update origin-response function
aws lambda get-function --function-name $ORIGIN_RESPONSE_FUNCTION --region $REGION 2>/dev/null && \
aws lambda update-function-code \
  --function-name $ORIGIN_RESPONSE_FUNCTION \
  --zip-file fileb://origin-response.zip \
  --region $REGION || \
aws lambda create-function \
  --function-name $ORIGIN_RESPONSE_FUNCTION \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler origin-response.handler \
  --zip-file fileb://origin-response.zip \
  --timeout 5 \
  --memory-size 128 \
  --region $REGION

echo -e "${GREEN}✓ Lambda functions created/updated${NC}"

echo -e "${YELLOW}Step 5: Publishing versions...${NC}"

# Publish new versions
VIEWER_VERSION=$(aws lambda publish-version \
  --function-name $VIEWER_REQUEST_FUNCTION \
  --region $REGION \
  --query 'Version' \
  --output text)

ORIGIN_VERSION=$(aws lambda publish-version \
  --function-name $ORIGIN_RESPONSE_FUNCTION \
  --region $REGION \
  --query 'Version' \
  --output text)

echo -e "${GREEN}✓ Versions published${NC}"
echo "  Viewer Request: $VIEWER_VERSION"
echo "  Origin Response: $ORIGIN_VERSION"

echo -e "${YELLOW}Step 6: Getting function ARNs...${NC}"

VIEWER_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$VIEWER_REQUEST_FUNCTION:$VIEWER_VERSION"
ORIGIN_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$ORIGIN_RESPONSE_FUNCTION:$ORIGIN_VERSION"

echo -e "${GREEN}✓ Function ARNs:${NC}"
echo "  Viewer Request: $VIEWER_ARN"
echo "  Origin Response: $ORIGIN_ARN"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Attach these functions to your CloudFront distribution:"
echo "   - Viewer Request: $VIEWER_ARN"
echo "   - Origin Response: $ORIGIN_ARN"
echo ""
echo "2. Update CloudFront distribution behavior:"
echo "   aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID > config.json"
echo "   # Edit config.json to add Lambda associations"
echo "   aws cloudfront update-distribution --id YOUR_DISTRIBUTION_ID --if-match ETAG --distribution-config file://config.json"
echo ""
echo "3. Wait for CloudFront distribution to deploy (15-20 minutes)"
echo ""

# Cleanup
rm -f viewer-request.zip origin-response.zip
rm -rf dist

echo -e "${GREEN}✓ Cleanup complete${NC}"
