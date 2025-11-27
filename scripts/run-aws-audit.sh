#!/bin/bash

# AWS Infrastructure Audit Runner
# This script runs the AWS audit using credentials from environment variables

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS credentials not found in environment variables"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_access_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "  export AWS_SESSION_TOKEN=your_session_token (if using temporary credentials)"
    echo "  export AWS_REGION=us-east-1"
    echo ""
    exit 1
fi

# Set default region if not set
export AWS_REGION="${AWS_REGION:-us-east-1}"

echo "✅ AWS credentials found"
echo "📍 Region: $AWS_REGION"
echo ""

# Run the audit script
npx tsx scripts/audit-aws-infrastructure.ts
