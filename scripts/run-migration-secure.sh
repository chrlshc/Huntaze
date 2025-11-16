#!/bin/bash

# Secure migration script - uses environment variables for credentials
# Source .env.migration file before running this script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_info "=========================================="
print_info "Auth-Onboarding Migration (Secure)"
print_info "=========================================="
echo ""

# Check if .env.migration exists
if [ -f ".env.migration" ]; then
    print_info "Loading credentials from .env.migration"
    source .env.migration
else
    print_warning ".env.migration file not found"
    print_info "Please create .env.migration from .env.migration.example"
    print_info "Or set environment variables manually:"
    print_info "  export AWS_ACCESS_KEY_ID=\"...\""
    print_info "  export AWS_SECRET_ACCESS_KEY=\"...\""
    print_info "  export DATABASE_URL=\"...\""
    exit 1
fi

# Verify required environment variables
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set"
    exit 1
fi

print_step "1. Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_info "✓ Database connection successful"
else
    print_error "✗ Database connection failed"
    exit 1
fi

echo ""
print_step "2. Checking current migration status..."

COLUMN_EXISTS=$(psql "$DATABASE_URL" -t -c \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed';" | tr -d ' ')

if [ "$COLUMN_EXISTS" -eq 1 ]; then
    print_warning "Column 'onboarding_completed' already exists"
    
    print_info "Current data distribution:"
    psql "$DATABASE_URL" -c \
        "SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
            COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users
        FROM users;"
    
    echo ""
    print_info "Migration already completed!"
    exit 0
else
    print_info "Column 'onboarding_completed' does not exist - migration needed"
fi

echo ""
print_warning "=========================================="
print_warning "IMPORTANT: About to run migration"
print_warning "=========================================="
print_warning "This will:"
print_warning "1. Add 'onboarding_completed' column to users table"
print_warning "2. Set all existing users to onboarding_completed = true"
print_warning "3. Create an index for performance"
print_warning ""
print_warning "Migration is non-destructive (only adds data)"
print_warning "=========================================="
echo ""

read -p "Continue with migration? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_info "Migration cancelled"
    exit 0
fi

echo ""
print_step "3. Running migration..."

psql "$DATABASE_URL" -f migrations/001_add_onboarding_completed_forward_only.sql

if [ $? -eq 0 ]; then
    print_info "✓ Migration completed successfully"
else
    print_error "✗ Migration failed"
    exit 1
fi

echo ""
print_step "4. Verifying migration..."

print_info "Checking column..."
psql "$DATABASE_URL" -c \
    "SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed';"

print_info "Checking data distribution..."
psql "$DATABASE_URL" -c \
    "SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
        COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users,
        COUNT(CASE WHEN onboarding_completed IS NULL THEN 1 END) as null_users
    FROM users;"

print_info "Checking index..."
psql "$DATABASE_URL" -c \
    "SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';"

echo ""
print_info "=========================================="
print_info "Migration completed successfully!"
print_info "=========================================="
