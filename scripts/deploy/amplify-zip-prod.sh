#!/usr/bin/env bash
set -euo pipefail

# Manual ZIP deployment to AWS Amplify for a Next.js app
# - Builds locally with provided public URLs
# - Uploads artifact.zip via Amplify create-deployment + PUT upload + start-deployment
# - Optionally runs HTTP smokes against the Amplify branch URL
#
# Requirements:
# - aws cli v2, curl, jq, zip
# - Auth: either AWS SSO profile (export AWS_PROFILE=huntaze-admin-sso; aws sso login) or temporary AWS_* env vars
# - Build: JWT_SECRET must be set in the environment for production builds
#
# Usage examples:
#   JWT_SECRET=... \
#   NEXT_PUBLIC_APP_URL=https://app.huntaze.com \
#   NEXT_PUBLIC_API_URL=https://app.huntaze.com/api \
#   scripts/deploy/amplify-zip-prod.sh
#
#   AWS_PROFILE=huntaze-admin-sso \
#   JWT_SECRET=... \
#   scripts/deploy/amplify-zip-prod.sh --smoke
#

APP_ID="${APP_ID:-d33l77zi1h78ce}"
BRANCH="${BRANCH:-prod}"
APP_URL="${NEXT_PUBLIC_APP_URL:-https://app.huntaze.com}"
API_URL="${NEXT_PUBLIC_API_URL:-https://app.huntaze.com/api}"
RUN_SMOKES=0
NO_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-id) APP_ID="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --app-url) APP_URL="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    --smoke) RUN_SMOKES=1; shift ;;
    --no-build) NO_BUILD=1; shift ;;
    -h|--help)
      echo "Usage: [APP_ID=..] [BRANCH=..] [NEXT_PUBLIC_APP_URL=..] [NEXT_PUBLIC_API_URL=..] $0 [--smoke] [--no-build]" >&2
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

for bin in aws curl jq zip; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing dependency: $bin" >&2; exit 1; }
done

AMPLIFY_URL="https://${BRANCH}.${APP_ID}.amplifyapp.com"

echo "== Deploying to Amplify app ${APP_ID}, branch ${BRANCH} =="
echo "Amplify URL: ${AMPLIFY_URL}"

if [[ "$NO_BUILD" -eq 0 ]]; then
  if [[ -z "${JWT_SECRET:-}" ]]; then
    echo "JWT_SECRET is required for production build. Export JWT_SECRET and re-run." >&2
    exit 1
  fi

  echo "== Building Next.js (production) =="
  echo "Using NEXT_PUBLIC_APP_URL=${APP_URL}"
  echo "Using NEXT_PUBLIC_API_URL=${API_URL}"
  NODE_ENV=production \
  NEXT_PUBLIC_APP_URL="${APP_URL}" \
  NEXT_PUBLIC_API_URL="${API_URL}" \
  npm run build
else
  echo "--no-build specified; reusing existing .next"
fi

if [[ ! -d .next ]]; then
  echo ".next directory not found; run without --no-build or ensure build succeeded." >&2
  exit 1
fi

echo "== Creating artifact.zip =="
rm -f artifact.zip
zip -rq artifact.zip .next public package.json next.config.mjs
ls -lh artifact.zip

echo "== Creating deployment in Amplify =="
DEP_JSON=$(aws amplify create-deployment \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH}" \
  --query '{jobId:jobId,zipUploadUrl:zipUploadUrl}' \
  --output json)

JOB_ID=$(echo "$DEP_JSON" | jq -r '.jobId // empty')
UPLOAD_URL=$(echo "$DEP_JSON" | jq -r '.zipUploadUrl // empty')

if [[ -z "$JOB_ID" || -z "$UPLOAD_URL" ]]; then
  echo "Failed to obtain jobId/zipUploadUrl from create-deployment. Output:" >&2
  echo "$DEP_JSON" >&2
  exit 1
fi

echo "Job ID: $JOB_ID"

echo "== Uploading artifact to pre-signed URL =="
curl -fsSL -X PUT -T artifact.zip --retry 5 --retry-connrefused --retry-delay 2 "$UPLOAD_URL"

echo "== Starting deployment job =="
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" >/dev/null

echo "== Polling job status =="
for i in {1..60}; do
  STATUS=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$BRANCH" --job-id "$JOB_ID" --query 'job.summary.status' --output text || true)
  echo "[$(date +%H:%M:%S)] Status: ${STATUS}"
  case "$STATUS" in
    SUCCEED) break ;;
    FAILED|CANCELLED)
      echo "Deployment failed (status: $STATUS)." >&2
      echo "Inspect job details with: aws amplify get-job --app-id $APP_ID --branch-name $BRANCH --job-id $JOB_ID" >&2
      exit 1
      ;;
  esac
  sleep 5
done

if [[ "$STATUS" != "SUCCEED" ]]; then
  echo "Timed out waiting for deployment to succeed." >&2
  exit 1
fi

echo "== Deployment complete =="
echo "Amplify URL: ${AMPLIFY_URL}"

if [[ "$RUN_SMOKES" -eq 1 ]]; then
  if [[ -f scripts/smokes/app-smokes.sh ]]; then
    echo "== Running smokes on ${AMPLIFY_URL} =="
    BASE_URL="${AMPLIFY_URL}" bash scripts/smokes/app-smokes.sh || true
  else
    echo "Smoke script not found at scripts/smokes/app-smokes.sh; skipping."
  fi
fi

echo "Done."

