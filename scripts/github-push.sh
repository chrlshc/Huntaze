#!/usr/bin/env bash
set -euo pipefail

# Push current repo to GitHub. Keeps secrets out of repo by enforcing ignores and cleaning cached files.
# Usage:
#   ./scripts/github-push.sh --remote https://github.com/chrlshc/Huntaze.git [--force]

REMOTE=""
FORCE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote) REMOTE="$2"; shift 2 ;;
    --force) FORCE="true"; shift 1 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$REMOTE" ]]; then
  echo "Usage: $0 --remote https://github.com/<owner>/<repo>.git [--force]"
  exit 1
fi

echo "Ensuring secret files are not tracked..."
git rm --cached -f .env.local.backup-* 2>/dev/null || true
git rm --cached -f .env.huntaze 2>/dev/null || true
git rm --cached -f huntaze-new/.env.local 2>/dev/null || true
git rm --cached -f huntaze-starter/.env 2>/dev/null || true
git rm --cached -f huntaze-starter/.env.local 2>/dev/null || true

echo "Adding .env examples (safe to commit) if untracked..."
git add -A

echo "Preparing remote..."
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already set to: $(git remote get-url origin)"
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi

git branch -M main || true

echo "Pushing to $REMOTE ..."
if [[ "$FORCE" == "true" ]]; then
  git push -u origin main --force-with-lease
else
  git push -u origin main
fi

echo "Done."

