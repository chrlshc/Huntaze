#!/bin/bash
# Monitor the critical build with Hypothesis E fix

STAGING_URL="https://staging.huntaze.com"
CHECK_INTERVAL=20
MAX_CHECKS=30  # 10 minutes max

echo "🚨 MONITORING CRITICAL BUILD - Hypothesis E Fix"
echo "================================================"
echo ""
echo "Fix Applied: Disable Redis/DB during build"
echo "Expected: No ENOENT errors, clean build artifact"
echo "URL: $STAGING_URL"
echo ""
echo "Checking every $CHECK_INTERVAL seconds (max $MAX_CHECKS checks)..."
echo "Press Ctrl+C to stop"
echo ""

ITERATION=0
START_TIME=$(date +%s)

while [ $ITERATION -lt $MAX_CHECKS ]; do
  ITERATION=$((ITERATION + 1))
  CURRENT_TIME=$(date +%s)
  ELAPSED=$((CURRENT_TIME - START_TIME))
  TIMESTAMP=$(date '+%H:%M:%S')
  
  echo "[$TIMESTAMP] Check #$ITERATION (${ELAPSED}s elapsed)"
  
  # Test root page
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   🎉 SUCCESS! Site is now responding with HTTP 200"
    echo ""
    echo "✅ HYPOTHESIS E CONFIRMED!"
    echo "   The problem was Redis/DB timeouts during build"
    echo "   corrupting the page_client-reference-manifest.js file"
    echo ""
    echo "Verification:"
    curl -I "$STAGING_URL" 2>&1 | head -10
    echo ""
    echo "Next steps:"
    echo "1. Restore the full homepage from backup"
    echo "2. Re-enable output: 'standalone' in next.config.ts"
    echo "3. Monitor for any other issues"
    echo ""
    exit 0
  elif [ "$HTTP_CODE" = "500" ]; then
    echo "   ⏳ Still 500 (build in progress or not deployed yet...)"
  elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ⚠️  Cannot reach server"
  else
    echo "   ℹ️  HTTP $HTTP_CODE"
  fi
  
  # Test API health (should always work)
  HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" 2>/dev/null || echo "000")
  if [ "$HEALTH_CODE" = "200" ]; then
    echo "   ✅ API Health: $HEALTH_CODE (server is running)"
  else
    echo "   ❌ API Health: $HEALTH_CODE (server may be restarting)"
  fi
  
  # Test simple page
  SIMPLE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/test-simple" 2>/dev/null || echo "000")
  if [ "$SIMPLE_CODE" = "200" ]; then
    echo "   ✅ Test page: $SIMPLE_CODE"
  else
    echo "   ⏳ Test page: $SIMPLE_CODE"
  fi
  
  echo ""
  sleep $CHECK_INTERVAL
done

echo "⏰ Timeout reached after $MAX_CHECKS checks"
echo ""
echo "❌ Build may have failed or is taking longer than expected"
echo ""
echo "Next steps:"
echo "1. Check Amplify Console for build status"
echo "2. Check CloudWatch logs for errors:"
echo "   aws logs tail /aws/amplify/d33l77zi1h78ce --follow --region us-east-1"
echo "3. Look for ENOENT errors in build logs"
echo ""
