#!/usr/bin/env bash
set -euo pipefail

# Update Amplify branch environment variables for Azure OpenAI
# - Requires: aws cli v2, and valid AWS credentials (AWS_PROFILE or AWS_* env)
# - Does NOT embed secrets; pass AZURE_OPENAI_API_KEY via env
#
# Usage:
#   export AWS_PROFILE=huntaze-admin-sso  # or configure AWS_* creds
#   export AZURE_OPENAI_API_KEY=...       # required
#   scripts/amplify/set-azure-env.sh \
#     --app-id d33l77zi1h78ce \
#     --branch prod \
#     --endpoint https://huntaze-ai-hub-eus2.openai.azure.com \
#     --deployment gpt-4o-mini \
#     --api-version 2024-10-21 \
#     --enable-azure 1 \
#     --start-job

APP_ID="${APP_ID:-d33l77zi1h78ce}"
BRANCH="${BRANCH:-prod}"
ENDPOINT="${AZURE_OPENAI_ENDPOINT:-https://huntaze-ai-hub-eus2.openai.azure.com}"
DEPLOYMENT="${AZURE_OPENAI_DEPLOYMENT:-gpt-4o-mini}"
API_VERSION="${AZURE_OPENAI_API_VERSION:-2024-10-21}"
ENABLE_AZURE="${ENABLE_AZURE_AI:-1}"
START_JOB=0
USE_RESPONSES="${USE_AZURE_RESPONSES:-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-id) APP_ID="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --endpoint) ENDPOINT="$2"; shift 2 ;;
    --deployment) DEPLOYMENT="$2"; shift 2 ;;
    --api-version) API_VERSION="$2"; shift 2 ;;
    --enable-azure) ENABLE_AZURE="$2"; shift 2 ;;
    --start-job) START_JOB=1; shift ;;
    --use-responses) USE_RESPONSES="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: [APP_ID=..] [BRANCH=..] [AZURE_* envs set] $0 [--start-job]" >&2
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

for bin in aws jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing dependency: $bin" >&2; exit 1; }
done

if [[ -z "${AZURE_OPENAI_API_KEY:-}" ]]; then
  echo "AZURE_OPENAI_API_KEY is required (export it in your shell)." >&2
  exit 1
fi

echo "== Updating Amplify env vars =="
echo "App: $APP_ID  Branch: $BRANCH"

aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables \
    AZURE_OPENAI_ENDPOINT="$ENDPOINT",\
AZURE_OPENAI_DEPLOYMENT="$DEPLOYMENT",\
AZURE_OPENAI_API_KEY="$AZURE_OPENAI_API_KEY",\
AZURE_OPENAI_API_VERSION="$API_VERSION",\
ENABLE_AZURE_AI="$ENABLE_AZURE",\
USE_AZURE_RESPONSES="$USE_RESPONSES" \
  >/dev/null

echo "Updated:"
echo " - AZURE_OPENAI_ENDPOINT=$ENDPOINT"
echo " - AZURE_OPENAI_DEPLOYMENT=$DEPLOYMENT"
echo " - AZURE_OPENAI_API_VERSION=$API_VERSION"
echo " - ENABLE_AZURE_AI=$ENABLE_AZURE"
echo " - USE_AZURE_RESPONSES=$USE_RESPONSES"
echo " - AZURE_OPENAI_API_KEY=(redacted)"

if [[ "$START_JOB" -eq 1 ]]; then
  echo "== Starting Amplify job (RELEASE) =="
  aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-type RELEASE >/dev/null
  echo "Started. Monitor in Amplify Console."
fi

echo "Done."
