#!/usr/bin/env bash
set -euo pipefail

REGION=${REGION:-us-east-1}
ACCOUNT_ID=${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 000000000000)}
FUNC_NAME=${FUNC_NAME:-refresh-analytics-snapshots}
ROLE_NAME=${ROLE_NAME:-refreshAnalyticsRole}
TABLE_TOKENS=${TABLE_TOKENS:-huntaze-oauth-tokens}
TABLE_ANALYTICS=${TABLE_ANALYTICS:-huntaze-analytics-events}
RULE_NAME=${RULE_NAME:-refresh-analytics-snapshots-6h}
SCHEDULE_EXPR=${SCHEDULE_EXPR:-"rate(6 hours)"}

echo "[info] Region: $REGION  Account: $ACCOUNT_ID"

aws sts get-caller-identity >/dev/null

echo "[step] Ensure IAM role"
set +e
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text 2>/dev/null)
set -e
if [ -z "${ROLE_ARN:-}" ] || [ "$ROLE_ARN" = "None" ]; then
  cat > /tmp/${ROLE_NAME}-trust.json <<'JSON'
{ "Version":"2012-10-17", "Statement":[{ "Effect":"Allow", "Principal": {"Service":"lambda.amazonaws.com"}, "Action":"sts:AssumeRole" }]}
JSON
  ROLE_ARN=$(aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file:///tmp/${ROLE_NAME}-trust.json --query Role.Arn --output text)
  aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >/dev/null
fi

echo "[step] Attach inline policy for DynamoDB"
cat > /tmp/${ROLE_NAME}-policy.json <<JSON
{ "Version":"2012-10-17", "Statement": [
  { "Effect":"Allow", "Action": ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:BatchWriteItem"],
    "Resource": [
      "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_TOKENS",
      "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_ANALYTICS"
    ] },
  { "Effect":"Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
    "Resource": ["arn:aws:logs:$REGION:$ACCOUNT_ID:*"] }
]}
JSON
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name RefreshAnalyticsPolicy --policy-document file:///tmp/${ROLE_NAME}-policy.json >/dev/null

echo "[step] Package Lambda"
ZIP_FILE=/tmp/${FUNC_NAME}.zip
rm -f "$ZIP_FILE"; (cd lambda/refresh-analytics-snapshots && zip -q -r "$ZIP_FILE" index.py)

echo "[step] Create/Update Lambda"
set +e
aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" >/dev/null 2>&1
EXISTS=$?
set -e
if [ $EXISTS -ne 0 ]; then
  aws lambda create-function --function-name "$FUNC_NAME" --runtime python3.11 --role "$ROLE_ARN" \
    --handler index.lambda_handler --zip-file fileb://"$ZIP_FILE" --timeout 60 --memory-size 256 --region "$REGION" >/dev/null
else
  aws lambda update-function-code --function-name "$FUNC_NAME" --zip-file fileb://"$ZIP_FILE" --region "$REGION" >/dev/null
fi

echo "[step] Update env"
aws lambda update-function-configuration --function-name "$FUNC_NAME" --region "$REGION" \
  --environment "Variables={TABLE_TOKENS=$TABLE_TOKENS,TABLE_ANALYTICS=$TABLE_ANALYTICS,ANALYTICS_TTL_DAYS=60}" >/dev/null || true

echo "[step] Schedule rule $RULE_NAME ($SCHEDULE_EXPR)"
aws events put-rule --name "$RULE_NAME" --schedule-expression "$SCHEDULE_EXPR" --region "$REGION" >/dev/null
TARGET_ARN=$(aws lambda get-function --function-name "$FUNC_NAME" --query Configuration.FunctionArn --output text --region "$REGION")
aws events put-targets --rule "$RULE_NAME" --targets "Id"="1","Arn"="$TARGET_ARN" --region "$REGION" >/dev/null || true
aws lambda add-permission --function-name "$FUNC_NAME" --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction --principal events.amazonaws.com \
  --source-arn "arn:aws:events:$REGION:$ACCOUNT_ID:rule/$RULE_NAME" --region "$REGION" >/dev/null 2>&1 || true

echo "[step] Invoke once (smoke)"
aws lambda invoke --function-name "$FUNC_NAME" --payload '{}' /tmp/${FUNC_NAME}-invoke.json --region "$REGION" >/dev/null || true
echo "[ok] Deployed and scheduled $FUNC_NAME"

