#!/bin/bash
# Quick Infrastructure Health Check
# Validates current AWS infrastructure state

set -e

REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="317805897534"

echo "🔍 Quick Infrastructure Health Check"
echo "====================================="
echo ""

# Verify AWS credentials
echo "1️⃣  Verifying AWS Credentials..."
IDENTITY=$(aws sts get-caller-identity 2>/dev/null || echo "")
if [ -n "$IDENTITY" ]; then
    CURRENT_ACCOUNT=$(echo "$IDENTITY" | jq -r '.Account')
    CURRENT_USER=$(echo "$IDENTITY" | jq -r '.Arn' | cut -d'/' -f2)
    echo "✅ Authenticated as: $CURRENT_USER"
    echo "✅ Account: $CURRENT_ACCOUNT"
    
    if [ "$CURRENT_ACCOUNT" != "$ACCOUNT_ID" ]; then
        echo "⚠️  Warning: Expected account $ACCOUNT_ID, got $CURRENT_ACCOUNT"
    fi
else
    echo "❌ AWS credentials not configured or expired"
    echo ""
    echo "Please set your AWS credentials:"
    echo "  export AWS_ACCESS_KEY_ID=\"...\""
    echo "  export AWS_SECRET_ACCESS_KEY=\"...\""
    echo "  export AWS_SESSION_TOKEN=\"...\""
    exit 1
fi

echo ""
echo "2️⃣  Checking Core Infrastructure..."

# ECS Clusters
echo ""
echo "ECS Clusters:"
aws ecs list-clusters --region $REGION --query 'clusterArns[*]' --output text 2>/dev/null | \
    grep -o '[^/]*$' | while read cluster; do
    STATUS=$(aws ecs describe-clusters --clusters $cluster --region $REGION --query 'clusters[0].status' --output text 2>/dev/null)
    SERVICES=$(aws ecs describe-clusters --clusters $cluster --region $REGION --query 'clusters[0].activeServicesCount' --output text 2>/dev/null)
    echo "  - $cluster: $STATUS ($SERVICES services)"
done

# SQS Queues
echo ""
echo "SQS Queues (huntaze):"
QUEUE_COUNT=$(aws sqs list-queues --region $REGION 2>/dev/null | grep -c "huntaze" || echo "0")
if [ "$QUEUE_COUNT" -gt 0 ]; then
    aws sqs list-queues --region $REGION 2>/dev/null | grep "huntaze" | grep -o '[^/]*$' | while read queue; do
        echo "  - $queue"
    done
else
    echo "  ⚠️  No huntaze queues found"
fi

# DynamoDB Tables
echo ""
echo "DynamoDB Tables (huntaze):"
TABLE_COUNT=$(aws dynamodb list-tables --region $REGION --query 'TableNames[*]' --output text 2>/dev/null | grep -c "huntaze" || echo "0")
if [ "$TABLE_COUNT" -gt 0 ]; then
    aws dynamodb list-tables --region $REGION --query 'TableNames[*]' --output text 2>/dev/null | tr '\t' '\n' | grep "huntaze" | while read table; do
        echo "  - $table"
    done
else
    echo "  ⚠️  No huntaze tables found"
fi

# Lambda Functions
echo ""
echo "Lambda Functions (huntaze):"
LAMBDA_COUNT=$(aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `huntaze`)].FunctionName' --output text 2>/dev/null | wc -w)
if [ "$LAMBDA_COUNT" -gt 0 ]; then
    aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `huntaze`)].{Name:FunctionName,Runtime:Runtime}' --output table 2>/dev/null
else
    echo "  ⚠️  No huntaze Lambda functions found"
fi

# CloudWatch Alarms
echo ""
echo "CloudWatch Alarms:"
ALARM_COUNT=$(aws cloudwatch describe-alarms --region $REGION --query 'MetricAlarms[*].AlarmName' --output text 2>/dev/null | wc -w)
ALARM_STATE=$(aws cloudwatch describe-alarms --region $REGION --state-value ALARM --query 'MetricAlarms[*].AlarmName' --output text 2>/dev/null | wc -w)
echo "  - Total alarms: $ALARM_COUNT"
echo "  - Alarms in ALARM state: $ALARM_STATE"

if [ "$ALARM_STATE" -gt 0 ]; then
    echo ""
    echo "  ⚠️  Alarms in ALARM state:"
    aws cloudwatch describe-alarms --region $REGION --state-value ALARM --query 'MetricAlarms[*].{Name:AlarmName,Reason:StateReason}' --output table 2>/dev/null
fi

# Budgets
echo ""
echo "3️⃣  Checking Cost Controls..."
BUDGET_COUNT=$(aws budgets describe-budgets --account-id $ACCOUNT_ID --query 'Budgets[*].BudgetName' --output text 2>/dev/null | wc -w)
if [ "$BUDGET_COUNT" -gt 0 ]; then
    echo "✅ Budgets configured: $BUDGET_COUNT"
    aws budgets describe-budgets --account-id $ACCOUNT_ID --query 'Budgets[*].{Name:BudgetName,Limit:BudgetLimit.Amount,Actual:CalculatedSpend.ActualSpend.Amount}' --output table 2>/dev/null
else
    echo "⚠️  No budgets configured"
fi

echo ""
echo "4️⃣  Checking Security Services..."

# GuardDuty
GUARDDUTY_COUNT=$(aws guardduty list-detectors --region $REGION --query 'DetectorIds[*]' --output text 2>/dev/null | wc -w)
if [ "$GUARDDUTY_COUNT" -gt 0 ]; then
    echo "✅ GuardDuty: Enabled"
else
    echo "⚠️  GuardDuty: Not enabled"
fi

# Security Hub
SECURITY_HUB=$(aws securityhub describe-hub --region $REGION 2>/dev/null || echo "")
if [ -n "$SECURITY_HUB" ]; then
    echo "✅ Security Hub: Enabled"
else
    echo "⚠️  Security Hub: Not enabled"
fi

# AWS Config
CONFIG_COUNT=$(aws configservice describe-configuration-recorders --region $REGION --query 'ConfigurationRecorders[*].name' --output text 2>/dev/null | wc -w)
if [ "$CONFIG_COUNT" -gt 0 ]; then
    echo "✅ AWS Config: Enabled"
else
    echo "⚠️  AWS Config: Not enabled"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Quick check complete!"
echo ""
echo "For comprehensive GO/NO-GO audit, run:"
echo "  ./scripts/go-no-go-audit.sh"
echo ""
echo "For production deployment, see:"
echo "  docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md"
