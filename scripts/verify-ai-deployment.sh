#!/bin/bash

# AI System Post-Deployment Verification Script
# Run this after deploying to production to verify everything works

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://your-domain.com}"
SESSION_COOKIE="${SESSION_COOKIE:-}"
ADMIN_COOKIE="${ADMIN_COOKIE:-}"

echo "🔍 AI System Post-Deployment Verification"
echo "=========================================="
echo ""
echo "Production URL: $PRODUCTION_URL"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to print info
print_info() {
    echo -e "ℹ $1"
}

# Function to test endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-}
    local cookie=${4:-}
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$cookie" ]; then
        curl_cmd="$curl_cmd -H 'Cookie: $cookie'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $url"
    
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)
    
    echo "$http_code:$body"
}

echo "Step 1: Basic Connectivity"
echo "--------------------------"

# Test main site
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL")
if [ "$RESPONSE" = "200" ]; then
    print_status 0 "Main site accessible"
else
    print_status 1 "Main site not accessible (HTTP $RESPONSE)"
fi

echo ""
echo "Step 2: Environment Variables"
echo "------------------------------"

# Test environment variables endpoint
RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/test-env")
HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
BODY=$(echo "$RESPONSE" | cut -d: -f2-)

if [ "$HTTP_CODE" = "200" ]; then
    print_status 0 "Environment variables endpoint accessible"
    
    # Parse JSON response (basic check)
    if echo "$BODY" | grep -q '"gemini":true'; then
        print_status 0 "GEMINI_API_KEY is set"
    else
        print_status 1 "GEMINI_API_KEY not set"
    fi
    
    if echo "$BODY" | grep -q '"redis":true'; then
        print_status 0 "ELASTICACHE_REDIS_HOST is set"
    else
        print_status 1 "ELASTICACHE_REDIS_HOST not set"
    fi
    
    if echo "$BODY" | grep -q '"database":true'; then
        print_status 0 "DATABASE_URL is set"
    else
        print_status 1 "DATABASE_URL not set"
    fi
else
    print_status 1 "Environment variables endpoint failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "Step 3: Redis Connectivity"
echo "--------------------------"

RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/test-redis")
HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
BODY=$(echo "$RESPONSE" | cut -d: -f2-)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$BODY" | grep -q '"success":true'; then
        print_status 0 "Redis connection successful"
    else
        print_status 1 "Redis connection failed"
    fi
else
    print_status 1 "Redis test endpoint failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "Step 4: AI API Endpoints"
echo "------------------------"

if [ -z "$SESSION_COOKIE" ]; then
    print_warning "SESSION_COOKIE not set - skipping authenticated endpoint tests"
    print_info "Set SESSION_COOKIE environment variable to test authenticated endpoints"
else
    # Test AI chat endpoint
    RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/ai/chat" "POST" '{"fanId":"test-fan","message":"Hello"}' "$SESSION_COOKIE")
    HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status 0 "AI chat endpoint working"
    elif [ "$HTTP_CODE" = "429" ]; then
        print_warning "AI chat endpoint rate limited (expected if testing multiple times)"
    else
        print_status 1 "AI chat endpoint failed (HTTP $HTTP_CODE)"
    fi
    
    # Test quota endpoint
    RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/ai/quota" "GET" "" "$SESSION_COOKIE")
    HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status 0 "AI quota endpoint working"
    else
        print_status 1 "AI quota endpoint failed (HTTP $HTTP_CODE)"
    fi
    
    # Test caption generation
    RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/ai/generate-caption" "POST" '{"platform":"instagram","contentInfo":{"type":"image","description":"test"}}' "$SESSION_COOKIE")
    HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status 0 "AI caption generation endpoint working"
    elif [ "$HTTP_CODE" = "429" ]; then
        print_warning "AI caption endpoint rate limited"
    else
        print_status 1 "AI caption endpoint failed (HTTP $HTTP_CODE)"
    fi
fi

echo ""
echo "Step 5: Admin Endpoints"
echo "-----------------------"

if [ -z "$ADMIN_COOKIE" ]; then
    print_warning "ADMIN_COOKIE not set - skipping admin endpoint tests"
    print_info "Set ADMIN_COOKIE environment variable to test admin endpoints"
else
    # Test admin costs endpoint
    RESPONSE=$(test_endpoint "$PRODUCTION_URL/api/admin/ai-costs" "GET" "" "$ADMIN_COOKIE")
    HTTP_CODE=$(echo "$RESPONSE" | cut -d: -f1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_status 0 "Admin AI costs endpoint working"
    elif [ "$HTTP_CODE" = "403" ]; then
        print_status 1 "Admin endpoint returned 403 - user may not have admin role"
    else
        print_status 1 "Admin endpoint failed (HTTP $HTTP_CODE)"
    fi
fi

echo ""
echo "Step 6: Database Tables"
echo "-----------------------"

print_info "Checking if AI tables exist in database..."
print_info "Run this SQL query manually to verify:"
echo ""
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "AND table_name IN ('usage_logs', 'monthly_charges', 'ai_insights');"
echo ""
print_info "Expected: 3 tables (usage_logs, monthly_charges, ai_insights)"

echo ""
echo "Step 7: User Fields"
echo "-------------------"

print_info "Checking if user fields exist..."
print_info "Run this SQL query manually to verify:"
echo ""
echo "SELECT column_name FROM information_schema.columns"
echo "WHERE table_name = 'users'"
echo "AND column_name IN ('ai_plan', 'role');"
echo ""
print_info "Expected: 2 columns (ai_plan, role)"

echo ""
echo "📊 Verification Summary"
echo "======================="
echo ""
echo "✅ Completed Checks:"
echo "  - Basic connectivity"
echo "  - Environment variables"
echo "  - Redis connectivity"
if [ -n "$SESSION_COOKIE" ]; then
    echo "  - AI API endpoints"
fi
if [ -n "$ADMIN_COOKIE" ]; then
    echo "  - Admin endpoints"
fi
echo ""
echo "📋 Manual Verification Required:"
echo "  - Database tables (run SQL queries above)"
echo "  - User fields (run SQL queries above)"
echo "  - Test with real user accounts"
echo "  - Monitor CloudWatch metrics"
echo "  - Check usage logs are being created"
echo ""
echo "🔗 Useful Links:"
echo "  - Amplify Console: https://console.aws.amazon.com/amplify"
echo "  - CloudWatch Logs: https://console.aws.amazon.com/cloudwatch"
echo "  - RDS Console: https://console.aws.amazon.com/rds"
echo "  - ElastiCache Console: https://console.aws.amazon.com/elasticache"
echo ""
echo "📖 For detailed verification steps, see:"
echo "   .kiro/specs/ai-system-gemini-integration/DEPLOYMENT_GUIDE.md"
echo ""
