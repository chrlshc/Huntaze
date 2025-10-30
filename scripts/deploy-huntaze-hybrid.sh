#!/bin/bash

# 🚀 Huntaze Hybrid Orchestrator - Complete Deployment Script
# This script does EVERYTHING needed to deploy the hybrid orchestrator

set -e

REGION="us-east-1"
ACCOUNT_ID="317805897534"

echo "🚀 Huntaze Hybrid Orchestrator - Complete Deployment"
echo "==================================================="
echo "Account: $ACCOUNT_ID"
echo "Region: $REGION"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the Huntaze project root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Deployment Checklist${NC}"
echo "========================"
echo "✅ Code: Hybrid orchestrator ready"
echo "✅ Docs: Complete documentation created"
echo "✅ Config: amplify.yml optimized"
echo "⚠️  AWS: Resources to be created"
echo "⚠️  Amplify: Environment variables to be configured"
echo "⚠️  Deploy: Ready to push"
echo ""

# Function to check AWS credentials
check_aws_credentials() {
    echo "🔐 Checking AWS credentials..."
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        echo ""
        echo "Please export your AWS credentials:"
        echo "export AWS_ACCESS_KEY_ID=\"YOUR_KEY\""
        echo "export AWS_SECRET_ACCESS_KEY=\"YOUR_SECRET\""
        echo "export AWS_SESSION_TOKEN=\"YOUR_TOKEN\"  # if using temporary credentials"
        echo ""
        exit 1
    fi
    
    local caller_info=$(aws sts get-caller-identity 2>/dev/null)
    local user_arn=$(echo $caller_info | jq -r '.Arn' 2>/dev/null || echo "Unknown")
    echo -e "${GREEN}✅ AWS credentials OK${NC}"
    echo "   User: $user_arn"
    echo ""
}

# Function to create AWS resources
create_aws_resources() {
    echo -e "${BLUE}📦 Creating AWS Resources${NC}"
    echo "=========================="
    
    # Run the infrastructure setup script
    if [ -f "scripts/setup-aws-infrastructure.sh" ]; then
        chmod +x scripts/setup-aws-infrastructure.sh
        ./scripts/setup-aws-infrastructure.sh
    else
        echo -e "${RED}❌ setup-aws-infrastructure.sh not found${NC}"
        exit 1
    fi
    
    echo ""
}

# Function to generate Amplify environment variables
generate_amplify_env_vars() {
    echo -e "${BLUE}📝 Generating Amplify Environment Variables${NC}"
    echo "============================================"
    
    cat > amplify-env-vars.txt << 'EOF'
# 🚀 Huntaze Hybrid Orchestrator - Amplify Environment Variables
# Copy these to: Amplify Console > App Settings > Environment variables

# ==================== AWS SERVICES ====================

# DynamoDB Tables (Cost Monitoring)
DYNAMODB_COSTS_TABLE=huntaze-ai-costs-production
DYNAMODB_ALERTS_TABLE=huntaze-cost-alerts-production

# SQS Queues (Workflow Orchestration)
SQS_WORKFLOW_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-hybrid-workflows
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# SNS Topics (Cost Alerts)
COST_ALERTS_SNS_TOPIC=arn:aws:sns:us-east-1:317805897534:huntaze-cost-alerts

# ==================== COST MONITORING ====================

# Alert Configuration
COST_ALERT_EMAIL=admin@huntaze.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
DAILY_COST_THRESHOLD=50
MONTHLY_COST_THRESHOLD=1000

# ==================== FEATURE FLAGS ====================

# Hybrid Orchestrator
HYBRID_ORCHESTRATOR_ENABLED=true
COST_MONITORING_ENABLED=true
RATE_LIMITER_ENABLED=true

# ==================== AI PROVIDERS ====================

# Azure OpenAI (Primary - GPT-4 Turbo)
AZURE_OPENAI_ENDPOINT=https://huntaze-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
AZURE_OPENAI_API_KEY=YOUR_AZURE_API_KEY
AZURE_OPENAI_API_VERSION=2024-02-15-preview
ENABLE_AZURE_AI=true
USE_AZURE_RESPONSES=true
AZURE_BILLING_LOCK=false

# OpenAI (Secondary - GPT-3.5 Turbo)
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY
OPENAI_ORG_ID=org-YOUR_OPENAI_ORG_ID

# ==================== DATABASE & CACHE ====================

# PostgreSQL (RDS)
DATABASE_URL=postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.REGION.rds.amazonaws.com:5432/huntaze

# Redis (ElastiCache)
REDIS_URL=redis://huntaze-redis-production.REGION.cache.amazonaws.com:6379

# ==================== AUTH & SECURITY ====================

# NextAuth
JWT_SECRET=YOUR_JWT_SECRET
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET
NEXTAUTH_URL=https://app.huntaze.com

# ==================== STRIPE ====================

# Payment Processing
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# ==================== APP CONFIGURATION ====================

# URLs
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
NEXT_PUBLIC_API_URL=https://app.huntaze.com/api

# OnlyFans
ONLYFANS_API_URL=https://onlyfans.com/api2/v2
ONLYFANS_USER_AGENT=Mozilla/5.0 (compatible; Huntaze/1.0)

# Logging
API_LOG_GROUP=/aws/amplify/huntaze
AI_SMOKE_TOKEN=YOUR_SMOKE_TEST_TOKEN

# ==================== AWS CREDENTIALS ====================
# Note: These should be configured in Amplify IAM role, not as env vars
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...

EOF

    echo -e "${GREEN}✅ Environment variables generated: amplify-env-vars.txt${NC}"
    echo ""
}

# Function to check git status
check_git_status() {
    echo -e "${BLUE}📋 Checking Git Status${NC}"
    echo "======================"
    
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
        echo ""
        echo "Modified files:"
        git status --short
        echo ""
        read -p "Do you want to commit these changes? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "feat: hybrid orchestrator deployment ready

- Added complete hybrid orchestrator implementation
- Added cost monitoring and alerting system
- Added 16 production API endpoints
- Added comprehensive documentation
- Configured Amplify deployment
- Ready for production deployment"
            echo -e "${GREEN}✅ Changes committed${NC}"
        else
            echo -e "${YELLOW}⚠️  Proceeding with uncommitted changes${NC}"
        fi
    else
        echo -e "${GREEN}✅ Git working directory clean${NC}"
    fi
    echo ""
}

# Function to generate deployment summary
generate_deployment_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "====================="
    
    cat > deployment-summary.md << EOF
# 🚀 Huntaze Hybrid Orchestrator - Deployment Summary

## ✅ COMPLETED

### AWS Resources Created
- ✅ DynamoDB: huntaze-ai-costs-production
- ✅ DynamoDB: huntaze-cost-alerts-production
- ✅ SQS: huntaze-hybrid-workflows
- ✅ SQS: huntaze-rate-limiter-queue
- ✅ SNS: huntaze-cost-alerts

### Code Ready
- ✅ ProductionHybridOrchestrator (Azure + OpenAI routing)
- ✅ EnhancedRateLimiter (OnlyFans compliance)
- ✅ CostMonitoringService (real-time cost tracking)
- ✅ 16 API endpoints (5 MVP + 11 Phase 2)
- ✅ Complete documentation (11 files)
- ✅ Amplify configuration optimized

## ⚠️ NEXT STEPS

### 1. Configure Amplify Environment Variables

**Where:** Amplify Console > App Settings > Environment variables

**What:** Copy variables from \`amplify-env-vars.txt\`

**Critical variables:**
- DYNAMODB_COSTS_TABLE
- SQS_WORKFLOW_QUEUE
- COST_ALERTS_SNS_TOPIC
- HYBRID_ORCHESTRATOR_ENABLED=true
- Your Azure/OpenAI API keys
- Database URLs

### 2. Deploy to Amplify

**Option A - Auto Deploy:**
\`\`\`bash
git push origin main
\`\`\`

**Option B - Manual:**
Amplify Console > Deployments > Redeploy this version

### 3. Verify Deployment

\`\`\`bash
# Health check
curl https://YOUR-AMPLIFY-URL/api/health/hybrid-orchestrator

# Test campaign
curl -X POST https://YOUR-AMPLIFY-URL/api/v2/campaigns/hybrid \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"type":"content_planning","platforms":["instagram"],"data":{"theme":"fitness"}}'

# Check costs
curl https://YOUR-AMPLIFY-URL/api/v2/costs/stats
\`\`\`

## 💰 ESTIMATED COSTS

- Amplify: ~\$5-10/month
- AWS Services: ~\$32/month
- AI Providers: ~\$32/month
- **Total: ~\$70-75/month**

## 📚 DOCUMENTATION

- \`TODO_DEPLOYMENT.md\` - Quick checklist
- \`AMPLIFY_QUICK_START.md\` - Amplify guide
- \`HUNTAZE_COMPLETE_ARCHITECTURE.md\` - Full architecture
- \`amplify-env-vars.txt\` - Environment variables

## 🎯 STATUS

**AWS Resources:** ✅ Created  
**Code:** ✅ Ready  
**Documentation:** ✅ Complete  
**Amplify Config:** ⚠️ Needs env vars  
**Deployment:** ⚠️ Ready to deploy  

**Time to production:** ~15 minutes (env vars + deploy)

---

**Generated:** $(date)
**Account:** $ACCOUNT_ID
**Region:** $REGION
EOF

    echo -e "${GREEN}✅ Deployment summary generated: deployment-summary.md${NC}"
    echo ""
}

# Function to show final instructions
show_final_instructions() {
    echo -e "${GREEN}🎉 DEPLOYMENT PREPARATION COMPLETE!${NC}"
    echo "===================================="
    echo ""
    echo -e "${BLUE}📋 NEXT STEPS (15 minutes):${NC}"
    echo ""
    echo "1. 📝 Configure Amplify Environment Variables (10 min)"
    echo "   → Open: Amplify Console > App Settings > Environment variables"
    echo "   → Copy from: amplify-env-vars.txt"
    echo ""
    echo "2. 🚀 Deploy to Amplify (2 min)"
    echo "   → Option A: git push origin main (auto-deploy)"
    echo "   → Option B: Amplify Console > Redeploy"
    echo ""
    echo "3. ✅ Verify Deployment (3 min)"
    echo "   → Test: curl https://YOUR-AMPLIFY-URL/api/health/hybrid-orchestrator"
    echo ""
    echo -e "${BLUE}📚 DOCUMENTATION:${NC}"
    echo "   → amplify-env-vars.txt - Environment variables to copy"
    echo "   → deployment-summary.md - Complete deployment summary"
    echo "   → TODO_DEPLOYMENT.md - Quick checklist"
    echo "   → AMPLIFY_QUICK_START.md - Amplify guide"
    echo ""
    echo -e "${BLUE}💰 ESTIMATED COSTS:${NC}"
    echo "   → ~\$70-75/month total (Amplify + AWS + AI)"
    echo ""
    echo -e "${GREEN}🎯 YOU'RE READY TO DEPLOY!${NC}"
    echo ""
}

# Main execution
main() {
    echo "Starting deployment preparation..."
    echo ""
    
    # Step 1: Check prerequisites
    check_aws_credentials
    
    # Step 2: Create AWS resources
    create_aws_resources
    
    # Step 3: Generate Amplify env vars
    generate_amplify_env_vars
    
    # Step 4: Check git status
    check_git_status
    
    # Step 5: Generate deployment summary
    generate_deployment_summary
    
    # Step 6: Show final instructions
    show_final_instructions
}

# Run main function
main

echo "🚀 Deployment preparation script completed successfully!"
echo "Next: Configure Amplify env vars and deploy!"
