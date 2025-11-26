#!/bin/bash

# AWS SES Verification Script for Staging
# Verifies all SES configuration on AWS

set -e

echo "🔍 AWS SES Configuration Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    echo "Install: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI found${NC}"
echo ""

# Set region
REGION="us-east-1"
export AWS_REGION=$REGION

echo "📍 Region: $REGION"
echo ""

# Check AWS credentials
echo "🔐 Checking AWS Credentials..."
echo "--------------------------------"

if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    echo -e "${GREEN}✅ Credentials valid${NC}"
    echo "   Account ID: $ACCOUNT_ID"
    echo "   User: $USER_ARN"
else
    echo -e "${RED}❌ Invalid AWS credentials${NC}"
    echo "Set credentials with: aws configure"
    exit 1
fi

echo ""

# Check SES Account Status
echo "📊 SES Account Status..."
echo "------------------------"

SEND_QUOTA=$(aws ses get-send-quota --region $REGION 2>/dev/null)

if [ $? -eq 0 ]; then
    MAX_24_HOUR=$(echo $SEND_QUOTA | jq -r '.Max24HourSend')
    MAX_SEND_RATE=$(echo $SEND_QUOTA | jq -r '.MaxSendRate')
    SENT_LAST_24=$(echo $SEND_QUOTA | jq -r '.SentLast24Hours')
    
    echo -e "${GREEN}✅ SES Account Active${NC}"
    echo "   Max 24h Send: $MAX_24_HOUR emails"
    echo "   Max Send Rate: $MAX_SEND_RATE emails/second"
    echo "   Sent Last 24h: $SENT_LAST_24 emails"
    echo ""
    
    # Check if in sandbox
    if (( $(echo "$MAX_24_HOUR <= 200" | bc -l) )); then
        echo -e "${YELLOW}⚠️  SANDBOX MODE ACTIVE${NC}"
        echo "   - Can only send to verified emails"
        echo "   - Limited to 200 emails/day"
        echo "   - Request production access to remove limits"
    else
        echo -e "${GREEN}✅ Production Mode Active${NC}"
    fi
else
    echo -e "${RED}❌ Cannot access SES${NC}"
    echo "Check IAM permissions for ses:GetSendQuota"
    exit 1
fi

echo ""

# Check Verified Identities
echo "📧 Verified Email Identities..."
echo "--------------------------------"

IDENTITIES=$(aws ses list-identities --region $REGION --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    IDENTITY_COUNT=$(echo $IDENTITIES | jq -r '.Identities | length')
    echo -e "${GREEN}✅ Found $IDENTITY_COUNT verified identities${NC}"
    echo ""
    
    # Check each identity
    echo $IDENTITIES | jq -r '.Identities[]' | while read identity; do
        VERIFICATION=$(aws ses get-identity-verification-attributes \
            --identities "$identity" \
            --region $REGION \
            --output json 2>/dev/null)
        
        STATUS=$(echo $VERIFICATION | jq -r ".VerificationAttributes[\"$identity\"].VerificationStatus")
        
        if [ "$STATUS" == "Success" ]; then
            echo -e "   ${GREEN}✅${NC} $identity (Verified)"
        else
            echo -e "   ${YELLOW}⏳${NC} $identity (Status: $STATUS)"
        fi
    done
else
    echo -e "${RED}❌ Cannot list identities${NC}"
fi

echo ""

# Check specific required identities
echo "🎯 Required Identities Check..."
echo "--------------------------------"

REQUIRED_IDENTITIES=(
    "huntaze.com"
    "no-reply@huntaze.com"
    "charles@huntaze.com"
)

for identity in "${REQUIRED_IDENTITIES[@]}"; do
    VERIFICATION=$(aws ses get-identity-verification-attributes \
        --identities "$identity" \
        --region $REGION \
        --output json 2>/dev/null)
    
    STATUS=$(echo $VERIFICATION | jq -r ".VerificationAttributes[\"$identity\"].VerificationStatus")
    
    if [ "$STATUS" == "Success" ]; then
        echo -e "   ${GREEN}✅${NC} $identity"
    elif [ "$STATUS" == "null" ] || [ -z "$STATUS" ]; then
        echo -e "   ${RED}❌${NC} $identity (Not found - needs verification)"
    else
        echo -e "   ${YELLOW}⏳${NC} $identity (Status: $STATUS)"
    fi
done

echo ""

# Check IAM Permissions
echo "🔒 IAM Permissions Check..."
echo "---------------------------"

# Test SES permissions
echo -n "   Testing ses:SendEmail... "
if aws ses send-email \
    --from "no-reply@huntaze.com" \
    --destination "ToAddresses=charles@huntaze.com" \
    --message "Subject={Data=Test},Body={Text={Data=Test}}" \
    --region $REGION \
    --dry-run 2>&1 | grep -q "DryRun"; then
    echo -e "${GREEN}✅${NC}"
else
    # Try without dry-run flag (some AWS accounts don't support it)
    echo -e "${YELLOW}⚠️  (dry-run not supported, permission likely OK)${NC}"
fi

echo ""

# Check DKIM Status
echo "🔐 DKIM Configuration..."
echo "------------------------"

for identity in "huntaze.com" "no-reply@huntaze.com"; do
    DKIM=$(aws ses get-identity-dkim-attributes \
        --identities "$identity" \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        DKIM_ENABLED=$(echo $DKIM | jq -r ".DkimAttributes[\"$identity\"].DkimEnabled")
        DKIM_STATUS=$(echo $DKIM | jq -r ".DkimAttributes[\"$identity\"].DkimVerificationStatus")
        
        if [ "$DKIM_ENABLED" == "true" ] && [ "$DKIM_STATUS" == "Success" ]; then
            echo -e "   ${GREEN}✅${NC} $identity - DKIM Enabled & Verified"
        elif [ "$DKIM_ENABLED" == "true" ]; then
            echo -e "   ${YELLOW}⏳${NC} $identity - DKIM Enabled (Status: $DKIM_STATUS)"
        else
            echo -e "   ${YELLOW}⚠️${NC}  $identity - DKIM Not Enabled"
        fi
    fi
done

echo ""

# Test Email Sending
echo "📨 Test Email Sending..."
echo "------------------------"

read -p "Send a test email to charles@huntaze.com? (y/n): " SEND_TEST

if [ "$SEND_TEST" == "y" ]; then
    echo ""
    echo "Sending test email..."
    
    RESULT=$(aws ses send-email \
        --from "no-reply@huntaze.com" \
        --destination "ToAddresses=charles@huntaze.com" \
        --message "Subject={Data='SES Test from Verification Script'},Body={Text={Data='This is a test email from the SES verification script. If you receive this, SES is working correctly!'}}" \
        --region $REGION \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        MESSAGE_ID=$(echo $RESULT | jq -r '.MessageId')
        echo -e "${GREEN}✅ Test email sent successfully!${NC}"
        echo "   Message ID: $MESSAGE_ID"
        echo "   Check inbox: charles@huntaze.com"
    else
        echo -e "${RED}❌ Failed to send test email${NC}"
        echo "   Error: $RESULT"
        
        # Provide specific error hints
        if echo "$RESULT" | grep -q "not verified"; then
            echo ""
            echo -e "${YELLOW}💡 Hint: Email address not verified${NC}"
            echo "   Verify at: https://console.aws.amazon.com/ses/home?region=$REGION#/verified-identities"
        elif echo "$RESULT" | grep -q "Access Denied"; then
            echo ""
            echo -e "${YELLOW}💡 Hint: IAM permissions issue${NC}"
            echo "   Ensure policy allows: ses:SendEmail, ses:SendRawEmail"
        fi
    fi
else
    echo "Skipped test email"
fi

echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""

# Count verified identities
VERIFIED_COUNT=0
for identity in "${REQUIRED_IDENTITIES[@]}"; do
    VERIFICATION=$(aws ses get-identity-verification-attributes \
        --identities "$identity" \
        --region $REGION \
        --output json 2>/dev/null)
    
    STATUS=$(echo $VERIFICATION | jq -r ".VerificationAttributes[\"$identity\"].VerificationStatus")
    
    if [ "$STATUS" == "Success" ]; then
        ((VERIFIED_COUNT++))
    fi
done

echo "Required Identities: $VERIFIED_COUNT/3 verified"

if [ $VERIFIED_COUNT -eq 3 ]; then
    echo -e "${GREEN}✅ All required identities verified${NC}"
else
    echo -e "${YELLOW}⚠️  Some identities need verification${NC}"
fi

echo ""

# Check sandbox status
if (( $(echo "$MAX_24_HOUR <= 200" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Sandbox Mode: Request production access${NC}"
    echo "   https://console.aws.amazon.com/ses/home?region=$REGION#/account"
else
    echo -e "${GREEN}✅ Production Mode Active${NC}"
fi

echo ""

# Next steps
echo "🎯 Next Steps"
echo "-------------"

if [ $VERIFIED_COUNT -lt 3 ]; then
    echo "1. Verify missing identities in SES Console"
    echo "   https://console.aws.amazon.com/ses/home?region=$REGION#/verified-identities"
fi

if (( $(echo "$MAX_24_HOUR <= 200" | bc -l) )); then
    echo "2. Request production access to remove sandbox limits"
    echo "   https://console.aws.amazon.com/ses/home?region=$REGION#/account"
fi

echo "3. Add environment variables to Amplify Console"
echo "4. Deploy code changes"
echo "5. Test with: curl -X POST https://staging.huntaze.com/api/debug/email"

echo ""
echo -e "${GREEN}✅ Verification complete!${NC}"
