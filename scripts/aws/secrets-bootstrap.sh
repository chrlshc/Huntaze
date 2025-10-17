#!/usr/bin/env bash
set -euo pipefail

REGION=${AWS_REGION:-us-east-1}

echo "[secrets] Creating/updating platform secrets in AWS Secrets Manager (region=$REGION)"

create_or_put() {
  local name="$1"; shift
  local value="$1"; shift
  if aws --region "$REGION" secretsmanager describe-secret --secret-id "$name" >/dev/null 2>&1; then
    aws --region "$REGION" secretsmanager put-secret-value --secret-id "$name" --secret-string "$value" >/dev/null
    echo "[secrets] updated: $name"
  else
    aws --region "$REGION" secretsmanager create-secret --name "$name" --secret-string "$value" >/dev/null
    echo "[secrets] created: $name"
  fi
}

# Instagram Graph
[[ -n "${META_PAGE_ACCESS_TOKEN:-}" ]] && create_or_put "huntaze/meta/page_access_token" "$META_PAGE_ACCESS_TOKEN"
[[ -n "${IG_USER_ID:-}" ]] && create_or_put "huntaze/instagram/user_id" "$IG_USER_ID"

# TikTok Content Posting API
[[ -n "${TT_ACCESS_TOKEN:-}" ]] && create_or_put "huntaze/tiktok/access_token" "$TT_ACCESS_TOKEN"

# Reddit (bundle JSON)
if [[ -n "${REDDIT_CLIENT_ID:-}" && -n "${REDDIT_CLIENT_SECRET:-}" && -n "${REDDIT_USER:-}" && -n "${REDDIT_PASS:-}" ]]; then
  payload=$(jq -n \
    --arg id "$REDDIT_CLIENT_ID" \
    --arg sec "$REDDIT_CLIENT_SECRET" \
    --arg u "$REDDIT_USER" \
    --arg p "$REDDIT_PASS" \
    '{client_id:$id, client_secret:$sec, username:$u, password:$p}')
  create_or_put "huntaze/reddit/credentials" "$payload"
fi

echo "[secrets] Done. Attach read permissions to the runtime role (SecretsManager:GetSecretValue)."

