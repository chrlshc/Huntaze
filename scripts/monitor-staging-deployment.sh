#!/bin/bash

# Monitor Staging Deployment
# Checks the status of the latest Amplify build and tests the register endpoint

APP_ID="d33l77zi1h78ce"
BRANCH="staging"
REGION="us-east-1"
STAGING_URL="https://staging.huntaze.com"

echo "🔍 Monitoring Staging Deployment..."
echo "=================================="
echo ""

# Get latest job status
echo "📊 Latest Build Status:"
aws amplify list-jobs \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --region "$REGION" \
  --max-items 1 \
  --query 'jobSummaries[0].[jobId,status,commitId]' \
  --output table

echo ""
echo "⏳ Waiting for build to complete..."
echo ""

# Wait for build to complete (max 10 minutes)
for i in {1..60}; do
  STATUS=$(aws amplify list-jobs \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region "$REGION" \
    --max-items 1 \
    --query 'jobSummaries[0].status' \
    --output text)
  
  echo "[$i/60] Status: $STATUS"
  
  if [ "$STATUS" = "SUCCEED" ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    break
  elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELLED" ]; then
    echo ""
    echo "❌ Build failed with status: $STATUS"
    exit 1
  fi
  
  sleep 10
done

# Test the register endpoint
echo "🧪 Testing Register Endpoint..."
echo ""

RESPONSE=$(curl -s -X POST "$STAGING_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "503" ]; then
  echo "⚠️  Still getting 503 - Registration unavailable"
  echo "This might mean:"
  echo "  1. Build hasn't propagated to CloudFront yet (wait 5-10 min)"
  echo "  2. DATABASE_URL env var is missing"
  echo "  3. Code still has the DATABASE_URL check"
elif [ "$HTTP_STATUS" = "409" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "✅ Registration endpoint is working!"
  echo "   (409 = user exists, 201 = created successfully)"
else
  echo "ℹ️  Got status $HTTP_STATUS - check response above"
fi

echo ""
echo "=================================="
echo "Monitoring complete!"
