#!/bin/bash
# Huntaze Production Cleanup Script
# Nettoie tous les fichiers de documentation/summary avant déploiement beta

set -e

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - No files will be deleted"
  echo ""
fi

echo "🧹 Huntaze Production Cleanup - Starting..."

# 1. Backup current state (skip in dry-run)
if [ "$DRY_RUN" = false ]; then
  echo "📦 Creating backup..."
  git stash push -m "backup-before-cleanup-$(date +%Y%m%d-%H%M%S)"
else
  echo "📦 Skipping backup (dry-run mode)"
fi

# 2. Remove all test summary and documentation files from root
echo "🗑️  Removing test summary files from root..."
if [ "$DRY_RUN" = true ]; then
  echo "Would delete from root:"
  ls -1 *_TESTS_*.md *_SUMMARY.md *_COMPLETE.md *_STATUS.md FILES_CREATED_*.md TEST_*.md DEPLOYMENT_*.md PRODUCTION_*.md 2>/dev/null | grep -v -E "(BETA_DEPLOYMENT_CHECKLIST|CLEANUP_ANALYSIS|EXECUTE_NOW|WHAT_GETS_DELETED|BETA_READY_FINAL_SUMMARY|README_DEPLOYMENT|START_HERE)" | head -20 || echo "  (no files match)"
else
  rm -f *_TESTS_*.md
  rm -f *_SUMMARY.md
  rm -f *_COMPLETE.md
  rm -f *_STATUS.md
  rm -f FILES_CREATED_*.md
  rm -f TEST_*.md
  rm -f DEPLOYMENT_*.md
  rm -f PRODUCTION_*.md
  # Restore the files we want to keep
  git checkout BETA_DEPLOYMENT_CHECKLIST.md CLEANUP_ANALYSIS.md EXECUTE_NOW.md WHAT_GETS_DELETED.md BETA_READY_FINAL_SUMMARY.md README_DEPLOYMENT.md START_HERE.md 2>/dev/null || true
fi

# Keep only essential docs
echo "✅ Keeping essential documentation..."
# README.md, CHANGELOG.md, and docs/ folder are preserved

# 3. Clean test documentation inside tests/
echo "🗑️  Removing test documentation files..."
if [ "$DRY_RUN" = true ]; then
  echo "Would delete from tests/:"
  find tests -name "*_SUMMARY.md" -o -name "*_README.md" -o -name "FILES_CREATED*.md" 2>/dev/null | head -10
else
  find tests -name "*_SUMMARY.md" -delete
  find tests -name "*_README.md" -delete
  find tests -name "FILES_CREATED*.md" -delete
fi

# 4. Update .gitignore to prevent future pollution
echo "📝 .gitignore already updated (skipping)"

# 5. Clean build artifacts
echo "🧹 Cleaning build artifacts..."
if [ "$DRY_RUN" = true ]; then
  echo "Would delete build artifacts:"
  ls -d .next .turbo dist coverage reports test-results node_modules/.cache 2>/dev/null || echo "  (no build artifacts found)"
else
  rm -rf .next
  rm -rf .turbo
  rm -rf dist
  rm -rf coverage
  rm -rf reports
  rm -rf test-results
  rm -rf node_modules/.cache
fi

# 6. Verify file count
echo "📊 Checking file count..."
FILE_COUNT=$(git ls-files | wc -l | tr -d ' ')
echo "Current tracked files: $FILE_COUNT"

if [ "$FILE_COUNT" -gt 1000 ]; then
  echo "⚠️  WARNING: Still tracking $FILE_COUNT files (expected < 1000)"
  echo "Running deeper analysis..."
  git ls-files | head -50
else
  echo "✅ File count looks good: $FILE_COUNT files"
fi

# 7. Stage changes
if [ "$DRY_RUN" = false ]; then
  echo "📦 Staging cleanup changes..."
  git add -A
fi

echo ""
if [ "$DRY_RUN" = true ]; then
  echo "✅ Dry run complete! No files were modified."
  echo ""
  echo "To execute for real, run:"
  echo "  bash scripts/cleanup-for-production.sh"
else
  echo "✅ Cleanup complete!"
  echo ""
  echo "Next steps:"
  echo "1. Review changes: git status"
  echo "2. Commit: git commit -m 'chore: cleanup test artifacts for production beta'"
  echo "3. Run: bash scripts/fix-dependencies.sh"
  echo "4. Push: git push origin main"
fi
