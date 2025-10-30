#!/bin/bash
# RDS Encryption Migration Script
# Migrates an unencrypted RDS instance to encrypted via snapshot/restore

set -e

REGION="us-east-1"
ACCOUNT_ID="317805897534"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 RDS ENCRYPTION MIGRATION${NC}"
echo "============================"
echo ""

# Check for required parameters
if [ -z "$1" ]; then
    echo -e "${RED}Error: DB instance identifier required${NC}"
    echo ""
    echo "Usage: $0 <db-instance-identifier> [kms-key-id]"
    echo ""
    echo "Example:"
    echo "  $0 huntaze-db"
    echo "  $0 huntaze-db arn:aws:kms:us-east-1:123456789012:key/abc-123"
    echo ""
    echo "Available unencrypted instances:"
    aws rds describe-db-instances \
        --region "$REGION" \
        --query 'DBInstances[?StorageEncrypted==`false`].{ID:DBInstanceIdentifier,Engine:Engine,Size:AllocatedStorage}' \
        --output table
    exit 1
fi

DB_INSTANCE_ID="$1"
KMS_KEY_ID="${2:-alias/aws/rds}"  # Default to AWS managed key

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SNAPSHOT_ID="${DB_INSTANCE_ID}-pre-encrypt-${TIMESTAMP}"
ENCRYPTED_SNAPSHOT_ID="${DB_INSTANCE_ID}-encrypted-${TIMESTAMP}"
NEW_DB_ID="${DB_INSTANCE_ID}-encrypted"

echo "Configuration:"
echo "  Source DB: $DB_INSTANCE_ID"
echo "  New DB: $NEW_DB_ID"
echo "  KMS Key: $KMS_KEY_ID"
echo "  Region: $REGION"
echo ""

# Verify DB exists and is not encrypted
echo "🔍 Verifying source database..."
DB_INFO=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --region "$REGION" \
    --output json 2>/dev/null || echo "")

if [ -z "$DB_INFO" ]; then
    echo -e "${RED}❌ Database $DB_INSTANCE_ID not found${NC}"
    exit 1
fi

IS_ENCRYPTED=$(echo "$DB_INFO" | jq -r '.DBInstances[0].StorageEncrypted')
if [ "$IS_ENCRYPTED" = "true" ]; then
    echo -e "${GREEN}✅ Database is already encrypted${NC}"
    exit 0
fi

DB_SUBNET_GROUP=$(echo "$DB_INFO" | jq -r '.DBInstances[0].DBSubnetGroup.DBSubnetGroupName')
DB_SECURITY_GROUPS=$(echo "$DB_INFO" | jq -r '.DBInstances[0].VpcSecurityGroups[].VpcSecurityGroupId' | tr '\n' ' ')
DB_PARAMETER_GROUP=$(echo "$DB_INFO" | jq -r '.DBInstances[0].DBParameterGroups[0].DBParameterGroupName')
DB_INSTANCE_CLASS=$(echo "$DB_INFO" | jq -r '.DBInstances[0].DBInstanceClass')
MULTI_AZ=$(echo "$DB_INFO" | jq -r '.DBInstances[0].MultiAZ')

echo -e "${GREEN}✅ Database found and verified${NC}"
echo "  Instance Class: $DB_INSTANCE_CLASS"
echo "  Multi-AZ: $MULTI_AZ"
echo "  Subnet Group: $DB_SUBNET_GROUP"
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This operation will:${NC}"
echo "  1. Create a snapshot of the current database"
echo "  2. Copy the snapshot with encryption enabled"
echo "  3. Restore a new encrypted instance"
echo "  4. Require manual cutover and cleanup"
echo ""
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Creating Snapshot${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📸 Creating snapshot: $SNAPSHOT_ID"
aws rds create-db-snapshot \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$REGION"

echo "⏳ Waiting for snapshot to complete..."
aws rds wait db-snapshot-completed \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region "$REGION"

echo -e "${GREEN}✅ Snapshot created successfully${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Creating Encrypted Copy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "🔐 Copying snapshot with encryption: $ENCRYPTED_SNAPSHOT_ID"
aws rds copy-db-snapshot \
    --source-db-snapshot-identifier "$SNAPSHOT_ID" \
    --target-db-snapshot-identifier "$ENCRYPTED_SNAPSHOT_ID" \
    --kms-key-id "$KMS_KEY_ID" \
    --copy-tags \
    --region "$REGION"

echo "⏳ Waiting for encrypted snapshot to complete..."
aws rds wait db-snapshot-completed \
    --db-snapshot-identifier "$ENCRYPTED_SNAPSHOT_ID" \
    --region "$REGION"

echo -e "${GREEN}✅ Encrypted snapshot created successfully${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Restoring Encrypted Instance${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "🚀 Restoring new encrypted instance: $NEW_DB_ID"

RESTORE_CMD="aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier $NEW_DB_ID \
    --db-snapshot-identifier $ENCRYPTED_SNAPSHOT_ID \
    --db-instance-class $DB_INSTANCE_CLASS \
    --db-subnet-group-name $DB_SUBNET_GROUP \
    --no-publicly-accessible \
    --region $REGION"

if [ "$MULTI_AZ" = "true" ]; then
    RESTORE_CMD="$RESTORE_CMD --multi-az"
fi

eval "$RESTORE_CMD"

echo "⏳ Waiting for instance to become available..."
aws rds wait db-instance-available \
    --db-instance-identifier "$NEW_DB_ID" \
    --region "$REGION"

echo -e "${GREEN}✅ Encrypted instance created successfully${NC}"
echo ""

# Apply security groups and parameter group
echo "🔧 Applying security groups and parameter group..."
aws rds modify-db-instance \
    --db-instance-identifier "$NEW_DB_ID" \
    --vpc-security-group-ids $DB_SECURITY_GROUPS \
    --db-parameter-group-name "$DB_PARAMETER_GROUP" \
    --apply-immediately \
    --region "$REGION" >/dev/null

echo -e "${GREEN}✅ Configuration applied${NC}"
echo ""

# Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$NEW_DB_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MIGRATION COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "New Encrypted Instance Details:"
echo "  Instance ID: $NEW_DB_ID"
echo "  Endpoint: $NEW_ENDPOINT"
echo "  Encryption: Enabled"
echo "  KMS Key: $KMS_KEY_ID"
echo ""
echo -e "${YELLOW}⚠️  MANUAL STEPS REQUIRED:${NC}"
echo ""
echo "1. Test the new encrypted instance:"
echo "   - Verify connectivity"
echo "   - Run smoke tests"
echo "   - Check application functionality"
echo ""
echo "2. Update application configuration:"
echo "   - Update database endpoint to: $NEW_ENDPOINT"
echo "   - Deploy configuration changes"
echo "   - Monitor for errors"
echo ""
echo "3. After successful cutover:"
echo "   - Delete old instance: aws rds delete-db-instance --db-instance-identifier $DB_INSTANCE_ID --skip-final-snapshot"
echo "   - Delete snapshots: aws rds delete-db-snapshot --db-snapshot-identifier $SNAPSHOT_ID"
echo "   - Keep encrypted snapshot for backup: $ENCRYPTED_SNAPSHOT_ID"
echo ""
echo "4. Update DNS/Route53 if using custom CNAME"
echo ""
