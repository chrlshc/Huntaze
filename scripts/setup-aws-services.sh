#!/bin/bash

# ============================================
# AWS Services Setup Script
# S3, SES, CloudWatch Configuration
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BUCKET_NAME="huntaze-assets"
REGION="us-east-1"
LOG_GROUP="/aws/amplify/huntaze-production"
SES_EMAIL="no-reply@huntaze.com"
SES_DOMAIN="huntaze.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWS Services Setup - Huntaze                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo ""

# ============================================
# S3 Setup
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. S3 Bucket Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if bucket exists
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${YELLOW}Creating S3 bucket: ${BUCKET_NAME}${NC}"
    aws s3 mb "s3://${BUCKET_NAME}" --region ${REGION}
    echo -e "${GREEN}✓ Bucket created${NC}"
else
    echo -e "${GREEN}✓ Bucket already exists${NC}"
fi

# Configure public access block
echo -e "${YELLOW}Configuring public access block...${NC}"
aws s3api put-public-access-block \
  --bucket ${BUCKET_NAME} \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  2>/dev/null || echo -e "${YELLOW}⚠️  Public access block already configured${NC}"

# Enable versioning
echo -e "${YELLOW}Enabling versioning...${NC}"
aws s3api put-bucket-versioning \
  --bucket ${BUCKET_NAME} \
  --versioning-configuration Status=Enabled \
  2>/dev/null || echo -e "${YELLOW}⚠️  Versioning already enabled${NC}"

echo -e "${GREEN}✅ S3 setup complete${NC}"
echo ""

# ============================================
# SES Setup
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. SES Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check domain verification
echo -e "${YELLOW}Checking SES domain verification...${NC}"
DOMAIN_STATUS=$(aws ses get-identity-verification-attributes \
  --identities ${SES_DOMAIN} \
  --region ${REGION} \
  --query "VerificationAttributes.\"${SES_DOMAIN}\".VerificationStatus" \
  --output text 2>/dev/null || echo "NotFound")

if [ "$DOMAIN_STATUS" = "Success" ]; then
    echo -e "${GREEN}✓ Domain ${SES_DOMAIN} is verified${NC}"
else
    echo -e "${YELLOW}⚠️  Domain ${SES_DOMAIN} not verified (Status: ${DOMAIN_STATUS})${NC}"
    echo -e "${YELLOW}   Please verify your domain in SES Console${NC}"
fi

# Check email verification
echo -e "${YELLOW}Checking SES email verification...${NC}"
EMAIL_STATUS=$(aws ses get-identity-verification-attributes \
  --identities ${SES_EMAIL} \
  --region ${REGION} \
  --query "VerificationAttributes.\"${SES_EMAIL}\".VerificationStatus" \
  --output text 2>/dev/null || echo "NotFound")

if [ "$EMAIL_STATUS" = "Success" ]; then
    echo -e "${GREEN}✓ Email ${SES_EMAIL} is verified${NC}"
else
    echo -e "${YELLOW}⚠️  Email ${SES_EMAIL} not verified (Status: ${EMAIL_STATUS})${NC}"
    echo -e "${YELLOW}   Please verify your email in SES Console${NC}"
fi

# Check sending limits
echo -e "${YELLOW}Checking SES sending limits...${NC}"
aws ses get-send-quota --region ${REGION} --output table

echo -e "${GREEN}✅ SES setup complete${NC}"
echo ""

# ============================================
# CloudWatch Setup
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. CloudWatch Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if log group exists
if aws logs describe-log-groups \
  --log-group-name-prefix ${LOG_GROUP} \
  --region ${REGION} \
  --query "logGroups[?logGroupName=='${LOG_GROUP}']" \
  --output text | grep -q "${LOG_GROUP}"; then
    echo -e "${GREEN}✓ Log group already exists${NC}"
else
    echo -e "${YELLOW}Creating log group: ${LOG_GROUP}${NC}"
    aws logs create-log-group \
      --log-group-name ${LOG_GROUP} \
      --region ${REGION}
    echo -e "${GREEN}✓ Log group created${NC}"
fi

# Set retention policy
echo -e "${YELLOW}Setting retention policy (30 days)...${NC}"
aws logs put-retention-policy \
  --log-group-name ${LOG_GROUP} \
  --retention-in-days 30 \
  --region ${REGION} \
  2>/dev/null || echo -e "${YELLOW}⚠️  Retention policy already set${NC}"

echo -e "${GREEN}✅ CloudWatch setup complete${NC}"
echo ""

# ============================================
# Summary
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Setup Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ S3 Bucket:${NC} ${BUCKET_NAME}"
echo -e "${GREEN}✅ SES Domain:${NC} ${SES_DOMAIN} (${DOMAIN_STATUS})"
echo -e "${GREEN}✅ SES Email:${NC} ${SES_EMAIL} (${EMAIL_STATUS})"
echo -e "${GREEN}✅ CloudWatch Log Group:${NC} ${LOG_GROUP}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. If SES domain/email not verified, verify them in SES Console"
echo "2. Request SES production access to remove sandbox limits"
echo "3. Add environment variables to Amplify Console"
echo "4. Test the services with scripts/test-aws-services.sh"
echo ""

echo -e "${GREEN}✅ Setup complete!${NC}"
