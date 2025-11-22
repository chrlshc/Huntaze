#!/bin/bash

# Integration Tests Runner with AWS Credentials
# This script sets up AWS credentials and runs integration tests

# Check if AWS credentials are provided
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS credentials not provided"
  echo "Usage: AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy AWS_SESSION_TOKEN=zzz ./scripts/run-integration-tests.sh"
  exit 1
fi

# Set AWS region and bucket
export AWS_REGION=${AWS_REGION:-us-east-1}
export AWS_S3_BUCKET=${AWS_S3_BUCKET:-huntaze-beta-assets}

echo "Running integration tests with AWS credentials..."
echo "Region: $AWS_REGION"
echo "Bucket: $AWS_S3_BUCKET"

# Run the tests
npm run test:integration
