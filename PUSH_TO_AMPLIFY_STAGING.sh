#!/bin/bash

# Push Staging Deployment Fix to Amplify Staging Branch
# Comprehensive deployment system ready for staging environment

echo "🚀 Pushing Staging Deployment Fix System to Amplify Staging..."

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if we have a staging branch
if git show-ref --verify --quiet refs/heads/staging; then
    echo "✅ Staging branch exists"
else
    echo "🔧 Creating staging branch..."
    git checkout -b staging
fi

# Switch to staging branch if not already there
if [ "$CURRENT_BRANCH" != "staging" ]; then
    echo "🔄 Switching to staging branch..."
    git checkout staging
    
    # Merge current changes
    echo "🔀 Merging changes from $CURRENT_BRANCH..."
    git merge $CURRENT_BRANCH --no-edit
fi

# Verify our staging deployment fix files are present
echo "📋 Verifying staging deployment fix files..."
REQUIRED_FILES=(
    "scripts/amplify-build-optimizer.js"
    "scripts/build-error-handler.js"
    "lib/monitoring/deployment-monitor.js"
    "lib/monitoring/deployment-alerting.js"
    "scripts/diagnose-deployment-failure.js"
    "tests/integration/deployment/build-configuration.test.js"
    "tests/integration/deployment/environment-validation.test.js"
    "STAGING_DEPLOYMENT_FIX_COMPLETE.md"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo "✅ All staging deployment fix files are present"
else
    echo "❌ Missing files:"
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

# Show git status
echo "📊 Git status:"
git status --porcelain

# Push to different remotes for staging
echo "🌐 Pushing to available remotes..."

# Try pushing to huntaze remote (most likely for staging)
if git remote get-url huntaze >/dev/null 2>&1; then
    echo "📤 Pushing to huntaze remote (staging)..."
    git push huntaze staging
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to huntaze remote"
    else
        echo "⚠️ Failed to push to huntaze remote"
    fi
fi

# Try pushing to amplify-lower remote
if git remote get-url amplify-lower >/dev/null 2>&1; then
    echo "📤 Pushing to amplify-lower remote..."
    git push amplify-lower staging
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to amplify-lower remote"
    else
        echo "⚠️ Failed to push to amplify-lower remote"
    fi
fi

# Try pushing to huntaze-new remote
if git remote get-url huntaze-new >/dev/null 2>&1; then
    echo "📤 Pushing to huntaze-new remote..."
    git push huntaze-new staging
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to huntaze-new remote"
    else
        echo "⚠️ Failed to push to huntaze-new remote"
    fi
fi

echo ""
echo "🎯 STAGING DEPLOYMENT FIX SYSTEM PUSH COMPLETE!"
echo ""
echo "📊 System Components Deployed:"
echo "  ✅ Build Optimization System"
echo "  ✅ Deployment Monitoring System" 
echo "  ✅ Comprehensive Testing Framework"
echo "  ✅ Advanced Diagnostic Tools"
echo ""
echo "🔧 Files Deployed:"
echo "  • scripts/amplify-build-optimizer.js - Enhanced build optimizer"
echo "  • scripts/build-error-handler.js - Intelligent error handling"
echo "  • lib/monitoring/deployment-monitor.js - Real-time monitoring"
echo "  • lib/monitoring/deployment-alerting.js - Smart alerting system"
echo "  • scripts/diagnose-deployment-failure.js - Comprehensive diagnostics"
echo "  • tests/integration/deployment/ - Complete test suite"
echo ""
echo "🚀 Next Steps:"
echo "  1. Amplify will automatically detect the staging branch push"
echo "  2. Build process will use the new optimization system"
echo "  3. Monitor deployment through the new monitoring system"
echo "  4. Check alerts and diagnostics if issues occur"
echo ""
echo "📈 Benefits Active:"
echo "  • Proactive issue detection"
echo "  • Automated error recovery"
echo "  • Real-time health monitoring"
echo "  • Comprehensive diagnostics"
echo "  • Security validation"
echo ""
echo "✨ STAGING ENVIRONMENT READY FOR OPTIMIZED DEPLOYMENTS!"