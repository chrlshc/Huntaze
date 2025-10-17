#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   AWS_REGION=us-east-1 PUBLISH_STACK_NAME=YourPublishStack \
#   node scripts/env-set.mjs .env.local NEXT_PUBLIC_APP_URL https://app.huntaze.com
#   bash scripts/fill-env-from-aws.sh

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

REGION="${AWS_REGION:-us-east-1}"
STACK="${PUBLISH_STACK_NAME:-}"

echo "Region: $REGION"
echo "Env file: $ENV_FILE"

ensure() {
  node "$ROOT_DIR/scripts/env-set.mjs" "$ENV_FILE" "$1" "$2"
}

# Ensure core defaults
ensure AWS_REGION "$REGION"
ensure ANALYTICS_TABLE "${ANALYTICS_TABLE:-huntaze-analytics-events}"
ensure TOKENS_TABLE "${TOKENS_TABLE:-huntaze-oauth-tokens}"

# Fetch SQS publisher URLs from a CloudFormation stack if provided
if [[ -n "$STACK" ]]; then
  echo "Fetching SQS publisher URLs from stack: $STACK"
  IG_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`InstagramQueueUrl`].OutputValue' --output text 2>/dev/null || true)
  TK_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`TikTokQueueUrl`].OutputValue' --output text 2>/dev/null || true)
  RD_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`RedditQueueUrl`].OutputValue' --output text 2>/dev/null || true)

  [[ -n "$IG_URL" && "$IG_URL" != "None" ]] && ensure SQS_PUBLISHER_INSTAGRAM_URL "$IG_URL"
  [[ -n "$TK_URL" && "$TK_URL" != "None" ]] && ensure SQS_PUBLISHER_TIKTOK_URL "$TK_URL"
  [[ -n "$RD_URL" && "$RD_URL" != "None" ]] && ensure SQS_PUBLISHER_REDDIT_URL "$RD_URL"
fi

echo "Done updating $ENV_FILE"

