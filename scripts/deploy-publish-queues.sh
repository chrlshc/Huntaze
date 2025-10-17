#!/usr/bin/env bash
set -euo pipefail

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}

aws cloudformation deploy \
  --template-file infrastructure/publish-queues.yaml \
  --stack-name huntaze-publish-queues \
  --parameter-overrides Environment="$ENV" \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo "[ok] publish-queues deployed"

