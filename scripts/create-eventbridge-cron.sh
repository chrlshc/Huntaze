#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   REGION=us-east-1 ACCOUNT_ID=123456789012 CRON_SECRET=your-secret \
#   ./scripts/create-eventbridge-cron.sh
#
# Creates:
#   - EventBridge Connection (x-cron-secret header)
#   - API Destination (GET https://huntaze.com/api/cron/refresh-oauth)
#   - IAM role to invoke API Destination
#   - Scheduled rule (rate 30 minutes) + target
#
# Requires:
#   - AWS CLI configured for the target account/region

REGION="${REGION:?REGION is required}"
ACCOUNT_ID="${ACCOUNT_ID:?ACCOUNT_ID is required}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET is required}"

CONN_NAME=${CONN_NAME:-HuntazeCronConnection}
DEST_NAME=${DEST_NAME:-HuntazeRefreshOAuth}
ROLE_NAME=${ROLE_NAME:-HuntazeEventBridgeInvokeApiDestination}
RULE_NAME=${RULE_NAME:-HuntazeRefreshOAuthEvery30m}
ENDPOINT=${ENDPOINT:-https://huntaze.com/api/cron/refresh-oauth}

echo "[1/5] Creating Connection $CONN_NAME"
aws events create-connection \
  --name "$CONN_NAME" \
  --authorization-type API_KEY \
  --auth-parameters "ApiKeyAuthParameters={ApiKeyName=x-cron-secret,ApiKeyValue=$CRON_SECRET}" \
  --region "$REGION" >/dev/null || echo "[info] Connection may already exist"

CONN_ARN="arn:aws:events:$REGION:$ACCOUNT_ID:connection/$CONN_NAME"

echo "[2/5] Creating API Destination $DEST_NAME"
aws events create-api-destination \
  --name "$DEST_NAME" \
  --connection-arn "$CONN_ARN" \
  --invocation-endpoint "$ENDPOINT" \
  --http-method GET \
  --invocation-rate-limit-per-second 1 \
  --region "$REGION" >/dev/null || echo "[info] API Destination may already exist"

DEST_ARN="arn:aws:events:$REGION:$ACCOUNT_ID:api-destination/$DEST_NAME"

echo "[3/5] Creating IAM role $ROLE_NAME"
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"events.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null || echo "[info] Role may already exist"

echo "[4/5] Attaching inline policy to role"
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name InvokeApiDestinationPolicy \
  --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"events:InvokeApiDestination\",\"Resource\":\"$DEST_ARN/*\"}]}" >/dev/null

echo "[5/5] Creating schedule rule + target"
aws events put-rule \
  --name "$RULE_NAME" \
  --schedule-expression "rate(30 minutes)" \
  --region "$REGION" >/dev/null || true

aws events put-targets \
  --rule "$RULE_NAME" \
  --targets "[{\"Id\":\"$DEST_NAME\",\"Arn\":\"$DEST_ARN\",\"RoleArn\":\"arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME\"}]" \
  --region "$REGION" >/dev/null

echo "Done. Verify in EventBridge console: Connection=$CONN_NAME, Destination=$DEST_NAME, Rule=$RULE_NAME"

