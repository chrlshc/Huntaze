#!/bin/bash

# ============================================================================
# Comprehensive Security Validation - ORR Checklist
# ============================================================================
# AWS Operational Readiness Review - Security Validation
# Validates: Security Hub, Config, GuardDuty, CloudTrail, Encryption
# ============================================================================

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OUTPUT_DIR="./validation-reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$OUTPUT_DIR"

echo "============================================"
echo "AWS Security Validation - ORR"
echo "============================================"
echo "Account: $ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Timestamp: $TIMESTAMP"
echo "============================================"
echo ""

# ============================================================================
# 1. Run Security Runbook
# ============================================================================

echo "📋 Step 1: Running Security Runbook"
echo "-------------------------------------------"

if [ -f "./scripts/security-runbook.sh" ]; then
  ./scripts/security-runbook.sh "$AWS_REGION" | tee "$OUTPUT_DIR/security-runbook-$TIMESTAMP.log"
  RUNBOOK_EXIT=$?
  
  if [ $RUNBOOK_EXIT -eq 0 ]; then
    echo "✅ Security runbook passed"
  else
    echo "❌ Security runbook failed (exit code: $RUNBOOK_EXIT)"
  fi
else
  echo "⚠️  Security runbook script not found"
fi

echo ""

# ============================================================================
# 2. Security Hub Compliance Report
# ============================================================================

echo "📋 Step 2: Security Hub Compliance Report"
echo "-------------------------------------------"

# Check Security Hub status
SECURITY_HUB=$(aws securityhub describe-hub \
  --region "$AWS_REGION" \
  --query 'HubArn' \
  --output text 2>/dev/null || echo "None")

if [ "$SECURITY_HUB" != "None" ]; then
  echo "✅ Security Hub enabled"
  
  # Get compliance summary
  aws securityhub get-findings \
    --region "$AWS_REGION" \
    --filters '{
      "ComplianceStatus": [{"Value": "FAILED", "Comparison": "EQUALS"}],
      "RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}]
    }' \
    --max-results 100 \
    --query 'Findings[*].{
      Title:Title,
      Severity:Severity.Label,
      Compliance:Compliance.Status,
      Resource:Resources[0].Id
    }' \
    --output json > "$OUTPUT_DIR/security-hub-findings-$TIMESTAMP.json"
  
  FAILED_COUNT=$(jq 'length' "$OUTPUT_DIR/security-hub-findings-$TIMESTAMP.json")
  echo "   Failed findings: $FAILED_COUNT"
  
  # Export compliance score
  aws securityhub get-findings \
    --region "$AWS_REGION" \
    --filters '{"RecordState": [{"Value": "ACTIVE", "Comparison": "EQUALS"}]}' \
    --max-results 1000 \
    --query 'Findings[*].Compliance.Status' \
    --output json | jq -r '.[] | select(. != null)' | sort | uniq -c > "$OUTPUT_DIR/compliance-summary-$TIMESTAMP.txt"
  
  echo "   Report saved: $OUTPUT_DIR/security-hub-findings-$TIMESTAMP.json"
else
  echo "❌ Security Hub not enabled"
fi

echo ""

# ============================================================================
# 3. AWS Config Conformance Pack
# ============================================================================

echo "📋 Step 3: AWS Config Conformance Pack"
echo "-------------------------------------------"

# Check if Config is enabled
CONFIG_RECORDER=$(aws configservice describe-configuration-recorders \
  --region "$AWS_REGION" \
  --query 'ConfigurationRecorders[0].name' \
  --output text 2>/dev/null || echo "None")

if [ "$CONFIG_RECORDER" != "None" ]; then
  echo "✅ AWS Config enabled: $CONFIG_RECORDER"
  
  # List conformance packs
  PACKS=$(aws configservice describe-conformance-packs \
    --region "$AWS_REGION" \
    --query 'ConformancePackDetails[*].ConformancePackName' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$PACKS" ]; then
    echo "   Conformance packs:"
    for pack in $PACKS; do
      echo "      - $pack"
      
      # Get compliance status
      aws configservice describe-conformance-pack-compliance \
        --conformance-pack-name "$pack" \
        --region "$AWS_REGION" \
        --query 'ConformancePackRuleComplianceList[*].{
          Rule:ConfigRuleName,
          Compliance:ComplianceType
        }' \
        --output json > "$OUTPUT_DIR/conformance-pack-$pack-$TIMESTAMP.json"
    done
  else
    echo "   ⚠️  No conformance packs deployed"
    echo "   Recommendation: Deploy 'Operational-Best-Practices-for-CIS-AWS-v1.4.0'"
  fi
else
  echo "❌ AWS Config not enabled"
  echo "   Action required: Enable AWS Config for compliance tracking"
fi

echo ""

# ============================================================================
# 4. GuardDuty Findings Summary
# ============================================================================

echo "📋 Step 4: GuardDuty Findings Summary"
echo "-------------------------------------------"

DETECTOR_ID=$(aws guardduty list-detectors \
  --region "$AWS_REGION" \
  --query 'DetectorIds[0]' \
  --output text 2>/dev/null || echo "None")

if [ "$DETECTOR_ID" != "None" ]; then
  echo "✅ GuardDuty enabled: $DETECTOR_ID"
  
  # Get findings by severity
  for severity in HIGH MEDIUM LOW; do
    FINDINGS=$(aws guardduty list-findings \
      --detector-id "$DETECTOR_ID" \
      --region "$AWS_REGION" \
      --finding-criteria "{\"Criterion\":{\"severity\":{\"Gte\":$([ "$severity" == "HIGH" ] && echo 7 || [ "$severity" == "MEDIUM" ] && echo 4 || echo 1)}}}" \
      --query 'FindingIds' \
      --output json 2>/dev/null || echo "[]")
    
    COUNT=$(echo "$FINDINGS" | jq 'length')
    echo "   $severity severity findings: $COUNT"
  done
  
  # Export detailed findings
  aws guardduty list-findings \
    --detector-id "$DETECTOR_ID" \
    --region "$AWS_REGION" \
    --max-results 50 \
    --query 'FindingIds' \
    --output json > "$OUTPUT_DIR/guardduty-findings-$TIMESTAMP.json"
else
  echo "❌ GuardDuty not enabled"
fi

echo ""

# ============================================================================
# 5. Encryption Validation
# ============================================================================

echo "📋 Step 5: Encryption Validation"
echo "-------------------------------------------"

# RDS encryption
echo "   RDS Instances:"
aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --query 'DBInstances[*].{
    ID:DBInstanceIdentifier,
    Encrypted:StorageEncrypted,
    Public:PubliclyAccessible
  }' \
  --output table

# ElastiCache encryption
echo "   ElastiCache Clusters:"
aws elasticache describe-replication-groups \
  --region "$AWS_REGION" \
  --query 'ReplicationGroups[*].{
    ID:ReplicationGroupId,
    AtRest:AtRestEncryptionEnabled,
    Transit:TransitEncryptionEnabled
  }' \
  --output table 2>/dev/null || echo "      No clusters found"

# S3 encryption
echo "   S3 Buckets (sample):"
aws s3api list-buckets --query 'Buckets[*].Name' --output text | head -5 | while read bucket; do
  ENCRYPTION=$(aws s3api get-bucket-encryption \
    --bucket "$bucket" \
    --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
    --output text 2>/dev/null || echo "None")
  echo "      $bucket: $ENCRYPTION"
done

echo ""

# ============================================================================
# 6. CloudTrail Validation
# ============================================================================

echo "📋 Step 6: CloudTrail Validation"
echo "-------------------------------------------"

TRAILS=$(aws cloudtrail describe-trails \
  --region "$AWS_REGION" \
  --query 'trailList[*].{
    Name:Name,
    MultiRegion:IsMultiRegionTrail,
    LogValidation:LogFileValidationEnabled
  }' \
  --output json)

echo "$TRAILS" | jq -r '.[] | "   \(.Name): MultiRegion=\(.MultiRegion), LogValidation=\(.LogValidation)"'

# Check trail status
aws cloudtrail describe-trails \
  --region "$AWS_REGION" \
  --query 'trailList[*].Name' \
  --output text | while read trail; do
  STATUS=$(aws cloudtrail get-trail-status \
    --name "$trail" \
    --region "$AWS_REGION" \
    --query 'IsLogging' \
    --output text)
  echo "      $trail logging: $STATUS"
done

echo ""

# ============================================================================
# 7. Generate ORR Report
# ============================================================================

echo "📋 Step 7: Generating ORR Report"
echo "-------------------------------------------"

cat > "$OUTPUT_DIR/orr-security-report-$TIMESTAMP.md" <<EOF
# AWS Security Validation Report

**Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Account**: $ACCOUNT_ID
**Region**: $AWS_REGION

## Executive Summary

This report validates security controls for AWS Operational Readiness Review.

## Security Services Status

### Security Hub
- Status: $([ "$SECURITY_HUB" != "None" ] && echo "✅ Enabled" || echo "❌ Disabled")
- Failed Findings: ${FAILED_COUNT:-N/A}

### GuardDuty
- Status: $([ "$DETECTOR_ID" != "None" ] && echo "✅ Enabled" || echo "❌ Disabled")
- Detector ID: ${DETECTOR_ID:-N/A}

### AWS Config
- Status: $([ "$CONFIG_RECORDER" != "None" ] && echo "✅ Enabled" || echo "❌ Disabled")
- Recorder: ${CONFIG_RECORDER:-N/A}

### CloudTrail
- Trails: $(echo "$TRAILS" | jq 'length')
- Multi-region: $(echo "$TRAILS" | jq '[.[] | select(.MultiRegion == true)] | length')

## Compliance Status

See detailed reports:
- Security Hub: security-hub-findings-$TIMESTAMP.json
- GuardDuty: guardduty-findings-$TIMESTAMP.json
- Config: conformance-pack-*-$TIMESTAMP.json

## Recommendations

1. Review and remediate all HIGH severity findings
2. Enable missing security services
3. Deploy CIS AWS Foundations conformance pack
4. Schedule weekly security reviews

## Sign-off

- [ ] Security team reviewed
- [ ] All critical findings addressed
- [ ] Ready for production

EOF

echo "✅ ORR report generated: $OUTPUT_DIR/orr-security-report-$TIMESTAMP.md"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "============================================"
echo "Validation Complete"
echo "============================================"
echo "Reports saved to: $OUTPUT_DIR/"
echo ""
echo "Next steps:"
echo "1. Review all reports in $OUTPUT_DIR/"
echo "2. Address any critical findings"
echo "3. Get sign-off from security team"
echo "4. Proceed to cost validation (Task 14)"
echo "============================================"
