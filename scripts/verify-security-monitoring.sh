#!/bin/bash

# Verify Security Monitoring setup
# Usage: ./scripts/verify-security-monitoring.sh

set -e

REGION="us-east-1"

echo "🔐 Verifying Security Monitoring Setup..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi
echo "✅ AWS credentials configured"
echo ""

# Check Security Hub
echo "2️⃣ Checking Security Hub..."
if aws securityhub describe-hub --region "$REGION" &> /dev/null; then
    echo "✅ Security Hub enabled"
    
    # Get enabled standards
    STANDARDS=$(aws securityhub get-enabled-standards \
        --region "$REGION" \
        --query 'StandardsSubscriptions[*].[StandardsArn,StandardsStatus]' \
        --output text)
    
    echo "   Enabled standards:"
    echo "$STANDARDS" | while read -r line; do
        ARN=$(echo "$line" | awk '{print $1}')
        STATUS=$(echo "$line" | awk '{print $2}')
        NAME=$(echo "$ARN" | awk -F'/' '{print $NF}')
        echo "   • $NAME: $STATUS"
    done
    
    # Get findings count
    FINDINGS_COUNT=$(aws securityhub get-findings \
        --region "$REGION" \
        --max-results 1 \
        --query 'Findings | length(@)' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Current findings: $FINDINGS_COUNT"
else
    echo "❌ Security Hub not enabled"
    echo "   Run: ./scripts/enable-security-hub.sh"
fi
echo ""

# Check GuardDuty
echo "3️⃣ Checking GuardDuty..."
DETECTOR_ID=$(aws guardduty list-detectors \
    --region "$REGION" \
    --query 'DetectorIds[0]' \
    --output text 2>/dev/null || echo "None")

if [ "$DETECTOR_ID" != "None" ] && [ -n "$DETECTOR_ID" ]; then
    echo "✅ GuardDuty enabled"
    echo "   Detector ID: $DETECTOR_ID"
    
    # Get detector status
    STATUS=$(aws guardduty get-detector \
        --detector-id "$DETECTOR_ID" \
        --region "$REGION" \
        --query 'Status' \
        --output text)
    
    echo "   Status: $STATUS"
    
    # Get findings count
    FINDINGS_COUNT=$(aws guardduty list-findings \
        --detector-id "$DETECTOR_ID" \
        --region "$REGION" \
        --query 'FindingIds | length(@)' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Current findings: $FINDINGS_COUNT"
    
    # Check EventBridge rule
    if aws events describe-rule \
        --name "huntaze-guardduty-findings" \
        --region "$REGION" &> /dev/null; then
        echo "   ✅ EventBridge rule configured"
    else
        echo "   ⚠️  EventBridge rule not found"
    fi
else
    echo "❌ GuardDuty not enabled"
    echo "   Run: ./scripts/enable-guardduty.sh"
fi
echo ""

# Check Access Analyzer
echo "4️⃣ Checking IAM Access Analyzer..."
ANALYZER_ARN=$(aws accessanalyzer list-analyzers \
    --region "$REGION" \
    --query "analyzers[?name=='huntaze-access-analyzer'].arn" \
    --output text 2>/dev/null || echo "")

if [ -n "$ANALYZER_ARN" ]; then
    echo "✅ Access Analyzer enabled"
    echo "   Analyzer ARN: $ANALYZER_ARN"
    
    # Get status
    STATUS=$(aws accessanalyzer get-analyzer \
        --analyzer-name "huntaze-access-analyzer" \
        --region "$REGION" \
        --query 'analyzer.status' \
        --output text)
    
    echo "   Status: $STATUS"
    
    # Get findings count
    FINDINGS_COUNT=$(aws accessanalyzer list-findings \
        --analyzer-arn "$ANALYZER_ARN" \
        --region "$REGION" \
        --query 'findings | length(@)' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Current findings: $FINDINGS_COUNT"
else
    echo "❌ Access Analyzer not enabled"
    echo "   Run: ./scripts/enable-access-analyzer.sh"
fi
echo ""

# Check SNS Topic
echo "5️⃣ Checking SNS Topic for alerts..."
SNS_TOPIC_ARN=$(aws sns list-topics \
    --region "$REGION" \
    --query 'Topics[?contains(TopicArn, `huntaze-production-alerts`)].TopicArn' \
    --output text)

if [ -n "$SNS_TOPIC_ARN" ]; then
    echo "✅ SNS Topic exists: $SNS_TOPIC_ARN"
    
    # Check subscriptions
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic \
        --topic-arn "$SNS_TOPIC_ARN" \
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
                echo "   ⚠️  $PROTOCOL: $ENDPOINT (Pending)"
            else
                echo "   ✅ $PROTOCOL: $ENDPOINT (Confirmed)"
            fi
        done
    fi
else
    echo "❌ SNS Topic not found"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Security Monitoring Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Calculate status
SERVICES_ENABLED=0
SERVICES_TOTAL=3

if aws securityhub describe-hub --region "$REGION" &> /dev/null; then
    ((SERVICES_ENABLED++))
fi

if [ "$DETECTOR_ID" != "None" ] && [ -n "$DETECTOR_ID" ]; then
    ((SERVICES_ENABLED++))
fi

if [ -n "$ANALYZER_ARN" ]; then
    ((SERVICES_ENABLED++))
fi

echo "Services enabled: $SERVICES_ENABLED/$SERVICES_TOTAL"
echo ""

if [ $SERVICES_ENABLED -eq $SERVICES_TOTAL ]; then
    echo "✅ All security services are enabled!"
    echo ""
    echo "📖 Next Steps:"
    echo "   1. Wait 2 hours for initial findings"
    echo "   2. Review Security Hub: https://console.aws.amazon.com/securityhub/home?region=$REGION"
    echo "   3. Review GuardDuty: https://console.aws.amazon.com/guardduty/home?region=$REGION"
    echo "   4. Review Access Analyzer: https://console.aws.amazon.com/access-analyzer/home?region=$REGION"
    echo "   5. Read guide: sam/SECURITY_MONITORING_GUIDE.md"
else
    echo "⚠️  Some services are not enabled"
    echo ""
    echo "📖 Enable missing services:"
    
    if ! aws securityhub describe-hub --region "$REGION" &> /dev/null; then
        echo "   • Security Hub: ./scripts/enable-security-hub.sh"
    fi
    
    if [ "$DETECTOR_ID" == "None" ] || [ -z "$DETECTOR_ID" ]; then
        echo "   • GuardDuty: ./scripts/enable-guardduty.sh"
    fi
    
    if [ -z "$ANALYZER_ARN" ]; then
        echo "   • Access Analyzer: ./scripts/enable-access-analyzer.sh"
    fi
fi
echo ""
