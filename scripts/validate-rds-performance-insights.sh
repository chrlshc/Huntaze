#!/bin/bash

# ============================================================================
# Validate RDS Performance Insights Configuration
# ============================================================================
# This script validates that Performance Insights is properly configured
# ============================================================================

set -e

# Configuration
RDS_INSTANCE_ID="${RDS_INSTANCE_ID:-huntaze-postgres-production}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "============================================"
echo "Validate RDS Performance Insights"
echo "============================================"
echo "Instance: $RDS_INSTANCE_ID"
echo "Region: $AWS_REGION"
echo "============================================"
echo ""

# Check Performance Insights status
echo "1️⃣  Checking Performance Insights status..."
PI_ENABLED=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].PerformanceInsightsEnabled' \
  --output text)

if [ "$PI_ENABLED" == "True" ]; then
  echo "   ✅ Performance Insights: Enabled"
else
  echo "   ❌ Performance Insights: Disabled"
  exit 1
fi

# Check retention period
echo "2️⃣  Checking retention period..."
RETENTION=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].PerformanceInsightsRetentionPeriod' \
  --output text)

if [ "$RETENTION" -ge 7 ]; then
  echo "   ✅ Retention period: $RETENTION days"
else
  echo "   ⚠️  Retention period: $RETENTION days (recommended: 7+)"
fi

# Check enhanced monitoring
echo "3️⃣  Checking enhanced monitoring..."
MONITORING_INTERVAL=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].MonitoringInterval' \
  --output text)

if [ "$MONITORING_INTERVAL" -gt 0 ]; then
  echo "   ✅ Enhanced monitoring: Enabled ($MONITORING_INTERVAL seconds)"
else
  echo "   ⚠️  Enhanced monitoring: Disabled"
fi

# Check KMS encryption
echo "4️⃣  Checking KMS encryption..."
PI_KMS_KEY=$(aws rds describe-db-instances \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'DBInstances[0].PerformanceInsightsKMSKeyId' \
  --output text)

if [ "$PI_KMS_KEY" != "None" ] && [ -n "$PI_KMS_KEY" ]; then
  echo "   ✅ KMS encryption: Enabled"
  echo "      Key: $PI_KMS_KEY"
else
  echo "   ⚠️  KMS encryption: Using default key"
fi

# Check CloudWatch alarms
echo "5️⃣  Checking CloudWatch alarms..."
ALARM_COUNT=$(aws cloudwatch describe-alarms \
  --region "$AWS_REGION" \
  --alarm-name-prefix "rds-$RDS_INSTANCE_ID" \
  --query 'length(MetricAlarms)' \
  --output text)

if [ "$ALARM_COUNT" -gt 0 ]; then
  echo "   ✅ CloudWatch alarms: $ALARM_COUNT configured"
  
  # List alarms
  aws cloudwatch describe-alarms \
    --region "$AWS_REGION" \
    --alarm-name-prefix "rds-$RDS_INSTANCE_ID" \
    --query 'MetricAlarms[*].[AlarmName,StateValue]' \
    --output text | while read -r alarm_name state; do
    echo "      - $alarm_name: $state"
  done
else
  echo "   ⚠️  CloudWatch alarms: None configured"
fi

# Check dashboard
echo "6️⃣  Checking CloudWatch dashboard..."
if aws cloudwatch get-dashboard \
  --dashboard-name "Huntaze-RDS-Performance" \
  --region "$AWS_REGION" &>/dev/null; then
  echo "   ✅ Dashboard: Huntaze-RDS-Performance exists"
else
  echo "   ⚠️  Dashboard: Not found"
fi

echo ""
echo "============================================"
echo "Validation Summary"
echo "============================================"
echo "Performance Insights: $PI_ENABLED"
echo "Retention: $RETENTION days"
echo "Enhanced Monitoring: $MONITORING_INTERVAL seconds"
echo "Alarms: $ALARM_COUNT"
echo "============================================"
echo ""

if [ "$PI_ENABLED" == "True" ]; then
  echo "✅ RDS Performance Insights is properly configured"
  echo ""
  echo "📊 Access Performance Insights:"
  echo "   https://console.aws.amazon.com/rds/home?region=$AWS_REGION#performance-insights:id=$RDS_INSTANCE_ID"
  echo ""
  exit 0
else
  echo "❌ RDS Performance Insights validation failed"
  exit 1
fi
