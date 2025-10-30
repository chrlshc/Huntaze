#!/bin/bash

# ============================================================================
# Enable RDS Performance Insights
# ============================================================================
# This script enables Performance Insights on the RDS instance
# Performance Insights provides detailed database performance monitoring
# ============================================================================

set -e

# Configuration
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-huntaze-postgres-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"
RETENTION_PERIOD=7  # Free tier: 7 days
MONITORING_INTERVAL=60  # Enhanced monitoring: 60 seconds

echo "============================================"
echo "Enable RDS Performance Insights"
echo "============================================"
echo "Instance: $RDS_INSTANCE_ID"
echo "Region: $AWS_REGION"
echo "Retention: $RETENTION_PERIOD days"
echo "============================================"
echo ""

# Check if instance exists
echo "📋 Checking RDS instance..."
if ! aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].DBInstanceIdentifier' \
  --output text &>/dev/null; then
  echo "❌ Error: RDS instance '$RDS_INSTANCE_ID' not found"
  exit 1
fi

echo "✅ RDS instance found"
echo ""

# Check current Performance Insights status
echo "📊 Checking current Performance Insights status..."
CURRENT_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].PerformanceInsightsEnabled' \
  --output text)

if [ "$CURRENT_STATUS" == "True" ]; then
  echo "✅ Performance Insights is already enabled"
  
  # Get current retention period
  CURRENT_RETENTION=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].PerformanceInsightsRetentionPeriod' \
    --output text)
  
  echo "   Current retention: $CURRENT_RETENTION days"
  echo ""
  echo "ℹ️  No changes needed. Exiting."
  exit 0
fi

echo "⚠️  Performance Insights is currently disabled"
echo ""

# Confirm before proceeding
read -p "Enable Performance Insights on $RDS_INSTANCE_ID? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Aborted by user"
  exit 1
fi

echo ""
echo "🔧 Enabling Performance Insights..."
echo "   This will cause a brief interruption (< 1 minute)"
echo ""

# Enable Performance Insights
aws rds modify-db-instance \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --enable-performance-insights \
  --performance-insights-retention-period "$RETENTION_PERIOD" \
  --monitoring-interval "$MONITORING_INTERVAL" \
  --apply-immediately \
  --output json > /dev/null

echo "✅ Performance Insights enable request submitted"
echo ""

# Wait for modification to complete
echo "⏳ Waiting for modification to complete..."
echo "   This may take 5-10 minutes..."
echo ""

aws rds wait db-instance-available \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION"

echo "✅ Modification complete"
echo ""

# Verify Performance Insights is enabled
echo "🔍 Verifying Performance Insights status..."
FINAL_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].PerformanceInsightsEnabled' \
  --output text)

if [ "$FINAL_STATUS" == "True" ]; then
  echo "✅ Performance Insights successfully enabled"
  
  # Get Performance Insights KMS key
  PI_KMS_KEY=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].PerformanceInsightsKMSKeyId' \
    --output text)
  
  echo ""
  echo "============================================"
  echo "Performance Insights Details"
  echo "============================================"
  echo "Status: Enabled"
  echo "Retention: $RETENTION_PERIOD days"
  echo "Monitoring Interval: $MONITORING_INTERVAL seconds"
  echo "KMS Key: $PI_KMS_KEY"
  echo "============================================"
  echo ""
  echo "📊 Access Performance Insights:"
  echo "   https://console.aws.amazon.com/rds/home?region=$AWS_REGION#performance-insights:id=$RDS_INSTANCE_ID"
  echo ""
else
  echo "❌ Error: Performance Insights not enabled"
  exit 1
fi

echo "✅ Done!"
