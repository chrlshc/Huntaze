#!/bin/bash

# AWS SES Setup Script for Staging
# This script helps you configure AWS SES environment variables in Amplify

set -e

echo "🚀 AWS SES Setup for Staging"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI found${NC}"
echo ""

# Get Amplify app details
echo "📋 Amplify Configuration"
echo "------------------------"
read -p "Enter your Amplify App ID: " APP_ID
read -p "Enter your branch name (e.g., main, staging): " BRANCH_NAME

echo ""
echo "🔐 AWS SES Configuration"
echo "------------------------"

# AWS Credentials
echo ""
echo "Enter your AWS credentials:"
read -p "AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
read -sp "AWS_SECRET_ACCESS_KEY: " AWS_SECRET_ACCESS_KEY
echo ""
read -sp "AWS_SESSION_TOKEN (press Enter to skip if not using temporary credentials): " AWS_SESSION_TOKEN
echo ""

# SES Configuration
echo ""
echo "Enter your SES configuration:"
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

read -p "SES From Email (default: no-reply@huntaze.com): " SES_FROM_EMAIL
SES_FROM_EMAIL=${SES_FROM_EMAIL:-no-reply@huntaze.com}

read -p "NextAuth URL (e.g., https://staging.huntaze.com): " NEXTAUTH_URL

echo ""
echo "📝 Summary"
echo "----------"
echo "App ID: $APP_ID"
echo "Branch: $BRANCH_NAME"
echo "Region: $AWS_REGION"
echo "From Email: $SES_FROM_EMAIL"
echo "NextAuth URL: $NEXTAUTH_URL"
echo "Has Session Token: $([ -n "$AWS_SESSION_TOKEN" ] && echo "Yes" || echo "No")"
echo ""

read -p "Continue with these settings? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🔧 Setting environment variables in Amplify..."
echo ""

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⏭️  Skipping $key (empty value)${NC}"
        return
    fi
    
    echo -n "Setting $key... "
    
    if aws amplify update-app \
        --app-id "$APP_ID" \
        --environment-variables "$key=$value" \
        --region us-east-1 \
        > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
}

# Set all environment variables
set_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
set_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
set_env_var "AWS_SESSION_TOKEN" "$AWS_SESSION_TOKEN"
set_env_var "AWS_REGION" "$AWS_REGION"
set_env_var "AWS_SES_REGION" "$AWS_REGION"
set_env_var "AWS_SES_FROM_EMAIL" "$SES_FROM_EMAIL"
set_env_var "SES_FROM_EMAIL" "$SES_FROM_EMAIL"
set_env_var "EMAIL_FROM" "$SES_FROM_EMAIL"
set_env_var "NEXTAUTH_URL" "$NEXTAUTH_URL"

echo ""
echo -e "${GREEN}✅ Environment variables configured!${NC}"
echo ""

echo "🧪 Next Steps"
echo "-------------"
echo "1. Verify sender email in SES:"
echo "   https://console.aws.amazon.com/ses/home?region=$AWS_REGION#/verified-identities"
echo ""
echo "2. If in sandbox mode, verify recipient email too"
echo ""
echo "3. Test email sending:"
echo "   curl -X POST $NEXTAUTH_URL/api/debug/email \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"to\":\"your-verified@email.com\"}'"
echo ""
echo "4. Check CloudWatch logs if there are issues:"
echo "   https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
