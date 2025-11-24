#!/bin/bash

# ============================================
# Push Environment Variables to AWS Amplify
# ============================================
# This script pushes all production environment variables to AWS Amplify
# 
# Usage: ./scripts/push-env-to-amplify.sh
#
# Prerequisites:
# - AWS CLI installed and configured
# - Proper AWS credentials with Amplify access

set -e

# Configuration
APP_ID="d33l77zi1h78ce"
BRANCH_NAME="production-ready"
REGION="us-east-1"

echo "🚀 Pushing environment variables to AWS Amplify..."
echo "   App ID: $APP_ID"
echo "   Branch: $BRANCH_NAME"
echo "   Region: $REGION"
echo ""

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $key (empty value)"
        return
    fi
    
    echo "📝 Setting $key..."
    aws amplify update-app \
        --app-id "$APP_ID" \
        --region "$REGION" \
        --environment-variables "$key=$value" \
        --no-cli-pager \
        > /dev/null 2>&1
}

# Read from .env.production if it exists
if [ -f ".env.production" ]; then
    echo "📄 Reading from .env.production..."
    
    # Export all variables from .env.production
    export $(grep -v '^#' .env.production | xargs)
    
    # Core Application
    set_env_var "NODE_ENV" "$NODE_ENV"
    set_env_var "NEXT_PUBLIC_APP_URL" "$NEXT_PUBLIC_APP_URL"
    set_env_var "AMPLIFY_ENV" "$AMPLIFY_ENV"
    
    # Database
    set_env_var "DATABASE_URL" "$DATABASE_URL"
    
    # Redis
    set_env_var "REDIS_HOST" "$REDIS_HOST"
    set_env_var "REDIS_PORT" "$REDIS_PORT"
    set_env_var "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
    set_env_var "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
    
    # Authentication
    set_env_var "NEXTAUTH_URL" "$NEXTAUTH_URL"
    set_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
    set_env_var "AUTH_TRUST_HOST" "$AUTH_TRUST_HOST"
    set_env_var "CSRF_SECRET" "$CSRF_SECRET"
    
    # AWS Services
    set_env_var "AWS_REGION" "$AWS_REGION"
    set_env_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
    set_env_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
    set_env_var "S3_BUCKET_NAME" "$S3_BUCKET_NAME"
    set_env_var "S3_REGION" "$S3_REGION"
    set_env_var "SES_FROM_EMAIL" "$SES_FROM_EMAIL"
    set_env_var "SES_REGION" "$SES_REGION"
    
    # VPC Configuration
    set_env_var "LAMBDA_SECURITY_GROUP_ID" "$LAMBDA_SECURITY_GROUP_ID"
    set_env_var "PRIVATE_SUBNET_1_ID" "$PRIVATE_SUBNET_1_ID"
    set_env_var "PRIVATE_SUBNET_2_ID" "$PRIVATE_SUBNET_2_ID"
    
    # AI Services
    set_env_var "GEMINI_API_KEY" "$GEMINI_API_KEY"
    set_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
    
    # Social Media
    set_env_var "IG_PAGE_TOKEN" "$IG_PAGE_TOKEN"
    set_env_var "IG_USER_ID" "$IG_USER_ID"
    set_env_var "TT_USER_TOKEN" "$TT_USER_TOKEN"
    set_env_var "REDDIT_CLIENT_ID" "$REDDIT_CLIENT_ID"
    set_env_var "REDDIT_CLIENT_SECRET" "$REDDIT_CLIENT_SECRET"
    
    # OnlyFans
    set_env_var "OF_SESSION_KEY" "$OF_SESSION_KEY"
    set_env_var "OF_AWS_REGION" "$OF_AWS_REGION"
    set_env_var "OF_DDB_SESSIONS_TABLE" "$OF_DDB_SESSIONS_TABLE"
    set_env_var "OF_DDB_FAN_CAPS_TABLE" "$OF_DDB_FAN_CAPS_TABLE"
    set_env_var "OF_KMS_KEY_ID" "$OF_KMS_KEY_ID"
    set_env_var "OF_SQS_SEND_QUEUE_URL" "$OF_SQS_SEND_QUEUE_URL"
    set_env_var "BRIGHT_DATA_CUSTOMER" "$BRIGHT_DATA_CUSTOMER"
    set_env_var "BRIGHT_DATA_PASSWORD" "$BRIGHT_DATA_PASSWORD"
    set_env_var "BRIGHT_DATA_ZONE" "$BRIGHT_DATA_ZONE"
    
    # Analytics
    set_env_var "NEXT_PUBLIC_GA_ID" "$NEXT_PUBLIC_GA_ID"
    set_env_var "NEXT_PUBLIC_VAPID_PUBLIC_KEY" "$NEXT_PUBLIC_VAPID_PUBLIC_KEY"
    
    # Feature Flags
    set_env_var "ENABLE_SMART_ONBOARDING" "$ENABLE_SMART_ONBOARDING"
    set_env_var "ENABLE_AI_FEATURES" "$ENABLE_AI_FEATURES"
    set_env_var "ENABLE_BETA_FEATURES" "$ENABLE_BETA_FEATURES"
    
    echo ""
    echo "✅ Environment variables pushed successfully!"
    echo ""
    echo "🔄 Trigger a new build in Amplify to apply changes:"
    echo "   aws amplify start-job --app-id $APP_ID --branch-name $BRANCH_NAME --job-type RELEASE --region $REGION"
    
else
    echo "❌ Error: .env.production file not found"
    echo "   Create it from .env.production.template first"
    exit 1
fi
