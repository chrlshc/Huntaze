#!/bin/bash

# NextAuth v4 Security Verification Suite
# Runs all security verification scripts

echo "🔒 NextAuth v4 Security Verification Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local name=$1
    local script=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if npx tsx "$script"; then
        echo ""
        echo -e "${GREEN}✅ $name: PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ $name: FAILED${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Run all checks
run_check "Security Features Verification" "scripts/verify-security-features.ts"
run_check "Cookie Security Verification" "scripts/verify-cookie-security.ts"
run_check "Error Handling Verification" "scripts/verify-error-handling.ts"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SECURITY VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo ""
    echo "Your NextAuth v4 implementation is secure and ready for deployment."
    echo ""
    echo "Optional: Run runtime tests (requires dev server):"
    echo "  1. Start dev server: npm run dev"
    echo "  2. Run tests: npx tsx scripts/test-auth-error-handling.ts"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some security checks failed.${NC}"
    echo ""
    echo "Please review the output above and address any issues before deploying."
    echo ""
    exit 1
fi
