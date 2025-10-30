#!/bin/bash

# 🔍 Pre-Deployment Check - Verify everything is ready
# This script checks your code without needing AWS credentials

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Huntaze Pre-Deployment Check"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description: $file"
        return 0
    else
        echo -e "${RED}❌${NC} $description: $file NOT FOUND"
        ((ERRORS++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $description: $dir"
        return 0
    else
        echo -e "${RED}❌${NC} $description: $dir NOT FOUND"
        ((ERRORS++))
        return 1
    fi
}

# Function to check for string in file
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if [ -f "$file" ] && grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅${NC} $description"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  $description"
        ((WARNINGS++))
        return 1
    fi
}

echo -e "${BLUE}📦 Core Services${NC}"
echo "================"
check_file "lib/services/production-hybrid-orchestrator-v2.ts" "Hybrid Orchestrator V2"
check_file "lib/services/enhanced-rate-limiter.ts" "Enhanced Rate Limiter"
check_file "lib/services/cost-monitoring-service.ts" "Cost Monitoring Service"
check_file "lib/services/cost-alert-manager.ts" "Cost Alert Manager"
echo ""

echo -e "${BLUE}🌐 API Endpoints${NC}"
echo "================"
check_file "app/api/health/hybrid-orchestrator/route.ts" "Health Check API"
check_file "app/api/v2/costs/stats/route.ts" "Cost Stats API"
check_file "app/api/v2/costs/alerts/route.ts" "Cost Alerts API"
check_file "app/api/v2/campaigns/status/route.ts" "Campaign Status API"
check_file "app/api/admin/feature-flags/route.ts" "Feature Flags API"
echo ""

echo -e "${BLUE}📚 Documentation${NC}"
echo "================="
check_file "TODO_DEPLOYMENT.md" "Deployment TODO"
check_file "AMPLIFY_QUICK_START.md" "Amplify Quick Start"
check_file "HUNTAZE_COMPLETE_ARCHITECTURE.md" "Complete Architecture"
check_file "DEPLOYMENT_NOW.md" "Deployment Now Guide"
echo ""

echo -e "${BLUE}🔧 Scripts${NC}"
echo "=========="
check_file "scripts/deploy-huntaze-hybrid.sh" "Main Deployment Script"
check_file "scripts/setup-aws-infrastructure.sh" "AWS Infrastructure Setup"
check_file "scripts/check-amplify-env.sh" "Amplify Env Check"
check_file "scripts/verify-deployment.sh" "Deployment Verification"
echo ""

echo -e "${BLUE}⚙️  Configuration${NC}"
echo "================="
check_file "amplify.yml" "Amplify Config"
check_file "package.json" "Package Config"
check_file "tsconfig.json" "TypeScript Config"
echo ""

echo -e "${BLUE}📋 Spec Files${NC}"
echo "============="
check_file ".kiro/specs/huntaze-hybrid-orchestrator-integration/requirements.md" "Requirements"
check_file ".kiro/specs/huntaze-hybrid-orchestrator-integration/design.md" "Design"
check_file ".kiro/specs/huntaze-hybrid-orchestrator-integration/tasks.md" "Tasks"
echo ""

echo -e "${BLUE}🧪 Tests${NC}"
echo "========"
check_file "tests/unit/production-hybrid-orchestrator-v2.test.ts" "Orchestrator Tests"
check_file "tests/unit/enhanced-rate-limiter.test.ts" "Rate Limiter Tests"
check_file "tests/unit/cost-alert-manager.test.ts" "Cost Alert Tests"
echo ""

echo -e "${BLUE}🔍 Code Quality Checks${NC}"
echo "======================"

# Check for TypeScript errors (quick check)
if command -v tsc &> /dev/null; then
    echo -n "Checking TypeScript compilation... "
    if tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
        echo -e "${GREEN}✅ No TypeScript errors${NC}"
    else
        echo -e "${YELLOW}⚠️  TypeScript errors found (run 'tsc --noEmit' for details)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️  TypeScript not found, skipping type check${NC}"
    ((WARNINGS++))
fi

# Check for required dependencies
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
else
    echo -e "${RED}❌ node_modules not found - run 'npm install'${NC}"
    ((ERRORS++))
fi

# Check for environment variable template
echo -n "Checking for .env.example... "
if [ -f ".env.example" ] || [ -f ".env.local.example" ]; then
    echo -e "${GREEN}✅ Environment template exists${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.example found${NC}"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}📊 Summary${NC}"
echo "=========="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 PERFECT! Everything is ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure AWS credentials"
    echo "2. Run: ./scripts/deploy-huntaze-hybrid.sh"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  READY with $WARNINGS warnings${NC}"
    echo ""
    echo "You can proceed with deployment, but review the warnings above."
    echo ""
    echo "Next steps:"
    echo "1. Configure AWS credentials"
    echo "2. Run: ./scripts/deploy-huntaze-hybrid.sh"
    echo ""
    exit 0
else
    echo -e "${RED}❌ NOT READY - $ERRORS errors, $WARNINGS warnings${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo ""
    exit 1
fi
