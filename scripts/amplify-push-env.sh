#!/usr/bin/env bash
set -euo pipefail

# Push environment variables to AWS Amplify branches for huntaze-starter and huntaze-new
# Usage (provide either --env-file or --preset):
#   ./scripts/amplify-push-env.sh --app-id APPID --branch main --env-file ./starter.env
#   ./scripts/amplify-push-env.sh --app-id APPID --branch main --preset starter
#   ./scripts/amplify-push-env.sh --app-id APPID --branch main --preset new
#
# Notes:
# - The env file format is simple KEY=VALUE lines (no quotes). Lines starting with # are ignored.
# - Requires: aws CLI configured (SSO or keys) with permission to update Amplify branches.

APP_ID=""
BRANCH=""
ENV_FILE=""
PRESET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-id) APP_ID="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --preset) PRESET="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$APP_ID" || -z "$BRANCH" ]]; then
  echo "Usage: $0 --app-id <APP_ID> --branch <BRANCH> [--env-file <path> | --preset starter|new]"
  exit 1
fi

if [[ -z "$ENV_FILE" && -n "$PRESET" ]]; then
  case "$PRESET" in
    starter)
      # Prefer .env.local if present, then .env
      if [[ -f "huntaze-starter/.env.local" ]]; then ENV_FILE="huntaze-starter/.env.local"; fi
      if [[ -z "$ENV_FILE" && -f "huntaze-starter/.env" ]]; then ENV_FILE="huntaze-starter/.env"; fi
      if [[ -z "$ENV_FILE" && -f "huntaze-starter/.env.example" ]]; then ENV_FILE="huntaze-starter/.env.example"; fi
      ;;
    new)
      # Prefer .env.local if present, then .env.example (user may copy to Secrets)
      if [[ -f "huntaze-new/.env.local" ]]; then ENV_FILE="huntaze-new/.env.local"; fi
      if [[ -z "$ENV_FILE" && -f "huntaze-new/.env" ]]; then ENV_FILE="huntaze-new/.env"; fi
      if [[ -z "$ENV_FILE" && -f "huntaze-new/.env.example" ]]; then ENV_FILE="huntaze-new/.env.example"; fi
      ;;
    *) echo "Unknown preset: $PRESET"; exit 1 ;;
  esac
fi

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Env file not found or not provided. Use --env-file or --preset starter|new"; exit 1
fi

# Build comma-separated KEY=VALUE string (escaping commas in values if any)
PAIRS=()
NP_AWS_REGION=""
while IFS= read -r line; do
  # trim whitespace
  line="$(printf "%s" "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  # skip comments/blank
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  # split on first '='
  KEY="${line%%=*}"
  VAL="${line#*=}"
  KEY="${KEY// /}"
  [[ -z "$KEY" ]] && continue
  # skip reserved AWS_* vars (Amplify forbids)
  if [[ "$KEY" == AWS_* ]]; then
    if [[ "$KEY" == "AWS_REGION" ]]; then NP_AWS_REGION="$VAL"; fi
    continue
  fi
  # naive escape of commas
  VAL_ESC="${VAL//,/\,}"
  PAIRS+=("${KEY}=${VAL_ESC}")
done < "$ENV_FILE"

if [[ ${#PAIRS[@]} -eq 0 ]]; then
  echo "No variables found in $ENV_FILE"; exit 1
fi

if [[ -n "$NP_AWS_REGION" ]]; then
  # provide client-side region if AWS_REGION was present
  PAIRS+=("NEXT_PUBLIC_AWS_REGION=${NP_AWS_REGION}")
fi
CSV=$(IFS=, ; echo "${PAIRS[*]}")

REGION_ENV="${AWS_DEFAULT_REGION:-${AWS_REGION:-}}"
[[ -z "$REGION_ENV" && -n "$NP_AWS_REGION" ]] && REGION_ENV="$NP_AWS_REGION"
[[ -z "$REGION_ENV" ]] && REGION_ENV="us-east-1"

echo "Pushing env to Amplify app=$APP_ID branch=$BRANCH region=$REGION_ENV (from $ENV_FILE) ..."
aws amplify update-branch \
  --region "$REGION_ENV" \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "$CSV" >/dev/null

echo "Done."
