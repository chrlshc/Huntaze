#!/bin/bash

# Setup NextAuth Environment Variables for AWS Amplify Staging
# This script helps configure the required environment variables for NextAuth v5

set -e

echo "=================================================="
echo "NextAuth Staging Environment Setup"
echo "=================================================="
echo ""

# Generate NEXTAUTH_SECRET if not provided
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "Generating NEXTAUTH_SECRET..."
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "Generated: $NEXTAUTH_SECRET"
else
  echo "Using provided NEXTAUTH_SECRET"
fi

# Set NEXTAUTH_URL
NEXTAUTH_URL="https://staging.huntaze.com"

echo ""
echo "Environment Variables to Configure:"
echo "-----------------------------------"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "NEXTAUTH_URL=$NEXTAUTH_URL"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "⚠️  AWS CLI not found. Please install it or configure manually."
  echo ""
  echo "Manual Configuration Steps:"
  echo "1. Go to AWS Amplify Console"
  echo "2. Select the Huntaze app"
  echo "3. Navigate to: App settings → Environment variables"
  echo "4. Add the variables shown above for the 'staging' branch"
  echo "5. Save and redeploy"
  exit 0
fi

# Check if APP_ID is set
if [ -z "$AMPLIFY_APP_ID" ]; then
  echo "⚠️  AMPLIFY_APP_ID not set. Please provide it:"
  echo ""
  echo "Usage:"
  echo "  AMPLIFY_APP_ID=<your-app-id> $0"
  echo ""
  echo "Or configure manually using the steps above."
  exit 0
fi

echo "Configuring AWS Amplify environment variables..."
echo ""

# Update environment variables
aws amplify update-branch \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name staging \
  --environment-variables \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXTAUTH_URL="$NEXTAUTH_URL"

echo "✅ Environment variables configured successfully!"
echo ""
echo "Triggering new build..."

# Trigger new build
aws amplify start-job \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name staging \
  --job-type RELEASE

echo "✅ Build triggered!"
echo ""
echo "Next Steps:"
echo "1. Wait for the build to complete (~5-10 minutes)"
echo "2. Run: curl -s https://staging.huntaze.com/api/health-check | jq .env"
echo "3. Verify: hasNextAuthSecret: true, hasNextAuthUrl: true"
echo "4. Test: curl -s https://staging.huntaze.com/api/auth/providers"
echo ""
