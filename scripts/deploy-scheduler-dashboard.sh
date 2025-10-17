#!/usr/bin/env bash
set -euo pipefail

# Create/Update a CloudWatch dashboard + key alarms for scheduler components
# Vars:
#   ENV=production
#   REGION=us-east-1
#   RULE_NAME=huntaze-monthly-billing-production
#   DLQ_NAME=monthly-billing-dlq-production
#   FN_INGEST=ingest-of-results
#   FN_REFRESH=refresh-analytics-snapshots
#   DASHBOARD_NAME=Huntaze-Scheduler

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}
RULE_NAME=${RULE_NAME:-huntaze-monthly-billing-${ENV}}
DLQ_NAME=${DLQ_NAME:-monthly-billing-dlq-${ENV}}
FN_INGEST=${FN_INGEST:-ingest-of-results}
FN_REFRESH=${FN_REFRESH:-refresh-analytics-snapshots}
DASHBOARD_NAME=${DASHBOARD_NAME:-Huntaze-Scheduler}
USERS_TABLE=${USERS_TABLE:-huntaze-users}

cat > /tmp/${DASHBOARD_NAME}.json <<JSON
{
  "widgets": [
    {
      "type": "metric", "x": 0, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "EventBridge - ${RULE_NAME}",
        "metrics": [
          [ "AWS/Events", "Invocations", "RuleName", "${RULE_NAME}" ],
          [ ".", "FailedInvocations", ".", "." ],
          [ ".", "InvocationsSentToDLQ", ".", "." ]
        ],
        "stat": "Sum", "period": 300, "region": "${REGION}", "view": "timeSeries"
      }
    },
    {
      "type": "metric", "x": 12, "y": 0, "width": 12, "height": 6,
      "properties": {
        "title": "Lambda - Errors & p95 (ingest, refresh)",
        "metrics": [
          [ "AWS/Lambda", "Errors", "FunctionName", "${FN_INGEST}" ],
          [ ".", "Duration", ".", ".", { "stat": "p95", "yAxis": "right" } ],
          [ ".", "Errors", ".", "${FN_REFRESH}" ],
          [ ".", "Duration", ".", ".", { "stat": "p95", "yAxis": "right" } ]
        ],
        "period": 300, "region": "${REGION}", "view": "timeSeries"
      }
    },
    {
      "type": "metric", "x": 0, "y": 6, "width": 12, "height": 6,
      "properties": {
        "title": "SQS DLQ - ${DLQ_NAME}",
        "metrics": [
          [ "AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", "${DLQ_NAME}" ],
          [ ".", "ApproximateAgeOfOldestMessage", ".", ".", { "yAxis": "right" } ]
        ],
        "period": 300, "region": "${REGION}", "view": "timeSeries"
      }
    },
    {
      "type": "metric", "x": 0, "y": 12, "width": 24, "height": 6,
      "properties": {
        "title": "DynamoDB GSI Read RCUs - ${USERS_TABLE}",
        "metrics": [
          [ "AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${USERS_TABLE}", "GlobalSecondaryIndexName", "ActiveSubscribers" ],
          [ ".", ".", "TableName", ".", "GlobalSecondaryIndexName", "ByStripeCustomerId" ],
          [ ".", ".", "TableName", ".", "GlobalSecondaryIndexName", "ByOnlyfansUserId" ]
        ],
        "stat": "Sum", "period": 300, "region": "${REGION}", "view": "timeSeries"
      }
    },
    {
      "type": "metric", "x": 0, "y": 18, "width": 24, "height": 6,
      "properties": {
        "title": "DynamoDB GSI ThrottledRequests - ${USERS_TABLE}",
        "metrics": [
          [ "AWS/DynamoDB", "ThrottledRequests", "TableName", "${USERS_TABLE}", "GlobalSecondaryIndexName", "ActiveSubscribers" ],
          [ ".", ".", "TableName", ".", "GlobalSecondaryIndexName", "ByStripeCustomerId" ],
          [ ".", ".", "TableName", ".", "GlobalSecondaryIndexName", "ByOnlyfansUserId" ]
        ],
        "stat": "Sum", "period": 300, "region": "${REGION}", "view": "timeSeries"
      }
    }
  ]
}
JSON

aws cloudwatch put-dashboard --dashboard-name "${DASHBOARD_NAME}" \
  --dashboard-body file:///tmp/${DASHBOARD_NAME}.json --region "${REGION}" >/dev/null

echo "[step] Alarms: EventBridge FailedInvocations > 0"
aws cloudwatch put-metric-alarm \
  --alarm-name evb-${ENV}-monthly-failedinvocations \
  --namespace AWS/Events --metric-name FailedInvocations \
  --dimensions Name=RuleName,Value=${RULE_NAME} \
  --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --region "${REGION}" >/dev/null

echo "[step] Alarms: SQS DLQ not empty"
aws cloudwatch put-metric-alarm \
  --alarm-name sqs-${ENV}-monthly-dlq-not-empty \
  --namespace AWS/SQS --metric-name ApproximateNumberOfMessagesVisible \
  --dimensions Name=QueueName,Value=${DLQ_NAME} \
  --statistic Average --period 300 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --region "${REGION}" >/dev/null

echo "[step] Alarms: Lambda ingest errors > 0"
aws cloudwatch put-metric-alarm \
  --alarm-name lambda-${ENV}-ingest-errors \
  --namespace AWS/Lambda --metric-name Errors \
  --dimensions Name=FunctionName,Value=${FN_INGEST} \
  --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --region "${REGION}" >/dev/null

echo "[ok] Dashboard ${DASHBOARD_NAME} and alarms created/updated"
