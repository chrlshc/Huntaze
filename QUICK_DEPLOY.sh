#!/bin/bash

# 🚀 QUICK DEPLOY - One command to rule them all!

echo "🚀 Huntaze Quick Deploy"
echo "======================="
echo ""
echo "This script will guide you through the deployment in 20 minutes."
echo ""

# Check if we're ready
if [ ! -f "scripts/pre-deployment-check.sh" ]; then
    echo "❌ Error: Run this from the Huntaze root directory"
    exit 1
fi

# Step 1: Pre-check
echo "📋 Step 1/5: Pre-deployment check..."
./scripts/pre-deployment-check.sh
if [ $? -ne 0 ]; then
    echo "❌ Pre-check failed. Fix errors and try again."
    exit 1
fi
echo ""

# Step 2: AWS credentials
echo "🔐 Step 2/5: AWS Credentials"
echo ""
echo "Please export your AWS credentials:"
echo ""
echo "export AWS_ACCESS_KEY_ID=\"AKIA...\""
echo "export AWS_SECRET_ACCESS_KEY=\"...\""
echo "export AWS_SESSION_TOKEN=\"...\"  # if using SSO"
echo ""
read -p "Have you exported your AWS credentials? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please export your credentials and run this script again."
    exit 1
fi

# Verify credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not working. Please check and try again."
    exit 1
fi
echo "✅ AWS credentials OK"
echo ""

# Step 3: Deploy infrastructure
echo "🚀 Step 3/5: Deploying AWS infrastructure..."
./scripts/deploy-huntaze-hybrid.sh
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Check errors above."
    exit 1
fi
echo ""

# Step 4: Amplify config
echo "⚙️  Step 4/5: Configure Amplify"
echo ""
echo "Next steps:"
echo "1. Open Amplify Console: https://console.aws.amazon.com/amplify"
echo "2. Go to: App Settings > Environment variables"
echo "3. Copy variables from: amplify-env-vars.txt"
echo ""
echo "Critical variables to configure:"
echo "  • DYNAMODB_COSTS_TABLE"
echo "  • SQS_WORKFLOW_QUEUE"
echo "  • COST_ALERTS_SNS_TOPIC"
echo "  • HYBRID_ORCHESTRATOR_ENABLED=true"
echo "  • Your Azure/OpenAI API keys"
echo ""
read -p "Have you configured Amplify env vars? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please configure Amplify and run this script again."
    exit 1
fi
echo ""

# Step 5: Deploy
echo "📤 Step 5/5: Deploy to production"
echo ""
echo "Ready to push to main?"
echo ""
read -p "Push to main now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "feat: hybrid orchestrator production deployment

- Complete hybrid orchestrator implementation
- Cost monitoring and alerting system
- 16 production API endpoints
- Comprehensive documentation
- Ready for production"
    git push origin main
    echo ""
    echo "✅ Pushed to main! Amplify will auto-deploy."
    echo ""
    echo "Monitor deployment:"
    echo "https://console.aws.amazon.com/amplify"
else
    echo "Skipping push. You can push manually later:"
    echo "  git push origin main"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Monitor Amplify deployment"
echo "2. Test endpoints: ./scripts/verify-deployment.sh"
echo "3. Check CloudWatch logs"
echo ""
echo "Documentation:"
echo "  • deployment-summary.md - Deployment summary"
echo "  • amplify-env-vars.txt - Environment variables"
echo "  • WHAT_WE_BUILT.md - What we built"
echo ""
echo "🚀 You're in production!"
