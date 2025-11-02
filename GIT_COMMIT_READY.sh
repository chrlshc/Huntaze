#!/bin/bash

echo "🎉 Ready to commit all 3 priorities!"
echo ""
echo "Files to commit:"
echo ""

# Deployment docs
echo "📁 Deployment Documentation:"
ls -1 docs/deployment/*.md

echo ""
echo "📁 User Guides:"
ls -1 docs/user-guides/*.md
ls -1 docs/USER_GUIDE_*.md 2>/dev/null

echo ""
echo "📁 Developer Guides:"
ls -1 docs/developer-guides/*.md
ls -1 docs/DEVELOPER_GUIDE_*.md 2>/dev/null

echo ""
echo "📁 Tests:"
ls -1 tests/integration/deployment/*.test.ts
ls -1 tests/integration/documentation/*.test.ts
ls -1 tests/integration/specs/*.test.ts

echo ""
echo "📁 Summary Documents:"
ls -1 *PRIORITIES*.md *SESSION*.md 2>/dev/null

echo ""
echo "✅ Total files ready for commit"
echo ""
echo "To commit, run:"
echo "git add ."
echo "git commit -F PRIORITIES_COMPLETE_COMMIT.txt"
echo "git push origin main"
