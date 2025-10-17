#!/usr/bin/env bash
set -euo pipefail

ENV=${ENV:-production}
REGION=${REGION:-us-east-1}

aws cloudformation deploy \
  --template-file infrastructure/posts-table.yaml \
  --stack-name huntaze-posts \
  --parameter-overrides Environment="$ENV" \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo "[ok] posts-table deployed"

