#!/bin/bash

# ============================================================================
# S3 & RDS Security Validation Script
# ============================================================================
# Validates S3 and RDS security configurations against AWS best practices
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="317805897534"
RDS_INSTANCE_ID="huntaze-postgres-production"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}S3 & RDS Security Validation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Function to check warning
check_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================================================
# 1. Validate S3 Account-Level Block Public Access
# ============================================================================

echo -e "${YELLOW}1. Validating S3 Account-Level Security...${NC}"

# Check account-level block public access
ACCOUNT_BPA=$(aws s3control get-public-access-block \
    --account-id "$AWS_ACCOUNT_ID" \
    --region "$AWS_REGION" 2>/dev/null || echo "NOT_CONFIGURED")

if [ "$ACCOUNT_BPA" != "NOT_CONFIGURED" ]; then
    BLOCK_PUBLIC_ACLS=$(echo "$ACCOUNT_BPA" | jq -r '.PublicAccessBlockConfiguration.BlockPublicAcls')
    IGNORE_PUBLIC_ACLS=$(echo "$ACCOUNT_BPA" | jq -r '.PublicAccessBlockConfiguration.IgnorePublicAcls')
    BLOCK_PUBLIC_POLICY=$(echo "$ACCOUNT_BPA" | jq -r '.PublicAccessBlockConfiguration.BlockPublicPolicy')
    RESTRICT_PUBLIC_BUCKETS=$(echo "$ACCOUNT_BPA" | jq -r '.PublicAccessBlockConfiguration.RestrictPublicBuckets')
    
    if [ "$BLOCK_PUBLIC_ACLS" = "true" ] && [ "$IGNORE_PUBLIC_ACLS" = "true" ] && \
       [ "$BLOCK_PUBLIC_POLICY" = "true" ] && [ "$RESTRICT_PUBLIC_BUCKETS" = "true" ]; then
        check_success "Account-level Block Public Access fully enabled"
    else
        check_warning "Account-level Block Public Access partially enabled"
        echo -e "${BLUE}  BlockPublicAcls: $BLOCK_PUBLIC_ACLS${NC}"
        echo -e "${BLUE}  IgnorePublicAcls: $IGNORE_PUBLIC_ACLS${NC}"
        echo -e "${BLUE}  BlockPublicPolicy: $BLOCK_PUBLIC_POLICY${NC}"
        echo -e "${BLUE}  RestrictPublicBuckets: $RESTRICT_PUBLIC_BUCKETS${NC}"
    fi
else
    check_warning "Account-level Block Public Access not configured"
fi

echo ""

# ============================================================================
# 2. Validate S3 Buckets
# ============================================================================

echo -e "${YELLOW}2. Validating S3 Buckets...${NC}"

# List all buckets
BUCKETS=$(aws s3api list-buckets --query 'Buckets[].Name' --output text)

if [ -z "$BUCKETS" ]; then
    echo -e "${BLUE}No S3 buckets found${NC}"
else
    BUCKET_COUNT=$(echo "$BUCKETS" | wc -w)
    echo -e "${BLUE}Found $BUCKET_COUNT buckets${NC}"
    echo ""
    
    for BUCKET in $BUCKETS; do
        echo -e "${BLUE}Checking bucket: $BUCKET${NC}"
        
        # Check bucket-level block public access
        BPA=$(aws s3api get-public-access-block \
            --bucket "$BUCKET" \
            --region "$AWS_REGION" 2>/dev/null || echo "NOT_CONFIGURED")
        
        if [ "$BPA" != "NOT_CONFIGURED" ]; then
            check_success "  Block Public Access enabled"
        else
            check_warning "  Block Public Access not configured"
        fi
        
        # Check encryption
        ENCRYPTION=$(aws s3api get-bucket-encryption \
            --bucket "$BUCKET" \
            --region "$AWS_REGION" 2>/dev/null || echo "NOT_CONFIGURED")
        
        if [ "$ENCRYPTION" != "NOT_CONFIGURED" ]; then
            SSE_ALGORITHM=$(echo "$ENCRYPTION" | jq -r '.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm')
            if [ "$SSE_ALGORITHM" = "aws:kms" ]; then
                check_success "  Encryption: SSE-KMS"
            elif [ "$SSE_ALGORITHM" = "AES256" ]; then
                check_warning "  Encryption: SSE-S3 (consider upgrading to SSE-KMS)"
            else
                check_warning "  Encryption: $SSE_ALGORITHM"
            fi
        else
            check_warning "  Encryption not configured"
        fi
        
        # Check versioning
        VERSIONING=$(aws s3api get-bucket-versioning \
            --bucket "$BUCKET" \
            --region "$AWS_REGION" \
            --query 'Status' \
            --output text 2>/dev/null || echo "NOT_CONFIGURED")
        
        if [ "$VERSIONING" = "Enabled" ]; then
            check_success "  Versioning enabled"
        else
            check_warning "  Versioning not enabled"
        fi
        
        # Check bucket policy for TLS enforcement
        POLICY=$(aws s3api get-bucket-policy \
            --bucket "$BUCKET" \
            --region "$AWS_REGION" \
            --query 'Policy' \
            --output text 2>/dev/null || echo "NOT_CONFIGURED")
        
        if [ "$POLICY" != "NOT_CONFIGURED" ]; then
            if echo "$POLICY" | grep -q "aws:SecureTransport"; then
                check_success "  TLS-only policy enforced"
            else
                check_warning "  TLS-only policy not found"
            fi
        else
            check_warning "  No bucket policy configured"
        fi
        
        # Check ownership controls
        OWNERSHIP=$(aws s3api get-bucket-ownership-controls \
            --bucket "$BUCKET" \
            --region "$AWS_REGION" \
            --query 'OwnershipControls.Rules[0].ObjectOwnership' \
            --output text 2>/dev/null || echo "NOT_CONFIGURED")
        
        if [ "$OWNERSHIP" = "BucketOwnerEnforced" ]; then
            check_success "  Object Ownership: BucketOwnerEnforced (ACLs disabled)"
        else
            check_warning "  Object Ownership: $OWNERSHIP"
        fi
        
        echo ""
    done
fi

# ============================================================================
# 3. Validate VPC Endpoint for S3
# ============================================================================

echo -e "${YELLOW}3. Validating S3 VPC Endpoint...${NC}"

VPC_ENDPOINTS=$(aws ec2 describe-vpc-endpoints \
    --filters "Name=service-name,Values=com.amazonaws.$AWS_REGION.s3" \
    --region "$AWS_REGION" \
    --query 'VpcEndpoints[*].{Id:VpcEndpointId,State:State,Type:VpcEndpointType}' \
    --output json)

ENDPOINT_COUNT=$(echo "$VPC_ENDPOINTS" | jq '. | length')

if [ "$ENDPOINT_COUNT" -gt 0 ]; then
    check_success "S3 VPC Endpoint(s) configured"
    echo "$VPC_ENDPOINTS" | jq -r '.[] | "  ID: \(.Id), State: \(.State), Type: \(.Type)"'
else
    check_warning "No S3 VPC Endpoint found"
fi

echo ""

# ============================================================================
# 4. Validate RDS Instance
# ============================================================================

echo -e "${YELLOW}4. Validating RDS Instance...${NC}"

# Check if RDS instance exists
RDS_INFO=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --region "$AWS_REGION" 2>/dev/null || echo "NOT_FOUND")

if [ "$RDS_INFO" != "NOT_FOUND" ]; then
    check_success "RDS instance found: $RDS_INSTANCE_ID"
    
    # Check publicly accessible
    PUBLICLY_ACCESSIBLE=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].PubliclyAccessible')
    if [ "$PUBLICLY_ACCESSIBLE" = "false" ]; then
        check_success "  Not publicly accessible"
    else
        check_warning "  Publicly accessible (security risk)"
    fi
    
    # Check encryption at rest
    STORAGE_ENCRYPTED=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].StorageEncrypted')
    if [ "$STORAGE_ENCRYPTED" = "true" ]; then
        check_success "  Encryption at rest enabled"
        KMS_KEY=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].KmsKeyId')
        echo -e "${BLUE}    KMS Key: $KMS_KEY${NC}"
    else
        check_warning "  Encryption at rest not enabled"
    fi
    
    # Check deletion protection
    DELETION_PROTECTION=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].DeletionProtection')
    if [ "$DELETION_PROTECTION" = "true" ]; then
        check_success "  Deletion protection enabled"
    else
        check_warning "  Deletion protection not enabled"
    fi
    
    # Check IAM authentication
    IAM_AUTH=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].IAMDatabaseAuthenticationEnabled')
    if [ "$IAM_AUTH" = "true" ]; then
        check_success "  IAM database authentication enabled"
    else
        check_warning "  IAM database authentication not enabled"
    fi
    
    # Check CloudWatch logs
    ENABLED_LOGS=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].EnabledCloudwatchLogsExports | join(", ")')
    if [ -n "$ENABLED_LOGS" ] && [ "$ENABLED_LOGS" != "null" ]; then
        check_success "  CloudWatch Logs enabled: $ENABLED_LOGS"
    else
        check_warning "  CloudWatch Logs not enabled"
    fi
    
    # Check Performance Insights
    PERF_INSIGHTS=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].PerformanceInsightsEnabled')
    if [ "$PERF_INSIGHTS" = "true" ]; then
        check_success "  Performance Insights enabled"
    else
        check_warning "  Performance Insights not enabled"
    fi
    
    # Check backup retention
    BACKUP_RETENTION=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].BackupRetentionPeriod')
    if [ "$BACKUP_RETENTION" -ge 7 ]; then
        check_success "  Backup retention: $BACKUP_RETENTION days"
    else
        check_warning "  Backup retention: $BACKUP_RETENTION days (recommend >= 7)"
    fi
    
else
    check_warning "RDS instance not found: $RDS_INSTANCE_ID"
fi

echo ""

# ============================================================================
# 5. Validate RDS Parameter Group (TLS enforcement)
# ============================================================================

echo -e "${YELLOW}5. Validating RDS Parameter Group...${NC}"

if [ "$RDS_INFO" != "NOT_FOUND" ]; then
    PARAM_GROUP=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].DBParameterGroups[0].DBParameterGroupName')
    
    if [ -n "$PARAM_GROUP" ] && [ "$PARAM_GROUP" != "null" ]; then
        echo -e "${BLUE}Parameter Group: $PARAM_GROUP${NC}"
        
        # Check rds.force_ssl
        FORCE_SSL=$(aws rds describe-db-parameters \
            --db-parameter-group-name "$PARAM_GROUP" \
            --region "$AWS_REGION" \
            --query "Parameters[?ParameterName=='rds.force_ssl'].ParameterValue" \
            --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$FORCE_SSL" = "1" ]; then
            check_success "  rds.force_ssl = 1 (TLS enforced)"
        else
            check_warning "  rds.force_ssl = $FORCE_SSL (TLS not enforced)"
        fi
    else
        check_warning "  No parameter group found"
    fi
fi

echo ""

# ============================================================================
# 6. Validate RDS Security Group
# ============================================================================

echo -e "${YELLOW}6. Validating RDS Security Group...${NC}"

if [ "$RDS_INFO" != "NOT_FOUND" ]; then
    SECURITY_GROUPS=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].VpcSecurityGroups[].VpcSecurityGroupId' | tr '\n' ' ')
    
    if [ -n "$SECURITY_GROUPS" ]; then
        echo -e "${BLUE}Security Groups: $SECURITY_GROUPS${NC}"
        
        for SG in $SECURITY_GROUPS; do
            # Check ingress rules
            INGRESS_RULES=$(aws ec2 describe-security-groups \
                --group-ids "$SG" \
                --region "$AWS_REGION" \
                --query 'SecurityGroups[0].IpPermissions' \
                --output json)
            
            # Check for overly permissive rules (0.0.0.0/0)
            OPEN_TO_WORLD=$(echo "$INGRESS_RULES" | jq -r '.[] | select(.IpRanges[].CidrIp == "0.0.0.0/0") | .FromPort')
            
            if [ -z "$OPEN_TO_WORLD" ]; then
                check_success "  Security group $SG: No rules open to 0.0.0.0/0"
            else
                check_warning "  Security group $SG: Port $OPEN_TO_WORLD open to 0.0.0.0/0"
            fi
        done
    else
        check_warning "  No security groups found"
    fi
fi

echo ""

# ============================================================================
# 7. Test RDS Connection with TLS
# ============================================================================

echo -e "${YELLOW}7. Testing RDS Connection (optional)...${NC}"

if command -v psql &> /dev/null; then
    if [ "$RDS_INFO" != "NOT_FOUND" ]; then
        ENDPOINT=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].Endpoint.Address')
        PORT=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].Endpoint.Port')
        
        echo -e "${BLUE}Endpoint: $ENDPOINT:$PORT${NC}"
        echo -e "${YELLOW}To test TLS connection, run:${NC}"
        echo -e "${BLUE}psql \"host=$ENDPOINT port=$PORT dbname=<db> user=<user> sslmode=require\" -c \"\\conninfo\"${NC}"
    fi
else
    echo -e "${YELLOW}psql not installed, skipping connection test${NC}"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Validation Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "• S3 Account Block Public Access: $([ "$ACCOUNT_BPA" != "NOT_CONFIGURED" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Not Configured${NC}")"
echo "• S3 Buckets: $BUCKET_COUNT found"
echo "• S3 VPC Endpoint: $([ "$ENDPOINT_COUNT" -gt 0 ] && echo "${GREEN}Configured${NC}" || echo "${YELLOW}Not Found${NC}")"
echo "• RDS Instance: $([ "$RDS_INFO" != "NOT_FOUND" ] && echo "${GREEN}Found${NC}" || echo "${YELLOW}Not Found${NC}")"
echo "• RDS Encryption: $([ "$STORAGE_ENCRYPTED" = "true" ] && echo "${GREEN}Enabled${NC}" || echo "${YELLOW}Not Enabled${NC}")"
echo "• RDS TLS Enforced: $([ "$FORCE_SSL" = "1" ] && echo "${GREEN}Yes${NC}" || echo "${YELLOW}No${NC}")"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review any warnings above"
echo "2. Apply Terraform to fix issues"
echo "3. Test application connectivity"
echo "4. Update connection strings with sslmode=require"
echo ""
