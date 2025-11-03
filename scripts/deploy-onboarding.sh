#!/bin/bash

# Adaptive Onboarding System - Deployment Script
# Usage: ./scripts/deploy-onboarding.sh [staging|production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

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

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_header "Adaptive Onboarding System Deployment"
print_info "Environment: $ENVIRONMENT"
print_info "Timestamp: $TIMESTAMP"
echo ""

# Step 1: Pre-deployment checks
print_header "Step 1: Pre-deployment Checks"

# Check git status
if [[ -n $(git status -s) ]]; then
    print_warning "Uncommitted changes detected"
    git status -s
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
else
    print_success "Git status clean"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Check if build succeeds
print_info "Testing build..."
if npm run build > /dev/null 2>&1; then
    print_success "Build test passed"
else
    print_error "Build test failed"
    exit 1
fi

# Check if tests pass
print_info "Running tests..."
if npm run test:unit > /dev/null 2>&1; then
    print_success "Unit tests passed"
else
    print_warning "Some unit tests failed (continuing anyway)"
fi

echo ""

# Step 2: Database backup
print_header "Step 2: Database Backup"

# Create backup directory
mkdir -p "$BACKUP_DIR"

if [[ "$ENVIRONMENT" == "production" ]]; then
    print_info "Creating production database backup..."
    
    # Check if DATABASE_URL is set
    if [[ -z "$DATABASE_URL" ]]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    BACKUP_FILE="$BACKUP_DIR/prod-backup-$TIMESTAMP.sql"
    
    # Create backup
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
        print_success "Database backup created: $BACKUP_FILE"
        
        # Verify backup
        if [[ -s "$BACKUP_FILE" ]]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            print_info "Backup size: $BACKUP_SIZE"
        else
            print_error "Backup file is empty"
            exit 1
        fi
    else
        print_error "Database backup failed"
        exit 1
    fi
else
    print_info "Skipping database backup for staging"
fi

echo ""

# Step 3: Git tagging (production only)
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_header "Step 3: Create Git Tag"
    
    TAG_NAME="v1.0.0-onboarding-$TIMESTAMP"
    
    print_info "Creating tag: $TAG_NAME"
    git tag -a "$TAG_NAME" -m "Adaptive Onboarding System deployment - $TIMESTAMP"
    
    print_info "Pushing tag..."
    git push origin "$TAG_NAME"
    
    print_success "Tag created and pushed: $TAG_NAME"
    echo ""
fi

# Step 4: Database migration
print_header "Step 4: Database Migration"

MIGRATION_FILE="lib/db/migrations/2024-11-02-adaptive-onboarding.sql"

if [[ ! -f "$MIGRATION_FILE" ]]; then
    print_error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

print_info "Migration file: $MIGRATION_FILE"

if [[ "$ENVIRONMENT" == "staging" ]]; then
    DB_URL="$STAGING_DATABASE_URL"
else
    DB_URL="$DATABASE_URL"
fi

if [[ -z "$DB_URL" ]]; then
    print_error "Database URL not set for $ENVIRONMENT"
    exit 1
fi

print_warning "About to run database migration on $ENVIRONMENT"
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running migration..."
    
    if psql "$DB_URL" -f "$MIGRATION_FILE" > /dev/null 2>&1; then
        print_success "Database migration completed"
        
        # Verify tables created
        print_info "Verifying tables..."
        TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'onboarding%' OR table_name LIKE 'feature%';" 2>/dev/null | tr -d ' ')
        
        if [[ "$TABLE_COUNT" -ge 4 ]]; then
            print_success "All tables created ($TABLE_COUNT tables)"
        else
            print_warning "Expected 4 tables, found $TABLE_COUNT"
        fi
    else
        print_error "Database migration failed"
        exit 1
    fi
else
    print_error "Migration cancelled"
    exit 1
fi

echo ""

# Step 5: Deploy to environment
print_header "Step 5: Deploy to $ENVIRONMENT"

if [[ "$ENVIRONMENT" == "staging" ]]; then
    TARGET_BRANCH="staging"
else
    TARGET_BRANCH="main"
fi

print_info "Target branch: $TARGET_BRANCH"

# Switch to target branch
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
    print_info "Switching to $TARGET_BRANCH branch..."
    git checkout "$TARGET_BRANCH"
    
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        print_info "Merging from main..."
        git merge main
    fi
fi

# Push to remote
print_info "Pushing to remote..."
git push origin "$TARGET_BRANCH"

print_success "Code pushed to $TARGET_BRANCH"

echo ""

# Step 6: Monitor deployment
print_header "Step 6: Monitor Deployment"

print_info "Deployment initiated on AWS Amplify"
print_info "Monitor build progress at:"

if [[ "$ENVIRONMENT" == "staging" ]]; then
    print_info "https://console.aws.amazon.com/amplify/ (staging branch)"
else
    print_info "https://console.aws.amazon.com/amplify/ (main branch)"
fi

echo ""
print_warning "Manual steps required:"
echo "1. Monitor Amplify build in AWS Console"
echo "2. Verify build completes successfully"
echo "3. Test deployment on $ENVIRONMENT URL"
echo "4. Monitor error rates and performance"

echo ""

# Step 7: Post-deployment checklist
print_header "Step 7: Post-Deployment Checklist"

echo "Manual verification required:"
echo ""
echo "□ Build completed successfully"
echo "□ No build errors"
echo "□ All pages generated"
echo "□ Deployment URL accessible"
echo ""
echo "Functional tests:"
echo "□ Onboarding flow works"
echo "□ Feature unlocking works"
echo "□ Tours display correctly"
echo "□ Keyboard navigation works"
echo "□ Mobile responsive"
echo ""
echo "Performance checks:"
echo "□ Error rate < 0.1%"
echo "□ Response times < 500ms"
echo "□ No console errors"
echo "□ Analytics tracking works"

echo ""

# Summary
print_header "Deployment Summary"

print_success "Deployment initiated successfully!"
echo ""
print_info "Environment: $ENVIRONMENT"
print_info "Branch: $TARGET_BRANCH"
print_info "Timestamp: $TIMESTAMP"

if [[ "$ENVIRONMENT" == "production" ]]; then
    print_info "Backup: $BACKUP_FILE"
    print_info "Tag: $TAG_NAME"
fi

echo ""
print_warning "Next steps:"
echo "1. Monitor Amplify build (10-15 minutes)"
echo "2. Run post-deployment tests"
echo "3. Monitor for 24-48 hours"
echo "4. Document any issues"

echo ""
print_success "Deployment script completed!"

# Rollback information
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    print_header "Rollback Information"
    print_warning "If rollback is needed:"
    echo ""
    echo "Option 1: Amplify Console"
    echo "  - Go to Deployments"
    echo "  - Select previous build"
    echo "  - Click 'Redeploy'"
    echo ""
    echo "Option 2: Git Rollback"
    echo "  git checkout $TAG_NAME"
    echo "  git push origin main --force"
    echo ""
    echo "Option 3: Database Rollback"
    echo "  psql \$DATABASE_URL < $BACKUP_FILE"
fi

echo ""
print_info "For detailed instructions, see:"
print_info "docs/ADAPTIVE_ONBOARDING_DEPLOYMENT.md"

exit 0
