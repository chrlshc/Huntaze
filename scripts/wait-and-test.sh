#!/bin/bash
# Wait for build and test the deployment

STAGING_URL="https://staging.huntaze.com"
MAX_WAIT=600  # 10 minutes max
CHECK_INTERVAL=30  # Check every 30 seconds

echo "⏳ Waiting for Amplify build to complete..."
echo "Max wait time: $((MAX_WAIT / 60)) minutes"
echo ""

START_TIME=$(date +%s)

while true; do
  ELAPSED=$(($(date +%s) - START_TIME))
  
  if [ $ELAPSED -gt $MAX_WAIT ]; then
    echo "❌ Timeout: Build took longer than $((MAX_WAIT / 60)) minutes"
    exit 1
  fi
  
  echo "[$(date '+%H:%M:%S')] Testing... (${ELAPSED}s elapsed)"
  
  # Test root page
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "✅ SUCCESS! Site is responding with HTTP 200"
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Test results:"
    echo "  Root page: $STAGING_URL - HTTP $HTTP_CODE"
    echo ""
    
    # Test other endpoints
    echo "Testing other endpoints..."
    TEST_SIMPLE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/test-simple" 2>/dev/null)
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" 2>/dev/null)
    
    echo "  Test page: $STAGING_URL/test-simple - HTTP $TEST_SIMPLE"
    echo "  API Health: $STAGING_URL/api/health - HTTP $API_HEALTH"
    echo ""
    
    exit 0
  elif [ "$HTTP_CODE" = "500" ]; then
    echo "  ❌ Still 500 - waiting for new build..."
  elif [ "$HTTP_CODE" = "000" ]; then
    echo "  ⚠️  Cannot reach server"
  else
    echo "  ℹ️  HTTP $HTTP_CODE"
  fi
  
  sleep $CHECK_INTERVAL
done
