#!/bin/bash

# AWS Production Hardening Test Runner
# Runs all tests related to AWS Production Hardening project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test files
UNIT_TEST="tests/unit/aws-production-hardening-tasks-progress.test.ts"
REGRESSION_TEST="tests/regression/aws-production-hardening-tasks-regression.test.ts"
INTEGRATION_TEST="tests/integration/aws-production-hardening-workflow.test.ts"

# Functions
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     AWS Production Hardening - Test Runner             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}▶ $1${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

run_test() {
    local test_file=$1
    local test_name=$2
    
    print_section "Running $test_name"
    
    if npm test -- "$test_file" --run --silent; then
        print_success "$test_name passed"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

run_test_with_coverage() {
    local test_file=$1
    local test_name=$2
    
    print_section "Running $test_name with coverage"
    
    if npm test -- "$test_file" --coverage --silent; then
        print_success "$test_name passed with coverage"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    local failed=0
    local passed=0
    
    # Parse arguments
    case "${1:-all}" in
        unit)
            print_info "Running unit tests only"
            run_test "$UNIT_TEST" "Unit Tests" && ((passed++)) || ((failed++))
            ;;
        regression)
            print_info "Running regression tests only"
            run_test "$REGRESSION_TEST" "Regression Tests" && ((passed++)) || ((failed++))
            ;;
        integration)
            print_info "Running integration tests only"
            run_test "$INTEGRATION_TEST" "Integration Tests" && ((passed++)) || ((failed++))
            ;;
        coverage)
            print_info "Running all tests with coverage"
            run_test_with_coverage "$UNIT_TEST" "Unit Tests" && ((passed++)) || ((failed++))
            run_test_with_coverage "$REGRESSION_TEST" "Regression Tests" && ((passed++)) || ((failed++))
            run_test_with_coverage "$INTEGRATION_TEST" "Integration Tests" && ((passed++)) || ((failed++))
            ;;
        all|*)
            print_info "Running all tests"
            run_test "$UNIT_TEST" "Unit Tests" && ((passed++)) || ((failed++))
            echo ""
            run_test "$REGRESSION_TEST" "Regression Tests" && ((passed++)) || ((failed++))
            echo ""
            run_test "$INTEGRATION_TEST" "Integration Tests" && ((passed++)) || ((failed++))
            ;;
    esac
    
    # Summary
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    Test Summary                          ║${NC}"
    echo -e "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BLUE}║${NC} ${GREEN}Passed:${NC} $passed                                              ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC} ${RED}Failed:${NC} $failed                                              ${BLUE}║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    
    if [ $failed -eq 0 ]; then
        print_success "All tests passed!"
        exit 0
    else
        print_error "Some tests failed!"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [unit|regression|integration|coverage|all]"
    echo ""
    echo "Options:"
    echo "  unit         Run unit tests only"
    echo "  regression   Run regression tests only"
    echo "  integration  Run integration tests only"
    echo "  coverage     Run all tests with coverage"
    echo "  all          Run all tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 unit         # Run unit tests only"
    echo "  $0 coverage     # Run all tests with coverage"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Run main
main "$@"
