#!/bin/bash

###############################################################################
# Health Check API - Test Runner Script
#
# This script runs the health check API tests with various options
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Test directory
TEST_DIR="$PROJECT_ROOT/tests/integration/health"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

###############################################################################
# Test Functions
###############################################################################

run_basic_tests() {
    print_header "Running Basic Tests"
    npm test "$TEST_DIR" -- --reporter=verbose
}

run_tests_with_coverage() {
    print_header "Running Tests with Coverage"
    npm test "$TEST_DIR" -- --coverage --reporter=verbose
}

run_tests_watch_mode() {
    print_header "Running Tests in Watch Mode"
    npm test "$TEST_DIR" -- --watch
}

run_performance_tests() {
    print_header "Running Performance Tests"
    npm test "$TEST_DIR" -- --grep="performance|concurrent|sequential" --reporter=verbose
}

run_security_tests() {
    print_header "Running Security Tests"
    npm test "$TEST_DIR" -- --grep="security|sensitive|expose" --reporter=verbose
}

run_load_tests() {
    print_header "Running Load Tests"
    npm test "$TEST_DIR" -- --grep="load|concurrent|sequential" --reporter=verbose
}

verify_health_endpoint() {
    print_header "Verifying Health Endpoint"
    
    # Check if server is running
    if ! curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_error "Server is not running on http://localhost:3000"
        print_info "Start the server with: npm run dev"
        return 1
    fi
    
    print_success "Server is running"
    
    # Test endpoint
    print_info "Testing endpoint..."
    RESPONSE=$(curl -s http://localhost:3000/api/health)
    
    # Check response
    if echo "$RESPONSE" | grep -q '"status":"ok"'; then
        print_success "Health check endpoint is working"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    else
        print_error "Health check endpoint returned unexpected response"
        echo "$RESPONSE"
        return 1
    fi
}

run_benchmark() {
    print_header "Running Performance Benchmark"
    
    # Check if server is running
    if ! curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_error "Server is not running on http://localhost:3000"
        return 1
    fi
    
    print_info "Running 100 requests..."
    
    # Measure response time
    TOTAL_TIME=0
    SUCCESS_COUNT=0
    
    for i in {1..100}; do
        START=$(date +%s%N)
        if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
            END=$(date +%s%N)
            DURATION=$((($END - $START) / 1000000)) # Convert to milliseconds
            TOTAL_TIME=$(($TOTAL_TIME + $DURATION))
            SUCCESS_COUNT=$(($SUCCESS_COUNT + 1))
        fi
        
        # Progress indicator
        if [ $(($i % 10)) -eq 0 ]; then
            echo -n "."
        fi
    done
    
    echo ""
    
    # Calculate average
    if [ $SUCCESS_COUNT -gt 0 ]; then
        AVG_TIME=$(($TOTAL_TIME / $SUCCESS_COUNT))
        print_success "Completed $SUCCESS_COUNT/100 requests"
        print_info "Average response time: ${AVG_TIME}ms"
        
        if [ $AVG_TIME -lt 50 ]; then
            print_success "Performance: Excellent (< 50ms)"
        elif [ $AVG_TIME -lt 100 ]; then
            print_success "Performance: Good (< 100ms)"
        elif [ $AVG_TIME -lt 200 ]; then
            print_warning "Performance: Acceptable (< 200ms)"
        else
            print_error "Performance: Slow (> 200ms)"
        fi
    else
        print_error "All requests failed"
        return 1
    fi
}

generate_report() {
    print_header "Generating Test Report"
    
    REPORT_FILE="$PROJECT_ROOT/test-report-health-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Health Check API - Test Report"
        echo "Generated: $(date)"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        npm test "$TEST_DIR" -- --reporter=verbose 2>&1
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Test Summary:"
        echo "- Test Directory: $TEST_DIR"
        echo "- Report Generated: $(date)"
    } > "$REPORT_FILE"
    
    print_success "Report saved to: $REPORT_FILE"
}

show_help() {
    cat << EOF
Health Check API - Test Runner

Usage: $0 [OPTION]

Options:
    basic           Run basic tests (default)
    coverage        Run tests with coverage report
    watch           Run tests in watch mode
    performance     Run performance tests only
    security        Run security tests only
    load            Run load tests only
    verify          Verify health endpoint is working
    benchmark       Run performance benchmark (100 requests)
    report          Generate detailed test report
    all             Run all tests and generate report
    help            Show this help message

Examples:
    $0                  # Run basic tests
    $0 coverage         # Run with coverage
    $0 verify           # Verify endpoint
    $0 benchmark        # Run benchmark
    $0 all              # Run everything

EOF
}

###############################################################################
# Main Script
###############################################################################

main() {
    cd "$PROJECT_ROOT"
    
    case "${1:-basic}" in
        basic)
            run_basic_tests
            ;;
        coverage)
            run_tests_with_coverage
            ;;
        watch)
            run_tests_watch_mode
            ;;
        performance)
            run_performance_tests
            ;;
        security)
            run_security_tests
            ;;
        load)
            run_load_tests
            ;;
        verify)
            verify_health_endpoint
            ;;
        benchmark)
            run_benchmark
            ;;
        report)
            generate_report
            ;;
        all)
            print_header "Running Complete Test Suite"
            verify_health_endpoint
            run_basic_tests
            run_tests_with_coverage
            run_benchmark
            generate_report
            print_success "All tests completed!"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
