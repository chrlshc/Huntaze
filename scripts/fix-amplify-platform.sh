#!/bin/bash

# Script to fix Amplify platform detection for Next.js SSR
# Run this to ensure Amplify treats your app as WEB_COMPUTE (SSR) not WEB (static)

echo "🔧 Fixing Amplify Platform Configuration for Next.js SSR"
echo ""
echo "⚠️  You need to run these AWS CLI commands manually:"
echo ""
echo "1. Find your Amplify App ID:"
echo "   - Go to AWS Amplify Console"
echo "   - Copy the App ID from your app's URL or settings"
echo ""
echo "2. Update app platform to WEB_COMPUTE:"
echo "   aws amplify update-app --app-id <YOUR_APP_ID> --platform WEB_COMPUTE --region us-east-1"
echo ""
echo "3. Update branch framework to Next.js SSR:"
echo "   aws amplify update-branch --app-id <YOUR_APP_ID> --branch-name staging --framework 'Next.js - SSR' --region us-east-1"
echo ""
echo "4. Trigger a new build:"
echo "   aws amplify start-job --app-id <YOUR_APP_ID> --branch-name staging --job-type RELEASE --region us-east-1"
echo ""
echo "📝 After running these commands, your Next.js app should deploy correctly with SSR support."
echo ""
echo "Alternative: You can also change these settings in the Amplify Console:"
echo "  - App Settings > General > Edit"
echo "  - Change Platform to 'Web Compute'"
echo "  - Branch Settings > Edit"
echo "  - Change Framework to 'Next.js - SSR'"
