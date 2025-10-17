#!/bin/bash
# Huntaze Cognito Deployment Script

# Configuration
STACK_NAME="${STACK_NAME:-huntaze-auth-dev}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="${DOMAIN_NAME:-localhost:3000}"

echo "🚀 Deploying Huntaze Cognito Stack"
echo "================================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo ""

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "❌ Error: AWS credentials not configured or expired"
    echo ""
    echo "Please configure AWS credentials using one of these methods:"
    echo "1. AWS SSO: aws sso login"
    echo "2. AWS CLI: aws configure"
    echo "3. Environment variables: export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=..."
    exit 1
fi

echo "✅ AWS credentials valid"
echo ""

# Deploy stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --region "$AWS_REGION" \
    --stack-name "$STACK_NAME" \
    --template-file "$(dirname "$0")/cognito.yaml" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DomainName="$DOMAIN_NAME" \
        PasswordMinLength=14 \
        MfaConfiguration=OPTIONAL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Stack deployed successfully!"
    echo ""
    echo "Retrieving stack outputs..."
    
    # Get outputs
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    CLIENT_ID=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
    
    COGNITO_DOMAIN=$(aws cloudformation describe-stacks \
        --region "$AWS_REGION" \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
        --output text)
    
    echo ""
    echo "📋 Stack Outputs:"
    echo "================"
    echo "USER_POOL_ID: $USER_POOL_ID"
    echo "CLIENT_ID: $CLIENT_ID"
    echo "COGNITO_DOMAIN: $COGNITO_DOMAIN"
    echo ""
    echo "🔧 Next Steps:"
    echo "============="
    echo "1. Update your .env.local file with these values:"
    echo ""
    echo "NEXT_PUBLIC_AWS_REGION=$AWS_REGION"
    echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID"
    echo ""
    echo "2. For production, update your hosting platform's environment variables"
    echo "3. Configure SES for email delivery"
    echo "4. Test the authentication flow"
else
    echo ""
    echo "❌ Stack deployment failed"
    exit 1
fi