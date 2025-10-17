#!/usr/bin/env bash
set -euo pipefail

PROFILE="huntaze-cli"
: "${AWS_REGION:=us-east-1}"
: "${LOG_GROUP_NAME:=/aws/lambda/huntaze-prod}"
: "${API_GATEWAY_ID:=}"
: "${API_GATEWAY_STAGE:=prod}"
: "${USERS_TABLE_NAME:=huntaze-users}"
: "${DAILY_COST_BUDGET:=50}"
: "${BUDGET_CURRENCY:=USD}"

echo "Using AWS_REGION=${AWS_REGION}"
echo "Using LOG_GROUP_NAME=${LOG_GROUP_NAME}"
[[ -n "$API_GATEWAY_ID" ]] && echo "Using API Gateway ${API_GATEWAY_ID}/${API_GATEWAY_STAGE}" || echo "Skipping API Gateway alarms (API_GATEWAY_ID not provided)"
echo "Monitoring DynamoDB table ${USERS_TABLE_NAME}"
echo "Daily cost budget threshold: ${DAILY_COST_BUDGET} ${BUDGET_CURRENCY}"
USER_POOL_ID="us-east-1_RSrwkHKaR"
SNS_TOPIC_NAME="huntaze-auth-alerts"
EMAIL="security@huntaze.com"

echo "🔔 Setting up CloudWatch alarms for authentication monitoring..."

# Create SNS topic for alerts
echo "Creating SNS topic..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --profile $PROFILE \
  --region $AWS_REGION \
  --name $SNS_TOPIC_NAME \
  --query 'TopicArn' \
  --output text)

echo "SNS Topic created: $SNS_TOPIC_ARN"

# Subscribe email to topic
echo "Subscribing email to alerts..."
aws sns subscribe \
  --profile $PROFILE \
  --region $AWS_REGION \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint $EMAIL

echo "✉️  Please check your email to confirm the subscription!"

# Create CloudWatch alarms
echo "Creating authentication failure alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-high-auth-failures" \
  --alarm-description "Alert when authentication failures exceed threshold" \
  --metric-name "UserAuthenticationFailureCount" \
  --namespace "AWS/Cognito" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=UserPool,Value=$USER_POOL_ID \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

echo "Creating token refresh errors alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-token-refresh-errors" \
  --alarm-description "Alert on high token refresh error rate" \
  --metric-name "TokenRefreshFailures" \
  --namespace "AWS/Cognito" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=UserPool,Value=$USER_POOL_ID \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

echo "Creating account takeover risk alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-account-takeover-risk" \
  --alarm-description "Alert on high-risk account takeover attempts" \
  --metric-name "AccountTakeoverRiskEventCount" \
  --namespace "AWS/Cognito" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=UserPool,Value=$USER_POOL_ID Name=EventType,Value=Risk \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

echo "Creating compromised credentials alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-compromised-credentials" \
  --alarm-description "Alert on compromised credential detection" \
  --metric-name "CompromisedCredentialsRiskEventCount" \
  --namespace "AWS/Cognito" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=UserPool,Value=$USER_POOL_ID \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

# Create custom metrics for API errors
echo "Creating custom namespace for API metrics..."
aws cloudwatch put-metric-data \
  --profile $PROFILE \
  --region $AWS_REGION \
  --namespace "Huntaze/Auth" \
  --metric-name "APIErrors" \
  --value 0 \
  --dimensions Endpoint=/api/auth/login

echo "Creating API error rate alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-api-auth-errors" \
  --alarm-description "Alert on high API authentication error rate" \
  --metric-name "APIErrors" \
  --namespace "Huntaze/Auth" \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Endpoint,Value=/api/auth/login \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

echo "✅ CloudWatch alarms configured successfully!"
echo ""
echo "📊 Alarms created:"
echo "  - High authentication failures (>10 in 5 min)"
echo "  - Token refresh errors (>20 in 10 min)"
echo "  - Account takeover risk events (>5 in 5 min)"
echo "  - Compromised credentials (>0)"
echo "  - API authentication errors (>50 in 2 min)"
echo ""
echo "⚠️  Remember to:"
echo "  1. Confirm the SNS email subscription"
echo "  2. Test the alarms with synthetic failures"
echo "  3. Adjust thresholds based on your traffic"
echo "  4. Add CloudWatch metrics in your API code"

if [[ -n "$API_GATEWAY_ID" ]]; then
  echo "\n📡 Creating API Gateway 5XX error alarm..."
  aws cloudwatch put-metric-alarm \
    --profile $PROFILE \
    --region $AWS_REGION \
    --alarm-name "huntaze-apigateway-5xx" \
    --alarm-description "Alert when API Gateway 5XX errors exceed 1%" \
    --namespace AWS/ApiGateway \
    --metric-name 5XXError \
    --dimensions Name=ApiId,Value=$API_GATEWAY_ID Name=Stage,Value=$API_GATEWAY_STAGE \
    --statistic Sum \
    --period 60 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator GreaterThanThreshold \
    --alarm-actions $SNS_TOPIC_ARN \
    --treat-missing-data notBreaching

  echo "Creating API Gateway latency alarm (>2s)..."
  aws cloudwatch put-metric-alarm \
    --profile $PROFILE \
    --region $AWS_REGION \
    --alarm-name "huntaze-apigateway-latency" \
    --alarm-description "Alert when p95 latency exceeds 2 seconds" \
    --namespace AWS/ApiGateway \
    --metric-name Latency \
    --dimensions Name=ApiId,Value=$API_GATEWAY_ID Name=Stage,Value=$API_GATEWAY_STAGE \
    --statistic Average \
    --period 60 \
    --evaluation-periods 1 \
    --threshold 2000 \
    --comparison-operator GreaterThanThreshold \
    --alarm-actions $SNS_TOPIC_ARN \
    --treat-missing-data notBreaching
fi

echo "\n📚 Creating DynamoDB throttled requests alarm..."
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-dynamodb-throttles" \
  --alarm-description "Alert when DynamoDB table throttles" \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=$USERS_TABLE_NAME \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

if aws budgets describe-budget \
  --profile $PROFILE \
  --region $AWS_REGION \
  --account-id "$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)" \
  --budget-name huntaze-prebeta-daily >/dev/null 2>&1; then
  echo "\n💰 Budget huntaze-prebeta-daily already exists, skipping creation."
else
  echo "\n💰 Creating AWS Budgets daily alert..."
  ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
  START_DATE=$(date -u +%Y-%m-%dT00:00:00Z)
  BUDGET_PAYLOAD=$(cat <<JSON
{
  "BudgetName": "huntaze-prebeta-daily",
  "BudgetType": "COST",
  "TimeUnit": "DAILY",
  "BudgetLimit": { "Amount": "${DAILY_COST_BUDGET}", "Unit": "${BUDGET_CURRENCY}" },
  "CostFilters": {},
  "CostTypes": { "IncludeSubscription": true, "IncludeTax": true, "UseBlended": false },
  "TimePeriod": { "Start": "${START_DATE}" }
}
JSON
  )

  NOTIFICATION_PAYLOAD=$(cat <<JSON
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      { "SubscriptionType": "SNS", "Address": "${SNS_TOPIC_ARN}" }
    ]
  }
]
JSON
  )

  aws budgets create-budget \
    --profile $PROFILE \
    --region $AWS_REGION \
    --account-id "$ACCOUNT_ID" \
    --budget "$BUDGET_PAYLOAD" \
    --notifications-with-subscribers "$NOTIFICATION_PAYLOAD"
fi

echo "\n🏁 Additional alarms and budget configured."

echo "\n📈 Creating metric filters for AI chat and rate limits..."

# Create metric filters for ai_chat_completed (premium vs mini)
aws logs put-metric-filter \
  --profile $PROFILE \
  --region $AWS_REGION \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name AiChatPremium \
  --filter-pattern '{ $.evt = "ai_chat_completed" && $.premiumRouted = true }' \
  --metric-transformations metricName=CompletedPremium,metricNamespace=Huntaze/AiChat,metricValue=1

aws logs put-metric-filter \
  --profile $PROFILE \
  --region $AWS_REGION \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name AiChatMini \
  --filter-pattern '{ $.evt = "ai_chat_completed" && $.premiumRouted = false }' \
  --metric-transformations metricName=CompletedMini,metricNamespace=Huntaze/AiChat,metricValue=1

# Create metric filter for rate limited events
aws logs put-metric-filter \
  --profile $PROFILE \
  --region $AWS_REGION \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name AiChatRateLimited \
  --filter-pattern '{ $.evt = "ai_chat_rate_limited" }' \
  --metric-transformations metricName=RateLimited,metricNamespace=Huntaze/AiChat,metricValue=1

# Create metric filter for server errors via *_failed events
aws logs put-metric-filter \
  --profile $PROFILE \
  --region $AWS_REGION \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name ApiFailedEvents \
  --filter-pattern '{ $.evt = "*_failed" }' \
  --metric-transformations metricName=FailedEvents,metricNamespace=Huntaze/API,metricValue=1

# Create metric filter for event_dedup_skipped (noisy retries indicator)
aws logs put-metric-filter \
  --profile $PROFILE \
  --region $AWS_REGION \
  --log-group-name "$LOG_GROUP_NAME" \
  --filter-name EventDedupSkipped \
  --filter-pattern '{ $.evt = "event_dedup_skipped" }' \
  --metric-transformations metricName=EventDedupSkipped,metricNamespace=Huntaze/API,metricValue=1

echo "📟 Creating AI chat alarms (premium and rate limited)..."

# Alarm: Rate limited spikes
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-ai-chat-rate-limited-spike" \
  --alarm-description "Burst of AI chat rate-limited responses" \
  --metric-name "RateLimited" \
  --namespace "Huntaze/AiChat" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

# Alarm: High premium usage (aggregate), adjust threshold
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-ai-chat-premium-usage-high" \
  --alarm-description "High premium model routing volume" \
  --metric-name "CompletedPremium" \
  --namespace "Huntaze/AiChat" \
  --statistic Sum \
  --period 3600 \
  --evaluation-periods 1 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

# Alarm: Event dedup skipped spikes (indicates noisy retries)
aws cloudwatch put-metric-alarm \
  --profile $PROFILE \
  --region $AWS_REGION \
  --alarm-name "huntaze-event-dedup-skipped-spike" \
  --alarm-description "High rate of event_dedup_skipped (duplicates/noisy retries)" \
  --metric-name "EventDedupSkipped" \
  --namespace "Huntaze/API" \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions $SNS_TOPIC_ARN \
  --treat-missing-data notBreaching

echo "✅ Metric filters and AI chat alarms configured."
