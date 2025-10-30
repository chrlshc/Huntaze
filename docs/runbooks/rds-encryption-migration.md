# RDS Encryption Migration Runbook

## Overview

This runbook covers the process of migrating an unencrypted RDS PostgreSQL instance to an encrypted one using the snapshot-copy-restore pattern.

**Important:** This is a **zero-downtime migration** if done correctly with proper planning.

## Prerequisites

- [ ] RDS instance is in `available` state
- [ ] Recent backup exists (< 24 hours old)
- [ ] Maintenance window scheduled
- [ ] Application can handle brief connection interruption
- [ ] DNS/endpoint update process documented
- [ ] Rollback plan prepared

## Migration Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  RDS Encryption Migration                    │
│                                                              │
│  1. Create Snapshot    2. Copy with KMS    3. Restore       │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │ Unencrypted  │────▶│  Encrypted   │───▶│  Encrypted   │ │
│  │   Instance   │     │   Snapshot   │    │   Instance   │ │
│  └──────────────┘     └──────────────┘    └──────────────┘ │
│         │                                         │          │
│         │                                         │          │
│         ▼                                         ▼          │
│  Keep running                            Update endpoint    │
│  during migration                        in application     │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Procedure

### Phase 1: Pre-Migration (30 minutes)

#### 1.1 Verify Current State

```bash
# Get current RDS instance details
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1 \
  --query 'DBInstances[0].{Encrypted:StorageEncrypted,Engine:Engine,Version:EngineVersion,Class:DBInstanceClass,Storage:AllocatedStorage,MultiAZ:MultiAZ}'

# Check if encryption is already enabled
ENCRYPTED=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1 \
  --query 'DBInstances[0].StorageEncrypted' \
  --output text)

if [ "$ENCRYPTED" = "true" ]; then
  echo "✓ Instance is already encrypted"
  exit 0
else
  echo "⚠ Instance is NOT encrypted - proceeding with migration"
fi
```

#### 1.2 Create Pre-Migration Backup

```bash
# Create manual snapshot before migration
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-postgres-production \
  --db-snapshot-identifier huntaze-postgres-pre-encryption-$(date +%Y%m%d-%H%M) \
  --region us-east-1

# Wait for snapshot to complete
aws rds wait db-snapshot-available \
  --db-snapshot-identifier huntaze-postgres-pre-encryption-$(date +%Y%m%d-%H%M) \
  --region us-east-1

echo "✓ Pre-migration snapshot created"
```

#### 1.3 Document Current Configuration

```bash
# Export current configuration
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1 > /tmp/rds-config-backup-$(date +%Y%m%d-%H%M).json

echo "✓ Configuration backed up to /tmp/rds-config-backup-$(date +%Y%m%d-%H%M).json"
```

### Phase 2: Create Encrypted Snapshot (15 minutes)

#### 2.1 Get KMS Key

```bash
# Get or create KMS key for RDS encryption
KMS_KEY_ID=$(aws kms list-aliases \
  --region us-east-1 \
  --query 'Aliases[?AliasName==`alias/huntaze-rds-encryption`].TargetKeyId' \
  --output text)

if [ -z "$KMS_KEY_ID" ]; then
  echo "⚠ KMS key not found - creating new key"
  # Create via Terraform or manually
  cd infra/terraform/production-hardening
  terraform apply -target=aws_kms_key.rds_encryption
  
  KMS_KEY_ID=$(terraform output -raw rds_encryption_kms_key_id)
fi

echo "✓ Using KMS Key: $KMS_KEY_ID"
```

#### 2.2 Create Snapshot from Current Instance

```bash
# Create snapshot
SNAPSHOT_ID="huntaze-postgres-encryption-source-$(date +%Y%m%d-%H%M)"

aws rds create-db-snapshot \
  --db-instance-identifier huntaze-postgres-production \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region us-east-1

echo "Creating snapshot: $SNAPSHOT_ID"

# Wait for completion (can take 5-15 minutes depending on size)
aws rds wait db-snapshot-available \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region us-east-1

echo "✓ Snapshot created: $SNAPSHOT_ID"
```

#### 2.3 Copy Snapshot with Encryption

```bash
# Copy snapshot with KMS encryption
ENCRYPTED_SNAPSHOT_ID="huntaze-postgres-encrypted-$(date +%Y%m%d-%H%M)"

aws rds copy-db-snapshot \
  --source-db-snapshot-identifier "$SNAPSHOT_ID" \
  --target-db-snapshot-identifier "$ENCRYPTED_SNAPSHOT_ID" \
  --kms-key-id "$KMS_KEY_ID" \
  --region us-east-1

echo "Copying snapshot with encryption: $ENCRYPTED_SNAPSHOT_ID"

# Wait for completion (can take 10-30 minutes depending on size)
aws rds wait db-snapshot-available \
  --db-snapshot-identifier "$ENCRYPTED_SNAPSHOT_ID" \
  --region us-east-1

echo "✓ Encrypted snapshot created: $ENCRYPTED_SNAPSHOT_ID"
```

### Phase 3: Restore Encrypted Instance (30 minutes)

#### 3.1 Prepare Restore Configuration

```bash
# Get current instance details for restore
CURRENT_CONFIG=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1 \
  --query 'DBInstances[0]')

DB_SUBNET_GROUP=$(echo "$CURRENT_CONFIG" | jq -r '.DBSubnetGroup.DBSubnetGroupName')
VPC_SECURITY_GROUPS=$(echo "$CURRENT_CONFIG" | jq -r '.VpcSecurityGroups[].VpcSecurityGroupId' | tr '\n' ' ')
DB_PARAMETER_GROUP=$(echo "$CURRENT_CONFIG" | jq -r '.DBParameterGroups[0].DBParameterGroupName')
INSTANCE_CLASS=$(echo "$CURRENT_CONFIG" | jq -r '.DBInstanceClass')
MULTI_AZ=$(echo "$CURRENT_CONFIG" | jq -r '.MultiAZ')

echo "Configuration for restore:"
echo "  Subnet Group: $DB_SUBNET_GROUP"
echo "  Security Groups: $VPC_SECURITY_GROUPS"
echo "  Parameter Group: $DB_PARAMETER_GROUP"
echo "  Instance Class: $INSTANCE_CLASS"
echo "  Multi-AZ: $MULTI_AZ"
```

#### 3.2 Restore from Encrypted Snapshot

```bash
# Restore to new instance
NEW_INSTANCE_ID="huntaze-postgres-encrypted"

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --db-snapshot-identifier "$ENCRYPTED_SNAPSHOT_ID" \
  --db-instance-class "$INSTANCE_CLASS" \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --vpc-security-group-ids $VPC_SECURITY_GROUPS \
  --db-parameter-group-name "$DB_PARAMETER_GROUP" \
  --multi-az \
  --publicly-accessible false \
  --deletion-protection true \
  --enable-iam-database-authentication \
  --enable-cloudwatch-logs-exports postgresql upgrade \
  --enable-performance-insights \
  --performance-insights-kms-key-id "$KMS_KEY_ID" \
  --region us-east-1

echo "Restoring encrypted instance: $NEW_INSTANCE_ID"

# Wait for instance to be available (can take 10-20 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --region us-east-1

echo "✓ Encrypted instance available: $NEW_INSTANCE_ID"
```

#### 3.3 Get New Endpoint

```bash
# Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

NEW_PORT=$(aws rds describe-db-instances \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)

echo "✓ New endpoint: $NEW_ENDPOINT:$NEW_PORT"
```

### Phase 4: Validation (15 minutes)

#### 4.1 Verify Encryption

```bash
# Verify encryption is enabled
ENCRYPTION_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --region us-east-1 \
  --query 'DBInstances[0].{Encrypted:StorageEncrypted,KmsKey:KmsKeyId}')

echo "Encryption status:"
echo "$ENCRYPTION_STATUS" | jq .

# Should show: Encrypted: true
```

#### 4.2 Test Database Connection

```bash
# Test connection with TLS
psql "host=$NEW_ENDPOINT port=$NEW_PORT dbname=huntaze user=postgres sslmode=require" \
  -c "SELECT version();"

# Verify TLS is enforced
psql "host=$NEW_ENDPOINT port=$NEW_PORT dbname=huntaze user=postgres sslmode=disable" \
  -c "SELECT version();" 2>&1 | grep -q "SSL connection is required" && \
  echo "✓ TLS is enforced" || echo "⚠ TLS not enforced"
```

#### 4.3 Verify Data Integrity

```bash
# Compare row counts between old and new
OLD_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Get table counts from old instance
psql "host=$OLD_ENDPOINT dbname=huntaze user=postgres sslmode=prefer" \
  -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" \
  > /tmp/old-counts.txt

# Get table counts from new instance
psql "host=$NEW_ENDPOINT dbname=huntaze user=postgres sslmode=require" \
  -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;" \
  > /tmp/new-counts.txt

# Compare
diff /tmp/old-counts.txt /tmp/new-counts.txt && \
  echo "✓ Data integrity verified" || \
  echo "⚠ Data mismatch detected - review differences"
```

### Phase 5: Application Cutover (15 minutes)

#### 5.1 Update Application Configuration

**Option A: Update ECS Task Definition**

```bash
# Update task definition with new endpoint
aws ecs describe-task-definition \
  --task-definition huntaze-api \
  --query 'taskDefinition' > /tmp/task-def.json

# Edit task-def.json to update DATABASE_URL
# Change: huntaze-postgres-production.xxx.rds.amazonaws.com
# To: huntaze-postgres-encrypted.xxx.rds.amazonaws.com

# Register new task definition
aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json

# Update service
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --task-definition huntaze-api:NEW_REVISION \
  --force-new-deployment
```

**Option B: Update Secrets Manager**

```bash
# Update DATABASE_URL in Secrets Manager
aws secretsmanager update-secret \
  --secret-id huntaze/database/url \
  --secret-string "postgresql://user:pass@$NEW_ENDPOINT:$NEW_PORT/huntaze?sslmode=require" \
  --region us-east-1

# Restart ECS tasks to pick up new secret
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --force-new-deployment
```

#### 5.2 Monitor Application

```bash
# Watch ECS service deployment
aws ecs describe-services \
  --cluster huntaze-cluster \
  --services huntaze-api \
  --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}'

# Check application logs
aws logs tail /aws/ecs/huntaze-api --follow

# Monitor RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=$NEW_INSTANCE_ID \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

### Phase 6: Cleanup (After 24-48 hours)

#### 6.1 Verify Stability

- [ ] Application running normally for 24-48 hours
- [ ] No database connection errors
- [ ] Performance metrics normal
- [ ] All features working

#### 6.2 Delete Old Instance

```bash
# Create final snapshot of old instance
aws rds create-db-snapshot \
  --db-instance-identifier huntaze-postgres-production \
  --db-snapshot-identifier huntaze-postgres-final-before-deletion-$(date +%Y%m%d) \
  --region us-east-1

# Wait for snapshot
aws rds wait db-snapshot-available \
  --db-snapshot-identifier huntaze-postgres-final-before-deletion-$(date +%Y%m%d) \
  --region us-east-1

# Delete old instance (skip final snapshot since we just created one)
aws rds delete-db-instance \
  --db-instance-identifier huntaze-postgres-production \
  --skip-final-snapshot \
  --region us-east-1

echo "✓ Old instance deleted"
```

#### 6.3 Cleanup Snapshots

```bash
# List all snapshots
aws rds describe-db-snapshots \
  --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `huntaze-postgres`)].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Size:AllocatedStorage}' \
  --output table

# Delete intermediate snapshots (keep final ones)
aws rds delete-db-snapshot \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region us-east-1

echo "✓ Intermediate snapshots cleaned up"
```

## Rollback Procedure

If issues occur during migration:

### Immediate Rollback (< 5 minutes)

```bash
# Revert application to old endpoint
aws ecs update-service \
  --cluster huntaze-cluster \
  --service huntaze-api \
  --task-definition huntaze-api:OLD_REVISION \
  --force-new-deployment

# Or update Secrets Manager back
aws secretsmanager update-secret \
  --secret-id huntaze/database/url \
  --secret-string "postgresql://user:pass@$OLD_ENDPOINT:$OLD_PORT/huntaze" \
  --region us-east-1
```

### Full Rollback (if new instance has issues)

```bash
# Delete new instance
aws rds delete-db-instance \
  --db-instance-identifier "$NEW_INSTANCE_ID" \
  --skip-final-snapshot \
  --region us-east-1

# Continue using old instance
echo "Rolled back to old instance: huntaze-postgres-production"
```

## Troubleshooting

### Issue: Snapshot taking too long

**Cause:** Large database size  
**Solution:** Schedule during low-traffic period, or use read replica for snapshot

### Issue: Connection refused after cutover

**Cause:** Security group not updated  
**Solution:**
```bash
# Verify security group allows connections
aws ec2 describe-security-groups \
  --group-ids $VPC_SECURITY_GROUPS \
  --query 'SecurityGroups[0].IpPermissions'
```

### Issue: TLS connection fails

**Cause:** Application not configured for TLS  
**Solution:**
```bash
# Update connection string with sslmode=require
# Download RDS CA certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Test with certificate
psql "host=$NEW_ENDPOINT sslmode=verify-full sslrootcert=global-bundle.pem"
```

### Issue: Performance degradation

**Cause:** Instance not warmed up  
**Solution:**
```bash
# Run ANALYZE on all tables
psql "host=$NEW_ENDPOINT dbname=huntaze user=postgres sslmode=require" \
  -c "ANALYZE;"

# Check for missing indexes
psql "host=$NEW_ENDPOINT dbname=huntaze user=postgres sslmode=require" \
  -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public';"
```

## Cost Impact

- **Snapshot storage:** ~$0.095/GB-month
- **Encrypted instance:** Same cost as unencrypted
- **KMS key:** $1/month
- **Performance Insights:** $0.00648/vCPU-hour (optional)

**Total additional cost:** ~$2-5/month

## Success Criteria

- [ ] New instance is encrypted (StorageEncrypted = true)
- [ ] TLS is enforced (rds.force_ssl = 1)
- [ ] Application connects successfully
- [ ] Data integrity verified
- [ ] Performance metrics normal
- [ ] No connection errors in logs
- [ ] Old instance deleted after 24-48 hours

---

**Last Updated:** 2025-10-28  
**Version:** 1.0  
**Owner:** Database Team
