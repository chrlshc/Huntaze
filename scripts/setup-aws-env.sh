#!/bin/bash
# AWS Environment Setup Script
# Helps configure AWS credentials for production deployment

echo "🔐 AWS Environment Setup"
echo "========================"
echo ""

# Check if credentials are already set
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "✅ AWS credentials already configured"
    echo ""
    echo "Current configuration:"
    aws sts get-caller-identity 2>/dev/null || echo "❌ Credentials invalid or expired"
    echo ""
    read -p "Do you want to update credentials? (y/n): " UPDATE
    if [ "$UPDATE" != "y" ]; then
        echo "Keeping existing credentials"
        exit 0
    fi
fi

echo ""
echo "Please provide your AWS credentials:"
echo "(You can find these in your AWS SSO portal or IAM console)"
echo ""

# Prompt for credentials
read -p "AWS Access Key ID: " ACCESS_KEY
read -p "AWS Secret Access Key: " SECRET_KEY
read -p "AWS Session Token (optional, press Enter to skip): " SESSION_TOKEN
read -p "AWS Region [us-east-1]: " REGION

# Set defaults
REGION=${REGION:-us-east-1}

# Export credentials
export AWS_ACCESS_KEY_ID="$ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
if [ -n "$SESSION_TOKEN" ]; then
    export AWS_SESSION_TOKEN="$SESSION_TOKEN"
fi
export AWS_REGION="$REGION"

echo ""
echo "🔍 Verifying credentials..."

# Test credentials
IDENTITY=$(aws sts get-caller-identity 2>/dev/null || echo "")
if [ -n "$IDENTITY" ]; then
    ACCOUNT=$(echo "$IDENTITY" | jq -r '.Account')
    USER=$(echo "$IDENTITY" | jq -r '.Arn' | cut -d'/' -f2)
    
    echo "✅ Credentials verified!"
    echo ""
    echo "Account: $ACCOUNT"
    echo "User: $USER"
    echo "Region: $REGION"
    
    # Check if it's the expected account
    EXPECTED_ACCOUNT="317805897534"
    if [ "$ACCOUNT" != "$EXPECTED_ACCOUNT" ]; then
        echo ""
        echo "⚠️  WARNING: Expected account $EXPECTED_ACCOUNT, got $ACCOUNT"
        echo "Are you sure you want to continue with this account?"
        read -p "Continue? (y/n): " CONTINUE
        if [ "$CONTINUE" != "y" ]; then
            echo "Aborting"
            exit 1
        fi
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Environment configured successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "To persist these credentials in your current shell, run:"
    echo ""
    echo "  export AWS_ACCESS_KEY_ID=\"$ACCESS_KEY\""
    echo "  export AWS_SECRET_ACCESS_KEY=\"$SECRET_KEY\""
    if [ -n "$SESSION_TOKEN" ]; then
        echo "  export AWS_SESSION_TOKEN=\"$SESSION_TOKEN\""
    fi
    echo "  export AWS_REGION=\"$REGION\""
    echo ""
    echo "Or source this script:"
    echo "  source scripts/setup-aws-env.sh"
    echo ""
    echo "Next steps:"
    echo "  1. Run quick health check: ./scripts/quick-infrastructure-check.sh"
    echo "  2. Run GO/NO-GO audit: ./scripts/go-no-go-audit.sh"
    echo "  3. Follow deployment guide: docs/runbooks/QUICK_START_PRODUCTION.md"
    
else
    echo "❌ Failed to verify credentials"
    echo ""
    echo "Please check:"
    echo "  - Access Key ID is correct"
    echo "  - Secret Access Key is correct"
    echo "  - Session Token is valid (if using SSO)"
    echo "  - Credentials have not expired"
    echo "  - You have network connectivity to AWS"
    exit 1
fi
