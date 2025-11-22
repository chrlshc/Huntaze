#!/bin/bash

###############################################################################
# Deploy CloudFront Distribution
#
# This script deploys the CloudFront distribution for Huntaze Beta
#
# Usage:
#   ./scripts/deploy-cloudfront.sh
#   ./scripts/deploy-cloudfront.sh --with-custom-domain
#   ./scripts/deploy-cloudfront.sh --update
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="huntaze-beta-cloudfront"
S3_STACK_NAME="huntaze-beta-s3"
TEMPLATE_FILE="infra/aws/cloudfront-distribution-stack.yaml"
REGION="us-east-1"

# Parameters
S3_BUCKET_NAME="${AWS_S3_BUCKET:-huntaze-beta-assets}"
VERCEL_DOMAIN="${VERCEL_DOMAIN:-huntaze.vercel.app}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-}"
ACM_CERTIFICATE_ARN="${ACM_CERTIFICATE_ARN:-}"
ENVIRONMENT="${ENVIRONMENT:-beta}"

# Flags
UPDATE_MODE=false
WITH_CUSTOM_DOMAIN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --update)
      UPDATE_MODE=true
      shift
      ;;
    --with-custom-domain)
      WITH_CUSTOM_DOMAIN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --update              Update existing stack instead of creating new one"
      echo "  --with-custom-domain  Deploy with custom domain (requires CUSTOM_DOMAIN and ACM_CERTIFICATE_ARN)"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

check_prerequisites() {
  print_header "Checking Prerequisites"
  
  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
  fi
  print_success "AWS CLI found"
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    exit 1
  fi
  print_success "AWS credentials configured"
  
  # Check template file
  if [ ! -f "$TEMPLATE_FILE" ]; then
    print_error "Template file not found: $TEMPLATE_FILE"
    exit 1
  fi
  print_success "Template file found"
  
  # Check S3 stack exists
  if ! aws cloudformation describe-stacks --stack-name "$S3_STACK_NAME" --region "$REGION" &> /dev/null; then
    print_error "S3 stack not found: $S3_STACK_NAME"
    print_info "Please deploy S3 stack first (Task 31)"
    exit 1
  fi
  print_success "S3 stack found"
  
  # Check custom domain requirements
  if [ "$WITH_CUSTOM_DOMAIN" = true ]; then
    if [ -z "$CUSTOM_DOMAIN" ] || [ -z "$ACM_CERTIFICATE_ARN" ]; then
      print_error "Custom domain requires CUSTOM_DOMAIN and ACM_CERTIFICATE_ARN environment variables"
      exit 1
    fi
    print_success "Custom domain configuration found"
  fi
  
  echo ""
}

build_parameters() {
  local params="ParameterKey=S3BucketName,ParameterValue=$S3_BUCKET_NAME"
  params="$params ParameterKey=VercelDomain,ParameterValue=$VERCEL_DOMAIN"
  params="$params ParameterKey=Environment,ParameterValue=$ENVIRONMENT"
  
  if [ "$WITH_CUSTOM_DOMAIN" = true ]; then
    params="$params ParameterKey=CustomDomain,ParameterValue=$CUSTOM_DOMAIN"
    params="$params ParameterKey=ACMCertificateArn,ParameterValue=$ACM_CERTIFICATE_ARN"
  fi
  
  echo "$params"
}

deploy_stack() {
  print_header "Deploying CloudFront Stack"
  
  local params=$(build_parameters)
  
  print_info "Stack Name: $STACK_NAME"
  print_info "S3 Bucket: $S3_BUCKET_NAME"
  print_info "Vercel Domain: $VERCEL_DOMAIN"
  print_info "Environment: $ENVIRONMENT"
  
  if [ "$WITH_CUSTOM_DOMAIN" = true ]; then
    print_info "Custom Domain: $CUSTOM_DOMAIN"
  fi
  
  echo ""
  
  if [ "$UPDATE_MODE" = true ]; then
    print_info "Updating existing stack..."
    
    aws cloudformation update-stack \
      --stack-name "$STACK_NAME" \
      --template-body "file://$TEMPLATE_FILE" \
      --parameters $params \
      --region "$REGION" \
      --capabilities CAPABILITY_IAM
    
    print_success "Stack update initiated"
  else
    print_info "Creating new stack..."
    
    aws cloudformation create-stack \
      --stack-name "$STACK_NAME" \
      --template-body "file://$TEMPLATE_FILE" \
      --parameters $params \
      --region "$REGION" \
      --capabilities CAPABILITY_IAM
    
    print_success "Stack creation initiated"
  fi
  
  echo ""
}

wait_for_stack() {
  print_header "Waiting for Stack Completion"
  
  print_warning "This may take 15-20 minutes..."
  echo ""
  
  local status=""
  local count=0
  
  while true; do
    status=$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --region "$REGION" \
      --query 'Stacks[0].StackStatus' \
      --output text 2>/dev/null || echo "FAILED")
    
    case $status in
      CREATE_COMPLETE|UPDATE_COMPLETE)
        echo ""
        print_success "Stack deployment completed!"
        break
        ;;
      CREATE_FAILED|UPDATE_FAILED|ROLLBACK_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
        echo ""
        print_error "Stack deployment failed: $status"
        exit 1
        ;;
      *)
        printf "\r${BLUE}Status: $status (${count}s)${NC}"
        sleep 10
        count=$((count + 10))
        ;;
    esac
  done
  
  echo ""
}

get_outputs() {
  print_header "Stack Outputs"
  
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
  
  echo ""
}

update_s3_bucket_policy() {
  print_header "Updating S3 Bucket Policy"
  
  print_info "Getting CloudFront OAI Canonical User ID..."
  
  local oai_canonical_user_id=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontOAICanonicalUserId`].OutputValue' \
    --output text)
  
  if [ -z "$oai_canonical_user_id" ]; then
    print_error "Failed to get OAI Canonical User ID"
    exit 1
  fi
  
  print_success "OAI Canonical User ID: $oai_canonical_user_id"
  
  print_info "Updating S3 bucket policy..."
  
  aws cloudformation update-stack \
    --stack-name "$S3_STACK_NAME" \
    --template-body "file://infra/aws/s3-bucket-stack.yaml" \
    --parameters \
      ParameterKey=BucketName,ParameterValue=$S3_BUCKET_NAME \
      ParameterKey=CloudFrontOAIId,ParameterValue=$oai_canonical_user_id \
    --region "$REGION"
  
  print_success "S3 bucket policy update initiated"
  
  echo ""
}

print_next_steps() {
  print_header "Next Steps"
  
  local distribution_domain=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
    --output text)
  
  echo "1. Update your .env.production file:"
  echo "   CDN_URL=https://$distribution_domain"
  echo ""
  
  if [ "$WITH_CUSTOM_DOMAIN" = true ]; then
    echo "2. Verify DNS configuration for $CUSTOM_DOMAIN"
    echo "   - Create CNAME or A (alias) record pointing to $distribution_domain"
    echo "   - Wait 24-48 hours for DNS propagation"
    echo ""
  fi
  
  echo "3. Test the CloudFront distribution:"
  echo "   curl -I https://$distribution_domain"
  echo ""
  
  echo "4. Test static assets:"
  echo "   curl -I https://$distribution_domain/_next/static/test.js"
  echo ""
  
  echo "5. Monitor CloudWatch metrics:"
  echo "   - Cache Hit Rate (target: > 80%)"
  echo "   - Error Rate (target: < 0.1%)"
  echo "   - Origin Latency (target: < 1s)"
  echo ""
  
  echo "6. Review CloudFront logs:"
  echo "   aws s3 ls s3://$S3_BUCKET_NAME-logs/cloudfront/$ENVIRONMENT/"
  echo ""
  
  print_success "CloudFront deployment complete!"
}

###############################################################################
# Main
###############################################################################

main() {
  print_header "CloudFront Deployment Script"
  echo ""
  
  check_prerequisites
  deploy_stack
  wait_for_stack
  get_outputs
  update_s3_bucket_policy
  print_next_steps
}

# Run main function
main
