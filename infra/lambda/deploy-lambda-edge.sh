#!/bin/bash

# Deploy Lambda@Edge Functions for CloudFront
# These functions must be deployed to us-east-1 region

set -e

# Configuration
REGION="us-east-1"
SECURITY_HEADERS_FUNCTION="huntaze-security-headers"
IMAGE_OPTIMIZATION_FUNCTION="huntaze-image-optimization"
ROLE_NAME="huntaze-lambda-edge-role"

echo "🚀 Deploying Lambda@Edge functions to ${REGION}..."

# Create IAM role for Lambda@Edge if it doesn't exist
echo "📋 Creating IAM role for Lambda@Edge..."
aws iam get-role --role-name ${ROLE_NAME} 2>/dev/null || \
aws iam create-role \
  --role-name ${ROLE_NAME} \
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
  }' \
  --description "Execution role for Lambda@Edge functions"

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name ${ROLE_NAME} \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  2>/dev/null || echo "Policy already attached"

# Wait for role to be available
echo "⏳ Waiting for IAM role to propagate..."
sleep 10

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name ${ROLE_NAME} --query 'Role.Arn' --output text)
echo "✅ Role ARN: ${ROLE_ARN}"

# Package and deploy security headers function
echo ""
echo "📦 Packaging security headers function..."
cd "$(dirname "$0")"
zip -q security-headers.zip security-headers.js

echo "🚀 Deploying security headers function..."
aws lambda create-function \
  --region ${REGION} \
  --function-name ${SECURITY_HEADERS_FUNCTION} \
  --runtime nodejs20.x \
  --role ${ROLE_ARN} \
  --handler security-headers.handler \
  --zip-file fileb://security-headers.zip \
  --description "Add security headers to CloudFront responses" \
  --timeout 5 \
  --memory-size 128 \
  --publish 2>/dev/null || \
aws lambda update-function-code \
  --region ${REGION} \
  --function-name ${SECURITY_HEADERS_FUNCTION} \
  --zip-file fileb://security-headers.zip \
  --publish

# Get security headers function ARN with version
SECURITY_HEADERS_ARN=$(aws lambda list-versions-by-function \
  --region ${REGION} \
  --function-name ${SECURITY_HEADERS_FUNCTION} \
  --query 'Versions[-1].FunctionArn' \
  --output text)

echo "✅ Security headers function deployed: ${SECURITY_HEADERS_ARN}"

# Package and deploy image optimization function
echo ""
echo "📦 Packaging image optimization function..."
zip -q image-optimization.zip image-optimization.js

echo "🚀 Deploying image optimization function..."
aws lambda create-function \
  --region ${REGION} \
  --function-name ${IMAGE_OPTIMIZATION_FUNCTION} \
  --runtime nodejs20.x \
  --role ${ROLE_ARN} \
  --handler image-optimization.handler \
  --zip-file fileb://image-optimization.zip \
  --description "Optimize image formats based on browser capabilities" \
  --timeout 5 \
  --memory-size 128 \
  --publish 2>/dev/null || \
aws lambda update-function-code \
  --region ${REGION} \
  --function-name ${IMAGE_OPTIMIZATION_FUNCTION} \
  --zip-file fileb://image-optimization.zip \
  --publish

# Get image optimization function ARN with version
IMAGE_OPTIMIZATION_ARN=$(aws lambda list-versions-by-function \
  --region ${REGION} \
  --function-name ${IMAGE_OPTIMIZATION_FUNCTION} \
  --query 'Versions[-1].FunctionArn' \
  --output text)

echo "✅ Image optimization function deployed: ${IMAGE_OPTIMIZATION_ARN}"

# Clean up zip files
rm -f security-headers.zip image-optimization.zip

echo ""
echo "✅ Lambda@Edge functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update CloudFront distribution to use these Lambda@Edge functions:"
echo "   - Security Headers (viewer-response): ${SECURITY_HEADERS_ARN}"
echo "   - Image Optimization (origin-request): ${IMAGE_OPTIMIZATION_ARN}"
echo ""
echo "2. You can add these to your CloudFormation stack or manually via AWS Console"
echo ""
echo "3. Test the functions after CloudFront distribution update"
