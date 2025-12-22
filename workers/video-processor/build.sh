#!/bin/bash

# Build and push Huntaze Video Processor to ECR
# Usage: ./build.sh [environment] [tag]
# Example: ./build.sh production latest

set -e

# Configuration
ENVIRONMENT=${1:-production}
TAG=${2:-latest}
AWS_REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPO_NAME="huntaze-video-processor"
IMAGE_NAME="${ECR_REGISTRY}/${REPO_NAME}:${TAG}"

echo "Building Huntaze Video Processor..."
echo "Environment: ${ENVIRONMENT}"
echo "Tag: ${TAG}"
echo "Image: ${IMAGE_NAME}"

# Create ECR repository if it doesn't exist
echo "Creating ECR repository..."
aws ecr create-repository \
  --repository-name "${REPO_NAME}" \
  --image-scanning-configuration scanOnPush=true \
  --region "${AWS_REGION}" || true

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# Build Docker image
echo "Building Docker image..."
docker build \
  --platform linux/amd64 \
  --tag "${IMAGE_NAME}" \
  --tag "${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}" \
  -f Dockerfile \
  .

# Push to ECR
echo "Pushing to ECR..."
docker push "${IMAGE_NAME}"
docker push "${ECR_REGISTRY}/${REPO_NAME}:${ENVIRONMENT}"

echo "✅ Build complete!"
echo "Image pushed to: ${IMAGE_NAME}"
echo ""
echo "Update your CloudFormation stack with:"
echo "ImageUri: ${IMAGE_NAME}"
