#!/bin/bash

# Deploy AWS infrastructure for Huntaze Simple Services testing
# This script deploys the CloudFormation stack for CodeBuild, S3, and monitoring

set -e

# Configuration
STACK_NAME="huntaze-simple-services-ci"
TEMPLATE_FILE="cloudformation/codebuild-simple-services.yml"
REGION="us-east-1"
PROFILE="default"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
        log_error "AWS credentials not configured or invalid for profile: $PROFILE"
        exit 1
    fi
    
    # Check CloudFormation template exists
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "CloudFormation template not found: $TEMPLATE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Get user inputs
get_parameters() {
    log_info "Gathering deployment parameters..."
    
    # Get AWS Account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
    log_info "AWS Account ID: $ACCOUNT_ID"
    
    # Repository URL
    read -p "Enter CodeCommit repository URL: " REPO_URL
    if [ -z "$REPO_URL" ]; then
        REPO_URL="https://git-codecommit.$REGION.amazonaws.com/v1/repos/huntaze"
        log_warning "Using default repository URL: $REPO_URL"
    fi
    
    # Notification email
    read -p "Enter notification email address: " NOTIFICATION_EMAIL
    if [ -z "$NOTIFICATION_EMAIL" ]; then
        NOTIFICATION_EMAIL="dev@huntaze.com"
        log_warning "Using default email: $NOTIFICATION_EMAIL"
    fi
    
    # Stripe secret ARN
    read -p "Enter Stripe Secrets Manager ARN (or press Enter to create): " STRIPE_SECRET_ARN
    if [ -z "$STRIPE_SECRET_ARN" ]; then
        STRIPE_SECRET_ARN="arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:huntaze/stripe-secrets"
        log_warning "Using default secret ARN: $STRIPE_SECRET_ARN"
    fi
    
    # Environment
    read -p "Enter environment (test/staging/production) [test]: " ENVIRONMENT
    if [ -z "$ENVIRONMENT" ]; then
        ENVIRONMENT="test"
    fi
}

# Create Stripe secrets if they don't exist
create_stripe_secrets() {
    log_info "Checking Stripe secrets in AWS Secrets Manager..."
    
    SECRET_NAME="huntaze/stripe-secrets"
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --profile $PROFILE --region $REGION &> /dev/null; then
        log_success "Stripe secrets already exist in Secrets Manager"
        return
    fi
    
    log_info "Creating Stripe secrets in AWS Secrets Manager..."
    
    # Get Stripe keys from user
    echo "Please provide your Stripe test keys:"
    read -s -p "Stripe Secret Key (sk_test_...): " STRIPE_SECRET_KEY
    echo
    read -p "Stripe Pro Monthly Price ID: " STRIPE_PRO_MONTHLY
    read -p "Stripe Pro Yearly Price ID: " STRIPE_PRO_YEARLY
    read -p "Stripe Enterprise Monthly Price ID: " STRIPE_ENTERPRISE_MONTHLY
    read -p "Stripe Enterprise Yearly Price ID: " STRIPE_ENTERPRISE_YEARLY
    
    # Create secret JSON
    SECRET_JSON=$(jq -n \
        --arg secret_key "$STRIPE_SECRET_KEY" \
        --arg pro_monthly "$STRIPE_PRO_MONTHLY" \
        --arg pro_yearly "$STRIPE_PRO_YEARLY" \
        --arg enterprise_monthly "$STRIPE_ENTERPRISE_MONTHLY" \
        --arg enterprise_yearly "$STRIPE_ENTERPRISE_YEARLY" \
        '{
            STRIPE_SECRET_KEY: $secret_key,
            STRIPE_PRO_MONTHLY_PRICE_ID: $pro_monthly,
            STRIPE_PRO_YEARLY_PRICE_ID: $pro_yearly,
            STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: $enterprise_monthly,
            STRIPE_ENTERPRISE_YEARLY_PRICE_ID: $enterprise_yearly
        }')
    
    # Create the secret
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Stripe API keys for Huntaze testing" \
        --secret-string "$SECRET_JSON" \
        --profile $PROFILE \
        --region $REGION
    
    log_success "Stripe secrets created successfully"
}

# Validate CloudFormation template
validate_template() {
    log_info "Validating CloudFormation template..."
    
    aws cloudformation validate-template \
        --template-body file://$TEMPLATE_FILE \
        --profile $PROFILE \
        --region $REGION > /dev/null
    
    log_success "CloudFormation template is valid"
}

# Deploy CloudFormation stack
deploy_stack() {
    log_info "Deploying CloudFormation stack: $STACK_NAME"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --profile $PROFILE --region $REGION &> /dev/null; then
        log_info "Stack exists, updating..."
        OPERATION="update-stack"
    else
        log_info "Stack doesn't exist, creating..."
        OPERATION="create-stack"
    fi
    
    # Deploy stack
    aws cloudformation $OPERATION \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters \
            ParameterKey=RepositoryUrl,ParameterValue=$REPO_URL \
            ParameterKey=StripeSecretArn,ParameterValue=$STRIPE_SECRET_ARN \
            ParameterKey=NotificationEmail,ParameterValue=$NOTIFICATION_EMAIL \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        --capabilities CAPABILITY_NAMED_IAM \
        --profile $PROFILE \
        --region $REGION
    
    log_info "Waiting for stack deployment to complete..."
    
    aws cloudformation wait stack-${OPERATION%-stack}-complete \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION
    
    log_success "Stack deployment completed successfully"
}

# Get stack outputs
get_stack_outputs() {
    log_info "Retrieving stack outputs..."
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    echo "$OUTPUTS" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"'
    
    # Save outputs to file
    echo "$OUTPUTS" > stack-outputs.json
    log_success "Stack outputs saved to stack-outputs.json"
}

# Test the deployment
test_deployment() {
    log_info "Testing the deployment..."
    
    # Get CodeBuild project name
    PROJECT_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CodeBuildProjectName") | .OutputValue')
    
    if [ "$PROJECT_NAME" != "null" ] && [ -n "$PROJECT_NAME" ]; then
        log_info "Starting a test build..."
        
        BUILD_ID=$(aws codebuild start-build \
            --project-name $PROJECT_NAME \
            --profile $PROFILE \
            --region $REGION \
            --query 'build.id' \
            --output text)
        
        log_success "Test build started with ID: $BUILD_ID"
        log_info "You can monitor the build in the AWS Console or use:"
        log_info "aws codebuild batch-get-builds --ids $BUILD_ID --profile $PROFILE --region $REGION"
    else
        log_warning "Could not retrieve CodeBuild project name for testing"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here
}

# Main execution
main() {
    log_info "Starting AWS infrastructure deployment for Huntaze Simple Services"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment steps
    check_prerequisites
    get_parameters
    create_stripe_secrets
    validate_template
    deploy_stack
    get_stack_outputs
    
    # Optional test
    read -p "Do you want to start a test build? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_deployment
    fi
    
    log_success "Deployment completed successfully!"
    log_info "Next steps:"
    log_info "1. Check your email for SNS subscription confirmation"
    log_info "2. Push code to your repository to trigger builds"
    log_info "3. Monitor builds in the AWS CodeBuild console"
    log_info "4. View metrics in the CloudWatch dashboard"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -r, --region   AWS region (default: us-east-1)"
    echo "  -p, --profile  AWS profile (default: default)"
    echo "  -s, --stack    Stack name (default: huntaze-simple-services-ci)"
    echo ""
    echo "Example:"
    echo "  $0 --region us-west-2 --profile production"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -s|--stack)
            STACK_NAME="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main