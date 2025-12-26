#!/bin/bash
# Create an AWS Amplify app in us-east-2 (Ohio).
# Usage:
#   APP_NAME=huntaze-prod BRANCH_NAME=main ./scripts/create-amplify-us-east-2.sh
# Optional:
#   AMPLIFY_REPO_URL=https://github.com/org/repo.git
#   AMPLIFY_OAUTH_TOKEN=... (GitHub token with repo access)
#   BUILD_SPEC_FILE=amplify.yml
#   PLATFORM=WEB_COMPUTE
#   FRAMEWORK="Next.js - SSR"

set -euo pipefail

REGION="${AWS_REGION:-us-east-2}"
APP_NAME="${APP_NAME:-huntaze-prod}"
BRANCH_NAME="${BRANCH_NAME:-main}"
BUILD_SPEC_FILE="${BUILD_SPEC_FILE:-amplify.yml}"
PLATFORM="${PLATFORM:-WEB_COMPUTE}"
FRAMEWORK="${FRAMEWORK:-Next.js - SSR}"
REPO_URL="${AMPLIFY_REPO_URL:-}"
OAUTH_TOKEN="${AMPLIFY_OAUTH_TOKEN:-}"

export AWS_REGION="$REGION"
export AWS_DEFAULT_REGION="$REGION"
export AWS_PAGER=""

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws CLI is required (https://docs.aws.amazon.com/cli/)."
  exit 1
fi

if [ ! -f "$BUILD_SPEC_FILE" ]; then
  echo "ERROR: build spec not found: $BUILD_SPEC_FILE"
  exit 1
fi

EXISTING_APP=$(aws amplify list-apps --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || true)

if [ -n "$EXISTING_APP" ] && [ "$EXISTING_APP" != "None" ]; then
  APP_ID="$EXISTING_APP"
  echo "Amplify app already exists: $APP_ID"
else
  CREATE_ARGS=(--name "$APP_NAME" --platform "$PLATFORM" --build-spec "$(cat "$BUILD_SPEC_FILE")")
  if [ -n "$REPO_URL" ] && [ -n "$OAUTH_TOKEN" ]; then
    CREATE_ARGS+=(--repository "$REPO_URL" --oauth-token "$OAUTH_TOKEN")
  fi
  APP_ID=$(aws amplify create-app "${CREATE_ARGS[@]}" --query 'app.appId' --output text)
  echo "Created Amplify app: $APP_ID"
fi

if [ -n "$REPO_URL" ] && [ -n "$OAUTH_TOKEN" ]; then
  if ! aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" >/dev/null 2>&1; then
    aws amplify create-branch \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH_NAME" \
      --framework "$FRAMEWORK" >/dev/null
    echo "Created branch: $BRANCH_NAME"
  else
    echo "Branch already exists: $BRANCH_NAME"
  fi
fi

echo "Amplify Console: https://${REGION}.console.aws.amazon.com/amplify/apps/${APP_ID}"
echo "Next: connect repo (if not provided) and set environment variables."
