#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${HUNTAZE_API_BASE:-}" ]]; then
  echo "HUNTAZE_API_BASE is not set (e.g., https://app.domain)" >&2
  exit 1
fi
if [[ -z "${HUNTAZE_INTERNAL_API_KEY:-}" ]]; then
  echo "HUNTAZE_INTERNAL_API_KEY is not set" >&2
  exit 1
fi

echo "[1/3] Health check: ${HUNTAZE_API_BASE}/api/health/platforms"
curl -fsS "${HUNTAZE_API_BASE}/api/health/platforms" | jq . || curl -fsS "${HUNTAZE_API_BASE}/api/health/platforms"

echo "[2/3] Enqueue sample publish_content (reddit)"
curl -fsS -X POST "${HUNTAZE_API_BASE}/api/queues/ai/publish-sample" \
  -H "x-huntaze-internal-key: ${HUNTAZE_INTERNAL_API_KEY}" \
  -H "content-type: application/json" \
  -d '{"platform":"reddit","subreddit":"OnlyFans101"}' | jq . || true

echo "[3/3] Reminder: Check consumer logs"
echo "    pm2 logs ai-sqs-consumer"

