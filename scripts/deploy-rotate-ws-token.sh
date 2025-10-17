#!/usr/bin/env bash
set -euo pipefail

# Deploys the rotate-ws-token Lambda and schedules hourly rotation via EventBridge.
# Requires: AWS CLI, zip, jq

REGION=${REGION:-us-east-1}
ACCOUNT_ID=${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 317805897534)}
FUNC_NAME=${FUNC_NAME:-rotate-ws-token}
ROLE_NAME=${ROLE_NAME:-rotateWsTokenRole}
SECRET_ID=${SECRET_ID:-onlyfans-ws}
CLUSTER=${CLUSTER:-huntaze-cluster}
SERVICE=${SERVICE:-onlyfans-scraper}
AGENT_ID=${AGENT_ID:-huntaze-of-scrap}
TTL_SECONDS=${TTL_SECONDS:-3600}
SCHEDULE_EXPR=${SCHEDULE_EXPR:-"rate(1 hour)"}
RULE_NAME=${RULE_NAME:-rotate-ws-token-hourly}

echo "[info] Region:    $REGION"
echo "[info] Account:   $ACCOUNT_ID"
echo "[info] Function:  $FUNC_NAME"
echo "[info] Role:      $ROLE_NAME"
echo "[info] Secret:    $SECRET_ID"
echo "[info] Cluster:   $CLUSTER"
echo "[info] Service:   $SERVICE"
echo "[info] AgentId:   $AGENT_ID"

aws sts get-caller-identity >/dev/null

echo "[step] Ensure IAM role for Lambda"
set +e
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text 2>/dev/null)
set -e
if [ -z "${ROLE_ARN:-}" ] || [ "$ROLE_ARN" = "None" ]; then
  cat > /tmp/${ROLE_NAME}-trust.json <<'JSON'
{ "Version":"2012-10-17", "Statement":[{ "Effect":"Allow", "Principal": {"Service":"lambda.amazonaws.com"}, "Action":"sts:AssumeRole" }]}
JSON
  ROLE_ARN=$(aws iam create-role --role-name "$ROLE_NAME" \
    --assume-role-policy-document file:///tmp/${ROLE_NAME}-trust.json \
    --query Role.Arn --output text)
  echo "[ok] Created role $ROLE_NAME"
fi

echo "[step] Attach inline policy (SecretsManager + ECS + Logs)"
cat > /tmp/${ROLE_NAME}-policy.json <<JSON
{ "Version":"2012-10-17", "Statement": [
  { "Effect":"Allow", "Action": ["secretsmanager:PutSecretValue", "secretsmanager:GetSecretValue"],
    "Resource": ["arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:$SECRET_ID*"] },
  { "Effect":"Allow", "Action": ["ecs:UpdateService", "ecs:DescribeServices"],
    "Resource": ["*"] },
  { "Effect":"Allow", "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": ["arn:aws:logs:$REGION:$ACCOUNT_ID:*"] }
]}
JSON
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name RotateWsTokenPolicy \
  --policy-document file:///tmp/${ROLE_NAME}-policy.json >/dev/null

echo "[step] Package Lambda"
LAMBDA_DIR="lambda/rotate-ws-token"
ZIP_FILE="/tmp/${FUNC_NAME}.zip"
rm -f "$ZIP_FILE"
pushd "$LAMBDA_DIR" >/dev/null
zip -q -r "$ZIP_FILE" .
popd >/dev/null

echo "[step] Create or update Lambda function"
set +e
aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" >/dev/null 2>&1
EXISTS=$?
set -e
if [ $EXISTS -ne 0 ]; then
  aws lambda create-function \
    --function-name "$FUNC_NAME" \
    --runtime nodejs18.x \
    --role "$ROLE_ARN" \
    --handler index.handler \
    --zip-file fileb://"$ZIP_FILE" \
    --timeout 30 \
    --memory-size 128 \
    --region "$REGION" >/dev/null
  echo "[ok] Created function $FUNC_NAME"
else
  aws lambda update-function-code --function-name "$FUNC_NAME" --zip-file fileb://"$ZIP_FILE" --region "$REGION" >/dev/null
  echo "[ok] Updated code for $FUNC_NAME"
fi

echo "[step] Update Lambda environment"
ENV_VARS=$(jq -n --arg ws "$WS_JWT_SECRET" \
  --arg sid "$SECRET_ID" --arg cl "$CLUSTER" --arg sv "$SERVICE" --arg aid "$AGENT_ID" --arg ttl "$TTL_SECONDS" \
  '{WS_JWT_SECRET:$ws, SECRET_ID:$sid, CLUSTER:$cl, SERVICE:$sv, AGENT_ID:$aid, TTL_SECONDS:$ttl, AWS_NODEJS_CONNECTION_REUSE_ENABLED:"1"}')
aws lambda update-function-configuration --function-name "$FUNC_NAME" \
  --environment "Variables=$ENV_VARS" --region "$REGION" >/dev/null

echo "[step] Create/Update EventBridge rule: $RULE_NAME ($SCHEDULE_EXPR)"
aws events put-rule --name "$RULE_NAME" --schedule-expression "$SCHEDULE_EXPR" --region "$REGION" >/dev/null

TARGET_ARN=$(aws lambda get-function --function-name "$FUNC_NAME" --query Configuration.FunctionArn --output text --region "$REGION")
aws events put-targets --rule "$RULE_NAME" --targets "Id"="1","Arn"="$TARGET_ARN" --region "$REGION" >/dev/null || true

echo "[step] Allow EventBridge to invoke Lambda"
set +e
aws lambda add-permission \
  --function-name "$FUNC_NAME" \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:$REGION:$ACCOUNT_ID:rule/$RULE_NAME" \
  --region "$REGION" >/dev/null 2>&1 || true
set -e

echo "[step] Invoke once for smoke test"
aws lambda invoke --function-name "$FUNC_NAME" --payload '{}' /tmp/${FUNC_NAME}-invoke.json --region "$REGION" >/dev/null
echo "[ok] Rotation Lambda deployed and invoked."

echo "[tip] Check logs: aws logs tail /aws/lambda/$FUNC_NAME --since 10m --region $REGION"

