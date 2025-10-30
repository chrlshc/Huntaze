#!/bin/bash

# ============================================================================
# Security Runbook - Automated Security Checks
# ============================================================================
# Comprehensive security validation across AWS services
# Exit codes: 0 = all pass, 1 = critical issues, 2 = warnings
# ============================================================================

set -euo pipefail

# Configuration
AWS_REGION="${1:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
CRITICAL_ISSUES=0
WARNINGS=0
CHECKS_PASSED=0

echo "============================================"
echo "Security Runbook - Automated Checks"
echo "============================================"
echo "Account: $ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "============================================"
echo ""

# ============================================================================
# 1. GuardDuty
# ============================================================================

echo "🔎 1. GuardDuty Threat Detection"
echo "-------------------------------------------"

DETECTOR_ID=$(aws guardduty list-detectors \
  --region "$AWS_REGION" \
  --query 'DetectorIds[0]' \
  --output text 2>/dev/null || echo "None")

if [ "$DETECTOR_ID" != "None" ] && [ -n "$DETECTOR_ID" ]; then
  echo -e "   ${GREEN}✅ GuardDuty enabled${NC}"
  echo "      Detector ID: $DETECTOR_ID"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  
  # Check for high/critical findings
  FINDINGS=$(aws guardduty list-findings \
    --detector-id "$DETECTOR_ID" \
    --region "$AWS_REGION" \
    --finding-criteria '{"Criterion":{"severity":{"Gte":7}}}' \
    --query 'FindingIds' \
    --output json 2>/dev/null || echo "[]")
  
  FINDING_COUNT=$(echo "$FINDINGS" | jq 'length')
  
  if [ "$FINDING_COUNT" -gt 0 ]; then
    echo -e "   ${RED}❌ High/Critical findings: $FINDING_COUNT${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  else
    echo -e "   ${GREEN}✅ No high/critical findings${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  fi
else
  echo -e "   ${RED}❌ GuardDuty not enabled${NC}"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

echo ""

# ============================================================================
# 2. Security Hub
# ============================================================================

echo "🔎 2. Security Hub Compliance"
echo "-------------------------------------------"

SECURITY_HUB_STATUS=$(aws securityhub describe-hub \
  --region "$AWS_REGION" \
  --query 'HubArn' \
  --output text 2>/dev/null || echo "None")

if [ "$SECURITY_HUB_STATUS" != "None" ]; then
  echo -e "   ${GREEN}✅ Security Hub enabled${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  
  # Check enabled standards
  STANDARDS=$(aws securityhub get-enabled-standards \
    --region "$AWS_REGION" \
    --query 'StandardsSubscriptions[*].StandardsArn' \
    --output text)
  
  if echo "$STANDARDS" | grep -q "aws-foundational-security-best-practices"; then
    echo -e "   ${GREEN}✅ FSBP standard enabled${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "   ${YELLOW}⚠️  FSBP standard not enabled${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Check for failed findings
  FAILED_FINDINGS=$(aws securityhub get-findings \
    --region "$AWS_REGION" \
    --filters '{"ComplianceStatus":[{"Value":"FAILED","Comparison":"EQUALS"}],"SeverityLabel":[{"Value":"CRITICAL","Comparison":"EQUALS"},{"Value":"HIGH","Comparison":"EQUALS"}]}' \
    --max-results 1 \
    --query 'Findings | length(@)' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$FAILED_FINDINGS" -gt 0 ]; then
    echo -e "   ${RED}❌ High/Critical failed findings detected${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  else
    echo -e "   ${GREEN}✅ No high/critical failed findings${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  fi
else
  echo -e "   ${RED}❌ Security Hub not enabled${NC}"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

echo ""

# ============================================================================
# 3. CloudTrail
# ============================================================================

echo "🔎 3. CloudTrail Audit Logging"
echo "-------------------------------------------"

TRAILS=$(aws cloudtrail describe-trails \
  --region "$AWS_REGION" \
  --query 'trailList[*].Name' \
  --output text)

if [ -n "$TRAILS" ]; then
  echo -e "   ${GREEN}✅ CloudTrail configured${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  
  for trail in $TRAILS; do
    # Check if trail is logging
    IS_LOGGING=$(aws cloudtrail get-trail-status \
      --name "$trail" \
      --region "$AWS_REGION" \
      --query 'IsLogging' \
      --output text)
    
    if [ "$IS_LOGGING" == "True" ]; then
      echo -e "   ${GREEN}✅ Trail '$trail' is logging${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "   ${RED}❌ Trail '$trail' is not logging${NC}"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    # Check multi-region
    IS_MULTI_REGION=$(aws cloudtrail describe-trails \
      --trail-name-list "$trail" \
      --region "$AWS_REGION" \
      --query 'trailList[0].IsMultiRegionTrail' \
      --output text)
    
    if [ "$IS_MULTI_REGION" == "True" ]; then
      echo -e "   ${GREEN}✅ Multi-region enabled${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "   ${YELLOW}⚠️  Multi-region not enabled${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
else
  echo -e "   ${RED}❌ No CloudTrail trails configured${NC}"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

echo ""

# ============================================================================
# 4. S3 Public Access Block
# ============================================================================

echo "🔎 4. S3 Public Access Block"
echo "-------------------------------------------"

PUBLIC_ACCESS_BLOCK=$(aws s3control get-public-access-block \
  --account-id "$ACCOUNT_ID" \
  --region "$AWS_REGION" \
  --query 'PublicAccessBlockConfiguration' \
  --output json 2>/dev/null || echo "{}")

if [ "$PUBLIC_ACCESS_BLOCK" != "{}" ]; then
  BLOCK_PUBLIC_ACLS=$(echo "$PUBLIC_ACCESS_BLOCK" | jq -r '.BlockPublicAcls')
  IGNORE_PUBLIC_ACLS=$(echo "$PUBLIC_ACCESS_BLOCK" | jq -r '.IgnorePublicAcls')
  BLOCK_PUBLIC_POLICY=$(echo "$PUBLIC_ACCESS_BLOCK" | jq -r '.BlockPublicPolicy')
  RESTRICT_PUBLIC_BUCKETS=$(echo "$PUBLIC_ACCESS_BLOCK" | jq -r '.RestrictPublicBuckets')
  
  if [ "$BLOCK_PUBLIC_ACLS" == "true" ] && [ "$IGNORE_PUBLIC_ACLS" == "true" ] && \
     [ "$BLOCK_PUBLIC_POLICY" == "true" ] && [ "$RESTRICT_PUBLIC_BUCKETS" == "true" ]; then
    echo -e "   ${GREEN}✅ All public access blocks enabled${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "   ${RED}❌ Public access block not fully enabled${NC}"
    echo "      BlockPublicAcls: $BLOCK_PUBLIC_ACLS"
    echo "      IgnorePublicAcls: $IGNORE_PUBLIC_ACLS"
    echo "      BlockPublicPolicy: $BLOCK_PUBLIC_POLICY"
    echo "      RestrictPublicBuckets: $RESTRICT_PUBLIC_BUCKETS"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  fi
else
  echo -e "   ${RED}❌ Public access block not configured${NC}"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

echo ""

# ============================================================================
# 5. RDS Security Posture
# ============================================================================

echo "🔎 5. RDS Security Posture"
echo "-------------------------------------------"

RDS_INSTANCES=$(aws rds describe-db-instances \
  --region "$AWS_REGION" \
  --query 'DBInstances[*].DBInstanceIdentifier' \
  --output text)

if [ -n "$RDS_INSTANCES" ]; then
  for instance in $RDS_INSTANCES; do
    echo "   Instance: $instance"
    
    # Check public accessibility
    IS_PUBLIC=$(aws rds describe-db-instances \
      --db-instance-identifier "$instance" \
      --region "$AWS_REGION" \
      --query 'DBInstances[0].PubliclyAccessible' \
      --output text)
    
    if [ "$IS_PUBLIC" == "False" ]; then
      echo -e "      ${GREEN}✅ Not publicly accessible${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "      ${RED}❌ Publicly accessible${NC}"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    # Check encryption
    IS_ENCRYPTED=$(aws rds describe-db-instances \
      --db-instance-identifier "$instance" \
      --region "$AWS_REGION" \
      --query 'DBInstances[0].StorageEncrypted' \
      --output text)
    
    if [ "$IS_ENCRYPTED" == "True" ]; then
      echo -e "      ${GREEN}✅ Storage encrypted${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "      ${RED}❌ Storage not encrypted${NC}"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    # Check deletion protection
    DEL_PROTECTION=$(aws rds describe-db-instances \
      --db-instance-identifier "$instance" \
      --region "$AWS_REGION" \
      --query 'DBInstances[0].DeletionProtection' \
      --output text)
    
    if [ "$DEL_PROTECTION" == "True" ]; then
      echo -e "      ${GREEN}✅ Deletion protection enabled${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "      ${YELLOW}⚠️  Deletion protection disabled${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
    
    echo ""
  done
else
  echo "   ℹ️  No RDS instances found"
fi

echo ""

# ============================================================================
# 6. ElastiCache Encryption
# ============================================================================

echo "🔎 6. ElastiCache Encryption"
echo "-------------------------------------------"

REDIS_CLUSTERS=$(aws elasticache describe-replication-groups \
  --region "$AWS_REGION" \
  --query 'ReplicationGroups[*].ReplicationGroupId' \
  --output text 2>/dev/null || echo "")

if [ -n "$REDIS_CLUSTERS" ]; then
  for cluster in $REDIS_CLUSTERS; do
    echo "   Cluster: $cluster"
    
    # Check at-rest encryption
    AT_REST=$(aws elasticache describe-replication-groups \
      --replication-group-id "$cluster" \
      --region "$AWS_REGION" \
      --query 'ReplicationGroups[0].AtRestEncryptionEnabled' \
      --output text)
    
    if [ "$AT_REST" == "True" ]; then
      echo -e "      ${GREEN}✅ At-rest encryption enabled${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "      ${RED}❌ At-rest encryption disabled${NC}"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    # Check transit encryption
    TRANSIT=$(aws elasticache describe-replication-groups \
      --replication-group-id "$cluster" \
      --region "$AWS_REGION" \
      --query 'ReplicationGroups[0].TransitEncryptionEnabled' \
      --output text)
    
    if [ "$TRANSIT" == "True" ]; then
      echo -e "      ${GREEN}✅ Transit encryption enabled${NC}"
      CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
      echo -e "      ${RED}❌ Transit encryption disabled${NC}"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    echo ""
  done
else
  echo "   ℹ️  No ElastiCache clusters found"
fi

echo ""

# ============================================================================
# 7. IAM Security
# ============================================================================

echo "🔎 7. IAM Security Checks"
echo "-------------------------------------------"

# Check root account MFA
ROOT_MFA=$(aws iam get-account-summary \
  --query 'SummaryMap.AccountMFAEnabled' \
  --output text)

if [ "$ROOT_MFA" == "1" ]; then
  echo -e "   ${GREEN}✅ Root account MFA enabled${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "   ${RED}❌ Root account MFA not enabled${NC}"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# Check for old access keys (> 90 days)
OLD_KEYS=$(aws iam generate-credential-report 2>/dev/null && \
  aws iam get-credential-report --query 'Content' --output text | \
  base64 -d | awk -F',' 'NR>1 && $11!="N/A" && $11!="no_information" {
    cmd="date -d "$11" +%s"
    cmd | getline key_date
    close(cmd)
    now=systime()
    age=(now-key_date)/86400
    if(age>90) print $1","age
  }' | wc -l)

if [ "$OLD_KEYS" -eq 0 ]; then
  echo -e "   ${GREEN}✅ No access keys older than 90 days${NC}"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
  echo -e "   ${YELLOW}⚠️  $OLD_KEYS access keys older than 90 days${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "============================================"
echo "Security Runbook Summary"
echo "============================================"
echo -e "Checks passed:     ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Warnings:          ${YELLOW}$WARNINGS${NC}"
echo -e "Critical issues:   ${RED}$CRITICAL_ISSUES${NC}"
echo "============================================"
echo ""

# Determine exit code
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL ISSUES DETECTED${NC}"
  echo "   Review and remediate critical issues immediately"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS DETECTED${NC}"
  echo "   Review warnings and plan remediation"
  exit 2
else
  echo -e "${GREEN}✅ ALL SECURITY CHECKS PASSED${NC}"
  exit 0
fi
