#!/bin/bash

# Deploy to Staging Script
# Commits changes and pushes to staging branch

set -e

echo "🚀 Huntaze - Deploy to Staging"
echo "==============================="
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Uncommitted changes detected"
    echo ""
    
    # Show status
    git status --short
    echo ""
    
    # Confirm commit
    read -p "Commit these changes? (y/n): " COMMIT_CONFIRM
    if [ "$COMMIT_CONFIRM" != "y" ]; then
        echo "❌ Cancelled"
        exit 0
    fi
    
    # Get commit message
    echo ""
    echo "📝 Enter commit message (or press Enter for default):"
    read -p "> " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="feat: complete beta launch preparation - all specs ready

- Fix Next.js 16 route params (12 routes)
- Fix React hydration errors (0 errors)
- Add OAuth validation endpoints (3 new)
- Optimize build performance (12.8s)
- Complete P0 and P1 specs (7/7)

Ready for beta launch testing in staging."
    fi
    
    # Commit changes
    echo ""
    echo "📦 Committing changes..."
    git add .
    git commit -m "$COMMIT_MSG"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "🚀 Deploying to staging..."
echo ""

# Push to staging
if [ "$CURRENT_BRANCH" = "staging" ]; then
    echo "📤 Pushing to staging branch..."
    git push origin staging
else
    echo "📤 Pushing current branch ($CURRENT_BRANCH) to staging..."
    git push origin $CURRENT_BRANCH:staging
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to staging!"
    echo ""
    echo "📊 Monitoring deployment..."
    echo ""
    
    # Wait a bit for Amplify to start the build
    sleep 5
    
    # Check build status
    if command -v aws &> /dev/null; then
        echo "🔍 Checking Amplify build status..."
        aws amplify list-jobs \
          --app-id d2gmcfr71gawhz \
          --branch-name staging \
          --max-results 1 \
          --query 'jobSummaries[0].[status,commitId,commitMessage]' \
          --output table
        
        echo ""
        echo "📋 Monitor build progress:"
        echo "   AWS Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d2gmcfr71gawhz/branches/staging"
        echo ""
        echo "🔍 After deployment, test:"
        echo "   Health: https://staging.huntaze.com/api/validation/health"
        echo "   App: https://staging.huntaze.com"
    else
        echo "⚠️  AWS CLI not found - cannot check build status"
        echo "   Monitor in AWS Console: https://console.aws.amazon.com/amplify/"
    fi
    
    echo ""
    echo "🎉 Deployment initiated!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Wait for build to complete (~5-10 min)"
    echo "  2. Test OAuth flows"
    echo "  3. Verify hydration fixes"
    echo "  4. Check all routes"
    echo ""
    echo "🚀 Staging deployment in progress!"
else
    echo ""
    echo "❌ Push failed!"
    echo "   Check git status and try again"
    exit 1
fi
