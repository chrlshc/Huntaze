#!/bin/bash

# Check CloudWatch logs for staging auth errors

echo "🔍 Checking CloudWatch logs for staging auth errors..."
echo ""

# Get the latest log stream for the staging branch
LOG_GROUP="/aws/amplify/d33l77zi1h78ce/staging"

echo "📋 Fetching recent log streams..."
aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --region us-east-1 \
  --query 'logStreams[*].[logStreamName,lastEventTime]' \
  --output table

echo ""
echo "🔍 Searching for NextAuth errors in recent logs..."
echo ""

# Get the most recent log stream
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region us-east-1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

if [ -n "$LATEST_STREAM" ]; then
  echo "📄 Latest log stream: $LATEST_STREAM"
  echo ""
  
  # Get recent logs
  aws logs get-log-events \
    --log-group-name "$LOG_GROUP" \
    --log-stream-name "$LATEST_STREAM" \
    --limit 50 \
    --region us-east-1 \
    --query 'events[*].message' \
    --output text | grep -i -E "(error|nextauth|auth|500|exception)" || echo "No errors found in recent logs"
else
  echo "❌ No log streams found"
fi
