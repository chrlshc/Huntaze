#!/usr/bin/env bash
set -euo pipefail

echo "[ux-guard] Checking for forbidden words in UX-facing code..."

PATTERN='\bbackend\b|backend/'
PATHS=(
  'app/**'
  'components/**'
  'public/locales/**'
  'lib/ui/**'
  'docs/user-facing/**'
)

if git grep -nEi "$PATTERN" -- ${PATHS[@]} ; then
  echo "\n❌ 'backend' mention found in UX-facing files. Please replace with user-friendly copy."
  exit 1
fi

echo "✅ No forbidden words found."

