#!/bin/bash

# Script to check Amplify deployment status
# Usage: ./scripts/check-amplify-deployment.sh

echo "🔍 Checking Amplify Deployment Status..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the latest commit
LATEST_COMMIT=$(git log -1 --format="%h - %s")
echo "📝 Latest commit: $LATEST_COMMIT"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI not installed. Install it to check deployment status automatically.${NC}"
    echo ""
    echo "Manual check:"
    echo "1. Go to: https://console.aws.amazon.com/amplify/"
    echo "2. Select your app"
    echo "3. Check the deployment status"
    exit 0
fi

# Get Amplify app ID from environment or config
APP_ID="${AMPLIFY_APP_ID:-}"

if [ -z "$APP_ID" ]; then
    echo -e "${YELLOW}⚠️  AMPLIFY_APP_ID not set. Checking for app...${NC}"
    
    # Try to find the app
    APPS=$(aws amplify list-apps --query 'apps[?name==`huntaze`].appId' --output text 2>/dev/null)
    
    if [ -z "$APPS" ]; then
        echo -e "${RED}❌ Could not find Amplify app${NC}"
        echo ""
        echo "Manual check:"
        echo "1. Go to: https://console.aws.amazon.com/amplify/"
        echo "2. Select your app"
        echo "3. Check the deployment status"
        exit 1
    fi
    
    APP_ID=$APPS
    echo -e "${GREEN}✅ Found app: $APP_ID${NC}"
fi

echo ""
echo "🚀 Checking deployment for branch: production-ready"
echo ""

# Get the latest job for the branch
JOB_INFO=$(aws amplify list-jobs \
    --app-id "$APP_ID" \
    --branch-name "production-ready" \
    --max-results 1 \
    --query 'jobSummaries[0].[status,commitId,commitMessage,commitTime]' \
    --output text 2>/dev/null)

if [ -z "$JOB_INFO" ]; then
    echo -e "${RED}❌ Could not fetch deployment info${NC}"
    echo ""
    echo "Manual check:"
    echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/production-ready"
    exit 1
fi

# Parse job info
STATUS=$(echo "$JOB_INFO" | awk '{print $1}')
COMMIT_ID=$(echo "$JOB_INFO" | awk '{print $2}')
COMMIT_MSG=$(echo "$JOB_INFO" | cut -f3-)

echo "Status: $STATUS"
echo "Commit: $COMMIT_ID"
echo "Message: $COMMIT_MSG"
echo ""

# Check status
case $STATUS in
    "SUCCEED")
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""
        echo "🌐 Your site should be live at:"
        echo "   https://production-ready.YOUR_DOMAIN.amplifyapp.com"
        ;;
    "RUNNING"|"PENDING")
        echo -e "${YELLOW}⏳ Deployment in progress...${NC}"
        echo ""
        echo "Check status at:"
        echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/production-ready"
        ;;
    "FAILED")
        echo -e "${RED}❌ Deployment failed!${NC}"
        echo ""
        echo "Check logs at:"
        echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/production-ready"
        ;;
    *)
        echo -e "${YELLOW}⚠️  Unknown status: $STATUS${NC}"
        ;;
esac

echo ""
echo "💡 Tip: Run this script again in a few minutes to check for updates"
