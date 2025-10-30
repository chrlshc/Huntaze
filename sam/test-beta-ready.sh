#!/bin/bash

set -e

echo "🧪 Testing Beta Readiness - Huntaze Walking Skeleton"
echo "====================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FUNCTION_NAME="huntaze-mock-read"
REGION="us-east-1"
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}▶ Testing: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Lambda Mock responds
run_test "Lambda Mock responds" \
    "aws lambda invoke \
        --function-name $FUNCTION_NAME \
        --region $REGION \
        --cli-binary-format raw-in-base64-out \
        --payload '{\"userId\":\"user-1\"}' \
        /tmp/test-mock.json > /dev/null 2>&1 && \
     grep -q 'test@huntaze.com' /tmp/test-mock.json"

# Test 2: X-Ray annotations present
run_test "X-Ray annotations in logs" \
    "aws logs tail /aws/lambda/$FUNCTION_NAME \
        --region $REGION \
        --since 2m \
        --format short 2>/dev/null | \
     grep -q 'XRAY.*Annotated trace'"

# Test 3: AppConfig flags retrieved (or AppConfig exists)
run_test "AppConfig configuration exists" \
    "aws appconfig list-configuration-profiles \
        --application-id cjcqdvj \
        --region $REGION \
        --query 'Items[?Name==\`feature-flags\`]' \
        --output text 2>/dev/null | \
     grep -q 'feature-flags'"

# Test 4: CloudWatch Alarm exists and is OK
run_test "CloudWatch Alarm configured" \
    "aws cloudwatch describe-alarms \
        --alarm-names huntaze-lambda-error-rate-gt-2pct \
        --region $REGION \
        --query 'MetricAlarms[0].StateValue' \
        --output text 2>/dev/null | \
     grep -qE '(OK|INSUFFICIENT_DATA)'"

# Test 5: Lambda alias exists
run_test "Lambda alias 'live' exists" \
    "aws lambda get-alias \
        --function-name $FUNCTION_NAME \
        --name live \
        --region $REGION > /dev/null 2>&1"

# Test 6: AppConfig application exists
run_test "AppConfig application exists" \
    "aws appconfig list-applications \
        --region $REGION \
        --query 'Items[?Name==\`huntaze-flags\`]' \
        --output text 2>/dev/null | \
     grep -q 'huntaze-flags'"

# Test 7: Dashboard exists
run_test "CloudWatch Dashboard exists" \
    "aws cloudwatch list-dashboards \
        --region $REGION \
        --query 'DashboardEntries[?DashboardName==\`huntaze-prisma-migration\`]' \
        --output text 2>/dev/null | \
     grep -q 'huntaze-prisma-migration'"

# Test 8: X-Ray tracing enabled
run_test "X-Ray tracing enabled" \
    "aws lambda get-function-configuration \
        --function-name $FUNCTION_NAME \
        --region $REGION \
        --query 'TracingConfig.Mode' \
        --output text 2>/dev/null | \
     grep -q 'Active'"

# Test 9: Prisma Lambda exists
run_test "Prisma Lambda exists" \
    "aws lambda get-function \
        --function-name huntaze-prisma-read \
        --region $REGION > /dev/null 2>&1"

# Test 10: CodeDeploy application exists
run_test "CodeDeploy application exists" \
    "aws deploy list-applications \
        --region $REGION \
        --query 'applications' \
        --output text 2>/dev/null | \
     grep -q 'huntaze-prisma-skeleton'"

# Test 11: Test canary flag (should be disabled by default)
run_test "Canary flag disabled by default" \
    "aws logs tail /aws/lambda/$FUNCTION_NAME \
        --region $REGION \
        --since 2m \
        --format short 2>/dev/null | \
     grep 'FLAG-CHECK' | tail -1 | \
     grep -q 'prismaEnabled: false'"

# Test 12: Mock data returns correctly
run_test "Mock data structure valid" \
    "aws lambda invoke \
        --function-name $FUNCTION_NAME \
        --region $REGION \
        --cli-binary-format raw-in-base64-out \
        --payload '{\"userId\":\"user-1\"}' \
        /tmp/test-structure.json > /dev/null 2>&1 && \
     jq -e '.body | fromjson | has(\"id\") and has(\"email\") and has(\"name\") and has(\"subscription\")' /tmp/test-structure.json > /dev/null 2>&1"

# Summary
echo ""
echo "====================================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "====================================================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Beta ready to launch.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review BETA_PLAYBOOK.md"
    echo "  2. Run: ./enable-canary.sh"
    echo "  3. Monitor: ./monitor-beta.sh --watch"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review issues before beta launch.${NC}"
    echo ""
    exit 1
fi
