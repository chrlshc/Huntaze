#!/bin/bash

# Quick OAuth Configuration Script for AWS Amplify
# This script configures all OAuth credentials in one command

set -e

echo "🚀 Huntaze - AWS Amplify OAuth Configuration"
echo "=============================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   brew install awscli  # macOS"
    echo "   or visit: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Get Amplify App ID
read -p "Enter your Amplify App ID (e.g., d2yx5aqwvvvvvv): " APP_ID
read -p "Enter branch name (default: main): " BRANCH
BRANCH=${BRANCH:-main}

echo ""
echo "📋 App ID: $APP_ID"
echo "📋 Branch: $BRANCH"
echo ""

# Confirm
read -p "Continue with OAuth configuration? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔑 Enter OAuth Credentials"
echo "=========================="
echo ""

# TikTok
echo "📱 TikTok Credentials:"
read -p "  TIKTOK_CLIENT_KEY: " TIKTOK_CLIENT_KEY
read -sp "  TIKTOK_CLIENT_SECRET: " TIKTOK_CLIENT_SECRET
echo ""
read -p "  TIKTOK_REDIRECT_URI (default: https://huntaze.com/api/auth/tiktok/callback): " TIKTOK_REDIRECT_URI
TIKTOK_REDIRECT_URI=${TIKTOK_REDIRECT_URI:-https://huntaze.com/api/auth/tiktok/callback}
echo ""

# Instagram
echo "📸 Instagram (Facebook) Credentials:"
read -p "  FACEBOOK_APP_ID: " FACEBOOK_APP_ID
read -sp "  FACEBOOK_APP_SECRET: " FACEBOOK_APP_SECRET
echo ""
read -p "  INSTAGRAM_REDIRECT_URI (default: https://huntaze.com/api/auth/instagram/callback): " INSTAGRAM_REDIRECT_URI
INSTAGRAM_REDIRECT_URI=${INSTAGRAM_REDIRECT_URI:-https://huntaze.com/api/auth/instagram/callback}
echo ""

# Reddit
echo "🔴 Reddit Credentials:"
read -p "  REDDIT_CLIENT_ID: " REDDIT_CLIENT_ID
read -sp "  REDDIT_CLIENT_SECRET: " REDDIT_CLIENT_SECRET
echo ""
read -p "  REDDIT_REDIRECT_URI (default: https://huntaze.com/api/auth/reddit/callback): " REDDIT_REDIRECT_URI
REDDIT_REDIRECT_URI=${REDDIT_REDIRECT_URI:-https://huntaze.com/api/auth/reddit/callback}
read -p "  REDDIT_USER_AGENT (default: Huntaze/1.0): " REDDIT_USER_AGENT
REDDIT_USER_AGENT=${REDDIT_USER_AGENT:-Huntaze/1.0}
echo ""

# Summary
echo ""
echo "📊 Configuration Summary"
echo "========================"
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo ""
echo "TikTok:"
echo "  ✅ Client Key: ${TIKTOK_CLIENT_KEY:0:10}..."
echo "  ✅ Client Secret: ***"
echo "  ✅ Redirect URI: $TIKTOK_REDIRECT_URI"
echo ""
echo "Instagram:"
echo "  ✅ App ID: ${FACEBOOK_APP_ID:0:10}..."
echo "  ✅ App Secret: ***"
echo "  ✅ Redirect URI: $INSTAGRAM_REDIRECT_URI"
echo ""
echo "Reddit:"
echo "  ✅ Client ID: ${REDDIT_CLIENT_ID:0:10}..."
echo "  ✅ Client Secret: ***"
echo "  ✅ Redirect URI: $REDDIT_REDIRECT_URI"
echo "  ✅ User Agent: $REDDIT_USER_AGENT"
echo ""

# Final confirmation
read -p "Apply this configuration to AWS Amplify? (y/n): " FINAL_CONFIRM
if [ "$FINAL_CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "⚙️  Configuring AWS Amplify..."
echo ""

# Update environment variables
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables \
    TIKTOK_CLIENT_KEY="$TIKTOK_CLIENT_KEY" \
    TIKTOK_CLIENT_SECRET="$TIKTOK_CLIENT_SECRET" \
    TIKTOK_REDIRECT_URI="$TIKTOK_REDIRECT_URI" \
    FACEBOOK_APP_ID="$FACEBOOK_APP_ID" \
    FACEBOOK_APP_SECRET="$FACEBOOK_APP_SECRET" \
    INSTAGRAM_REDIRECT_URI="$INSTAGRAM_REDIRECT_URI" \
    REDDIT_CLIENT_ID="$REDDIT_CLIENT_ID" \
    REDDIT_CLIENT_SECRET="$REDDIT_CLIENT_SECRET" \
    REDDIT_REDIRECT_URI="$REDDIT_REDIRECT_URI" \
    REDDIT_USER_AGENT="$REDDIT_USER_AGENT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration successful!"
    echo ""
    echo "🎉 OAuth credentials configured in AWS Amplify!"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Trigger a new deployment (git push or manual)"
    echo "  2. Wait for build to complete"
    echo "  3. Test OAuth flows"
    echo "  4. Check health endpoint: https://huntaze.com/api/validation/health"
    echo ""
    echo "🚀 Ready to launch!"
else
    echo ""
    echo "❌ Configuration failed!"
    echo "   Check AWS credentials and permissions"
    exit 1
fi
