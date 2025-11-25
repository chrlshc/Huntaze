#!/bin/bash

# ============================================
# AWS Amplify Environment Variables Setup Script
# ============================================
# This script helps you configure all required environment variables
# for your Amplify deployment.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_ID="d33l77zi1h78ce"
BRANCH_NAME="production-ready"
REGION="us-east-1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWS Amplify Environment Variables Setup             ║${NC}"
echo -e "${BLUE}║   App: huntaze (${APP_ID})                            ║${NC}"
echo -e "${BLUE}║   Branch: ${BRANCH_NAME}                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first:${NC}"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Run: aws configure${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"
echo ""

# Function to generate secure secret
generate_secret() {
    openssl rand -base64 32
}

# Function to generate hex secret
generate_hex_secret() {
    openssl rand -hex 16
}

# Function to prompt for value
prompt_for_value() {
    local var_name=$1
    local description=$2
    local default_value=$3
    local is_secret=$4
    
    echo -e "${YELLOW}📝 ${var_name}${NC}"
    echo "   ${description}"
    
    if [ -n "$default_value" ]; then
        echo -e "   ${BLUE}Default: ${default_value}${NC}"
    fi
    
    if [ "$is_secret" = "true" ]; then
        read -s -p "   Enter value (hidden): " value
        echo ""
    else
        read -p "   Enter value: " value
    fi
    
    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value=$default_value
    fi
    
    echo "$value"
}

# Function to add environment variable
add_env_var() {
    local key=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${key} (no value provided)${NC}"
        return
    fi
    
    echo -e "${GREEN}✓ Adding ${key}${NC}"
    ENV_VARS["$key"]="$value"
}

# Declare associative array for environment variables
declare -A ENV_VARS

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 1: Core Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Core variables
add_env_var "NODE_ENV" "production"
add_env_var "AMPLIFY_ENV" "production-ready"
add_env_var "NEXT_PUBLIC_APP_URL" "https://production-ready.d33l77zi1h78ce.amplifyapp.com"
add_env_var "AUTH_TRUST_HOST" "true"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 2: Database Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

DATABASE_URL=$(prompt_for_value \
    "DATABASE_URL" \
    "PostgreSQL connection string" \
    "postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require" \
    "true")
add_env_var "DATABASE_URL" "$DATABASE_URL"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 3: Redis Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

REDIS_HOST=$(prompt_for_value \
    "REDIS_HOST" \
    "Redis ElastiCache endpoint" \
    "huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com" \
    "false")
add_env_var "REDIS_HOST" "$REDIS_HOST"
add_env_var "REDIS_PORT" "6379"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 4: Authentication Secrets${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Generating NEXTAUTH_SECRET...${NC}"
NEXTAUTH_SECRET=$(generate_secret)
add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
add_env_var "NEXTAUTH_URL" "https://production-ready.d33l77zi1h78ce.amplifyapp.com"

echo -e "${YELLOW}Generating CSRF_SECRET...${NC}"
CSRF_SECRET=$(generate_secret)
add_env_var "CSRF_SECRET" "$CSRF_SECRET"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 5: AWS Configuration${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

AWS_ACCESS_KEY_ID=$(prompt_for_value \
    "AWS_ACCESS_KEY_ID" \
    "AWS Access Key ID" \
    "" \
    "true")
add_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"

AWS_SECRET_ACCESS_KEY=$(prompt_for_value \
    "AWS_SECRET_ACCESS_KEY" \
    "AWS Secret Access Key" \
    "" \
    "true")
add_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"

add_env_var "AWS_REGION" "us-east-1"
add_env_var "S3_BUCKET_NAME" "huntaze-assets"
add_env_var "S3_REGION" "us-east-1"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 6: AI Services${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

GEMINI_API_KEY=$(prompt_for_value \
    "GEMINI_API_KEY" \
    "Google Gemini API Key" \
    "" \
    "true")
add_env_var "GEMINI_API_KEY" "$GEMINI_API_KEY"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}STEP 7: Email Configuration (AWS SES)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

add_env_var "AWS_SES_REGION" "us-east-1"
add_env_var "AWS_SES_FROM_EMAIL" "noreply@huntaze.com"
add_env_var "AWS_SES_FROM_NAME" "Huntaze"
add_env_var "EMAIL_FROM" "noreply@huntaze.com"
add_env_var "EMAIL_SERVER_HOST" "email-smtp.us-east-1.amazonaws.com"
add_env_var "EMAIL_SERVER_PORT" "587"

EMAIL_SERVER_USER=$(prompt_for_value \
    "EMAIL_SERVER_USER" \
    "AWS SES SMTP Username" \
    "" \
    "false")
add_env_var "EMAIL_SERVER_USER" "$EMAIL_SERVER_USER"

EMAIL_SERVER_PASSWORD=$(prompt_for_value \
    "EMAIL_SERVER_PASSWORD" \
    "AWS SES SMTP Password" \
    "" \
    "true")
add_env_var "EMAIL_SERVER_PASSWORD" "$EMAIL_SERVER_PASSWORD"

echo ""
echo -e "${YELLOW}Do you want to configure optional integrations? (y/n)${NC}"
read -p "> " configure_optional

if [ "$configure_optional" = "y" ] || [ "$configure_optional" = "Y" ]; then
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 8: Optional - Google OAuth${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    GOOGLE_CLIENT_ID=$(prompt_for_value \
        "GOOGLE_CLIENT_ID" \
        "Google OAuth Client ID" \
        "" \
        "false")
    add_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
    
    GOOGLE_CLIENT_SECRET=$(prompt_for_value \
        "GOOGLE_CLIENT_SECRET" \
        "Google OAuth Client Secret" \
        "" \
        "true")
    add_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"
    
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}STEP 9: Optional - Analytics${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    
    GA_ID=$(prompt_for_value \
        "NEXT_PUBLIC_GA_ID" \
        "Google Analytics ID" \
        "" \
        "false")
    add_env_var "NEXT_PUBLIC_GA_ID" "$GA_ID"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ ${#ENV_VARS[@]} environment variables configured${NC}"
echo ""

# Build the environment variables JSON
ENV_JSON="{"
first=true
for key in "${!ENV_VARS[@]}"; do
    if [ "$first" = true ]; then
        first=false
    else
        ENV_JSON+=","
    fi
    # Escape special characters in value
    value="${ENV_VARS[$key]}"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    ENV_JSON+="\"$key\":\"$value\""
done
ENV_JSON+="}"

echo -e "${YELLOW}Do you want to push these variables to AWS Amplify? (y/n)${NC}"
read -p "> " confirm_push

if [ "$confirm_push" = "y" ] || [ "$confirm_push" = "Y" ]; then
    echo ""
    echo -e "${BLUE}Pushing environment variables to Amplify...${NC}"
    
    # Update branch with environment variables
    aws amplify update-branch \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --environment-variables "$ENV_JSON" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Environment variables successfully pushed to Amplify!${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Trigger a new deployment in Amplify Console"
        echo "2. Or run: aws amplify start-job --app-id $APP_ID --branch-name $BRANCH_NAME --job-type RELEASE"
        echo ""
        echo -e "${BLUE}View your app: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID${NC}"
    else
        echo -e "${RED}❌ Failed to push environment variables${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}Environment variables NOT pushed to Amplify${NC}"
    echo ""
    echo "To push manually, use the AWS Amplify Console:"
    echo "https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
