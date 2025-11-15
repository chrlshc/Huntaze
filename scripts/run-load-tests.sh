#!/bin/bash

# Run all load tests for rate limiting
# Usage: ./scripts/run-load-tests.sh [BASE_URL]

set -e

BASE_URL=${1:-"http://localhost:3000"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="tests/load/reports/${TIMESTAMP}"

echo "🚀 Running Rate Limiting Load Tests"
echo "📍 Base URL: ${BASE_URL}"
echo "📁 Results will be saved to: ${RESULTS_DIR}"
echo ""

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Function to run a test and save results
run_test() {
  local test_name=$1
  local test_file=$2
  local duration=$3
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🧪 Running: ${test_name}"
  echo "⏱️  Estimated duration: ${duration}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  BASE_URL="${BASE_URL}" k6 run \
    --out json="${RESULTS_DIR}/${test_name}.json" \
    "${test_file}" \
    | tee "${RESULTS_DIR}/${test_name}.log"
  
  echo ""
  echo "✅ ${test_name} complete"
  echo ""
}

# Run quick smoke test first
echo "🔍 Running quick smoke test..."
run_test "quick-test" "tests/load/rate-limiting/quick-test.js" "10 seconds"

# Ask user if they want to continue with full tests
read -p "Continue with full load tests? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Skipping full load tests"
  exit 0
fi

# Run rate limiter validation test
run_test "rate-limiter-validation" "tests/load/rate-limiting/rate-limiter-validation.js" "5 minutes"

# Run circuit breaker test
run_test "circuit-breaker" "tests/load/rate-limiting/circuit-breaker.js" "6 minutes"

# Generate summary report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Results saved to: ${RESULTS_DIR}"
echo ""
echo "Files:"
ls -lh "${RESULTS_DIR}"
echo ""
echo "✨ All tests complete!"
echo ""
echo "To view detailed results:"
echo "  cat ${RESULTS_DIR}/rate-limiter-validation.log"
echo "  cat ${RESULTS_DIR}/circuit-breaker.log"
echo ""
