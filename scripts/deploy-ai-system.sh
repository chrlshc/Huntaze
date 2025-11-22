#!/bin/bash

# AI System Deployment Script
# This script helps verify deployment readiness and guides through deployment steps

set -e

echo "🚀 AI System Deployment Checklist"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
print_info() {
    echo -e "ℹ $1"
}

echo "Step 1: Pre-deployment Checks"
echo "------------------------------"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed: $NODE_VERSION"
else
    print_status 1 "Node.js not installed"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not installed"
    exit 1
fi

# Check Prisma CLI
if command_exists npx; then
    print_status 0 "npx available (for Prisma commands)"
else
    print_status 1 "npx not available"
    exit 1
fi

echo ""
echo "Step 2: Environment Variables Check"
echo "------------------------------------"

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "GEMINI_API_KEY"
    "ELASTICACHE_REDIS_HOST"
    "AWS_REGION"
)

ALL_VARS_SET=true
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_status 1 "$var not set"
        ALL_VARS_SET=false
    else
        print_status 0 "$var is set"
    fi
done

if [ "$ALL_VARS_SET" = false ]; then
    print_warning "Some environment variables are missing"
    print_info "Set them in your Amplify Console or .env file"
    echo ""
fi

echo ""
echo "Step 3: Database Migration Status"
echo "----------------------------------"

# Check Prisma migration status
print_info "Checking migration status..."
if npx prisma migrate status > /dev/null 2>&1; then
    print_status 0 "Database migrations are up to date"
else
    print_warning "Database migrations may need to be applied"
    print_info "Run: npx prisma migrate deploy"
fi

echo ""
echo "Step 4: Verify AI Tables Exist"
echo "-------------------------------"

# Check if AI tables exist
print_info "Checking AI tables..."
if npm run verify:ai-tables > /dev/null 2>&1; then
    print_status 0 "AI tables exist in database"
else
    print_warning "AI tables may not exist"
    print_info "Run migrations first: npx prisma migrate deploy"
fi

echo ""
echo "Step 5: Build Verification"
echo "--------------------------"

# Check if build succeeds
print_info "Testing build (this may take a few minutes)..."
if npm run build > /dev/null 2>&1; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed"
    print_info "Check build errors with: npm run build"
    exit 1
fi

echo ""
echo "Step 6: Test Suite"
echo "------------------"

# Run tests
print_info "Running AI system tests..."
if npm run test:ai > /dev/null 2>&1; then
    print_status 0 "All tests passing"
else
    print_warning "Some tests may be failing"
    print_info "Review test results with: npm run test:ai"
fi

echo ""
echo "Step 7: Deployment Readiness Summary"
echo "-------------------------------------"

if [ "$ALL_VARS_SET" = true ]; then
    echo -e "${GREEN}✓${NC} Environment variables configured"
else
    echo -e "${RED}✗${NC} Environment variables need configuration"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Review the deployment guide: .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md"
echo "2. Apply database migrations in production: npx prisma migrate deploy"
echo "3. Configure environment variables in Amplify Console"
echo "4. Push to main branch to trigger Amplify build"
echo "5. Monitor build progress in Amplify Console"
echo "6. Run post-deployment verification tests"
echo ""

# Ask if user wants to see deployment guide
read -p "Would you like to view the deployment guide now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command_exists less; then
        less .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md
    elif command_exists cat; then
        cat .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md
    else
        echo "Please open: .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md"
    fi
fi

echo ""
echo "🎉 Pre-deployment checks complete!"
echo ""
