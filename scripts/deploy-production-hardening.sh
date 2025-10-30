#!/bin/bash

# ============================================================================
# Deploy AWS Production Hardening Infrastructure
# ============================================================================
# This script deploys the Terraform infrastructure for production hardening
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="infra/terraform/production-hardening"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="317805897534"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Production Hardening Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Verify AWS account
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Wrong AWS account${NC}"
    echo "Expected: $AWS_ACCOUNT_ID"
    echo "Current: $CURRENT_ACCOUNT"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Navigate to Terraform directory
cd "$TERRAFORM_DIR"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}Creating terraform.tfvars from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${YELLOW}Please review and update terraform.tfvars if needed${NC}"
    echo ""
fi

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

echo -e "${GREEN}✓ Terraform initialized${NC}"
echo ""

# Validate Terraform configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate

echo -e "${GREEN}✓ Configuration valid${NC}"
echo ""

# Plan deployment
echo -e "${YELLOW}Planning deployment...${NC}"
terraform plan -out=tfplan

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Review the plan above${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
read -p "Do you want to apply this plan? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    rm -f tfplan
    exit 0
fi

# Apply deployment
echo ""
echo -e "${YELLOW}Applying deployment...${NC}"
terraform apply tfplan

echo -e "${GREEN}✓ Deployment complete${NC}"
echo ""

# Clean up plan file
rm -f tfplan

# Get outputs
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Deployment Outputs${NC}"
echo -e "${YELLOW}========================================${NC}"
terraform output

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Verification${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verify SQS queues
echo -e "${YELLOW}Verifying SQS queues...${NC}"
aws sqs list-queues --region $AWS_REGION | grep -E "huntaze-hybrid-workflows|huntaze-rate-limiter" || echo "No queues found"

# Verify DynamoDB tables
echo -e "${YELLOW}Verifying DynamoDB tables...${NC}"
aws dynamodb list-tables --region $AWS_REGION | grep -E "huntaze-ai-costs|huntaze-cost-alerts" || echo "No tables found"

# Verify SNS topics
echo -e "${YELLOW}Verifying SNS topics...${NC}"
aws sns list-topics --region $AWS_REGION | grep "huntaze-cost-alerts" || echo "No topics found"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Next Steps${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "1. Subscribe to SNS topic for cost alerts:"
echo "   aws sns subscribe --topic-arn <ARN> --protocol email --notification-endpoint admin@huntaze.com"
echo ""
echo "2. Update application environment variables with queue URLs and table names"
echo ""
echo "3. Continue with Week 1 tasks:"
echo "   - Migrate ElastiCache to encrypted cluster"
echo "   - Enable GuardDuty, Security Hub, CloudTrail"
echo "   - Enable Container Insights on ECS clusters"
echo ""
echo -e "${GREEN}Deployment successful! 🚀${NC}"
