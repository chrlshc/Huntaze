#!/usr/bin/env bash
set -euo pipefail

# Simple loop worker to trigger AI SQS processing via Next API route.
#
# Env vars:
#   HUNTAZE_API_BASE  Base URL to the running app (default: http://localhost:3000)
#   INTERVAL_SECONDS  Sleep between polls (default: 5)

API_BASE="${HUNTAZE_API_BASE:-http://localhost:3000}"
INTERVAL="${INTERVAL_SECONDS:-5}"

echo "[ai-queue-worker] Target: ${API_BASE} | interval: ${INTERVAL}s"

while true; do
  start_ts=$(date +%s)
  resp=$(curl -fsS "${API_BASE}/api/queues/ai/process" || true)
  if [[ -n "${resp}" ]]; then
    echo "[ai-queue-worker] $(date -Is) processed -> ${resp}"
  else
    echo "[ai-queue-worker] $(date -Is) processed -> (no response)"
  fi
  end_ts=$(date +%s)

  # Sleep remaining time if the request was fast
  elapsed=$(( end_ts - start_ts ))
  if (( elapsed < INTERVAL )); then
    sleep $(( INTERVAL - elapsed ))
  fi
done

