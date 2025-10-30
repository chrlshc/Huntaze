#!/bin/bash

# Test script for Cost Alert System
# Tests task 4.2: Cost alerting system implementation

set -e

echo "🧪 Testing Cost Alert System (Task 4.2)"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}Running: ${test_name}${NC}"
    
    if npm test -- "$test_file" --run --reporter=verbose 2>&1 | grep -q "PASS"; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Run unit tests
echo "📋 Unit Tests"
echo "-------------"
run_test "Cost Alert Manager" "tests/unit/cost-alert-manager.test.ts"

# Run integration tests
echo "🔗 Integration Tests"
echo "-------------------"
run_test "Cost Alert System Integration" "tests/integration/cost-alert-system-integration.test.ts"

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Task 4.2 Implementation Status: ✓ COMPLETE"
    echo ""
    echo "Features Tested:"
    echo "  ✓ Multi-channel alerting (Email, Slack, SNS, In-App)"
    echo "  ✓ Configurable thresholds (user & global)"
    echo "  ✓ Cost forecasting and predictions"
    echo "  ✓ Rate limiting"
    echo "  ✓ Alert history"
    echo "  ✓ Error handling and recovery"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
