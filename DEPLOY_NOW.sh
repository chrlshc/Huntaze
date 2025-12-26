#!/bin/bash

# 🚀 QUICK DEPLOY - AWS Amplify Environment Variables Management System
# Run this script to deploy everything in one command

echo "🚀 DEPLOYING AWS AMPLIFY ENVIRONMENT VARIABLES MANAGEMENT SYSTEM"
echo "================================================================"

# Run the main deployment script
./scripts/deploy-amplify-env-vars.sh

echo ""
echo "🎯 DEPLOYMENT SUMMARY:"
echo "• System deployed and ready to use"
echo "• Run: cat AMPLIFY_ENV_VARS_QUICKSTART.md for next steps"
echo "• Test: node scripts/amplify-env-vars/amplify-env-vars.js --help"
echo ""
echo "✨ Happy managing your environment variables! ✨"