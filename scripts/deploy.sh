#!/bin/bash

###############################################################################
# Huntaze Deployment Script
# Deploys Marketing Campaigns Backend + AWS Rate Limiter Integration
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_ID="d33l77zi1h78ce"
REGION="us-east-1"
BRANCH="main"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install it first."
        exit 1
    fi
    
    # Check Prisma
    if ! command -v npx &> /dev/null; then
        log_error "npx not found. Please install Node.js properly."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git not found. Please install it first."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

###############################################################################
# Step 1: Database Migration
###############################################################################

deploy_database() {
    log_info "Step 1: Deploying database migrations..."
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate
    
    # Create migration (dev environment)
    if [ "$1" == "dev" ]; then
        log_info "Creating migration..."
        npx prisma migrate dev --name add_marketing_and_rate_limiter_models
    fi
    
    # Deploy migration (production)
    if [ "$1" == "prod" ]; then
        log_warning "Deploying migration to production..."
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" == "yes" ]; then
            npx prisma migrate deploy
            log_success "Database migration deployed"
        else
            log_warning "Migration skipped"
        fi
    fi
}

###############################################################################
# Step 2: Configure Environment Variables
###############################################################################

configure_amplify() {
    log_info "Step 2: Configuring Amplify environment variables..."
    
    # Check if RATE_LIMITER_ENABLED should be set
    read -p "Enable rate limiter? (yes/no, default: no): " enable_rl
    RATE_LIMITER_ENABLED="false"
    if [ "$enable_rl" == "yes" ]; then
        RATE_LIMITER_ENABLED="true"
    fi
    
    log_info "Updating Amplify environment variables..."
    aws amplify update-app \
        --app-id "$APP_ID" \
        --region "$REGION" \
        --environment-variables \
            SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
            RATE_LIMITER_ENABLED="$RATE_LIMITER_ENABLED" \
            AWS_REGION=us-east-1 \
        > /dev/null 2>&1
    
    log_success "Environment variables configured (RATE_LIMITER_ENABLED=$RATE_LIMITER_ENABLED)"
}

###############################################################################
# Step 3: Deploy Infrastructure (Terraform)
###############################################################################

deploy_infrastructure() {
    log_info "Step 3: Deploying infrastructure (Terraform)..."
    
    if [ ! -d "infra/terraform/production-hardening" ]; then
        log_warning "Terraform directory not found, skipping..."
        return
    fi
    
    cd infra/terraform/production-hardening
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init -input=false
    
    # Plan
    log_info "Planning Terraform deployment..."
    terraform plan -out=tfplan
    
    # Apply
    read -p "Apply Terraform changes? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
        terraform apply tfplan
        log_success "Infrastructure deployed"
    else
        log_warning "Infrastructure deployment skipped"
    fi
    
    cd ../../..
}

###############################################################################
# Step 4: Build and Test
###############################################################################

build_and_test() {
    log_info "Step 4: Building and testing application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    
    # Build
    log_info "Building application..."
    npm run build
    
    # Run tests (optional)
    read -p "Run tests before deployment? (yes/no, default: yes): " run_tests
    if [ "$run_tests" != "no" ]; then
        log_info "Running tests..."
        npm run test:unit || log_warning "Some tests failed, continuing..."
    fi
    
    log_success "Build completed"
}

###############################################################################
# Step 5: Deploy to Amplify
###############################################################################

deploy_amplify() {
    log_info "Step 5: Deploying to AWS Amplify..."
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "You have uncommitted changes"
        read -p "Commit and push? (yes/no): " commit
        if [ "$commit" == "yes" ]; then
            git add .
            read -p "Commit message: " message
            git commit -m "$message"
            git push origin "$BRANCH"
        else
            log_error "Please commit your changes before deploying"
            exit 1
        fi
    else
        log_info "No uncommitted changes, pushing to trigger deployment..."
        git push origin "$BRANCH"
    fi
    
    # Trigger Amplify deployment
    log_info "Triggering Amplify deployment..."
    JOB_ID=$(aws amplify start-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH" \
        --job-type RELEASE \
        --region "$REGION" \
        --query 'jobSummary.jobId' \
        --output text)
    
    log_success "Deployment triggered (Job ID: $JOB_ID)"
    
    # Monitor deployment
    log_info "Monitoring deployment (this may take a few minutes)..."
    while true; do
        STATUS=$(aws amplify get-job \
            --app-id "$APP_ID" \
            --branch-name "$BRANCH" \
            --job-id "$JOB_ID" \
            --region "$REGION" \
            --query 'job.summary.status' \
            --output text)
        
        if [ "$STATUS" == "SUCCEED" ]; then
            log_success "Deployment successful! 🎉"
            break
        elif [ "$STATUS" == "FAILED" ] || [ "$STATUS" == "CANCELLED" ]; then
            log_error "Deployment failed with status: $STATUS"
            exit 1
        else
            echo -n "."
            sleep 10
        fi
    done
}

###############################################################################
# Step 6: Post-Deployment Validation
###############################################################################

validate_deployment() {
    log_info "Step 6: Validating deployment..."
    
    # Get app URL
    APP_URL=$(aws amplify get-app \
        --app-id "$APP_ID" \
        --region "$REGION" \
        --query 'app.defaultDomain' \
        --output text)
    
    FULL_URL="https://$BRANCH.$APP_URL"
    
    log_info "Application URL: $FULL_URL"
    
    # Health check
    log_info "Performing health check..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL/api/health" || echo "000")
    
    if [ "$HTTP_CODE" == "200" ]; then
        log_success "Health check passed"
    else
        log_warning "Health check returned HTTP $HTTP_CODE"
    fi
    
    # Check CloudWatch metrics
    log_info "Checking CloudWatch metrics..."
    METRIC_COUNT=$(aws cloudwatch list-metrics \
        --namespace "Huntaze/OnlyFans" \
        --region "$REGION" \
        --query 'length(Metrics)' \
        --output text)
    
    if [ "$METRIC_COUNT" -gt 0 ]; then
        log_success "CloudWatch metrics configured ($METRIC_COUNT metrics)"
    else
        log_warning "No CloudWatch metrics found yet"
    fi
    
    log_success "Deployment validation complete"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         Huntaze Deployment Script                         ║"
    echo "║  Marketing Campaigns + AWS Rate Limiter Integration       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Parse arguments
    ENV="${1:-dev}"
    
    if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
        log_error "Invalid environment. Use 'dev' or 'prod'"
        exit 1
    fi
    
    log_info "Deploying to: $ENV"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    echo ""
    
    deploy_database "$ENV"
    echo ""
    
    configure_amplify
    echo ""
    
    if [ "$ENV" == "prod" ]; then
        deploy_infrastructure
        echo ""
    fi
    
    build_and_test
    echo ""
    
    deploy_amplify
    echo ""
    
    validate_deployment
    echo ""
    
    # Summary
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                 Deployment Complete! 🎉                    ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    log_success "Next steps:"
    echo "  1. Monitor CloudWatch dashboard"
    echo "  2. Check application logs"
    echo "  3. Run smoke tests"
    echo "  4. Enable rate limiter progressively (10% → 50% → 100%)"
    echo ""
    log_info "Documentation: ./DEPLOYMENT_GUIDE.md"
    echo ""
}

# Run main function
main "$@"
