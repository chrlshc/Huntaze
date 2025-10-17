#!/usr/bin/env bash
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ANALYTICS_TABLE="${ANALYTICS_TABLE:-huntaze-analytics-events}"
TOKENS_TABLE="${TOKENS_TABLE:-huntaze-oauth-tokens}"

echo "Region: $REGION"
echo "Analytics table: $ANALYTICS_TABLE"
echo "Tokens table: $TOKENS_TABLE"

table_exists() {
  aws dynamodb describe-table --table-name "$1" --region "$REGION" >/dev/null 2>&1
}

if ! table_exists "$ANALYTICS_TABLE"; then
  echo "Creating $ANALYTICS_TABLE..."
  aws dynamodb create-table \
    --table-name "$ANALYTICS_TABLE" \
    --attribute-definitions AttributeName=day,AttributeType=S AttributeName=sk,AttributeType=S \
    --key-schema AttributeName=day,KeyType=HASH AttributeName=sk,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"
else
  echo "$ANALYTICS_TABLE exists"
fi

echo "Enabling TTL on $ANALYTICS_TABLE (attribute 'ttl')..."
aws dynamodb update-time-to-live \
  --table-name "$ANALYTICS_TABLE" \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" \
  --region "$REGION" >/dev/null || true

if ! table_exists "$TOKENS_TABLE"; then
  echo "Creating $TOKENS_TABLE..."
  aws dynamodb create-table \
    --table-name "$TOKENS_TABLE" \
    --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=provider,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH AttributeName=provider,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION"
else
  echo "$TOKENS_TABLE exists"
fi

echo "Done."

