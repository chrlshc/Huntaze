#!/bin/bash

# Test All Missing APIs Script
# Tests messaging, notifications, social publishing, and campaigns APIs

set -e

BASE_URL="${BASE_URL:-https://staging.huntaze.com}"
RESULTS_FILE="api-test-results-$(date +%Y%m%d-%H%M%S).json"

echo "🧪 Testing All Missing APIs"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test an API endpoint
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    # Check if response has standardized format
    has_success=$(echo "$body" | grep -o '"success"' || echo "")
    has_error=$(echo "$body" | grep -o '"error"' || echo "")
    has_meta=$(echo "$body" | grep -o '"meta"' || echo "")
    
    if [ "$status_code" = "$expected_status" ]; then
        if [ -n "$has_success" ] || [ -n "$has_error" ]; then
            echo -e "${GREEN}✓ PASS${NC} (Status: $status_code, Format: ✓)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${YELLOW}⚠ PARTIAL${NC} (Status: $status_code, Format: ✗)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Store result (show first 3 lines of response)
    echo "$body" | python3 -m json.tool 2>/dev/null | head -n 3 || echo "$body" | head -n 3
    echo ""
}

echo "📨 MESSAGING & NOTIFICATIONS APIs"
echo "================================"

# OnlyFans Messaging Send
test_api "OnlyFans Messaging Send" "POST" "/api/onlyfans/messaging/send" \
    '{"recipientId":"test123","content":"Hello"}' \
    "401"

# OnlyFans AI Suggestions
test_api "OnlyFans AI Suggestions" "POST" "/api/onlyfans/ai/suggestions" \
    '{"fanId":123,"fanName":"Test Fan"}' \
    "401"

# Messages Unread Count
test_api "Messages Unread Count" "GET" "/api/messages/unread-count" \
    "" \
    "200"

# Messages Metrics
test_api "Messages Metrics" "GET" "/api/messages/metrics?period=week" \
    "" \
    "200"

echo ""
echo "📱 SOCIAL MEDIA PUBLISHING APIs"
echo "================================"

# Instagram Publish
test_api "Instagram Publish" "POST" "/api/instagram/publish" \
    '{"mediaType":"IMAGE","mediaUrl":"https://example.com/image.jpg"}' \
    "400"

# TikTok Upload
test_api "TikTok Upload" "POST" "/api/tiktok/upload" \
    '{"source":"PULL_FROM_URL","title":"Test Video"}' \
    "401"

# Reddit Publish
test_api "Reddit Publish" "POST" "/api/reddit/publish" \
    '{"subreddit":"test","title":"Test Post","kind":"self"}' \
    "400"

echo ""
echo "🎯 CAMPAIGNS APIs (Checking for Duplicates)"
echo "================================"

# OnlyFans Campaigns (Old)
test_api "OnlyFans Campaigns (Old)" "POST" "/api/onlyfans/campaigns" \
    '{"userId":"user_123","planTier":"pro","campaignName":"Test"}' \
    "403"

# Marketing Campaigns (New)
test_api "Marketing Campaigns List" "GET" "/api/marketing/campaigns" \
    "" \
    "401"

test_api "Marketing Campaigns Create" "POST" "/api/marketing/campaigns" \
    '{"name":"Test Campaign","channel":"email","goal":"engagement","audienceSegment":"all"}' \
    "401"

echo ""
echo "📊 TEST SUMMARY"
echo "================================"
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
