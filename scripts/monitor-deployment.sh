#!/bin/bash
# Monitor deployment progress

STAGING_URL="https://staging.huntaze.com"
CHECK_INTERVAL=30  # seconds

echo "🔍 Monitoring Deployment Progress"
echo "=================================="
echo ""
echo "URL: $STAGING_URL"
echo "Checking every $CHECK_INTERVAL seconds..."
echo "Press Ctrl+C to stop"
echo ""

ITERATION=0
while true; do
  ITERATION=$((ITERATION + 1))
  TIMESTAMP=$(date '+%H:%M:%S')
  
  echo "[$TIMESTAMP] Check #$ITERATION"
  
  # Test root page
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ SUCCESS! Site is now responding with HTTP 200"
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Verify the fix:"
    echo "   curl -I $STAGING_URL"
    echo ""
    exit 0
  elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ⏳ Still returning 500 (build in progress...)"
  elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ⚠️  Cannot reach server"
  else
    echo "   ℹ️  HTTP $HTTP_CODE"
  fi
  
  # Test API health
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" 2>/dev/null || echo "000")
  echo "   API Health: $HEALTH_CODE"
  
  echo ""
  sleep $CHECK_INTERVAL
done
