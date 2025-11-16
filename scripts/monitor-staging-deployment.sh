#!/bin/bash

# Monitor staging deployment status

APP_ID="d33l77zi1h78ce"
BRANCH="staging"
JOB_ID="125"

echo "📊 Monitoring deployment status..."
echo "App ID: $APP_ID"
echo "Branch: $BRANCH"
echo "Job ID: $JOB_ID"
echo ""

while true; do
  STATUS=$(aws amplify get-job \
    --app-id $APP_ID \
    --branch-name $BRANCH \
    --job-id $JOB_ID \
    --region us-east-1 \
    --query 'job.summary.status' \
    --output text 2>&1)
  
  if [ $? -ne 0 ]; then
    echo "❌ Error checking deployment status"
    echo "$STATUS"
    exit 1
  fi
  
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$TIMESTAMP] Status: $STATUS"
  
  case $STATUS in
    "SUCCEED")
      echo ""
      echo "✅ Deployment completed successfully!"
      echo ""
      echo "🧪 Testing authentication endpoint..."
      curl -I https://staging.huntaze.com/api/auth/signin 2>&1 | grep -E "HTTP|content-type"
      echo ""
      echo "🔍 Check full response:"
      echo "   curl https://staging.huntaze.com/api/auth/signin"
      exit 0
      ;;
    "FAILED")
      echo ""
      echo "❌ Deployment failed!"
      echo ""
      echo "📋 Get error details:"
      echo "   aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID --region us-east-1"
      exit 1
      ;;
    "CANCELLED")
      echo ""
      echo "⚠️  Deployment was cancelled"
      exit 1
      ;;
    "PENDING"|"RUNNING"|"PROVISIONING")
      # Continue monitoring
      sleep 15
      ;;
    *)
      echo "⚠️  Unknown status: $STATUS"
      sleep 15
      ;;
  esac
done
