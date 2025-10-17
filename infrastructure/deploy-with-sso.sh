#!/bin/bash
# Cognito Deployment with AWS SSO

set -e

echo "🚀 Huntaze Cognito Deployment (AWS SSO)"
echo "======================================="
echo ""

# Check if profile is provided
PROFILE=${1:-huntaze}

echo "📋 Using AWS Profile: $PROFILE"
echo ""

# Test SSO connection
echo "🔐 Checking SSO authentication..."
if aws sts get-caller-identity --profile $PROFILE &>/dev/null; then
    echo "✅ Already authenticated"
    IDENTITY=$(aws sts get-caller-identity --profile $PROFILE)
    echo "   Account: $(echo $IDENTITY | jq -r '.Account')"
    echo "   User: $(echo $IDENTITY | jq -r '.Arn')"
else
    echo "🔄 Need to login..."
    aws sso login --profile $PROFILE
    
    # Verify login worked
    if aws sts get-caller-identity --profile $PROFILE &>/dev/null; then
        echo "✅ Login successful!"
    else
        echo "❌ Login failed. Please check your SSO configuration."
        exit 1
    fi
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Configuration
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="huntaze-auth-dev"
ENVIRONMENT="dev"

# Deploy
aws cloudformation deploy \
    --profile $PROFILE \
    --region $REGION \
    --stack-name $STACK_NAME \
    --template-file cognito.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DomainName=localhost:3000 \
        PasswordMinLength=14 \
        MfaConfiguration=OPTIONAL

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Retrieving outputs..."
    
    # Get outputs
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --profile $PROFILE \
        --region $REGION \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    CLIENT_ID=$(aws cloudformation describe-stacks \
        --profile $PROFILE \
        --region $REGION \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
    
    DOMAIN=$(aws cloudformation describe-stacks \
        --profile $PROFILE \
        --region $REGION \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolDomain`].OutputValue' \
        --output text)
    
    echo ""
    echo "🎉 SUCCESS! Add these to your .env.local:"
    echo ""
    echo "────────────────────────────────────────"
    echo "NEXT_PUBLIC_AWS_REGION=$REGION"
    echo "NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID"
    echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID"
    echo "────────────────────────────────────────"
    echo ""
    echo "📌 Cognito Hosted UI: $DOMAIN"
    echo ""
    echo "🔄 Want to auto-update .env.local? (y/N): "
    read -r UPDATE_ENV
    
    if [[ "$UPDATE_ENV" =~ ^[Yy]$ ]]; then
        cp ../.env.local ../.env.local.backup
        sed -i '' "s|NEXT_PUBLIC_AWS_REGION=.*|NEXT_PUBLIC_AWS_REGION=$REGION|" ../.env.local
        sed -i '' "s|NEXT_PUBLIC_USER_POOL_ID=.*|NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID|" ../.env.local
        sed -i '' "s|NEXT_PUBLIC_USER_POOL_CLIENT_ID=.*|NEXT_PUBLIC_USER_POOL_CLIENT_ID=$CLIENT_ID|" ../.env.local
        echo "✅ Updated .env.local (backup: .env.local.backup)"
    fi
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the error above and try again"
    exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Test login at: http://localhost:3000/auth"
echo "3. Configure SES for production emails"
echo ""