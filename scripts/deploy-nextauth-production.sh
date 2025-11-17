#!/bin/bash

# NextAuth Migration - Production Deployment Script
# ⚠️ CRITICAL: Only run this after 48+ hours of stable staging deployment

set -e  # Exit on error

echo "🚀 NextAuth Migration - Production Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}ℹ $1${NC}"
}

# Critical safety check
echo "⚠️  PRODUCTION DEPLOYMENT - SAFETY CHECKS"
echo "=========================================="
echo ""

print_warning "This will deploy to PRODUCTION"
print_warning "Make sure you have:"
echo "  1. Staging running stable for 48+ hours"
echo "  2. All team members available"
echo "  3. Rollback plan ready"
echo "  4. Database backup completed"
echo ""

read -p "Have you completed all prerequisites? (yes/NO) " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_error "Deployment cancelled - Prerequisites not met"
    print_info "Review: .kiro/specs/nextauth-migration/PRODUCTION_DEPLOYMENT_GUIDE.md"
    exit 1
fi

# Verify staging stability
echo ""
echo "Step 1: Verify Staging Stability"
echo "---------------------------------"

if [ -n "$STAGING_URL" ]; then
    print_info "Checking staging health..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/health" | grep -q "200"; then
        print_success "Staging is healthy"
    else
        print_error "Staging health check failed"
        exit 1
    fi
else
    print_warning "STAGING_URL not set, skipping staging check"
    read -p "Continue without staging verification? (yes/NO) " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "Must be on 'main' branch for production deployment"
    print_info "Current branch: $CURRENT_BRANCH"
    exit 1
fi
print_success "On main branch"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_error "You have uncommitted changes"
    git status -s
    exit 1
fi
print_success "No uncommitted changes"

echo ""
echo "Step 2: Pre-Deployment Backup"
echo "------------------------------"

# Database backup
if [ -n "$PRODUCTION_DATABASE_URL" ]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Creating database backup: $BACKUP_FILE"
    
    if pg_dump "$PRODUCTION_DATABASE_URL" > "$BACKUP_FILE"; then
        print_success "Database backup created"
    else
        print_error "Database backup failed"
        exit 1
    fi
else
    print_warning "PRODUCTION_DATABASE_URL not set"
    print_info "Make sure database backup is created manually"
    read -p "Continue without automated backup? (yes/NO) " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 1
    fi
fi

# Git tag
TAG_NAME="v1.0-pre-nextauth-migration-$(date +%Y%m%d_%H%M%S)"
print_info "Creating git tag: $TAG_NAME"
git tag -a "$TAG_NAME" -m "Pre-NextAuth migration production deployment"
git push origin "$TAG_NAME"
print_success "Git tag created"

echo ""
echo "Step 3: Final Tests"
echo "-------------------"

# Run integration tests
print_info "Running integration tests..."
if npm run test:integration -- tests/integration/auth/nextauth-migration.test.ts > /dev/null 2>&1; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Build verification
print_info "Verifying production build..."
rm -rf .next
if npm run build > /dev/null 2>&1; then
    print_success "Production build successful"
else
    print_error "Production build failed"
    exit 1
fi

echo ""
echo "Step 4: Environment Verification"
echo "---------------------------------"

# Check critical environment variables
MISSING_VARS=()

if [ -z "$NEXTAUTH_SECRET" ]; then
    MISSING_VARS+=("NEXTAUTH_SECRET")
fi

if [ -z "$NEXTAUTH_URL" ]; then
    MISSING_VARS+=("NEXTAUTH_URL")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    print_error "Missing environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_info "These must be set in your production environment"
    read -p "Continue anyway? (yes/NO) " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 1
    fi
else
    print_success "Environment variables configured"
fi

echo ""
echo "Step 5: Database Verification"
echo "------------------------------"

if [ -n "$PRODUCTION_DATABASE_URL" ]; then
    print_info "Checking database schema..."
    
    # Check onboarding_completed column
    if psql "$PRODUCTION_DATABASE_URL" -c "\d users" | grep -q "onboarding_completed"; then
        print_success "onboarding_completed column exists"
    else
        print_error "onboarding_completed column missing"
        print_info "Run database migration first"
        exit 1
    fi
    
    # Check sessions table
    if psql "$PRODUCTION_DATABASE_URL" -c "\dt" | grep -q "sessions"; then
        print_success "sessions table exists"
    else
        print_error "sessions table missing"
        print_info "Run database migration first"
        exit 1
    fi
else
    print_warning "PRODUCTION_DATABASE_URL not set"
    print_info "Verify database migrations manually"
fi

echo ""
echo "Step 6: Final Confirmation"
echo "--------------------------"

print_warning "You are about to deploy to PRODUCTION"
echo ""
echo "Deployment details:"
echo "  - Branch: $CURRENT_BRANCH"
echo "  - Commit: $(git rev-parse --short HEAD)"
echo "  - Time: $(date)"
echo "  - Backup: $BACKUP_FILE"
echo "  - Tag: $TAG_NAME"
echo ""

read -p "Type 'DEPLOY TO PRODUCTION' to continue: " -r
echo
if [[ $REPLY != "DEPLOY TO PRODUCTION" ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

echo ""
echo "Step 7: Deployment"
echo "------------------"

print_info "Deploying to production..."

# Deployment method selection
echo "Select deployment method:"
echo "1. AWS Amplify"
echo "2. Vercel"
echo "3. Manual (git push)"
read -p "Select (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        print_info "Deploying to AWS Amplify..."
        if command -v amplify &> /dev/null; then
            amplify publish --environment production
            print_success "Deployed to AWS Amplify"
        else
            print_error "Amplify CLI not found"
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
            exit 1
        fi
        ;;
    3)
        print_info "Pushing to main branch..."
        git push origin main
        print_success "Pushed to main"
        print_info "Monitor your CI/CD pipeline for deployment status"
        ;;
    *)
        print_error "Invalid selection"
        exit 1
        ;;
esac

echo ""
echo "Step 8: Post-Deployment Verification"
echo "-------------------------------------"

print_info "Waiting for deployment to complete..."
sleep 30

if [ -n "$PRODUCTION_URL" ]; then
    print_info "Running smoke tests..."
    
    # Health check
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/health" | grep -q "200"; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        print_warning "Consider rolling back"
    fi
    
    # NextAuth endpoint
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL/api/auth/session" | grep -q "200"; then
        print_success "NextAuth endpoint accessible"
    else
        print_error "NextAuth endpoint failed"
        print_warning "Consider rolling back"
    fi
else
    print_warning "PRODUCTION_URL not set, skipping automated verification"
    print_info "Perform manual smoke tests immediately"
fi

echo ""
echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""
echo "⚠️  CRITICAL: Monitor production closely for the next 2-4 hours"
echo ""
echo "Immediate Actions:"
echo "1. Perform manual smoke tests"
echo "2. Monitor application logs"
echo "3. Check error rates"
echo "4. Verify user logins working"
echo ""
echo "Smoke Tests:"
echo "- Register new account at $PRODUCTION_URL/auth"
echo "- Login with existing account"
echo "- Navigate between pages"
echo "- Test API endpoints"
echo "- Verify session persistence"
echo ""
echo "Monitoring:"
if [ -n "$PRODUCTION_URL" ]; then
    echo "- Production URL: $PRODUCTION_URL"
    echo "- Health: $PRODUCTION_URL/api/health"
    echo "- Session: $PRODUCTION_URL/api/auth/session"
fi
echo ""
echo "Rollback (if needed):"
echo "- Git: git revert HEAD && git push origin main"
echo "- Platform: Use your platform's rollback feature"
echo "- Database: psql \$PRODUCTION_DATABASE_URL < $BACKUP_FILE"
echo ""
echo "Documentation:"
echo "- Production Guide: .kiro/specs/nextauth-migration/PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "- Troubleshooting: docs/NEXTAUTH_TROUBLESHOOTING.md"
echo "- Rollback: docs/ROLLBACK_PROCEDURE.md"
echo ""
echo "Team Communication:"
echo "- Notify team of successful deployment"
echo "- Share monitoring dashboard"
echo "- Prepare incident response if needed"
echo ""
print_success "Good luck! 🚀"
echo ""
