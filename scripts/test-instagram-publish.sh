#!/bin/bash

# Instagram Publish API - Test Runner
# Runs all integration tests for the Instagram publish endpoint

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
print_info "Instagram Publish API - Integration Tests"
print_info "=========================================="
echo ""

# Check if test environment is set up
if [ -z "$TEST_API_URL" ]; then
    print_warning "TEST_API_URL not set, using default: http://localhost:3000"
    export TEST_API_URL="http://localhost:3000"
fi

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set. Please set it before running tests."
    exit 1
fi

# Check if server is running
print_step "1. Checking if test server is running..."
if curl -s "$TEST_API_URL/api/health" > /dev/null 2>&1; then
    print_info "✓ Test server is running at $TEST_API_URL"
else
    print_warning "✗ Test server not responding at $TEST_API_URL"
    print_info "Starting test server..."
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
    
    if curl -s "$TEST_API_URL/api/health" > /dev/null 2>&1; then
        print_info "✓ Test server started successfully"
    else
        print_error "✗ Failed to start test server"
        exit 1
    fi
fi

echo ""
print_step "2. Running Instagram Publish Integration Tests..."
echo ""

# Run all tests
npm run test:integration -- instagram-publish

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_info "=========================================="
    print_info "✓ All tests passed successfully!"
    print_info "=========================================="
else
    print_error "=========================================="
    print_error "✗ Some tests failed"
    print_error "=========================================="
fi

# Cleanup
if [ ! -z "$SERVER_PID" ]; then
    print_info "Stopping test server..."
    kill $SERVER_PID 2>/dev/null || true
fi

exit $TEST_EXIT_CODE
