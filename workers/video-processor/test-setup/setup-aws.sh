#!/bin/bash

# Setup LocalStack with required resources
# This runs inside LocalStack container on startup

set -e

echo "Setting up LocalStack resources..."

# Create S3 bucket
awslocal s3 mb s3://test-videos || true
awslocal s3api put-bucket-cors --bucket test-videos --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["*"],
      "MaxAge": 3600
    }
  ]
}'

# Create SQS queue
awslocal sqs create-queue --queue-name huntaze-video-processing-local || true

# Create test video uploads directory
mkdir -p /tmp/test-videos

# Download a sample video for testing (optional)
# This would require internet access in LocalStack
# curl -o /tmp/test-videos/sample.mp4 https://example.com/sample-video.mp4

echo "LocalStack setup complete!"
