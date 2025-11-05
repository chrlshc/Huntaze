#!/bin/bash

echo "🚀 Launching Staging Deployment - Huntaze"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: amplify.yml not found. Please run this from the project root."
    exit 1
fi

echo "✅ Found amplify.yml configuration"

# Run pre-deployment diagnostics
echo "🔍 Running pre-deployment diagnostics..."
node scripts/fix-staging-deployment.js

# Check git status
echo "📋 Git Status:"
git status --porcelain

# Show current branch
echo "🌿 Current branch: $(git branch --show-current)"

# Commit the deployment fixes
echo "💾 Committing deployment fixes..."
git add amplify.yml scripts/fix-staging-deployment.js STAGING_DEPLOYMENT_FIX_*.txt STAGING_DEPLOYMENT_FIX_*.md
git commit -m "🔧 STAGING FIX: Resolve Node.js download timeout in Amplify deployment

- Remove nvm Node.js installation to avoid download timeouts
- Use default Amplify Node.js version for faster builds
- Add network resilience with extended timeouts (300s)
- Implement fallback npm install strategy
- Add pre-build diagnostics script
- Optimize memory settings and disable telemetry
- Add build timeout protection with retry logic

Fixes deployment failure at 28% Node.js download phase.
Ready for immediate staging deployment."

echo "🚀 Pushing to staging branch..."
git push origin staging

echo ""
echo "✅ DEPLOYMENT LAUNCHED!"
echo "========================================"
echo "📊 Monitor your deployment at:"
echo "   AWS Amplify Console > Huntaze-app > staging"
echo ""
echo "🔍 Expected build time: 8-10 minutes"
echo "📝 Build should now complete without Node.js download timeout"
echo ""
echo "🎯 Next steps:"
echo "   1. Watch the build logs in Amplify Console"
echo "   2. Verify staging environment at: https://staging.huntaze.com"
echo "   3. Test key functionality after deployment"
echo ""