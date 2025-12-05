#!/bin/bash
set -e

# AWS credentials - use environment variables or AWS CLI profile
# export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
# export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
# export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"

ECR="317805897534.dkr.ecr.us-east-2.amazonaws.com"
IMG="huntaze-ai-router"

echo "=== ECR Login ==="
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $ECR

echo "=== Build ==="
docker build -t $IMG lib/ai/router/

echo "=== Tag & Push ==="
docker tag $IMG:latest $ECR/$IMG:latest
docker push $ECR/$IMG:latest

echo "=== Done! ==="
