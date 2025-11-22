#!/bin/bash

# Check if the application is ready for Lighthouse audits

set -e

echo "🔍 Checking Lighthouse Audit Readiness..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check a condition
check() {
    local description=$1
    local command=$2
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Check Node.js version
check "Node.js installed" "command -v node"
check "Node.js version >= 18" "[[ \$(node -v | cut -d'v' -f2 | cut -d'.' -f1) -ge 18 ]]"

# Check npm packages
check "npm installed" "command -v npm"
check "Dependencies installed" "[ -d node_modules ]"

# Check Lighthouse CLI
check "Lighthouse CLI installed" "command -v lighthouse"

# Check configuration files
check "lighthouserc.js exists" "[ -f lighthouserc.js ]"
check "performance-budget.json exists" "[ -f performance-budget.json ]"
check "GitHub Actions workflow exists" "[ -f .github/workflows/lighthouse-ci.yml ]"

# Check if server is running
check "Server running on port 3000" "curl -s http://localhost:3000 > /dev/null"

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠ Server not running. Start with: npm run dev${NC}"
fi

# Check key pages are accessible
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    check "Landing page accessible" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q '200'"
    check "Login page accessible" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/auth/login | grep -q '200'"
    check "Register page accessible" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/auth/register | grep -q '200'"
fi

# Check build artifacts
check "Next.js build exists" "[ -d .next ]"

# Check environment variables
check ".env file exists" "[ -f .env ] || [ -f .env.local ]"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to run Lighthouse audits.${NC}"
    echo ""
    echo "Run audits with:"
    echo "  ./scripts/run-lighthouse.sh"
    exit 0
else
    echo -e "${RED}❌ $CHECKS_FAILED check(s) failed.${NC}"
    echo ""
    echo "Fix the issues above before running Lighthouse audits."
    exit 1
fi
