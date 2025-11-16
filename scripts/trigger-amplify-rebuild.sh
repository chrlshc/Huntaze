#!/bin/bash

# Trigger a new Amplify build to pick up environment variables
# This is needed after adding/updating environment variables in Amplify Console

echo "=================================================="
echo "Trigger Amplify Rebuild"
echo "=================================================="
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Please install it first."
  echo ""
  echo "Alternative: Trigger rebuild manually in Amplify Console:"
  echo "1. Go to AWS Amplify Console"
  echo "2. Select Huntaze app"
  echo "3. Select 'staging' branch"
  echo "4. Click 'Redeploy this version'"
  exit 1
fi

# Check if APP_ID is set
if [ -z "$AMPLIFY_APP_ID" ]; then
  echo "⚠️  AMPLIFY_APP_ID not set."
  echo ""
  echo "Usage:"
  echo "  AMPLIFY_APP_ID=<your-app-id> $0"
  echo ""
  echo "Or trigger rebuild manually in Amplify Console (see above)"
  exit 1
fi

echo "Triggering rebuild for staging branch..."
echo ""

aws amplify start-job \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name staging \
  --job-type RELEASE

if [ $? -eq 0 ]; then
  echo "✅ Rebuild triggered successfully!"
  echo ""
  echo "Monitor the build:"
  echo "- AWS Console: https://console.aws.amazon.com/amplify/home"
  echo "- Wait ~5-7 minutes for build to complete"
  echo "- Then run: ./scripts/verify-staging-nextauth.sh"
else
  echo "❌ Failed to trigger rebuild"
  echo ""
  echo "Please trigger manually in Amplify Console"
fi
