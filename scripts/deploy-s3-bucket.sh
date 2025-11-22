#!/bin/bash

# Deploy S3 Bucket Stack for Huntaze Beta Assets
# This script creates the S3 bucket with versioning and lifecycle policies

set -e

STACK_NAME="huntaze-beta-assets-stack"
TEMPLATE_FILE="infra/aws/s3-bucket-stack.yaml"
BUCKET_NAME="huntaze-beta-assets"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying S3 Bucket Stack..."
echo "Stack Name: $STACK_NAME"
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Validate CloudFormation template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

# Check if stack already exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    2>&1 || true)

if echo "$STACK_EXISTS" | grep -q "does not exist"; then
    echo "📦 Creating new stack..."
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=BucketName,ParameterValue=$BUCKET_NAME \
        --region $REGION \
        --tags Key=Environment,Value=Beta Key=Project,Value=Huntaze
    
    echo "⏳ Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION
else
    echo "🔄 Updating existing stack..."
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=BucketName,ParameterValue=$BUCKET_NAME \
        --region $REGION \
        2>&1 || {
            if echo "$?" | grep -q "No updates are to be performed"; then
                echo "✅ No updates needed - stack is already up to date"
            else
                echo "❌ Stack update failed"
                exit 1
            fi
        }
    
    if ! echo "$?" | grep -q "No updates"; then
        echo "⏳ Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    fi
fi

# Get stack outputs
echo ""
echo "📊 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "✅ S3 Bucket Stack deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with: AWS_S3_BUCKET=$BUCKET_NAME"
echo "2. Configure CloudFront distribution (if needed)"
echo "3. Run 'npm run upload-assets' to upload static assets"
