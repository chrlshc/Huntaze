#!/bin/bash

# AWS Infrastructure Audit Test Runner
# Runs all tests related to AWS infrastructure validation

set -e

echo "🔍 AWS Infrastructure Audit Test Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test file
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo -e "${YELLOW}Running: ${test_name}${NC}"
  
  if npm test -- "$test_file" --silent 2>&1 | grep -q "PASS"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo ""
}

# Run unit tests
echo "📦 Unit Tests"
echo "-------------"
run_test "tests/unit/aws-infrastructure-audit-validation.test.ts" "Infrastructure Validation"

# Run integration tests
echo "🔗 Integration Tests"
echo "--------------------"
run_test "tests/integration/aws-infrastructure-audit-integration.test.ts" "Resource Provisioning"

# Run regression tests
echo "🔄 Regression Tests"
echo "-------------------"
run_test "tests/regression/aws-infrastructure-audit-regression.test.ts" "Documentation Consistency"

# Summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All AWS infrastructure audit tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi
