#!/bin/bash

# Script to verify Cost Monitoring setup
# Usage: ./scripts/verify-cost-monitoring.sh

set -e

REGION="us-east-1"
BUDGET_NAME="huntaze-monthly-budget"

echo "🔍 Verifying Cost Monitoring Setup..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi
echo "✅ AWS credentials configured"
echo ""

# Check AWS Budget
echo "2️⃣ Checking AWS Budget..."
if aws budgets describe-budget \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --budget-name "$BUDGET_NAME" \
    --region us-east-1 &> /dev/null; then
    
    BUDGET_INFO=$(aws budgets describe-budget \
        --account-id $(aws sts get-caller-identity --query Account --output text) \
        --budget-name "$BUDGET_NAME" \
        --region us-east-1 \
        --query 'Budget.[BudgetLimit.Amount,TimeUnit]' \
        --output text)
    
    echo "✅ Budget configured: \$$BUDGET_INFO"
    
    # Get current spend
    CURRENT_SPEND=$(aws budgets describe-budget \
        --account-id $(aws sts get-caller-identity --query Account --output text) \
        --budget-name "$BUDGET_NAME" \
        --region us-east-1 \
        --query 'Budget.CalculatedSpend.ActualSpend.Amount' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Current spend: \$$CURRENT_SPEND"
else
    echo "❌ Budget not found: $BUDGET_NAME"
    echo "   Deploy the SAM template to create it"
fi
echo ""

# Check Cost Anomaly Detection
echo "3️⃣ Checking Cost Anomaly Detection..."
MONITORS=$(aws ce get-anomaly-monitors \
    --region us-east-1 \
    --query 'AnomalyMonitors[?MonitorName==`huntaze-cost-anomaly-monitor`]' \
    --output json 2>/dev/null || echo "[]")

if [ "$MONITORS" != "[]" ]; then
    echo "✅ Cost Anomaly Monitor configured"
    
    MONITOR_ARN=$(echo "$MONITORS" | jq -r '.[0].MonitorArn')
    
    # Check subscriptions
    SUBSCRIPTIONS=$(aws ce get-anomaly-subscriptions \
        --region us-east-1 \
        --query "AnomalySubscriptions[?contains(MonitorArnList, '$MONITOR_ARN')]" \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$SUBSCRIPTIONS" != "[]" ]; then
        THRESHOLD=$(echo "$SUBSCRIPTIONS" | jq -r '.[0].Threshold')
        echo "   Threshold: \$$THRESHOLD"
        echo "✅ Anomaly alerts configured"
    else
        echo "⚠️  No subscriptions found for anomaly monitor"
    fi
else
    echo "❌ Cost Anomaly Monitor not found"
    echo "   Deploy the SAM template to create it"
fi
echo ""

# Check SNS Topic
echo "4️⃣ Checking SNS Topic..."
TOPIC_ARN=$(aws sns list-topics \
    --region "$REGION" \
    --query 'Topics[?contains(TopicArn, `huntaze-production-alerts`)].TopicArn' \
    --output text)

if [ -n "$TOPIC_ARN" ]; then
    echo "✅ SNS Topic exists: $TOPIC_ARN"
    
    # Check subscriptions
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$TOPIC_ARN" \
        --region "$REGION" \
        --query 'Subscriptions[*].[Protocol,Endpoint,SubscriptionArn]' \
        --output text)
    
    if [ -n "$SUBSCRIPTIONS" ]; then
        echo "   Subscriptions:"
        echo "$SUBSCRIPTIONS" | while read -r line; do
            PROTOCOL=$(echo "$line" | awk '{print $1}')
            ENDPOINT=$(echo "$line" | awk '{print $2}')
            SUB_ARN=$(echo "$line" | awk '{print $3}')
            
            if [[ "$SUB_ARN" == *"PendingConfirmation"* ]]; then
                echo "   ⚠️  $PROTOCOL: $ENDPOINT (Pending Confirmation)"
            else
                echo "   ✅ $PROTOCOL: $ENDPOINT (Confirmed)"
            fi
        done
    else
        echo "   ⚠️  No subscriptions found"
    fi
else
    echo "❌ SNS Topic not found"
fi
echo ""

# Check CloudWatch Dashboard
echo "5️⃣ Checking CloudWatch Dashboard..."
if aws cloudwatch get-dashboard \
    --dashboard-name "huntaze-prisma-migration" \
    --region "$REGION" &> /dev/null; then
    
    echo "✅ CloudWatch Dashboard exists"
    echo "   URL: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=huntaze-prisma-migration"
else
    echo "❌ CloudWatch Dashboard not found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Cost Monitoring Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "1. If budget not found, deploy SAM template:"
echo "   cd sam && sam build && sam deploy"
echo ""
echo "2. If SNS subscription pending, check your email and confirm"
echo ""
echo "3. Monitor costs in AWS Console:"
echo "   https://console.aws.amazon.com/cost-management/home?region=$REGION#/dashboard"
echo ""
echo "4. View anomalies:"
echo "   https://console.aws.amazon.com/cost-management/home?region=$REGION#/anomaly-detection"
echo ""
