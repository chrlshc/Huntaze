#!/bin/bash

# Check Amplify Environment Variables
# This script checks if all required OAuth credentials are configured in AWS Amplify

echo "🔍 Checking AWS Amplify Environment Variables..."
echo "================================================"
echo ""

# Get Amplify App ID (you'll need to replace this with your actual app ID)
# You can find it in AWS Amplify Console or by running: aws amplify list-apps
AMPLIFY_APP_ID="d2yx5aqwvvvvvv"  # Replace with your actual app ID

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Get current branch (assuming main or staging)
BRANCH="main"

echo "📋 Checking environment variables for app: $AMPLIFY_APP_ID, branch: $BRANCH"
echo ""

# Get environment variables from Amplify
ENV_VARS=$(aws amplify get-branch --app-id "$AMPLIFY_APP_ID" --branch-name "$BRANCH" --query 'branch.environmentVariables' --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Failed to get Amplify environment variables"
    echo "   Make sure:"
    echo "   1. AWS credentials are configured"
    echo "   2. AMPLIFY_APP_ID is correct"
    echo "   3. Branch name is correct"
    exit 1
fi

# Required OAuth variables
REQUIRED_VARS=(
    "TIKTOK_CLIENT_KEY"
    "TIKTOK_CLIENT_SECRET"
    "TIKTOK_REDIRECT_URI"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "INSTAGRAM_REDIRECT_URI"
    "REDDIT_CLIENT_ID"
    "REDDIT_CLIENT_SECRET"
    "REDDIT_REDIRECT_URI"
    "REDDIT_USER_AGENT"
)

echo "🔍 Checking required OAuth variables:"
echo ""

MISSING_COUNT=0
CONFIGURED_COUNT=0

for VAR in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "\"$VAR\""; then
        echo "✅ $VAR - Configured"
        ((CONFIGURED_COUNT++))
    else
        echo "❌ $VAR - Missing"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo "================================================"
echo "📊 Summary:"
echo "   Configured: $CONFIGURED_COUNT/${#REQUIRED_VARS[@]}"
echo "   Missing: $MISSING_COUNT/${#REQUIRED_VARS[@]}"
echo ""

if [ $MISSING_COUNT -eq 0 ]; then
    echo "🎉 All OAuth credentials are configured!"
    echo "✅ Ready for deployment"
    exit 0
else
    echo "⚠️  Some OAuth credentials are missing"
    echo "   Please configure them in AWS Amplify Console"
    echo "   or use: aws amplify update-branch --app-id $AMPLIFY_APP_ID --branch-name $BRANCH --environment-variables KEY=VALUE"
    exit 1
fi
