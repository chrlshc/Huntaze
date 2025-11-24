#!/bin/bash
# Diagnose 500 Internal Server Error on staging.huntaze.com

set -e

STAGING_URL="https://staging.huntaze.com"
APP_ID="d33l77zi1h78ce"
BRANCH="staging"
REGION="us-east-1"

echo "🔍 Diagnosing 500 Internal Server Error on staging.huntaze.com"
echo "================================================================"
echo ""

# 1. Check if the site is accessible
echo "1️⃣  Testing site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" || echo "000")
echo "   HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "500" ]; then
  echo "   ❌ Confirmed: 500 Internal Server Error"
elif [ "$HTTP_CODE" = "000" ]; then
  echo "   ❌ Cannot reach server (network issue)"
else
  echo "   ✅ Server responding with: $HTTP_CODE"
fi
echo ""

# 2. Check Amplify deployment status
echo "2️⃣  Checking Amplify deployment status..."
if command -v aws &> /dev/null; then
  BRANCH_INFO=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region "$REGION" 2>&1 || echo "ERROR")
  
  if [[ "$BRANCH_INFO" == *"ERROR"* ]]; then
    echo "   ⚠️  Could not fetch branch info (check AWS credentials)"
  else
    echo "   ✅ Branch exists"
    
    # Get latest job
    LATEST_JOB=$(aws amplify list-jobs \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH" \
      --region "$REGION" \
      --max-results 1 \
      --query 'jobSummaries[0]' 2>&1 || echo "ERROR")
    
    if [[ "$LATEST_JOB" != *"ERROR"* ]]; then
      echo "   Latest deployment:"
      echo "$LATEST_JOB" | jq -r '"     Status: \(.status)\n     Started: \(.startTime)\n     Job ID: \(.jobId)"' 2>/dev/null || echo "$LATEST_JOB"
    fi
  fi
else
  echo "   ⚠️  AWS CLI not installed - cannot check deployment status"
fi
echo ""

# 3. Check environment variables
echo "3️⃣  Checking critical environment variables..."
if command -v aws &> /dev/null; then
  ENV_VARS=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH" \
    --region "$REGION" \
    --query 'branch.environmentVariables' 2>&1 || echo "ERROR")
  
  if [[ "$ENV_VARS" == *"ERROR"* ]]; then
    echo "   ⚠️  Could not fetch environment variables"
  else
    # Check for critical variables
    CRITICAL_VARS=("DATABASE_URL" "REDIS_HOST" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "NODE_ENV")
    
    for VAR in "${CRITICAL_VARS[@]}"; do
      if echo "$ENV_VARS" | grep -q "\"$VAR\""; then
        echo "   ✅ $VAR is set"
      else
        echo "   ❌ $VAR is MISSING"
      fi
    done
  fi
else
  echo "   ⚠️  AWS CLI not installed - cannot check environment variables"
fi
echo ""

# 4. Test API endpoints
echo "4️⃣  Testing API endpoints..."

# Test health endpoint (if exists)
echo "   Testing /api/health..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" 2>/dev/null || echo "000")
echo "   Status: $HEALTH_CODE"

# Test CSRF token endpoint
echo "   Testing /api/csrf/token..."
CSRF_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/csrf/token" 2>/dev/null || echo "000")
echo "   Status: $CSRF_CODE"

# Test NextAuth providers
echo "   Testing /api/auth/providers..."
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/auth/providers" 2>/dev/null || echo "000")
echo "   Status: $AUTH_CODE"
echo ""

# 5. Check CloudWatch logs (if AWS CLI available)
echo "5️⃣  Checking recent CloudWatch logs..."
if command -v aws &> /dev/null; then
  LOG_GROUP="/aws/amplify/$APP_ID"
  
  # Try to get recent log streams
  LOG_STREAMS=$(aws logs describe-log-streams \
    --log-group-name "$LOG_GROUP" \
    --order-by LastEventTime \
    --descending \
    --max-items 3 \
    --region "$REGION" 2>&1 || echo "ERROR")
  
  if [[ "$LOG_STREAMS" == *"ERROR"* ]] || [[ "$LOG_STREAMS" == *"ResourceNotFoundException"* ]]; then
    echo "   ⚠️  Could not access CloudWatch logs"
    echo "   Log group: $LOG_GROUP"
  else
    echo "   ✅ Found recent log streams"
    echo "   To view logs, run:"
    echo "   aws logs tail $LOG_GROUP --follow --region $REGION"
  fi
else
  echo "   ⚠️  AWS CLI not installed - cannot check logs"
fi
echo ""

# 6. Common issues and solutions
echo "📋 Common Causes of 500 Errors:"
echo "================================================================"
echo ""
echo "1. Missing Environment Variables"
echo "   Solution: Run ./scripts/push-env-to-amplify.sh"
echo ""
echo "2. Database Connection Failure"
echo "   - Check DATABASE_URL is correct"
echo "   - Verify VPC security groups allow connections"
echo "   - Ensure LAMBDA_SECURITY_GROUP_ID and subnet IDs are set"
echo ""
echo "3. Redis Connection Failure"
echo "   - Check REDIS_HOST and REDIS_PORT are correct"
echo "   - Verify ElastiCache security group allows connections"
echo ""
echo "4. Build Errors"
echo "   - Check Amplify Console for build logs"
echo "   - Look for TypeScript or dependency errors"
echo ""
echo "5. NextAuth Configuration"
echo "   - Verify NEXTAUTH_SECRET is set (min 32 characters)"
echo "   - Check NEXTAUTH_URL matches your domain"
echo "   - Ensure AUTH_TRUST_HOST=true"
echo ""
echo "📚 Next Steps:"
echo "================================================================"
echo ""
echo "1. View detailed logs:"
echo "   aws logs tail /aws/amplify/$APP_ID --follow --region $REGION"
echo ""
echo "2. Check Amplify Console:"
echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo ""
echo "3. Verify environment variables:"
echo "   aws amplify get-branch --app-id $APP_ID --branch-name $BRANCH --region $REGION"
echo ""
echo "4. Trigger new deployment:"
echo "   aws amplify start-job --app-id $APP_ID --branch-name $BRANCH --job-type RELEASE --region $REGION"
echo ""
