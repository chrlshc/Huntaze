#!/bin/bash

# ============================================
# Check Amplify Deployment Status
# ============================================
# Quick script to check deployment status and environment variables

set -e

APP_ID="d33l77zi1h78ce"
BRANCH_NAME="production-ready"
REGION="us-east-1"

echo "🔍 Checking Amplify deployment status..."
echo ""

# Get branch info
echo "📋 Branch Information:"
aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --region "$REGION" \
  --query 'branch.{Status:stage,AutoBuild:enableAutoBuild,LastJob:activeJobId,Updated:updateTime}' \
  --output table

echo ""
echo "🔐 Environment Variables:"
aws amplify get-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --region "$REGION" \
  --query 'branch.environmentVariables' \
  --output json | jq 'keys'

echo ""
echo "🚀 Recent Jobs:"
aws amplify list-jobs \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --region "$REGION" \
  --max-results 3 \
  --query 'jobSummaries[*].{JobId:jobId,Status:status,Started:startTime,Ended:endTime}' \
  --output table

echo ""
echo "🌐 App URL: https://$BRANCH_NAME.$APP_ID.amplifyapp.com"
