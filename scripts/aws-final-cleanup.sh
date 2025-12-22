#!/bin/bash
# ============================================================================
# AWS Final Cleanup - Remove Remaining Unused Resources
# ============================================================================
# This script removes the last remaining unused resources identified
# ============================================================================

set -e

echo "🧹 AWS Final Cleanup"
echo "===================="
echo ""

# Credentials: use the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS credentials not configured or expired."
  echo "   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry."
  exit 1
fi

LOG_FILE="aws-final-cleanup-$(date +%Y%m%d-%H%M%S).log"

echo "📝 Log file: $LOG_FILE"
echo ""

# Function to execute with logging
execute() {
    local description=$1
    local command=$2
    
    echo "▶ $description" | tee -a "$LOG_FILE"
    if eval "$command" 2>&1 | tee -a "$LOG_FILE"; then
        echo "✅ Success" | tee -a "$LOG_FILE"
        return 0
    else
        echo "⚠️  Failed or already deleted" | tee -a "$LOG_FILE"
        return 1
    fi
    echo "" | tee -a "$LOG_FILE"
}

# ============================================================================
# 1. Delete Empty ECS Cluster (us-east-2)
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "1. Delete Empty ECS Cluster"
echo "Expected Savings: ~$5/mois"
echo "═══════════════════════════════════════"
echo ""

read -p "Delete empty cluster 'huntaze-ai-router' in us-east-2? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    execute \
        "Deleting empty cluster huntaze-ai-router" \
        "aws ecs delete-cluster \
            --cluster huntaze-ai-router \
            --region us-east-2"
fi

# ============================================================================
# 2. Delete EventBridge Rule (eu-west-1)
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "2. Delete Unused EventBridge Rule"
echo "Expected Savings: ~$1/mois"
echo "═══════════════════════════════════════"
echo ""

read -p "Delete EventBridge rule 'ai-insights-ready' in eu-west-1? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    execute \
        "Deleting EventBridge rule ai-insights-ready" \
        "aws events delete-rule \
            --name ai-insights-ready \
            --region eu-west-1 \
            --force"
fi

# ============================================================================
# 3. Delete SQS DLQ (eu-west-1) - Optional
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "3. Delete Unused SQS Queue (Optional)"
echo "Expected Savings: ~$0.50/mois"
echo "═══════════════════════════════════════"
echo ""

read -p "Delete SQS queue 'ai-team-eventbridge-dlq' in eu-west-1? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    queue_url=$(aws sqs get-queue-url \
        --queue-name ai-team-eventbridge-dlq \
        --region eu-west-1 \
        --query 'QueueUrl' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$queue_url" ]; then
        execute \
            "Deleting SQS queue ai-team-eventbridge-dlq" \
            "aws sqs delete-queue \
                --queue-url '$queue_url' \
                --region eu-west-1"
    fi
fi

# ============================================================================
# 4. Delete Unused Secrets (eu-west-1) - Optional
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "4. Delete Legacy Secrets (Optional)"
echo "Expected Savings: ~$0.80/mois"
echo "═══════════════════════════════════════"
echo ""

read -p "Delete legacy secrets in eu-west-1 (ai-team/*)? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    # Export before deletion
    mkdir -p secrets-backup-eu
    
    for secret in "ai-team/database-url" "ai-team/azure-openai"; do
        aws secretsmanager get-secret-value \
            --secret-id "$secret" \
            --region eu-west-1 \
            --output json > "secrets-backup-eu/${secret//\//-}.json" 2>/dev/null || true
    done
    
    execute \
        "Deleting ai-team/database-url" \
        "aws secretsmanager delete-secret \
            --secret-id ai-team/database-url \
            --force-delete-without-recovery \
            --region eu-west-1"
    
    execute \
        "Deleting ai-team/azure-openai" \
        "aws secretsmanager delete-secret \
            --secret-id ai-team/azure-openai \
            --force-delete-without-recovery \
            --region eu-west-1"
fi

# ============================================================================
# 5. Delete Old CloudWatch Log Streams
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "5. Clean Old Log Streams"
echo "Expected Savings: ~$2-5/mois"
echo "═══════════════════════════════════════"
echo ""

read -p "Delete log streams older than 7 days? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    for region in "us-east-2" "us-east-1" "eu-west-1"; do
        echo "Cleaning logs in $region..."
        
        log_groups=$(aws logs describe-log-groups \
            --region $region \
            --query 'logGroups[].logGroupName' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$log_groups" ]; then
            for log_group in $log_groups; do
                # Delete streams older than 7 days
                cutoff_date=$(date -u -d '7 days ago' +%s)000 2>/dev/null || cutoff_date=$(date -u -v-7d +%s)000
                old_streams=$(aws logs describe-log-streams \
                    --log-group-name "$log_group" \
                    --region $region \
                    --query "logStreams[?lastEventTime<\`$cutoff_date\`].logStreamName" \
                    --output text 2>/dev/null || echo "")
                
                if [ -n "$old_streams" ]; then
                    for stream in $old_streams; do
                        execute \
                            "Delete old stream $stream from $log_group" \
                            "aws logs delete-log-stream \
                                --log-group-name '$log_group' \
                                --log-stream-name '$stream' \
                                --region $region"
                    done
                fi
            done
        fi
    done
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "✅ FINAL CLEANUP COMPLETE"
echo "═══════════════════════════════════════"
echo ""
echo "Additional Savings: ~$10-15/mois"
echo "Total Monthly Cost: ~$65-85/mois"
echo ""
echo "Log saved to: $LOG_FILE"
echo ""
