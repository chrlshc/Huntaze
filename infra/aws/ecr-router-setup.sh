#!/bin/bash
# =============================================================================
# ECR Repository Setup for AI Router
# =============================================================================
# Creates ECR repository and pushes the AI Router Docker image
#
# Usage:
#   ./infra/aws/ecr-router-setup.sh [--region REGION] [--profile PROFILE]
#
# Prerequisites:
#   - AWS CLI configured
#   - Docker installed and running
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO_NAME="huntaze/ai-router"
AWS_REGION="${AWS_REGION:-us-east-2}"
AWS_PROFILE="${AWS_PROFILE:-default}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--region REGION] [--profile PROFILE] [--tag TAG]"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ECR Setup for AI Router${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  Region:  ${YELLOW}$AWS_REGION${NC}"
echo -e "  Profile: ${YELLOW}$AWS_PROFILE${NC}"
echo -e "  Repo:    ${YELLOW}$REPO_NAME${NC}"
echo -e "  Tag:     ${YELLOW}$IMAGE_TAG${NC}"
echo ""

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
echo -e "${GREEN}✓ Account ID: $AWS_ACCOUNT_ID${NC}"

# ECR registry URL
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${ECR_REGISTRY}/${REPO_NAME}:${IMAGE_TAG}"

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Creating ECR repository...${NC}"
aws ecr describe-repositories \
    --repository-names "$REPO_NAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" 2>/dev/null || \
aws ecr create-repository \
    --repository-name "$REPO_NAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256

echo -e "${GREEN}✓ ECR repository ready${NC}"

# Set lifecycle policy to keep only last 10 images
echo -e "${YELLOW}Setting lifecycle policy...${NC}"
aws ecr put-lifecycle-policy \
    --repository-name "$REPO_NAME" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --lifecycle-policy-text '{
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    }' 2>/dev/null || true

echo -e "${GREEN}✓ Lifecycle policy set${NC}"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" | \
docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t "$REPO_NAME:$IMAGE_TAG" lib/ai/router/

echo -e "${GREEN}✓ Image built${NC}"

# Tag for ECR
echo -e "${YELLOW}Tagging image for ECR...${NC}"
docker tag "$REPO_NAME:$IMAGE_TAG" "$ECR_IMAGE"

echo -e "${GREEN}✓ Image tagged${NC}"

# Push to ECR
echo -e "${YELLOW}Pushing to ECR...${NC}"
docker push "$ECR_IMAGE"

echo -e "${GREEN}✓ Image pushed${NC}"

# Get image size
IMAGE_SIZE=$(docker images "$ECR_IMAGE" --format "{{.Size}}")

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ ECR Setup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Image URI:  ${BLUE}$ECR_IMAGE${NC}"
echo -e "  Image Size: ${BLUE}$IMAGE_SIZE${NC}"
echo ""
echo -e "  Use this URI in your ECS task definition."
echo ""
