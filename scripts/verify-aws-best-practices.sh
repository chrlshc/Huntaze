#!/bin/bash

# Verify AWS Best Practices Configuration
# Usage: ./scripts/verify-aws-best-practices.sh

set -e

REGION="us-east-1"
ERRORS=0

echo "🔍 Verifying AWS Best Practices Configuration..."
echo ""

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CloudTrail >90j Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "2️⃣ Checking CloudTrail S3 Trail (>90j audit)..."

TRAILS=$(aws cloudtrail describe-trails \
    --region "$REGION" \
    --query 'trailList[*].[Name,IsLogging,S3BucketName,IsMultiRegionTrail]' \
    --output text 2>/dev/null || echo "")

if [ -z "$TRAILS" ]; then
    echo "❌ No CloudTrail S3 trail configured"
    echo "   ⚠️  Event History (90j) ≠ Trail S3 (audit long-terme)"
    echo "   Action: Create S3 trail for audit >90j"
    echo "   Command: aws cloudtrail create-trail --name huntaze-audit-trail --s3-bucket-name huntaze-cloudtrail-logs --is-multi-region-trail"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ CloudTrail S3 trail configured:"
    echo "$TRAILS" | while read -r name logging bucket multiregion; do
        echo "   • Trail: $name"
        echo "   • Logging: $logging"
        echo "   • S3 Bucket: $bucket"
        echo "   • Multi-Region: $multiregion"
        
        if [ "$logging" != "true" ]; then
            echo "   ⚠️  Trail not logging - run: aws cloudtrail start-logging --name $name"
        fi
    done
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# KMS CMK Rotation Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "3️⃣ Checking KMS CMK Rotation..."

CMK_KEYS=$(aws kms list-keys \
    --region "$REGION" \
    --query 'Keys[*].KeyId' \
    --output text 2>/dev/null || echo "")

if [ -z "$CMK_KEYS" ]; then
    echo "ℹ️  No KMS CMK keys found (using AWS managed keys)"
else
    echo "Found KMS keys:"
    for KEY_ID in $CMK_KEYS; do
        # Get key metadata
        KEY_MANAGER=$(aws kms describe-key \
            --key-id "$KEY_ID" \
            --region "$REGION" \
            --query 'KeyMetadata.KeyManager' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        KEY_SPEC=$(aws kms describe-key \
            --key-id "$KEY_ID" \
            --region "$REGION" \
            --query 'KeyMetadata.KeySpec' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        # Only check customer-managed symmetric keys
        if [ "$KEY_MANAGER" = "CUSTOMER" ] && [ "$KEY_SPEC" = "SYMMETRIC_DEFAULT" ]; then
            ROTATION_ENABLED=$(aws kms get-key-rotation-status \
                --key-id "$KEY_ID" \
                --region "$REGION" \
                --query 'KeyRotationEnabled' \
                --output text 2>/dev/null || echo "false")
            
            if [ "$ROTATION_ENABLED" = "true" ]; then
                echo "   ✅ Key $KEY_ID: Rotation enabled"
            else
                echo "   ❌ Key $KEY_ID: Rotation NOT enabled"
                echo "      ⚠️  Action: Enable rotation for symmetric CMK"
                echo "      Command: aws kms enable-key-rotation --key-id $KEY_ID"
                ERRORS=$((ERRORS + 1))
            fi
        elif [ "$KEY_MANAGER" = "CUSTOMER" ]; then
            echo "   ℹ️  Key $KEY_ID: $KEY_SPEC (rotation not supported for non-symmetric keys)"
        fi
    done
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RDS Architecture Check (Cross-Region DR)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "4️⃣ Checking RDS Architecture (Cross-Region DR compatibility)..."

DB_INSTANCES=$(aws rds describe-db-instances \
    --region "$REGION" \
    --query 'DBInstances[*].[DBInstanceIdentifier,Engine,DBClusterIdentifier]' \
    --output text 2>/dev/null || echo "")

if [ -z "$DB_INSTANCES" ]; then
    echo "ℹ️  No RDS instances found"
else
    echo "$DB_INSTANCES" | while read -r instance engine cluster; do
        if [ -n "$cluster" ] && [ "$cluster" != "None" ]; then
            echo "   ⚠️  Instance: $instance (Multi-AZ DB Cluster)"
            echo "      ⚠️  Automated backups cross-region NOT supported for clusters"
            echo "      Solutions:"
            echo "      1. Use manual snapshots + cross-region copy"
            echo "      2. Switch to DB Instance (not cluster)"
            echo "      3. Use Aurora Global Database (Palier 3)"
            ERRORS=$((ERRORS + 1))
        else
            echo "   ✅ Instance: $instance (DB Instance - cross-region DR supported)"
        fi
    done
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GuardDuty Free Trial Check
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "5️⃣ Checking GuardDuty Free Trial Status..."

DETECTOR_ID=$(aws guardduty list-detectors \
    --region "$REGION" \
    --query 'DetectorIds[0]' \
    --output text 2>/dev/null || echo "None")

if [ "$DETECTOR_ID" = "None" ] || [ -z "$DETECTOR_ID" ]; then
    echo "ℹ️  GuardDuty not enabled"
else
    echo "✅ GuardDuty enabled (Detector: $DETECTOR_ID)"
    echo "   ⚠️  Free Trial: 30 jours gratuits par région/protection"
    echo "   ⚠️  Coût démarre automatiquement après 30 jours"
    echo ""
    echo "   📊 Monitoring Free Trial:"
    echo "   • Vérifier Cost Explorer après 30j"
    echo "   • Budget: ~\$5-15/month après free trial"
    echo "   • Désactiver si nécessaire: aws guardduty delete-detector --detector-id $DETECTOR_ID"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All AWS Best Practices Verified!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo "⚠️  Found $ERRORS Configuration Issues"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 Review the issues above and apply recommended actions"
    exit 1
fi
