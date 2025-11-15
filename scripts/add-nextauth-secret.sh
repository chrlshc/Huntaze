#!/bin/bash

# Script to add NEXTAUTH_SECRET to AWS Amplify
# Usage: ./scripts/add-nextauth-secret.sh

set -e

echo "🔐 Adding NEXTAUTH_SECRET to AWS Amplify..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Huntaze"

# Get NEXTAUTH_SECRET from JWT_SECRET (already in Amplify)
echo -e "${YELLOW}Getting JWT_SECRET from Amplify to use as NEXTAUTH_SECRET...${NC}"

echo -e "${YELLOW}Finding Amplify App ID...${NC}"

# Get App ID
APP_ID=$(aws amplify list-apps --query "apps[?name=='${APP_NAME}'].appId" --output text)

if [ -z "$APP_ID" ]; then
  echo -e "${RED}❌ Error: Could not find Amplify app '${APP_NAME}'${NC}"
  echo "Available apps:"
  aws amplify list-apps --query "apps[].{Name:name,ID:appId}" --output table
  exit 1
fi

echo -e "${GREEN}✅ Found App ID: ${APP_ID}${NC}"

echo -e "${YELLOW}Checking current environment variables...${NC}"

# Get current environment variables
CURRENT_VARS=$(aws amplify get-app --app-id "$APP_ID" --query "app.environmentVariables" --output json)

# Get JWT_SECRET to use as NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(echo "$CURRENT_VARS" | jq -r '.JWT_SECRET')

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "null" ]; then
  echo -e "${RED}❌ Error: JWT_SECRET not found in Amplify environment variables${NC}"
  echo "Please ensure JWT_SECRET is configured in Amplify first."
  exit 1
fi

echo -e "${GREEN}✅ Found JWT_SECRET to use as NEXTAUTH_SECRET${NC}"

echo "Current variables:"
echo "$CURRENT_VARS" | jq -r 'to_entries[] | "\(.key)=\(.value)"' | head -5
echo "..."

# Check if NEXTAUTH_SECRET already exists
if echo "$CURRENT_VARS" | jq -e '.NEXTAUTH_SECRET' > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  NEXTAUTH_SECRET already exists${NC}"
  read -p "Do you want to update it? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo -e "${YELLOW}Adding NEXTAUTH_SECRET...${NC}"

# Add NEXTAUTH_SECRET to environment variables
# Note: This updates ALL environment variables, so we need to merge with existing ones
NEW_VARS=$(echo "$CURRENT_VARS" | jq --arg secret "$NEXTAUTH_SECRET" '. + {NEXTAUTH_SECRET: $secret}')

# Update app with new environment variables
aws amplify update-app \
  --app-id "$APP_ID" \
  --environment-variables "$(echo "$NEW_VARS" | jq -c '.')" \
  > /dev/null

echo -e "${GREEN}✅ NEXTAUTH_SECRET added successfully!${NC}"

echo -e "${YELLOW}Verifying...${NC}"

# Verify the variable was added
UPDATED_VARS=$(aws amplify get-app --app-id "$APP_ID" --query "app.environmentVariables.NEXTAUTH_SECRET" --output text)

if [ -n "$UPDATED_VARS" ] && [ "$UPDATED_VARS" != "null" ]; then
  echo -e "${GREEN}✅ Verification successful!${NC}"
else
  echo -e "${RED}❌ Verification failed. Variable may not have been set correctly.${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
echo ""
echo "Next steps:"
echo "1. Trigger a new build:"
echo "   git commit --allow-empty -m 'chore: trigger rebuild for NEXTAUTH_SECRET'"
echo "   git push origin staging"
echo ""
echo "2. Wait for build to complete (~5 minutes)"
echo ""
echo "3. Test Google OAuth at https://huntaze.com/auth"
