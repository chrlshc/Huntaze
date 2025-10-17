#!/usr/bin/env bash
set -euo pipefail

# Deploy and wire the S3 -> Lambda ingestion for OnlyFans worker results
# Requires: AWS CLI, zip, and an existing S3 bucket with worker outputs under jobs/*/result.json

REGION=${REGION:-us-east-1}
ACCOUNT_ID=${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo 000000000000)}
FUNC_NAME=${FUNC_NAME:-ingest-of-results}
ROLE_NAME=${ROLE_NAME:-ofIngestRole}
BUCKET=${BUCKET:?BUCKET is required (S3 bucket where worker writes results)}
ANALYTICS_TABLE=${ANALYTICS_TABLE:-huntaze-analytics-events}
USERS_TABLE=${USERS_TABLE:-${USERS_TABLE:-huntaze-users}}
OF_AGGREGATES_ENDPOINT=${OF_AGGREGATES_ENDPOINT:-}
CRON_SECRET=${CRON_SECRET:-}

echo "[info] Region: $REGION  Account: $ACCOUNT_ID  Bucket: $BUCKET"
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
  # IAM can take a few seconds to propagate; wait before using the role
  aws iam wait role-exists --role-name "$ROLE_NAME" || true
  sleep 8
fi

echo "[step] Attach inline policy for S3 read + DynamoDB write"
cat > /tmp/${ROLE_NAME}-policy.json <<JSON
{ "Version":"2012-10-17", "Statement": [
  { "Effect":"Allow", "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::${BUCKET}/jobs/*/result.json"] },
  { "Effect":"Allow", "Action": ["dynamodb:PutItem","dynamodb:UpdateItem"],
    "Resource": [
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${ANALYTICS_TABLE}",
      "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/${USERS_TABLE}"
    ] },
  { "Effect":"Allow", "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
    "Resource": ["arn:aws:logs:${REGION}:${ACCOUNT_ID}:*"] }
]}
JSON
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name OfIngestPolicy --policy-document file:///tmp/${ROLE_NAME}-policy.json >/dev/null

echo "[step] Package Lambda"
ZIP_FILE=/tmp/${FUNC_NAME}.zip
rm -f "$ZIP_FILE"; (cd lambda/ingest-of-results && zip -q -r "$ZIP_FILE" index.js)

echo "[step] Create/Update Lambda"
set +e
aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" >/dev/null 2>&1
EXISTS=$?
set -e
if [ $EXISTS -ne 0 ]; then
  aws lambda create-function --function-name "$FUNC_NAME" --runtime nodejs20.x --role "$ROLE_ARN" \
    --handler index.handler --zip-file fileb://"$ZIP_FILE" --timeout 30 --memory-size 256 --region "$REGION" >/dev/null
else
  aws lambda update-function-code --function-name "$FUNC_NAME" --zip-file fileb://"$ZIP_FILE" --region "$REGION" >/dev/null
fi

echo "[step] Update env"
aws lambda update-function-configuration --function-name "$FUNC_NAME" --region "$REGION" \
  --environment "Variables={ANALYTICS_TABLE=${ANALYTICS_TABLE},USERS_TABLE=${USERS_TABLE},OF_AGGREGATES_ENDPOINT=${OF_AGGREGATES_ENDPOINT},CRON_SECRET=${CRON_SECRET}}" >/dev/null || true

echo "[step] Grant S3 -> Lambda invoke permission"
aws lambda add-permission --function-name "$FUNC_NAME" --statement-id AllowS3Invoke \
  --action lambda:InvokeFunction --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::${BUCKET}" --region "$REGION" >/dev/null 2>&1 || true

echo "[step] Configure S3 notifications (prefix=jobs/, suffix=result.json)"
# Fetch existing notification, merge if necessary (simple overwrite here)
cat > /tmp/${FUNC_NAME}-notif.json <<JSON
{
  "LambdaFunctionConfigurations": [
    {
      "Id": "of-jobs-result-json",
      "LambdaFunctionArn": "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNC_NAME}",
      "Events": ["s3:ObjectCreated:Put","s3:ObjectCreated:Copy","s3:ObjectCreated:CompleteMultipartUpload"],
      "Filter": {
        "Key": {
          "FilterRules": [
            { "Name": "prefix", "Value": "jobs/" },
            { "Name": "suffix", "Value": "result.json" }
          ]
        }
      }
    }
  ]
}
JSON
aws s3api put-bucket-notification-configuration --bucket "$BUCKET" --notification-configuration file:///tmp/${FUNC_NAME}-notif.json >/dev/null

echo "[ok] Deployed and wired Lambda $FUNC_NAME to S3 bucket $BUCKET"
