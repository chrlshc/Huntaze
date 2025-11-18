#!/bin/bash

# Test script for Integrations Status API
# Runs integration tests for GET /api/integrations/status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
print_info "Integrations Status API - Integration Tests"
print_info "=========================================="
echo ""

# Check if test environment is configured
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set, using default test database"
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/huntaze_test"
fi

if [ -z "$TEST_API_URL" ]; then
    print_warning "TEST_API_URL not set, using default"
    export TEST_API_URL="http://localhost:3000"
fi

print_step "1. Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    print_warning "psql not found, skipping database check"
else
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_info "✓ Database connection successful"
    else
        print_error "✗ Database connection failed"
        print_error "Please ensure PostgreSQL is running and DATABASE_URL is correct"
        exit 1
    fi
fi

print_info "✓ Prerequisites check passed"
echo ""

print_step "2. Installing dependencies..."
npm install --silent
print_info "✓ Dependencies installed"
echo ""

print_step "3. Running integration tests..."
echo ""

# Run tests with different options based on arguments
case "${1:-all}" in
    "all")
        print_info "Running all integration tests for integrations status..."
        npm run test:integration -- integrations-status
        ;;
    "watch")
        print_info "Running tests in watch mode..."
        npm run test:integration:watch -- integrations-status
        ;;
    "coverage")
        print_info "Running tests with coverage..."
        npm run test:integration:coverage -- integrations-status
        ;;
    "verbose")
        print_info "Running tests in verbose mode..."
        npm run test:integration -- integrations-status --reporter=verbose
        ;;
    "quick")
        print_info "Running quick smoke tests..."
        npm run test:integration -- integrations-status --grep="HTTP Status Codes"
        ;;
    *)
        print_error "Unknown option: $1"
        echo ""
        echo "Usage: $0 [all|watch|coverage|verbose|quick]"
        echo ""
        echo "Options:"
        echo "  all       - Run all integration tests (default)"
        echo "  watch     - Run tests in watch mode"
        echo "  coverage  - Run tests with coverage report"
        echo "  verbose   - Run tests with verbose output"
        echo "  quick     - Run quick smoke tests only"
        exit 1
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_info "=========================================="
    print_info "✓ All tests passed!"
    print_info "=========================================="
else
    print_error "=========================================="
    print_error "✗ Some tests failed"
    print_error "=========================================="
    exit $TEST_EXIT_CODE
fi

# Optional: Run additional checks
if [ "${2}" == "--with-lint" ]; then
    echo ""
    print_step "4. Running linter..."
    npm run lint -- tests/integration/api/integrations-status.integration.test.ts
    print_info "✓ Linting passed"
fi

if [ "${2}" == "--with-type-check" ]; then
    echo ""
    print_step "4. Running type check..."
    npx tsc --noEmit tests/integration/api/integrations-status.integration.test.ts
    print_info "✓ Type check passed"
fi

echo ""
print_info "Test run complete!"
