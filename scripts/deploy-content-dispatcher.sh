#!/usr/bin/env bash
set -euo pipefail

# Deploy the content-dispatcher Lambda and wire it to an EventBridge scheduled rule
# Requires: POSTS_TABLE deployed, SQS queues deployed

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}
ACCOUNT_ID=${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
FUNC_NAME=${FUNC_NAME:-content-dispatcher}
ROLE_NAME=${ROLE_NAME:-ContentDispatcherRole}
SCHEDULE_EXPR=${SCHEDULE_EXPR:-rate(2 minutes)}

POSTS_TABLE=${POSTS_TABLE:-huntaze-posts}

# Queue URLs (export or auto-discover by name)
Q_TWITTER=${Q_TWITTER:-$(aws sqs get-queue-url --queue-name publisher-twitter-${ENV} --query QueueUrl --output text 2>/dev/null || echo '')}
Q_INSTAGRAM=${Q_INSTAGRAM:-$(aws sqs get-queue-url --queue-name publisher-instagram-${ENV} --query QueueUrl --output text 2>/dev/null || echo '')}
Q_TIKTOK=${Q_TIKTOK:-$(aws sqs get-queue-url --queue-name publisher-tiktok-${ENV} --query QueueUrl --output text 2>/dev/null || echo '')}
Q_REDDIT=${Q_REDDIT:-$(aws sqs get-queue-url --queue-name publisher-reddit-${ENV} --query QueueUrl --output text 2>/dev/null || echo '')}

echo "[info] Region=$REGION Env=$ENV Account=$ACCOUNT_ID"

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
  sleep 5
fi

echo "[step] Attach inline policy"
cat > /tmp/${ROLE_NAME}-policy.json <<JSON
{ "Version":"2012-10-17", "Statement": [
  { "Effect":"Allow", "Action": ["dynamodb:Query","dynamodb:BatchGetItem","dynamodb:GetItem"],
    "Resource": [
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}/index/*",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}/*"
    ] },
  { "Effect":"Allow", "Action": ["sqs:SendMessage","sqs:SendMessageBatch"],
    "Resource": [
      ${Q_TWITTER:+"arn:aws:sqs:${REGION}:${ACCOUNT_ID}:publisher-twitter-${ENV}",}
      ${Q_INSTAGRAM:+"arn:aws:sqs:${REGION}:${ACCOUNT_ID}:publisher-instagram-${ENV}",}
      ${Q_TIKTOK:+"arn:aws:sqs:${REGION}:${ACCOUNT_ID}:publisher-tiktok-${ENV}",}
      ${Q_REDDIT:+"arn:aws:sqs:${REGION}:${ACCOUNT_ID}:publisher-reddit-${ENV}"}
    ].filter(Boolean) }
]}
JSON
# jq is safer but keep simple: if JSON may break due to empty, fallback to wildcard for publisher-* queues
if ! jq empty /tmp/${ROLE_NAME}-policy.json >/dev/null 2>&1; then
cat > /tmp/${ROLE_NAME}-policy.json <<JSON
{ "Version":"2012-10-17", "Statement": [
  { "Effect":"Allow", "Action": ["dynamodb:Query","dynamodb:BatchGetItem","dynamodb:GetItem"],
    "Resource": [
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}/index/*",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${POSTS_TABLE}/*"
    ] },
  { "Effect":"Allow", "Action": ["sqs:SendMessage","sqs:SendMessageBatch"],
    "Resource": "arn:aws:sqs:${REGION}:${ACCOUNT_ID}:publisher-*-${ENV}"
  }
]}
JSON
fi
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name ContentDispatcherPolicy --policy-document file:///tmp/${ROLE_NAME}-policy.json >/dev/null

echo "[step] Package Lambda"
ZIP=/tmp/${FUNC_NAME}.zip
rm -f "$ZIP"; (cd lambda/content-dispatcher && zip -q -r "$ZIP" index.js)

echo "[step] Create/Update Lambda"
set +e
aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" >/dev/null 2>&1
EXISTS=$?
set -e
if [ $EXISTS -ne 0 ]; then
  aws lambda create-function --function-name "$FUNC_NAME" --runtime nodejs20.x --role "$ROLE_ARN" \
    --handler index.handler --zip-file fileb://"$ZIP" --timeout 30 --memory-size 256 --region "$REGION" >/dev/null
else
  aws lambda update-function-code --function-name "$FUNC_NAME" --zip-file fileb://"$ZIP" --region "$REGION" >/dev/null
fi

echo "[step] Update Lambda env"
ENV_JSON=$(jq -n --arg POSTS_TABLE "$POSTS_TABLE" \
  --arg Q_TWITTER "$Q_TWITTER" --arg Q_INSTAGRAM "$Q_INSTAGRAM" --arg Q_TIKTOK "$Q_TIKTOK" --arg Q_REDDIT "$Q_REDDIT" '
  { Variables: ( { POSTS_TABLE: $POSTS_TABLE }
    + (if $Q_TWITTER != "" then { Q_TWITTER: $Q_TWITTER } else {} end)
    + (if $Q_INSTAGRAM != "" then { Q_INSTAGRAM: $Q_INSTAGRAM } else {} end)
    + (if $Q_TIKTOK != "" then { Q_TIKTOK: $Q_TIKTOK } else {} end)
    + (if $Q_REDDIT != "" then { Q_REDDIT: $Q_REDDIT } else {} end)
  ) }
')
aws lambda update-function-configuration --function-name "$FUNC_NAME" --region "$REGION" \
  --environment "$ENV_JSON" >/dev/null

echo "[step] Ensure EventBridge rule"
RULE_NAME=content-dispatcher-${ENV}
set +e
aws events describe-rule --name "$RULE_NAME" --region "$REGION" >/dev/null 2>&1 || \
aws events put-rule --name "$RULE_NAME" --schedule-expression "$SCHEDULE_EXPR" --state ENABLED --region "$REGION" >/dev/null
set -e

echo "[step] Lambda invoke permission for EventBridge"
aws lambda add-permission --function-name "$FUNC_NAME" --statement-id evb-dispatcher \
  --action lambda:InvokeFunction --principal events.amazonaws.com \
  --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${RULE_NAME}" --region "$REGION" >/dev/null 2>&1 || true

echo "[step] Target wiring"
aws events put-targets --rule "$RULE_NAME" --region "$REGION" --targets \
  "Id=dispatcher-${ENV},Arn=arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNC_NAME}" >/dev/null

echo "[ok] content-dispatcher deployed and wired"
