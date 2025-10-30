#!/bin/bash

# ============================================================================
# Configure AWS Amplify Environment Variables for Rate Limiter
# ============================================================================
# This script adds the required environment variables to AWS Amplify
# for the OnlyFans rate limiter integration.
#
# Usage:
#   ./scripts/configure-amplify-rate-limiter.sh
#
# Prerequisites:
#   - AWS CLI installed and configured
#   - Permissions to update Amplify app
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AMPLIFY_APP_ID="d33l77zi1h78ce"
AWS_REGION="us-east-1"
SQS_RATE_LIMITER_QUEUE="https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Amplify Rate Limiter Configuration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS CLI found"

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not authenticated${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✓${NC} AWS credentials valid"

# Get current environment variables
echo ""
echo -e "${YELLOW}Fetching current Amplify environment variables...${NC}"

CURRENT_ENV=$(aws amplify get-app \
    --app-id "$AMPLIFY_APP_ID" \
    --region "$AWS_REGION" \
    --query 'app.environmentVariables' \
    --output json 2>/dev/null || echo "{}")

echo -e "${GREEN}✓${NC} Current environment variables retrieved"

# Add rate limiter variables
echo ""
echo -e "${YELLOW}Adding rate limiter environment variables...${NC}"

# Merge current env with new variables
NEW_ENV=$(echo "$CURRENT_ENV" | jq '. + {
  "SQS_RATE_LIMITER_QUEUE": "'"$SQS_RATE_LIMITER_QUEUE"'",
  "RATE_LIMITER_ENABLED": "true"
}')

# Update Amplify app
aws amplify update-app \
    --app-id "$AMPLIFY_APP_ID" \
    --region "$AWS_REGION" \
    --environment-variables "$NEW_ENV" \
    > /dev/null

echo -e "${GREEN}✓${NC} Environment variables updated successfully"

# Verify the update
echo ""
echo -e "${YELLOW}Verifying configuration...${NC}"

UPDATED_ENV=$(aws amplify get-app \
    --app-id "$AMPLIFY_APP_ID" \
    --region "$AWS_REGION" \
    --query 'app.environmentVariables' \
    --output json)

if echo "$UPDATED_ENV" | jq -e '.SQS_RATE_LIMITER_QUEUE' > /dev/null; then
    echo -e "${GREEN}✓${NC} SQS_RATE_LIMITER_QUEUE: $(echo "$UPDATED_ENV" | jq -r '.SQS_RATE_LIMITER_QUEUE')"
else
    echo -e "${RED}✗${NC} SQS_RATE_LIMITER_QUEUE not found"
fi

if echo "$UPDATED_ENV" | jq -e '.RATE_LIMITER_ENABLED' > /dev/null; then
    echo -e "${GREEN}✓${NC} RATE_LIMITER_ENABLED: $(echo "$UPDATED_ENV" | jq -r '.RATE_LIMITER_ENABLED')"
else
    echo -e "${RED}✗${NC} RATE_LIMITER_ENABLED not found"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Trigger a new Amplify build to apply changes"
echo "2. Verify the build logs show the new environment variables"
echo ""
echo "To trigger a build:"
echo "  aws amplify start-job --app-id $AMPLIFY_APP_ID --branch-name main --job-type RELEASE"
echo ""
