#!/usr/bin/env bash
set -euo pipefail

# Sync environment variables to an Amplify Hosting branch without printing secrets
# Usage:
#   scripts/amplify-set-env.sh -a <AMPLIFY_APP_ID> -b <BRANCH_NAME> -f <ENV_FILE> [--dry-run]

APP_ID=""
BRANCH=""
ENV_FILE=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -a|--app-id) APP_ID="$2"; shift 2 ;;
    -b|--branch) BRANCH="$2"; shift 2 ;;
    -f|--file) ENV_FILE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$APP_ID" || -z "$BRANCH" || -z "$ENV_FILE" ]]; then
  echo "Usage: $0 -a <APP_ID> -b <BRANCH> -f <ENV_FILE> [--dry-run]" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

# Build comma-separated KEY=VALUE string, skipping comments/blank lines
ENV_MAP=""
COUNT=0
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^# ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"; val="${BASH_REMATCH[2]}"
    # Strip surrounding quotes to reduce parsing issues
    val="${val%\"}"; val="${val#\"}"
    if [[ -z "$ENV_MAP" ]]; then
      ENV_MAP="${key}=${val}"
    else
      ENV_MAP+=" , ${key}=${val}"
    fi
    ((COUNT++))
  fi
done < "$ENV_FILE"

echo "[amplify] App: $APP_ID  Branch: $BRANCH  Vars: $COUNT"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[amplify] Dry run. Not updating."
  exit 0
fi

# Validate AWS identity (does not print any secret)
aws sts get-caller-identity >/dev/null

# Ensure app/branch exist (will fail fast otherwise)
aws amplify get-app --app-id "$APP_ID" >/dev/null
aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH" >/dev/null

# Update branch environment variables
aws amplify update-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH" \
  --environment-variables "$ENV_MAP" \
  >/dev/null

echo "[amplify] Updated $COUNT variables on $BRANCH"

