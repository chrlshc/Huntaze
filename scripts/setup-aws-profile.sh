#!/bin/bash

# Setup AWS Profile for Huntaze Performance Optimization
# This script helps configure AWS credentials using AWS CLI profiles

echo "🔧 AWS Profile Setup for Huntaze"
echo "=================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "Please install it: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI is installed"
echo ""

# List available profiles
echo "Available AWS profiles:"
aws configure list-profiles

echo ""
echo "Which profile would you like to use?"
read -p "Profile name (or press Enter for 'default'): " PROFILE_NAME

if [ -z "$PROFILE_NAME" ]; then
    PROFILE_NAME="default"
fi

echo ""
echo "Testing profile: $PROFILE_NAME"

# Test the profile
if aws sts get-caller-identity --profile "$PROFILE_NAME" &> /dev/null; then
    echo "✅ Profile '$PROFILE_NAME' is valid"
    
    # Get account info
    ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE_NAME" --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile "$PROFILE_NAME" --query Arn --output text)
    
    echo ""
    echo "Account ID: $ACCOUNT_ID"
    echo "User/Role: $USER_ARN"
    echo ""
    
    # Update .env.aws.local
    echo "Updating .env.aws.local with profile configuration..."
    cat > .env.aws.local << EOF
# AWS Configuration for Huntaze Performance Optimization
# Using AWS CLI Profile: $PROFILE_NAME

AWS_PROFILE=$PROFILE_NAME
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$ACCOUNT_ID

# Note: When using AWS_PROFILE, the SDK will automatically use
# credentials from ~/.aws/credentials for the specified profile
EOF
    
    echo "✅ Configuration saved to .env.aws.local"
    echo ""
    echo "You can now run: npm run test:aws-connection"
    
else
    echo "❌ Profile '$PROFILE_NAME' is not valid or not configured"
    echo ""
    echo "To configure a new profile, run:"
    echo "  aws configure --profile $PROFILE_NAME"
    exit 1
fi
