#!/bin/bash

# Huntaze Hybrid Orchestrator - Complete Production Deployment Script
# This script automates the entire deployment process

set -e

REGION="us-east-1"
ACCOUNT_ID="317805897534"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}🚀 Huntaze Hybrid Orchestrator - Production Deployment${NC}"
echo "========================================================"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}${BOLD}$1${NC}"
    echo "----------------------------------------"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if AWS credentials are configured
print_section "1. Checking AWS Credentials"
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS credentials not configured"
    echo ""
    echo "Please configure your AWS credentials:"
    echo "  export AWS_ACCESS_KEY_ID=..."
    echo "  export AWS_SECRET_ACCESS_KEY=..."
    echo "  export AWS_SESSION_TOKEN=..."
    exit 1
fi

CALLER_IDENTITY=$(aws sts get-caller-identity)
AWS_ACCOUNT=$(echo $CALLER_IDENTITY | jq -r '.Account')
AWS_USER=$(echo $CALLER_IDENTITY | jq -r '.Arn' | cut -d'/' -f2)

print_success "AWS credentials OK"
print_info "Account: $AWS_ACCOUNT"
print_info "User: $AWS_USER"

# Create AWS resources
print_section "2. Creating AWS Resources"

# Function to create DynamoDB table if not exists
create_dynamodb_table() {
    local table_name=$1
    local hash_key=$2
    local range_key=$3
    
    if aws dynamodb describe-table --table-name "$table_name" --region "$REGION" > /dev/null 2>&1; then
        print_warning "Table already exists: $table_name"
    else
        print_info "Creating table: $table_name"
        
        if [ -z "$range_key" ]; then
            aws dynamodb create-table \
                --table-name "$table_name" \
                --attribute-definitions AttributeName="$hash_key",AttributeType=S \
                --key-schema AttributeName="$hash_key",KeyType=HASH \
                --billing-mode PAY_PER_REQUEST \
                --region "$REGION" \
                > /dev/null
        else
            aws dynamodb create-table \
                --table-name "$table_name" \
                --attribute-definitions \
                    AttributeName="$hash_key",AttributeType=S \
                    AttributeName="$range_key",AttributeType=S \
                --key-schema \
                    AttributeName="$hash_key",KeyType=HASH \
                    AttributeName="$range_key",KeyType=RANGE \
                --billing-mode PAY_PER_REQUEST \
                --region "$REGION" \
                > /dev/null
        fi
        
        print_success "Created table: $table_name"
    fi
}

# Function to create SQS queue if not exists
create_sqs_queue() {
    local queue_name=$1
    
    if aws sqs get-queue-url --queue-name "$queue_name" --region "$REGION" > /dev/null 2>&1; then
        print_warning "Queue already exists: $queue_name"
    else
        print_info "Creating queue: $queue_name"
        aws sqs create-queue \
            --queue-name "$queue_name" \
            --region "$REGION" \
            > /dev/null
        print_success "Created queue: $queue_name"
    fi
}

# Function to create SNS topic if not exists
create_sns_topic() {
    local topic_name=$1
    local topic_arn="arn:aws:sns:$REGION:$ACCOUNT_ID:$topic_name"
    
    if aws sns get-topic-attributes --topic-arn "$topic_arn" --region "$REGION" > /dev/null 2>&1; then
        print_warning "Topic already exists: $topic_name"
    else
        print_info "Creating topic: $topic_name"
        aws sns create-topic \
            --name "$topic_name" \
            --region "$REGION" \
            > /dev/null
        print_success "Created topic: $topic_name"
    fi
}

# Create resources
create_dynamodb_table "huntaze-ai-costs-production" "id" "timestamp"
create_dynamodb_table "huntaze-cost-alerts-production" "id" ""
create_sqs_queue "huntaze-hybrid-workflows"
create_sqs_queue "huntaze-rate-limiter-queue"
create_sns_topic "huntaze-cost-alerts"

print_success "All AWS resources created/verified"

# Check if code is ready
print_section "3. Verifying Code"

# Check if key files exist
REQUIRED_FILES=(
    "lib/services/production-hybrid-orchestrator-v2.ts"
    "lib/services/integration-middleware.ts"
    "lib/services/enhanced-rate-limiter.ts"
    "lib/services/cost-monitoring-service.ts"
    "app/api/v2/campaigns/hybrid/route.ts"
    "app/api/health/hybrid-orchestrator/route.ts"
    "amplify.yml"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = false ]; then
    print_error "Some required files are missing"
    exit 1
fi

print_success "All required files present"

# Build check
print_section "4. Testing Build"

print_info "Running npm install..."
npm ci --no-audit --no-fund > /dev/null 2>&1 || npm i --no-audit --no-fund > /dev/null 2>&1

print_info "Testing build..."
if npm run build > /tmp/huntaze-build.log 2>&1; then
    print_success "Build successful"
else
    print_error "Build failed"
    echo ""
    echo "Build log:"
    tail -20 /tmp/huntaze-build.log
    exit 1
fi

# Git status
print_section "5. Preparing Git Commit"

if [ -n "$(git status --porcelain)" ]; then
    print_info "Uncommitted changes detected"
    
    echo ""
    echo "Files to commit:"
    git status --short
    echo ""
    
    read -p "Commit and push these changes? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "feat: hybrid orchestrator production deployment

- Add ProductionHybridOrchestrator with Azure/OpenAI routing
- Add EnhancedRateLimiter for OnlyFans compliance
- Add CostMonitoringService with real-time tracking
- Add 16 API endpoints (5 MVP + 11 Phase 2)
- Configure Amplify with optimized build
- Add comprehensive documentation

Ready for production deployment 🚀"
        
        print_success "Changes committed"
        
        echo ""
        read -p "Push to origin main? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            print_success "Pushed to origin main"
            print_info "Amplify will auto-deploy in ~5 minutes"
        else
            print_warning "Skipped push - you'll need to push manually"
        fi
    else
        print_warning "Skipped commit - you'll need to commit manually"
    fi
else
    print_success "No uncommitted changes"
    print_info "Ready to push if needed"
fi

# Summary
print_section "6. Deployment Summary"

echo ""
echo -e "${BOLD}✅ AWS Resources Created:${NC}"
echo "  • DynamoDB: huntaze-ai-costs-production"
echo "  • DynamoDB: huntaze-cost-alerts-production"
echo "  • SQS: huntaze-hybrid-workflows"
echo "  • SQS: huntaze-rate-limiter-queue"
echo "  • SNS: huntaze-cost-alerts"
echo ""

echo -e "${BOLD}✅ Code Verified:${NC}"
echo "  • All required files present"
echo "  • Build successful"
echo "  • Ready for deployment"
echo ""

echo -e "${BOLD}⚠️  Next Steps:${NC}"
echo ""
echo "1. Configure Amplify Environment Variables:"
echo "   → Amplify Console > App Settings > Environment variables"
echo ""
echo "   Add these variables:"
echo "   • DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production"
echo "   • DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production"
echo "   • SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/huntaze-hybrid-workflows"
echo "   • SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/huntaze-rate-limiter-queue"
echo "   • COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:$ACCOUNT_ID:huntaze-cost-alerts"
echo "   • HYBRID_ORCHESTRATOR_ENABLED=true"
echo "   • COST_MONITORING_ENABLED=true"
echo "   • RATE_LIMITER_ENABLED=true"
echo ""
echo "   Full list: See AMPLIFY_DEPLOYMENT_GUIDE.md"
echo ""

echo "2. Subscribe to Cost Alerts:"
echo "   aws sns subscribe \\"
echo "     --topic-arn arn:aws:sns:us-east-1:$ACCOUNT_ID:huntaze-cost-alerts \\"
echo "     --protocol email \\"
echo "     --notification-endpoint admin@huntaze.com"
echo ""

echo "3. Monitor Deployment:"
echo "   → Amplify Console > Build history"
echo "   → Wait for build to complete (~5 min)"
echo ""

echo "4. Verify Deployment:"
echo "   curl https://YOUR-AMPLIFY-URL/api/health/hybrid-orchestrator"
echo ""

echo -e "${BOLD}📚 Documentation:${NC}"
echo "  • TODO_DEPLOYMENT.md - Quick checklist"
echo "  • AMPLIFY_QUICK_START.md - Amplify guide"
echo "  • HUNTAZE_FINAL_SUMMARY.md - Complete summary"
echo ""

echo -e "${GREEN}${BOLD}🎉 Deployment preparation complete!${NC}"
echo ""
echo "Estimated time to production: ~15 minutes"
echo "  • AWS resources: ✅ Done"
echo "  • Code ready: ✅ Done"
echo "  • Amplify config: ⚠️  10 min"
echo "  • Deploy & verify: ⚠️  5 min"
echo ""
echo -e "${BOLD}Good luck! 🚀${NC}"
echo ""
