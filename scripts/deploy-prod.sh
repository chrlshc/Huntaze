#!/usr/bin/env bash
set -euo pipefail

# Huntaze production deployment wrapper
# - Uses AWS SSO profile via AWS_PROFILE
# - No secrets are persisted in this file (expects env vars)
# - Mirrors the manual block you shared, with guardrails and region pinning

usage() {
  cat <<'USAGE'
Usage:
  ENV=production REGION=us-east-1 ACCOUNT_ID=317805897534 \
  CronEndpoint=https://huntaze.com/api/cron/monthly-billing \
  CRON_SECRET=... RESULTS_BUCKET=huntaze-scraper-results \
  OF_AGGREGATES_ENDPOINT=https://huntaze.com/api/ingest/of-aggregates \
  AWS_PROFILE=huntaze-prod \
  bash scripts/deploy-prod.sh

Notes:
  - Authenticate first: aws sso login --profile ${AWS_PROFILE:-huntaze-prod}
  - This script does not echo secrets; avoid putting secrets in shell history.
  - CloudFormation deploys use --no-fail-on-empty-changeset for idempotence.
USAGE
}

need() { command -v "$1" >/dev/null 2>&1 || { echo "[error] Missing dependency: $1" >&2; exit 1; }; }
require() { [ -n "${!1:-}" ] || { echo "[error] Missing required env: $1" >&2; usage; exit 1; }; }

need aws
need jq
need curl

# Required environment
ENV=${ENV:-production}
REGION=${REGION:-us-east-1}
ACCOUNT_ID=${ACCOUNT_ID:-}
CronEndpoint=${CronEndpoint:-https://huntaze.com/api/cron/monthly-billing}
CRON_SECRET=${CRON_SECRET:-}
RESULTS_BUCKET=${RESULTS_BUCKET:-}
OF_AGGREGATES_ENDPOINT=${OF_AGGREGATES_ENDPOINT:-}

require ENV
require REGION
require CronEndpoint
require CRON_SECRET
require RESULTS_BUCKET
require OF_AGGREGATES_ENDPOINT

# Optional, but validate if provided
if [ -z "${ACCOUNT_ID}" ]; then
  echo "[info] ACCOUNT_ID not provided, discovering via STS..."
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
fi

echo "[info] Using profile: ${AWS_PROFILE:-default} | Region: ${REGION} | Account: ${ACCOUNT_ID}"

# Verify required files exist
[ -f infrastructure/users-table.yaml ] || { echo "[error] missing infrastructure/users-table.yaml"; exit 1; }
[ -f infrastructure/eventbridge-monthly-billing.yaml ] || { echo "[error] missing infrastructure/eventbridge-monthly-billing.yaml"; exit 1; }
[ -f infrastructure/of-aggregates-table.yaml ] || { echo "[error] missing infrastructure/of-aggregates-table.yaml"; exit 1; }
[ -f scripts/deploy-of-ingestor.sh ] || { echo "[error] missing scripts/deploy-of-ingestor.sh"; exit 1; }
[ -f scripts/deploy-scheduler-dashboard.sh ] || { echo "[error] missing scripts/deploy-scheduler-dashboard.sh"; exit 1; }

echo "[check] STS identity (should be Account=${ACCOUNT_ID})"
aws sts get-caller-identity --output json | jq '{Account,Arn}'

echo "\n[1] Create Change Set for users table (GSIs)"
CS="users-gsis-$(date +%s)"
aws cloudformation create-change-set \
  --stack-name huntaze-users-table \
  --change-set-name "$CS" \
  --template-body file://infrastructure/users-table.yaml \
  --change-set-type UPDATE \
  --region "$REGION" >/dev/null || true

echo "[1a] Describe Change Set (may be empty if no changes)"
set +e
aws cloudformation describe-change-set \
  --stack-name huntaze-users-table \
  --change-set-name "$CS" \
  --region "$REGION" --output json | jq '{Status,StatusReason,Changes: [.Changes[]?.ResourceChange.ResourceType]}' || true
set -e

echo "\n[2] Deploy monthly billing EventBridge rule (DLQ + retries)"
aws cloudformation deploy \
  --template-file infrastructure/eventbridge-monthly-billing.yaml \
  --stack-name huntaze-monthly-billing \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment="$ENV" CronSecret="$CRON_SECRET" CronEndpoint="$CronEndpoint" \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo "\n[3] Deploy OF aggregates table"
aws cloudformation deploy \
  --template-file infrastructure/of-aggregates-table.yaml \
  --stack-name huntaze-of-aggregates \
  --parameter-overrides TableName=huntaze-of-aggregates \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo "\n[4] Deploy S3 -> Lambda ingestor and wire notifications"
BUCKET="$RESULTS_BUCKET" CRON_SECRET="$CRON_SECRET" \
OF_AGGREGATES_ENDPOINT="$OF_AGGREGATES_ENDPOINT" \
REGION="$REGION" ACCOUNT_ID="$ACCOUNT_ID" \
bash scripts/deploy-of-ingestor.sh

echo "\n[5] Create dashboard + alarms (EventBridge, DLQ, Lambda)"
ENV="$ENV" REGION="$REGION" \
RULE_NAME="huntaze-monthly-billing-$ENV" \
DLQ_NAME="monthly-billing-dlq-$ENV" \
FN_INGEST="ingest-of-results" \
FN_REFRESH="refresh-analytics-snapshots" \
bash scripts/deploy-scheduler-dashboard.sh

echo "\n[post] Verify EventBridge target configuration"
aws events list-targets-by-rule --region "$REGION" --rule "huntaze-monthly-billing-$ENV" \
  --query "Targets[0].{Retry:RetryPolicy,DLQ:DeadLetterConfig}"

echo "\n[post] Verify Users table GSIs (ActiveSubscribers, ByStripeCustomerId, ByOnlyfansUserId)"
aws dynamodb describe-table --table-name huntaze-users \
  --query "Table.GlobalSecondaryIndexes[?contains(['ActiveSubscribers','ByStripeCustomerId','ByOnlyfansUserId'],IndexName)].{Index:IndexName,Status:IndexStatus}"

echo "\n[smoke] Trigger S3 -> Lambda ingest with a sample object"
printf '%s' '{"userId":"u1","month":"2025-10","gross":1000,"net":900,"fees":100,"currency":"USD"}' \
  | aws s3 cp - "s3://$RESULTS_BUCKET/jobs/test/result.json"

echo "\n[smoke] POST aggregates endpoint with secret header (response shown below)"
curl -s -X POST "$OF_AGGREGATES_ENDPOINT" \
  -H "x-cron-secret: $CRON_SECRET" -H "content-type: application/json" \
  -d '{"userId":"u1","month":"2025-10","gross":1000,"net":900,"fees":100,"currency":"USD","source":{"bucket":"b","key":"k","etag":"e"}}' | jq .

echo "\n[ok] Deployment flow completed"

