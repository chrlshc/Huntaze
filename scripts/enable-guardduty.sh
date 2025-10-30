#!/bin/bash

# Enable AWS GuardDuty with EventBridge integration
# Usage: ./scripts/enable-guardduty.sh

set -e

REGION="us-east-1"
SNS_TOPIC_NAME="huntaze-production-alerts"

echo "🛡️  Enabling AWS GuardDuty..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Check if GuardDuty is already enabled
echo "2️⃣ Checking GuardDuty status..."
DETECTOR_ID=$(aws guardduty list-detectors --region "$REGION" --query 'DetectorIds[0]' --output text 2>/dev/null || echo "None")

if [ "$DETECTOR_ID" != "None" ] && [ -n "$DETECTOR_ID" ]; then
    echo "✅ GuardDuty already enabled"
    echo "   Detector ID: $DETECTOR_ID"
else
    echo "📦 Enabling GuardDuty..."
    
    DETECTOR_ID=$(aws guardduty create-detector \
        --enable \
        --finding-publishing-frequency FIFTEEN_MINUTES \
        --region "$REGION" \
        --query 'DetectorId' \
        --output text)
    
    if [ -n "$DETECTOR_ID" ]; then
        echo "✅ GuardDuty enabled successfully"
        echo "   Detector ID: $DETECTOR_ID"
    else
        echo "❌ Failed to enable GuardDuty"
        exit 1
    fi
fi
echo ""

# Get SNS Topic ARN
echo "3️⃣ Getting SNS Topic ARN..."
SNS_TOPIC_ARN=$(aws sns list-topics \
    --region "$REGION" \
    --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" \
    --output text)

if [ -z "$SNS_TOPIC_ARN" ]; then
    echo "❌ SNS Topic not found: $SNS_TOPIC_NAME"
    echo "   Deploy the SAM template first"
    exit 1
fi

echo "✅ SNS Topic: $SNS_TOPIC_ARN"
echo ""

# Create EventBridge rule for GuardDuty findings
echo "4️⃣ Creating EventBridge rule for GuardDuty findings..."
RULE_NAME="huntaze-guardduty-findings"

# Check if rule exists
if aws events describe-rule --name "$RULE_NAME" --region "$REGION" &> /dev/null; then
    echo "✅ EventBridge rule already exists"
else
    echo "📦 Creating EventBridge rule..."
    
    aws events put-rule \
        --name "$RULE_NAME" \
        --description "Route GuardDuty HIGH/CRITICAL findings to SNS" \
        --event-pattern '{
          "source": ["aws.guardduty"],
          "detail-type": ["GuardDuty Finding"],
          "detail": {
            "severity": [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
          }
        }' \
        --state ENABLED \
        --region "$REGION" > /dev/null
    
    echo "✅ EventBridge rule created"
fi
echo ""

# Add SNS target to EventBridge rule
echo "5️⃣ Adding SNS target to EventBridge rule..."

# Check if target already exists
EXISTING_TARGETS=$(aws events list-targets-by-rule \
    --rule "$RULE_NAME" \
    --region "$REGION" \
    --query 'Targets[?Arn==`'"$SNS_TOPIC_ARN"'`].Id' \
    --output text)

if [ -n "$EXISTING_TARGETS" ]; then
    echo "✅ SNS target already configured"
else
    echo "📦 Adding SNS target..."
    
    aws events put-targets \
        --rule "$RULE_NAME" \
        --region "$REGION" \
        --targets "Id"="1","Arn"="$SNS_TOPIC_ARN" > /dev/null
    
    echo "✅ SNS target added"
fi
echo ""

# Add SNS topic policy to allow EventBridge
echo "6️⃣ Updating SNS topic policy..."

POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEventBridgePublish",
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "SNS:Publish",
      "Resource": "'"$SNS_TOPIC_ARN"'"
    }
  ]
}'

# Get existing policy
EXISTING_POLICY=$(aws sns get-topic-attributes \
    --topic-arn "$SNS_TOPIC_ARN" \
    --region "$REGION" \
    --query 'Attributes.Policy' \
    --output text 2>/dev/null || echo "{}")

# Check if EventBridge permission already exists
if echo "$EXISTING_POLICY" | grep -q "events.amazonaws.com"; then
    echo "✅ SNS policy already allows EventBridge"
else
    echo "📦 Adding EventBridge permission to SNS..."
    
    aws sns set-topic-attributes \
        --topic-arn "$SNS_TOPIC_ARN" \
        --attribute-name Policy \
        --attribute-value "$POLICY" \
        --region "$REGION"
    
    echo "✅ SNS policy updated"
fi
echo ""

# Get initial findings count
echo "7️⃣ Checking for findings..."
FINDINGS_COUNT=$(aws guardduty list-findings \
    --detector-id "$DETECTOR_ID" \
    --region "$REGION" \
    --query 'FindingIds | length(@)' \
    --output text 2>/dev/null || echo "0")

echo "   Current findings: $FINDINGS_COUNT"
echo "   New findings will appear within 15 minutes"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GuardDuty Enabled Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 What was enabled:"
echo "   • GuardDuty detector (15-minute findings)"
echo "   • EventBridge rule for HIGH/CRITICAL findings (severity >= 7)"
echo "   • SNS notifications to $SNS_TOPIC_NAME"
echo ""
echo "📧 Alert Configuration:"
echo "   • Severity 7.0-8.9: HIGH findings"
echo "   • Severity >= 8.0: CRITICAL findings"
echo "   • Frequency: Every 15 minutes"
echo ""
echo "📖 Next Steps:"
echo "   1. View findings: https://console.aws.amazon.com/guardduty/home?region=$REGION#/findings"
echo "   2. Enable IAM Access Analyzer: ./scripts/enable-access-analyzer.sh"
echo "   3. Review findings daily for first week"
echo ""
echo "💰 Cost:"
echo "   • GuardDuty: ~\$4.60 per million events = ~\$5-15/month"
echo "   • ⚠️ First 30 days: FREE TRIAL per région/protection"
echo "   • Coût démarre automatiquement après 30 jours"
echo "   • Utile pour affiner le budget par palier"
echo ""
echo "📊 Free Trial Monitoring:"
echo "   • Vérifier les coûts dans Cost Explorer après 30j"
echo "   • Désactiver si coût trop élevé: aws guardduty delete-detector --detector-id $DETECTOR_ID"
echo ""
echo "🔍 Detection Types:"
echo "   • Reconnaissance (port scanning, unusual API calls)"
echo "   • Instance compromise (malware, crypto mining)"
echo "   • Account compromise (credential exfiltration)"
echo "   • Bucket compromise (suspicious S3 access)"
echo ""
