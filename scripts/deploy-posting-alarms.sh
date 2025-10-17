#!/usr/bin/env bash
set -euo pipefail

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}

aws cloudformation deploy \
  --template-file infrastructure/posting-alarms.yaml \
  --stack-name huntaze-posting-alarms \
  --parameter-overrides Environment="$ENV" \
  --region "$REGION" \
  --no-fail-on-empty-changeset >/dev/null

echo "[ok] Posting alarms deployed for $ENV"

