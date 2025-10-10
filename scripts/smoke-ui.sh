#!/usr/bin/env bash
set -euo pipefail

# Base URL precedence: PW_BASE_URL > NEXT_PUBLIC_APP_URL > default
BASE_URL=${PW_BASE_URL:-${NEXT_PUBLIC_APP_URL:-https://app.huntaze.com}}
export PW_BASE_URL="$BASE_URL"

echo "[smoke-ui] Base URL: $PW_BASE_URL"
npx playwright test tests/smoke/ui.* --reporter=line "$@"

