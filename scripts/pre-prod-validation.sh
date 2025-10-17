#!/bin/bash

# Huntaze Pre-Production Validation Script
# Run this before deploying to production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-TestPassword123!}"

# Results tracking
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Huntaze Pre-Production Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo -e "Date: $(date)"
echo ""

# Helper functions
check() {
    local test_name="$1"
    local result="$2"
    
    if [ "$result" = "0" ]; then
        echo -e "[${GREEN}✓${NC}] $test_name"
        ((PASSED++))
        return 0
    else
        echo -e "[${RED}✗${NC}] $test_name"
        ((FAILED++))
        return 1
    fi
}

warn() {
    local test_name="$1"
    echo -e "[${YELLOW}!${NC}] $test_name"
    ((WARNINGS++))
}

# Function to make HTTP requests
http_get() {
    curl -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null || echo "000"
}

http_post() {
    local url="$1"
    local data="$2"
    curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null || echo "000"
}

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$command"; then
        check "$test_name" 0
    else
        check "$test_name" 1
    fi
}

echo -e "${YELLOW}1. Environment Checks${NC}"
echo "------------------------"

# Check environment variables
run_test "JWT_SECRET is set" "[ ! -z \"\${JWT_SECRET:-}\" ]"
run_test "AWS_REGION is set" "[ ! -z \"\${NEXT_PUBLIC_AWS_REGION:-}\" ]"
run_test "USER_POOL_ID is set" "[ ! -z \"\${NEXT_PUBLIC_USER_POOL_ID:-}\" ]"
run_test "USER_POOL_CLIENT_ID is set" "[ ! -z \"\${NEXT_PUBLIC_USER_POOL_CLIENT_ID:-}\" ]"

echo ""
echo -e "${YELLOW}2. Server Health Checks${NC}"
echo "------------------------"

# Check if server is running
run_test "Server is reachable" "[ \$(http_get \"$BASE_URL\") = \"200\" ]"
run_test "Health endpoint responds" "[ \$(http_get \"$BASE_URL/api/health\") = \"200\" ]"

echo ""
echo -e "${YELLOW}3. Security Headers${NC}"
echo "------------------------"

# Check security headers
HEADERS=$(curl -sI "$BASE_URL" 2>/dev/null || echo "")
run_test "Strict-Transport-Security present" "echo \"$HEADERS\" | grep -qi 'strict-transport-security'"
run_test "X-Frame-Options present" "echo \"$HEADERS\" | grep -qi 'x-frame-options'"
run_test "X-Content-Type-Options present" "echo \"$HEADERS\" | grep -qi 'x-content-type-options'"
run_test "Content-Security-Policy present" "echo \"$HEADERS\" | grep -qi 'content-security-policy'"

echo ""
echo -e "${YELLOW}4. Authentication Endpoints${NC}"
echo "------------------------"

# Test auth endpoints
run_test "Login page accessible" "[ \$(http_get \"$BASE_URL/auth\") = \"200\" ]"
run_test "Forgot password page accessible" "[ \$(http_get \"$BASE_URL/auth/forgot-password\") = \"200\" ]"
run_test "Dashboard redirects when not authenticated" "[ \$(http_get \"$BASE_URL/dashboard\") = \"307\" ]"

echo ""
echo -e "${YELLOW}5. API Security${NC}"
echo "------------------------"

# Test API security
run_test "Protected API returns 401 without auth" "[ \$(http_get \"$BASE_URL/api/user/me\") = \"401\" ]"
run_test "Invalid login returns 401" "[ \$(http_post \"$BASE_URL/api/auth/login\" '{\"email\":\"bad@example.com\",\"password\":\"wrong\"}') = \"401\" ]"

echo ""
echo -e "${YELLOW}6. Rate Limiting${NC}"
echo "------------------------"

# Test rate limiting (make 6 rapid requests, expecting 429 on the last)
echo -n "Testing: Rate limiting enforced... "
RATE_LIMITED=false
for i in {1..6}; do
    STATUS=$(http_post "$BASE_URL/api/auth/login" '{"email":"test@example.com","password":"wrong"}')
    if [ "$STATUS" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
    sleep 0.1
done

if [ "$RATE_LIMITED" = true ]; then
    check "Rate limiting enforced" 0
else
    warn "Rate limiting might not be working (expected 429, got $STATUS)"
fi

echo ""
echo -e "${YELLOW}7. Static Assets & Performance${NC}"
echo "------------------------"

# Check static assets
run_test "Favicon accessible" "[ \$(http_get \"$BASE_URL/favicon.ico\") = \"200\" ]"
run_test "Robots.txt accessible" "[ \$(http_get \"$BASE_URL/robots.txt\") = \"200\" ]"

# Basic performance check
echo -n "Testing: Page load time < 3s... "
START=$(date +%s%N)
curl -s -o /dev/null "$BASE_URL" 2>/dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
if [ "$DURATION" -lt 3000 ]; then
    check "Page load time < 3s (${DURATION}ms)" 0
else
    warn "Page load time > 3s (${DURATION}ms)"
fi

echo ""
echo -e "${YELLOW}8. Cookie Security${NC}"
echo "------------------------"

# Check cookie attributes
echo -n "Testing: Secure cookies configured... "
COOKIES=$(curl -sI "$BASE_URL/auth" 2>/dev/null | grep -i 'set-cookie' || echo "")
if echo "$COOKIES" | grep -qi "httponly"; then
    check "HttpOnly flag on cookies" 0
else
    warn "HttpOnly flag might not be set on all cookies"
fi

if echo "$COOKIES" | grep -qi "samesite"; then
    check "SameSite flag on cookies" 0
else
    warn "SameSite flag might not be set on all cookies"
fi

echo ""
echo -e "${YELLOW}9. Error Handling${NC}"
echo "------------------------"

# Test error pages
run_test "404 page handled gracefully" "[ \$(http_get \"$BASE_URL/non-existent-page-12345\") = \"404\" ]"
run_test "Invalid API endpoint returns proper error" "[ \$(http_get \"$BASE_URL/api/invalid-endpoint\") = \"404\" ]"

echo ""
echo -e "${YELLOW}10. GDPR Compliance${NC}"
echo "------------------------"

# Check GDPR endpoints
run_test "Delete account endpoint exists" "[ \$(http_get \"$BASE_URL/api/auth/delete-account\") = \"401\" ]"
run_test "Privacy policy accessible" "[ \$(http_get \"$BASE_URL/privacy-policy\") = \"200\" ]"
run_test "Terms of service accessible" "[ \$(http_get \"$BASE_URL/terms-of-service\") = \"200\" ]"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    if [ "$WARNINGS" -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Ready for production.${NC}"
        exit 0
    else
        echo -e "${YELLOW}! Validation completed with warnings. Review before production.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Validation failed. Fix issues before deploying to production.${NC}"
    exit 1
fi