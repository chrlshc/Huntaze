#!/bin/bash

# Fix AWS Amplify Environment Variables
# Adds missing NEXTAUTH_SECRET and other critical variables

set -e

echo "🔧 Fixing AWS Amplify Environment Variables"
echo "==========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   brew install awscli  # macOS"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Get Amplify App ID and Branch
read -p "Enter your Amplify App ID (e.g., d33l77zi1h78ce): " APP_ID
read -p "Enter branch name (staging/main): " BRANCH

echo ""
echo "📋 App ID: $APP_ID"
echo "📋 Branch: $BRANCH"
echo ""

# Generate NEXTAUTH_SECRET if needed
echo "🔑 NEXTAUTH_SECRET Configuration"
echo "================================"
echo ""
echo "Option 1: Generate a new random secret (recommended)"
echo "Option 2: Enter your own secret"
echo ""
read -p "Choose option (1 or 2): " OPTION

if [ "$OPTION" == "1" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated new NEXTAUTH_SECRET"
else
    read -sp "Enter NEXTAUTH_SECRET: " NEXTAUTH_SECRET
    echo ""
fi

echo ""
echo "🔑 Other Required Variables"
echo "=========================="
echo ""

# NEXTAUTH_URL
read -p "NEXTAUTH_URL (e.g., https://staging.d33l77zi1h78ce.amplifyapp.com): " NEXTAUTH_URL

# JWT_SECRET (can be same as NEXTAUTH_SECRET or different)
echo ""
echo "JWT_SECRET (for middleware authentication)"
read -p "Use same as NEXTAUTH_SECRET? (y/n): " USE_SAME_JWT
if [ "$USE_SAME_JWT" == "y" ]; then
    JWT_SECRET="$NEXTAUTH_SECRET"
else
    read -sp "Enter JWT_SECRET: " JWT_SECRET
    echo ""
fi

# Get current environment variables
echo ""
echo "📥 Fetching current environment variables..."
CURRENT_ENV=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH" --query 'branch.environmentVariables' --output json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch current environment variables"
    exit 1
fi

echo "✅ Current environment variables fetched"
echo ""

# Summary
echo "📊 Configuration Summary"
echo "======================="
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}...${NEXTAUTH_SECRET: -10}"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "JWT_SECRET: ${JWT_SECRET:0:10}...${JWT_SECRET: -10}"
echo ""

# Confirm
read -p "Apply these changes to AWS Amplify? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "⚙️  Updating AWS Amplify environment variables..."
echo ""

# Merge with existing environment variables
# We need to preserve existing vars and add new ones
MERGED_ENV=$(echo "$CURRENT_ENV" | jq \
  --arg nextauth_secret "$NEXTAUTH_SECRET" \
  --arg nextauth_url "$NEXTAUTH_URL" \
  --arg jwt_secret "$JWT_SECRET" \
  '. + {
    "NEXTAUTH_SECRET": $nextauth_secret,
    "NEXTAUTH_URL": $nextauth_url,
    "JWT_SECRET": $jwt_secret
  }')

# Convert JSON to AWS CLI format
ENV_VARS_STRING=$(echo "$MERGED_ENV" | jq -r 'to_entries | map("\(.key)=\(.value)") | join(",")')

# Update branch with merged environment variables
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables $(echo "$MERGED_ENV" | jq -r 'to_entries | map("\(.key)=\(.value)") | @json' | tr -d '"')

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Environment variables updated successfully!"
    echo ""
    echo "🎉 Configuration complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Trigger a new deployment:"
    echo "     git commit --allow-empty -m 'chore: trigger rebuild with NEXTAUTH_SECRET'"
    echo "     git push origin $BRANCH"
    echo ""
    echo "  2. Monitor the build in AWS Amplify Console"
    echo ""
    echo "  3. Verify the deployment:"
    echo "     curl $NEXTAUTH_URL/api/health"
    echo ""
else
    echo ""
    echo "❌ Failed to update environment variables"
    echo ""
    echo "💡 Alternative: Update manually in AWS Amplify Console"
    echo "   1. Go to: https://console.aws.amazon.com/amplify"
    echo "   2. Select your app: $APP_ID"
    echo "   3. Go to: Hosting > $BRANCH > Environment variables"
    echo "   4. Add these variables:"
    echo "      NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
    echo "      NEXTAUTH_URL=$NEXTAUTH_URL"
    echo "      JWT_SECRET=$JWT_SECRET"
    exit 1
fi
