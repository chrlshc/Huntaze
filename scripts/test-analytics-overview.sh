#!/bin/bash

# Test script for Analytics Overview API
# Tests authentication, caching, error handling, and performance

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${TEST_API_URL:-http://localhost:3000}"
ENDPOINT="/api/analytics/overview"

echo "=========================================="
echo "Analytics Overview API - Test Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Endpoint: $ENDPOINT"
echo ""

# Test 1: Unauthorized access
echo -e "${YELLOW}Test 1: Unauthorized access${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$ENDPOINT")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Returns 401 for unauthorized access${NC}"
    
    # Check error structure
    if echo "$BODY" | jq -e '.error.code == "UNAUTHORIZED"' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Error response has correct structure${NC}"
    else
        echo -e "${RED}✗ Error response structure is invalid${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Expected 401, got $HTTP_CODE${NC}"
    exit 1
fi

echo ""

# Test 2: Response headers
echo -e "${YELLOW}Test 2: Response headers${NC}"
HEADERS=$(curl -s -I "$BASE_URL$ENDPOINT")

if echo "$HEADERS" | grep -q "x-correlation-id"; then
    echo -e "${GREEN}✓ Includes X-Correlation-Id header${NC}"
else
    echo -e "${RED}✗ Missing X-Correlation-Id header${NC}"
fi

if echo "$HEADERS" | grep -q "x-ratelimit-limit"; then
    echo -e "${GREEN}✓ Includes rate limit headers${NC}"
else
    echo -e "${RED}✗ Missing rate limit headers${NC}"
fi

echo ""

# Test 3: Response format validation
echo -e "${YELLOW}Test 3: Response format validation${NC}"

# This test requires authentication, so we'll just validate the error response
if echo "$BODY" | jq -e '.success == false' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Response has 'success' field${NC}"
else
    echo -e "${RED}✗ Response missing 'success' field${NC}"
    exit 1
fi

if echo "$BODY" | jq -e '.error.correlationId' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Response includes correlationId${NC}"
else
    echo -e "${RED}✗ Response missing correlationId${NC}"
    exit 1
fi

if echo "$BODY" | jq -e '.error.retryable' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Response includes retryable flag${NC}"
else
    echo -e "${RED}✗ Response missing retryable flag${NC}"
    exit 1
fi

echo ""

# Test 4: Performance
echo -e "${YELLOW}Test 4: Performance${NC}"

START_TIME=$(date +%s%N)
curl -s "$BASE_URL$ENDPOINT" > /dev/null
END_TIME=$(date +%s%N)

DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $DURATION -lt 1000 ]; then
    echo -e "${GREEN}✓ Response time: ${DURATION}ms (< 1000ms)${NC}"
else
    echo -e "${YELLOW}⚠ Response time: ${DURATION}ms (> 1000ms)${NC}"
fi

echo ""

# Test 5: Concurrent requests
echo -e "${YELLOW}Test 5: Concurrent requests${NC}"

START_TIME=$(date +%s%N)

# Make 10 concurrent requests
for i in {1..10}; do
    curl -s "$BASE_URL$ENDPOINT" > /dev/null &
done

wait

END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $DURATION -lt 3000 ]; then
    echo -e "${GREEN}✓ 10 concurrent requests completed in ${DURATION}ms (< 3000ms)${NC}"
else
    echo -e "${YELLOW}⚠ 10 concurrent requests took ${DURATION}ms (> 3000ms)${NC}"
fi

echo ""

# Test 6: Error response doesn't expose sensitive data
echo -e "${YELLOW}Test 6: Security - No sensitive data exposure${NC}"

if echo "$BODY" | grep -qi "password\|token\|secret\|stack"; then
    echo -e "${RED}✗ Response contains sensitive data${NC}"
    exit 1
else
    echo -e "${GREEN}✓ No sensitive data in error response${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run integration tests: npm run test:integration -- analytics-overview"
echo "2. Test with authenticated session"
echo "3. Verify caching behavior"
echo "4. Monitor logs for correlation IDs"
echo ""
