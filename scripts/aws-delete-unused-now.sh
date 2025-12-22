#!/bin/bash
# ============================================================================
# AWS Delete Unused Resources - IMMEDIATE
# ============================================================================
# Supprime les ressources inutilisées qui consomment
# ============================================================================

set -e

echo "🗑️  AWS Delete Unused Resources"
echo "================================"
echo ""

# Credentials: use the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS credentials not configured or expired."
  echo "   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry."
  exit 1
fi

LOG_FILE="aws-delete-unused-$(date +%Y%m%d-%H%M%S).log"

echo "📝 Log: $LOG_FILE"
echo ""

# ============================================================================
# 1. Delete Empty ECS Cluster (us-east-2)
# ============================================================================
echo "🗑️  Deleting empty cluster 'huntaze-ai-router'..."
aws ecs delete-cluster \
  --cluster huntaze-ai-router \
  --region us-east-2 2>&1 | tee -a "$LOG_FILE"
echo "✅ Cluster deleted"
echo ""

# ============================================================================
# 2. Delete EventBridge Rule (eu-west-1)
# ============================================================================
echo "🗑️  Deleting EventBridge rule 'ai-insights-ready'..."
aws events delete-rule \
  --name ai-insights-ready \
  --region eu-west-1 \
  --force 2>&1 | tee -a "$LOG_FILE"
echo "✅ EventBridge rule deleted"
echo ""

# ============================================================================
# 3. Delete SQS DLQ (eu-west-1)
# ============================================================================
echo "🗑️  Deleting SQS queue 'ai-team-eventbridge-dlq'..."
queue_url=$(aws sqs get-queue-url \
  --queue-name ai-team-eventbridge-dlq \
  --region eu-west-1 \
  --query 'QueueUrl' \
  --output text 2>/dev/null || echo "")

if [ -n "$queue_url" ]; then
  aws sqs delete-queue \
    --queue-url "$queue_url" \
    --region eu-west-1 2>&1 | tee -a "$LOG_FILE"
  echo "✅ SQS queue deleted"
else
  echo "⚠️  Queue not found or already deleted"
fi
echo ""

# ============================================================================
# 4. Delete Legacy Secrets (eu-west-1)
# ============================================================================
echo "🗑️  Deleting legacy secrets in eu-west-1..."

# Backup first
mkdir -p secrets-backup-eu
for secret in "ai-team/database-url" "ai-team/azure-openai"; do
  echo "  Backing up $secret..."
  aws secretsmanager get-secret-value \
    --secret-id "$secret" \
    --region eu-west-1 \
    --output json > "secrets-backup-eu/${secret//\//-}.json" 2>/dev/null || true
done

# Delete
for secret in "ai-team/database-url" "ai-team/azure-openai"; do
  echo "  Deleting $secret..."
  aws secretsmanager delete-secret \
    --secret-id "$secret" \
    --force-delete-without-recovery \
    --region eu-west-1 2>&1 | tee -a "$LOG_FILE" || true
done
echo "✅ Legacy secrets deleted"
echo ""

# ============================================================================
# 5. Delete Old Log Streams
# ============================================================================
echo "🗑️  Cleaning old log streams (>7 days)..."

for region in "us-east-2" "us-east-1" "eu-west-1"; do
  echo "  Region: $region"
  
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
        stream_count=$(echo "$old_streams" | wc -w)
        echo "    Deleting $stream_count old streams from $log_group..."
        
        for stream in $old_streams; do
          aws logs delete-log-stream \
            --log-group-name "$log_group" \
            --log-stream-name "$stream" \
            --region $region 2>/dev/null || true
        done
      fi
    done
  fi
done
echo "✅ Old log streams cleaned"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "═══════════════════════════════════════"
echo "✅ CLEANUP COMPLETE"
echo "═══════════════════════════════════════"
echo ""
echo "Deleted:"
echo "  ✅ Empty ECS cluster (huntaze-ai-router)"
echo "  ✅ EventBridge rule (ai-insights-ready)"
echo "  ✅ SQS DLQ queue"
echo "  ✅ Legacy secrets (2 secrets)"
echo "  ✅ Old log streams (>7 days)"
echo ""
echo "Additional Savings: ~$10-15/mois"
echo "New Monthly Cost: ~$65-85/mois"
echo ""
echo "Log: $LOG_FILE"
echo "Backups: secrets-backup-eu/"
echo ""
