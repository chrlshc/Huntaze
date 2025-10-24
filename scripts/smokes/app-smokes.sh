#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-}"
if [ -z "${BASE_URL}" ]; then
  echo "Usage: BASE_URL=https://app.huntaze.com $0" >&2
  exit 1
fi

echo "== GET $BASE_URL =="
curl -sS -I --max-time 10 "$BASE_URL" | sed -n '1,10p' || true
echo

echo "== Smoke: $BASE_URL/api/ai/azure/smoke =="
if [[ -n "${AI_SMOKE_TOKEN:-}" ]]; then
  echo "[AI] Forcing Azure smoke with token (may incur minimal spend)"
  curl -sS --max-time 20 "$BASE_URL/api/ai/azure/smoke?force=1" \
    -H 'accept: application/json' \
    -H "authorization: Bearer ${AI_SMOKE_TOKEN}" || true
else
  echo "[AI] No AI_SMOKE_TOKEN set; skipping force. Expect 401/locked without spend."
  curl -sS --max-time 20 -i "$BASE_URL/api/ai/azure/smoke" -H 'accept: application/json' | sed -n '1,6p' || true
fi
echo; echo

echo "== Summary run: $BASE_URL/api/analytics/ai/summary/run =="
curl -sS --max-time 20 -X POST "$BASE_URL/api/analytics/ai/summary/run" \
  -H 'content-type: application/json' \
  -d '{"account_id":"acct_cli","period":"7d","platform":"instagram"}' || true
echo; echo
