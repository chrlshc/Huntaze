#!/bin/bash
# Script pour merger chore/upgrade-2025 vers main et déclencher le déploiement

set -e

echo "🚀 Merging cleanup branch to main..."

# 1. Checkout main et sync avec remote
git checkout main
git fetch huntaze main
git reset --hard huntaze/main

# 2. Merge notre branche de cleanup
git merge chore/upgrade-2025 --no-ff -m "Merge: Production Beta Ready - Cleanup & CI/CD Fixes

- Remove 127k+ node_modules files from tracking (97.9% reduction)
- Remove 178 test summary/status .md files
- Fix Jobs 62-64 (ESLint, Turbopack, file count)
- Update amplify.yml with production-ready config
- Add cleanup and fix-dependencies scripts

Reduces tracked files from 130,495 to 2,705.
Ready for beta deployment with 50 users."

# 3. Push vers main
echo "📤 Pushing to main..."
git push huntaze main

echo ""
echo "✅ Merge complete!"
echo ""
echo "AWS Amplify will now trigger a build automatically."
echo "Expected build time: 6-8 minutes"
echo ""
echo "Monitor at: https://console.aws.amazon.com/amplify/"
