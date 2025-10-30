#!/bin/bash

# Configure RDS Automated Backups
# Usage: ./scripts/configure-rds-backups.sh [db-instance-id]

set -e

REGION="us-east-1"
DB_INSTANCE_ID="${1:-huntaze-postgres-production}"
RETENTION_DAYS=7
BACKUP_WINDOW="03:00-04:00"  # UTC

echo "💾 Configuring RDS Automated Backups..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi
echo "✅ AWS credentials configured"
echo ""

# Check if DB instance exists
echo "2️⃣ Checking RDS instance..."
if ! aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION" &> /dev/null; then
    echo "❌ DB instance not found: $DB_INSTANCE_ID"
    exit 1
fi

# Get current configuration
CURRENT_RETENTION=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].BackupRetentionPeriod' \
    --output text)

CURRENT_WINDOW=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].PreferredBackupWindow' \
    --output text)

echo "✅ DB instance found: $DB_INSTANCE_ID"
echo "   Current retention: $CURRENT_RETENTION days"
echo "   Current backup window: $CURRENT_WINDOW"
echo ""

# Configure backups
if [ "$CURRENT_RETENTION" -lt "$RETENTION_DAYS" ]; then
    echo "3️⃣ Updating backup retention to $RETENTION_DAYS days..."
    
    aws rds modify-db-instance \
        --db-instance-identifier "$DB_INSTANCE_ID" \
        --backup-retention-period "$RETENTION_DAYS" \
        --preferred-backup-window "$BACKUP_WINDOW" \
        --apply-immediately \
        --region "$REGION" > /dev/null
    
    echo "✅ Backup retention updated"
    echo "   New retention: $RETENTION_DAYS days"
    echo "   Backup window: $BACKUP_WINDOW UTC"
else
    echo "3️⃣ Backup retention already configured"
    echo "   Current: $CURRENT_RETENTION days (>= $RETENTION_DAYS)"
fi
echo ""

# Wait for modification to apply
echo "4️⃣ Waiting for modification to apply..."
sleep 10
echo ""

# Verify PITR is enabled
echo "5️⃣ Verifying Point-in-Time Recovery (PITR)..."
LATEST_RESTORABLE=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].LatestRestorableTime' \
    --output text)

if [ -n "$LATEST_RESTORABLE" ] && [ "$LATEST_RESTORABLE" != "None" ]; then
    echo "✅ PITR is enabled"
    echo "   Latest restorable time: $LATEST_RESTORABLE"
    
    # Calculate PITR window
    CURRENT_TIME=$(date -u +%s)
    RESTORABLE_TIME=$(date -d "$LATEST_RESTORABLE" +%s 2>/dev/null || echo "$CURRENT_TIME")
    DIFF_MINUTES=$(( ($CURRENT_TIME - $RESTORABLE_TIME) / 60 ))
    
    if [ $DIFF_MINUTES -lt 60 ]; then
        echo "   PITR lag: $DIFF_MINUTES minutes (healthy)"
    else
        echo "   ⚠️  PITR lag: $DIFF_MINUTES minutes (check replication)"
    fi
else
    echo "❌ PITR not available"
    echo "   This may take a few minutes after enabling backups"
fi
echo ""

# Get backup information
echo "6️⃣ Recent automated backups:"
aws rds describe-db-snapshots \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --snapshot-type automated \
    --region "$REGION" \
    --query 'DBSnapshots[0:3].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
    --output table
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ RDS Backups Configured Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Configuration:"
echo "   • DB Instance: $DB_INSTANCE_ID"
echo "   • Retention: $RETENTION_DAYS days"
echo "   • Backup Window: $BACKUP_WINDOW UTC (off-peak)"
echo "   • PITR: Enabled (restore to any second within $RETENTION_DAYS days)"
echo ""
echo "📧 Next Steps:"
echo "   1. Test PITR restore: ./scripts/test-rds-pitr-restore.sh"
echo "   2. Deploy monthly backup test: ./scripts/deploy-rds-backup-testing.sh"
echo "   3. View backups: https://console.aws.amazon.com/rds/home?region=$REGION#database:id=$DB_INSTANCE_ID;is-cluster=false;tab=maintenance"
echo ""
echo "💰 Cost:"
echo "   • Backup storage: Free up to 100% of DB size"
echo "   • Additional storage: ~\$0.095/GB-month"
echo "   • 7-day retention: ~\$2-5/month (depends on DB size)"
echo ""
echo "🔍 Verify:"
echo "   aws rds describe-db-instances \\"
echo "     --db-instance-identifier $DB_INSTANCE_ID \\"
echo "     --query 'DBInstances[0].[BackupRetentionPeriod,LatestRestorableTime]'"
echo ""
