#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <rest-api-id> <stage-name> <global-rate-limit> <global-burst-limit> [profile]" >&2
  exit 1
fi

REST_API_ID="$1"
STAGE_NAME="$2"
GLOBAL_RATE="$3"
GLOBAL_BURST="$4"
PROFILE="${5:-default}"

aws apigateway update-stage \
  --rest-api-id "$REST_API_ID" \
  --stage-name "$STAGE_NAME" \
  --profile "$PROFILE" \
  --patch-operations \
    op="replace",path="/*/*/throttling/rateLimit",value="$GLOBAL_RATE" \
    op="replace",path="/*/*/throttling/burstLimit",value="$GLOBAL_BURST"

echo "✅ Applied stage-level throttling (rate=${GLOBAL_RATE} rpm, burst=${GLOBAL_BURST}) to ${REST_API_ID}/${STAGE_NAME}."
