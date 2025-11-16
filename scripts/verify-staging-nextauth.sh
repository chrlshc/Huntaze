#!/bin/bash

# Verify NextAuth is working on staging after deployment

echo "=================================================="
echo "NextAuth Staging Verification"
echo "=================================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check (env vars status)"
echo "---------------------------------------"
HEALTH_RESPONSE=$(curl -s https://staging.huntaze.com/api/health-check)
echo "$HEALTH_RESPONSE" | jq .

HAS_SECRET=$(echo "$HEALTH_RESPONSE" | jq -r '.env.hasNextAuthSecret')
HAS_URL=$(echo "$HEALTH_RESPONSE" | jq -r '.env.hasNextAuthUrl')

if [ "$HAS_SECRET" = "true" ] && [ "$HAS_URL" = "true" ]; then
  echo "✅ Environment variables are set correctly"
else
  echo "❌ Environment variables are missing:"
  echo "   NEXTAUTH_SECRET: $HAS_SECRET"
  echo "   NEXTAUTH_URL: $HAS_URL"
  exit 1
fi

echo ""

# Test 2: NextAuth Error Page (should not be 500)
echo "Test 2: NextAuth Error Endpoint"
echo "--------------------------------"
ERROR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.huntaze.com/api/auth/error)
echo "Status Code: $ERROR_STATUS"

if [ "$ERROR_STATUS" = "200" ]; then
  echo "✅ NextAuth error page loads correctly"
elif [ "$ERROR_STATUS" = "500" ]; then
  echo "❌ Still getting 500 error"
  exit 1
else
  echo "⚠️  Unexpected status code: $ERROR_STATUS"
fi

echo ""

# Test 3: NextAuth Providers
echo "Test 3: NextAuth Providers Endpoint"
echo "------------------------------------"
PROVIDERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.huntaze.com/api/auth/providers)
echo "Status Code: $PROVIDERS_STATUS"

if [ "$PROVIDERS_STATUS" = "200" ]; then
  echo "✅ Providers endpoint working"
  curl -s https://staging.huntaze.com/api/auth/providers | jq .
else
  echo "❌ Providers endpoint failed with status: $PROVIDERS_STATUS"
  exit 1
fi

echo ""

# Test 4: NextAuth Signin
echo "Test 4: NextAuth Signin Endpoint"
echo "---------------------------------"
SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.huntaze.com/api/auth/signin)
echo "Status Code: $SIGNIN_STATUS"

if [ "$SIGNIN_STATUS" = "200" ] || [ "$SIGNIN_STATUS" = "307" ]; then
  echo "✅ Signin endpoint working"
else
  echo "❌ Signin endpoint failed with status: $SIGNIN_STATUS"
  exit 1
fi

echo ""
echo "=================================================="
echo "✅ All tests passed! NextAuth is working on staging"
echo "=================================================="
