#!/bin/bash

# Quick Fix for NEXTAUTH_SECRET - One Command Solution
# Usage: ./scripts/quick-fix-nextauth.sh [app-id] [branch]

set -e

APP_ID="${1:-d33l77zi1h78ce}"
BRANCH="${2:-staging}"

echo "🔧 Quick Fix: Adding NEXTAUTH_SECRET to AWS Amplify"
echo "=================================================="
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install with: brew install awscli"
    exit 1
fi

# Generate secrets
echo "🔑 Generating secrets..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Determine URL based on branch
if [ "$BRANCH" == "main" ]; then
    NEXTAUTH_URL="https://main.$APP_ID.amplifyapp.com"
else
    NEXTAUTH_URL="https://$BRANCH.$APP_ID.amplifyapp.com"
fi

echo "✅ Secrets generated"
echo "📋 NEXTAUTH_URL: $NEXTAUTH_URL"
echo ""

# Get current environment variables
echo "📥 Fetching current environment variables..."
CURRENT_ENV=$(aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --query 'branch.environmentVariables' \
  --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch environment variables"
    echo "   Check: App ID, Branch name, AWS credentials"
    exit 1
fi

# Merge with new variables
echo "⚙️  Merging environment variables..."
MERGED_ENV=$(echo "$CURRENT_ENV" | jq \
  --arg nextauth_secret "$NEXTAUTH_SECRET" \
  --arg nextauth_url "$NEXTAUTH_URL" \
  --arg jwt_secret "$JWT_SECRET" \
  '. + {
    "NEXTAUTH_SECRET": $nextauth_secret,
    "NEXTAUTH_URL": $nextauth_url,
    "JWT_SECRET": $jwt_secret
  }')

# Convert to AWS CLI format
ENV_VARS_ARG=""
while IFS= read -r line; do
    KEY=$(echo "$line" | jq -r '.key')
    VALUE=$(echo "$line" | jq -r '.value')
    if [ -n "$ENV_VARS_ARG" ]; then
        ENV_VARS_ARG="$ENV_VARS_ARG,"
    fi
    ENV_VARS_ARG="$ENV_VARS_ARG$KEY=$VALUE"
done < <(echo "$MERGED_ENV" | jq -c 'to_entries[]')

# Update Amplify
echo "🚀 Updating AWS Amplify..."
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "$ENV_VARS_ARG" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Environment variables updated"
    echo ""
    echo "📊 Added Variables:"
    echo "   ✅ NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}...${NEXTAUTH_SECRET: -10}"
    echo "   ✅ NEXTAUTH_URL: $NEXTAUTH_URL"
    echo "   ✅ JWT_SECRET: ${JWT_SECRET:0:10}...${JWT_SECRET: -10}"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Trigger rebuild:"
    echo "      git commit --allow-empty -m 'chore: trigger rebuild'"
    echo "      git push origin $BRANCH"
    echo ""
    echo "   2. Monitor build at:"
    echo "      https://console.aws.amazon.com/amplify/home#/$APP_ID"
    echo ""
    echo "🎉 Build should now succeed!"
else
    echo ""
    echo "❌ Failed to update environment variables"
    echo ""
    echo "💡 Try manual update in AWS Console:"
    echo "   1. Go to: https://console.aws.amazon.com/amplify/home#/$APP_ID"
    echo "   2. Select branch: $BRANCH"
    echo "   3. Add environment variables:"
    echo "      NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
    echo "      NEXTAUTH_URL=$NEXTAUTH_URL"
    echo "      JWT_SECRET=$JWT_SECRET"
    exit 1
fi
