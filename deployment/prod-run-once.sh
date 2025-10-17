#!/usr/bin/env bash
set -euo pipefail

# Huntaze: One‑shot production bring‑up using current shell env
# - Uses existing AWS_* env (from SSO or temporary creds)
# - Sources deployment/prod-env.sh if present to populate app/env vars
# - Deploys SQS CloudWatch alarms (optional)
# - Bootstraps Secrets Manager entries (optional)
# - Starts PM2 consumer
# - Runs validation (health + enqueue sample)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[prod] Using AWS_REGION=${AWS_REGION:-us-east-1} AWS_PROFILE=${AWS_PROFILE:-}"

if [[ -z "${AWS_ACCESS_KEY_ID:-}" && -z "${AWS_PROFILE:-}" ]]; then
  echo "[warn] No AWS_PROFILE and no temporary AWS credentials detected. Use SSO or export credentials before running." >&2
fi

# 1) Load app env
if [[ -f "deployment/prod-env.sh" ]]; then
  echo "[prod] Sourcing deployment/prod-env.sh"
  source deployment/prod-env.sh
else
  echo "[info] You can copy deployment/prod-env.template.sh to deployment/prod-env.sh and fill secrets."
fi

# 2) Deploy CloudWatch alarms (optional)
if command -v aws >/dev/null 2>&1; then
  echo "[prod] Deploying CloudWatch SQS alarms stack (optional)"
  aws cloudformation deploy \
    --stack-name huntaze-sqs-alarms \
    --template-file infrastructure/cloudwatch-sqs-alarms.yaml \
    --parameter-overrides QueueName=${SQS_AI_QUEUE:-huntaze-ai-processing} DLQName=${SQS_AI_QUEUE:-huntaze-ai-processing}-dlq \
    --capabilities CAPABILITY_NAMED_IAM || true
else
  echo "[warn] aws CLI not found; skipping alarms deploy"
fi

# 3) Bootstrap secrets to AWS Secrets Manager (optional)
if command -v aws >/dev/null 2>&1; then
  echo "[prod] Bootstrapping platform secrets (optional)"
  bash scripts/aws/secrets-bootstrap.sh || true
fi

# 4) Start PM2 consumer
if command -v pm2 >/dev/null 2>&1; then
  echo "[prod] Starting PM2 ai-sqs-consumer"
  pm2 start ecosystem.config.js --only ai-sqs-consumer --env production || true
  # Ensure latest shell environment is applied to the running process
  pm2 restart ai-sqs-consumer --update-env || true
  pm2 save || true
else
  echo "[warn] pm2 not found; install pm2 or start via: node scripts/ai-sqs-consumer.js"
fi

# 5) Validation (health + enqueue sample)
if [[ -z "${HUNTAZE_API_BASE:-}" ]]; then
  echo "[warn] HUNTAZE_API_BASE not set; skipping remote validation"
else
  echo "[prod] Running validation against ${HUNTAZE_API_BASE}"
  bash scripts/prod-validate.sh || true
fi

echo "[prod] Done. Check logs: pm2 logs ai-sqs-consumer"
