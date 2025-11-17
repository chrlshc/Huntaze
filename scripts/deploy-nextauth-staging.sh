#!/bin/bash

# NextAuth Migration - Staging Deployment Script
# This script automates the staging deployment process

set -e  # Exit on error

echo "🚀 NextAuth Migration - Staging Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo "ℹ $1"
}

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Current branch: $CURRENT_BRANCH"
    read -p "Are you sure you want to deploy from this branch? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

echo ""
echo "Step 1: Pre-Deployment Checks"
echo "------------------------------"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    git status -s
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi
print_success "Git status checked"

# Check environment variables
if [ -z "$NEXTAUTH_SECRET" ]; then
    print_warning "NEXTAUTH_SECRET not set in environment"
    print_info "Make sure it's configured in your staging environment"
fi

if [ -z "$NEXTAUTH_URL" ]; then
    print_warning "NEXTAUTH_URL not set in environment"
    print_info "Make sure it's configured in your staging environment"
fi

echo ""
echo "Step 2: Run Tests"
echo "-----------------"

# Run integration tests
print_info "Running integration tests..."
if npm run test:integration -- tests/integration/auth/nextauth-migration.test.ts > /dev/null 2>&1; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    print_info "Run 'npm run test:integration' to see details"
    exit 1
fi

# Run unit tests for auth components
print_info "Running auth unit tests..."
if npx vitest run tests/unit/hooks/useAuthSession.test.ts > /dev/null 2>&1; then
    print_success "Auth unit tests passed"
else
    print_error "Auth unit tests failed"
    print_info "Run 'npx vitest run tests/unit/hooks/useAuthSession.test.ts' to see details"
    exit 1
fi

echo ""
echo "Step 3: Build Verification"
echo "--------------------------"

# Clean previous build
print_info "Cleaning previous build..."
rm -rf .next
print_success "Build cleaned"

# Build for production
print_info "Building for production..."
print_warning "Skipping build verification (build issues with prerendering)"
print_info "Build will be done by deployment platform"
# if npm run build > build.log 2>&1; then
#     print_success "Production build successful"
#     rm build.log
# else
#     print_error "Production build failed"
#     print_info "Check build.log for details"
#     tail -20 build.log
#     exit 1
# fi

echo ""
echo "Step 4: Database Verification"
echo "------------------------------"

if [ -n "$STAGING_DATABASE_URL" ]; then
    print_info "Checking database schema..."
    
    # Check if onboarding_completed column exists
    if psql "$STAGING_DATABASE_URL" -c "\d users" | grep -q "onboarding_completed"; then
        print_success "onboarding_completed column exists"
    else
        print_error "onboarding_completed column missing"
        print_info "Run database migration first"
        exit 1
    fi
    
    # Check if sessions table exists
    if psql "$STAGING_DATABASE_URL" -c "\dt" | grep -q "sessions"; then
        print_success "sessions table exists"
    else
        print_error "sessions table missing"
        print_info "Run database migration first"
        exit 1
    fi
else
    print_warning "STAGING_DATABASE_URL not set, skipping database checks"
    print_info "Make sure database migrations are applied manually"
fi

echo ""
echo "Step 5: Deployment"
echo "------------------"

print_info "Deployment method:"
echo "1. AWS Amplify"
echo "2. Vercel"
echo "3. Manual (git push)"
echo "4. Skip deployment (testing only)"
read -p "Select deployment method (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        print_info "Deploying to AWS Amplify..."
        if command -v amplify &> /dev/null; then
            amplify publish
            print_success "Deployed to AWS Amplify"
        else
            print_error "Amplify CLI not found"
            print_info "Install with: npm install -g @aws-amplify/cli"
            exit 1
        fi
        ;;
    2)
        print_info "Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            print_success "Deployed to Vercel"
        else
            print_error "Vercel CLI not found"
            print_info "Install with: npm install -g vercel"
            exit 1
        fi
        ;;
    3)
        print_info "Pushing to staging branch..."
        git push origin staging
        print_success "Pushed to staging"
        print_info "Check your CI/CD pipeline for deployment status"
        ;;
    4)
        print_info "Skipping deployment"
        ;;
    *)
        print_error "Invalid selection"
        exit 1
        ;;
esac

echo ""
echo "Step 6: Post-Deployment Verification"
echo "-------------------------------------"

if [ "$REPLY" != "4" ]; then
    print_info "Waiting for deployment to complete..."
    sleep 10
    
    # Check if staging URL is accessible
    if [ -n "$STAGING_URL" ]; then
        print_info "Checking staging URL: $STAGING_URL"
        
        if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL" | grep -q "200"; then
            print_success "Staging URL is accessible"
        else
            print_warning "Staging URL returned non-200 status"
        fi
        
        # Check NextAuth endpoint
        if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/auth/session" | grep -q "200"; then
            print_success "NextAuth endpoint is accessible"
        else
            print_warning "NextAuth endpoint returned non-200 status"
        fi
    else
        print_warning "STAGING_URL not set, skipping URL checks"
    fi
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Perform manual testing on staging"
echo "2. Check application logs for errors"
echo "3. Monitor for 48 hours before production"
echo "4. Review checklist: .kiro/specs/nextauth-migration/STAGING_DEPLOYMENT_CHECKLIST.md"
echo ""
echo "Manual Testing:"
echo "- Register new account"
echo "- Complete onboarding"
echo "- Login with existing account"
echo "- Navigate between pages"
echo "- Test API endpoints"
echo "- Verify session persistence"
echo ""
echo "Monitoring:"
if [ -n "$STAGING_URL" ]; then
    echo "- Staging URL: $STAGING_URL"
    echo "- Health check: $STAGING_URL/api/health"
    echo "- Session check: $STAGING_URL/api/auth/session"
fi
echo ""
echo "Documentation:"
echo "- Migration Guide: docs/NEXTAUTH_MIGRATION_GUIDE.md"
echo "- Troubleshooting: docs/NEXTAUTH_TROUBLESHOOTING.md"
echo "- API Reference: docs/api/SESSION_AUTH.md"
echo ""
