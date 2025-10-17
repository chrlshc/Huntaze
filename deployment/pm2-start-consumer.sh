#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load production env if present
if [[ -f "$SCRIPT_DIR/prod-env.sh" ]]; then
  source "$SCRIPT_DIR/prod-env.sh"
else
  echo "[info] You can copy deployment/prod-env.template.sh to deployment/prod-env.sh and fill secrets."
fi

echo "[pm2] starting ai-sqs-consumer (env=$NODE_ENV)"
pm2 start ecosystem.config.js --only ai-sqs-consumer --env production
pm2 save

echo "[pm2] started. View logs: pm2 logs ai-sqs-consumer"

