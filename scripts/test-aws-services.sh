#!/bin/bash

# ============================================
# Test AWS Services (S3, SES, CloudWatch)
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
TEST_EMAIL="charles@huntaze.com"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Testing AWS Services - Huntaze                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Test S3
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1. Testing S3${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Create test file
echo "Test file from Huntaze - $(date)" > /tmp/huntaze-test.txt

# Upload
echo -e "${YELLOW}Uploading test file to S3...${NC}"
if aws s3 cp /tmp/huntaze-test.txt "s3://${BUCKET_NAME}/test/test-$(date +%s).txt" --region ${REGION}; then
    echo -e "${GREEN}✅ S3 Upload: SUCCESS${NC}"
else
    echo -e "${RED}❌ S3 Upload: FAILED${NC}"
fi

# List files
echo -e "${YELLOW}Listing files in bucket...${NC}"
aws s3 ls "s3://${BUCKET_NAME}/test/" --region ${REGION} | tail -5

# Cleanup
rm /tmp/huntaze-test.txt

echo ""

# ============================================
# Test SES
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2. Testing SES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Send test email
echo -e "${YELLOW}Sending test email...${NC}"
if aws ses send-email \
  --from ${SES_EMAIL} \
  --to ${TEST_EMAIL} \
  --subject "Huntaze - Test Email $(date +%H:%M:%S)" \
  --text "This is a test email from Huntaze AWS setup script. Sent at $(date)" \
  --region ${REGION} 2>/dev/null; then
    echo -e "${GREEN}✅ SES Email: SUCCESS${NC}"
    echo -e "${GREEN}   Check ${TEST_EMAIL} for the test email${NC}"
else
    echo -e "${RED}❌ SES Email: FAILED${NC}"
    echo -e "${YELLOW}   Make sure ${SES_EMAIL} and ${TEST_EMAIL} are verified in SES${NC}"
fi

# Show sending statistics
echo -e "${YELLOW}SES Sending Statistics:${NC}"
aws ses get-send-statistics --region ${REGION} --output table | head -20

echo ""

# ============================================
# Test CloudWatch
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3. Testing CloudWatch${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Create test log stream
STREAM_NAME="test-$(date +%s)"
echo -e "${YELLOW}Creating log stream: ${STREAM_NAME}${NC}"

if aws logs create-log-stream \
  --log-group-name ${LOG_GROUP} \
  --log-stream-name ${STREAM_NAME} \
  --region ${REGION} 2>/dev/null; then
    echo -e "${GREEN}✓ Log stream created${NC}"
else
    echo -e "${YELLOW}⚠️  Log stream may already exist${NC}"
fi

# Put log event
echo -e "${YELLOW}Writing test log event...${NC}"
TIMESTAMP=$(date +%s)000

if aws logs put-log-events \
  --log-group-name ${LOG_GROUP} \
  --log-stream-name ${STREAM_NAME} \
  --log-events timestamp=${TIMESTAMP},message="Test log from setup script - $(date)" \
  --region ${REGION} 2>/dev/null; then
    echo -e "${GREEN}✅ CloudWatch Logs: SUCCESS${NC}"
else
    echo -e "${RED}❌ CloudWatch Logs: FAILED${NC}"
fi

# Show recent logs
echo -e "${YELLOW}Recent logs:${NC}"
aws logs tail ${LOG_GROUP} --since 5m --region ${REGION} 2>/dev/null | tail -10 || echo "No recent logs"

echo ""

# ============================================
# Summary
# ============================================

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}Services tested:${NC}"
echo "  • S3 (huntaze-assets)"
echo "  • SES (no-reply@huntaze.com)"
echo "  • CloudWatch (/aws/amplify/huntaze-production)"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check your email (${TEST_EMAIL}) for the test message"
echo "2. View logs in CloudWatch Console"
echo "3. If all tests passed, add environment variables to Amplify"
echo ""

echo -e "${GREEN}✅ Testing complete!${NC}"
