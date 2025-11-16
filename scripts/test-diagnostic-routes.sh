#!/bin/bash

# Test Diagnostic Routes
# Tests the newly created diagnostic routes locally and on staging

set -e

echo "=========================================="
echo "Testing Diagnostic Routes"
echo "=========================================="
echo ""

# Determine base URL
if [ "$1" == "staging" ]; then
  BASE_URL="https://staging.huntaze.com"
  echo "Testing on STAGING environment"
else
  BASE_URL="http://localhost:3000"
  echo "Testing on LOCAL environment"
fi

echo "Base URL: $BASE_URL"
echo ""

# Test 1: /api/ping
echo "Test 1: /api/ping (ultra-simple route)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/ping")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ PASS: /api/ping returned 200"
else
  echo "❌ FAIL: /api/ping returned $HTTP_CODE"
  exit 1
fi
echo ""

# Test 2: /api/health-check
echo "Test 2: /api/health-check (middleware bypass)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/health-check")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ PASS: /api/health-check returned 200"
else
  echo "❌ FAIL: /api/health-check returned $HTTP_CODE"
  exit 1
fi
echo ""

# Test 3: /api/test-env
echo "Test 3: /api/test-env (with middleware)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/test-env")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ PASS: /api/test-env returned 200"
else
  echo "❌ FAIL: /api/test-env returned $HTTP_CODE"
  exit 1
fi
echo ""

# Test 4: Check correlation IDs
echo "Test 4: Correlation ID headers"
echo "----------------------------------------"
CORRELATION_ID=$(curl -s -I "$BASE_URL/api/ping" | grep -i "x-correlation-id" | cut -d: -f2 | tr -d '[:space:]')

if [ -n "$CORRELATION_ID" ]; then
  echo "✅ PASS: Correlation ID found: $CORRELATION_ID"
else
  echo "❌ FAIL: No correlation ID in response headers"
  exit 1
fi
echo ""

echo "=========================================="
echo "All diagnostic route tests passed! ✅"
echo "=========================================="
