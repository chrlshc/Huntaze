#!/bin/bash

set -e

echo "🛫 Pre-Flight Check - Beta Launch"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REGION="us-east-1"
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Check function
check() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -e "\n${BLUE}▶ ${name}${NC}"
    
    result=$(eval "$command" 2>&1 || echo "FAILED")
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((CHECKS_FAILED++))
        return 1
    fi
}

check_warning() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -e "\n${BLUE}▶ ${name}${NC}"
    
    result=$(eval "$command" 2>&1 || echo "FAILED")
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((CHECKS_WARNING++))
        return 1
    fi
}

echo ""
echo "====================================="
echo "1. Infrastructure Checks"
echo "====================================="

# Lambda Mock exists
check "Lambda Mock exists" \
    "aws lambda get-function --function-name huntaze-mock-read --region $REGION --query 'Configuration.FunctionName' --output text" \
    "huntaze-mock-read"

# Lambda Prisma exists
check "Lambda Prisma exists" \
    "aws lambda get-function --function-name huntaze-prisma-read --region $REGION --query 'Configuration.FunctionName' --output text" \
    "huntaze-prisma-read"

# Lambda alias exists
check "Lambda alias 'live' exists" \
    "aws lambda get-alias --function-name huntaze-mock-read --name live --region $REGION --query 'Name' --output text" \
    "live"

# X-Ray tracing enabled
check "X-Ray tracing enabled" \
    "aws lambda get-function-configuration --function-name huntaze-mock-read --region $REGION --query 'TracingConfig.Mode' --output text" \
    "Active"

echo ""
echo "====================================="
echo "2. AppConfig Checks"
echo "====================================="

# AppConfig application exists
check "AppConfig application exists" \
    "aws appconfig list-applications --region $REGION --query 'Items[?Name==\`huntaze-flags\`].Name' --output text" \
    "huntaze-flags"

# AppConfig environment exists
check "AppConfig environment exists" \
    "aws appconfig list-environments --application-id cjcqdvj --region $REGION --query 'Items[?Name==\`production\`].Name' --output text" \
    "production"

# AppConfig profile exists
check "AppConfig profile exists" \
    "aws appconfig list-configuration-profiles --application-id cjcqdvj --region $REGION --query 'Items[?Name==\`feature-flags\`].Name' --output text" \
    "feature-flags"

echo ""
echo "====================================="
echo "3. Monitoring Checks"
echo "====================================="

# CloudWatch Alarm exists
check "CloudWatch Alarm exists" \
    "aws cloudwatch describe-alarms --alarm-names huntaze-lambda-error-rate-gt-2pct --region $REGION --query 'MetricAlarms[0].AlarmName' --output text" \
    "huntaze-lambda-error-rate-gt-2pct"

# Alarm is in OK or INSUFFICIENT_DATA state
check_warning "Alarm state is OK" \
    "aws cloudwatch describe-alarms --alarm-names huntaze-lambda-error-rate-gt-2pct --region $REGION --query 'MetricAlarms[0].StateValue' --output text" \
    "OK\|INSUFFICIENT_DATA"

# Dashboard exists
check "CloudWatch Dashboard exists" \
    "aws cloudwatch list-dashboards --region $REGION --query 'DashboardEntries[?DashboardName==\`huntaze-prisma-migration\`].DashboardName' --output text" \
    "huntaze-prisma-migration"

echo ""
echo "====================================="
echo "4. CodeDeploy Checks"
echo "====================================="

# CodeDeploy application exists
check "CodeDeploy application exists" \
    "aws deploy list-applications --region $REGION --query 'applications' --output text" \
    "huntaze-prisma-skeleton"

echo ""
echo "====================================="
echo "5. Current State Checks"
echo "====================================="

# Check current traffic (should be 100% Mock)
echo -e "\n${BLUE}▶ Current traffic routing${NC}"
ROUTING=$(aws lambda get-alias \
    --function-name huntaze-mock-read \
    --name live \
    --region $REGION \
    --query 'RoutingConfig.AdditionalVersionWeights' \
    --output text 2>&1 || echo "None")

if [ "$ROUTING" = "None" ] || [ -z "$ROUTING" ]; then
    echo -e "${GREEN}✅ PASS - 100% Mock (no canary)${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING - Canary already active${NC}"
    echo "  Current routing: $ROUTING"
    ((CHECKS_WARNING++))
fi

# Check recent errors
echo -e "\n${BLUE}▶ Recent errors (last 10 min)${NC}"
ERROR_COUNT=$(aws logs filter-log-events \
    --log-group-name /aws/lambda/huntaze-mock-read \
    --start-time $(date -d '10 minutes ago' +%s)000 \
    --filter-pattern "ERROR" \
    --region $REGION \
    --query 'length(events)' \
    --output text 2>/dev/null || echo "0")

if [ "$ERROR_COUNT" -lt 5 ]; then
    echo -e "${GREEN}✅ PASS - $ERROR_COUNT errors (< 5)${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING - $ERROR_COUNT errors${NC}"
    ((CHECKS_WARNING++))
fi

# Test Lambda invocation
echo -e "\n${BLUE}▶ Test Lambda invocation${NC}"
TEST_RESULT=$(aws lambda invoke \
    --function-name huntaze-mock-read \
    --region $REGION \
    --cli-binary-format raw-in-base64-out \
    --payload '{"userId":"preflight-test"}' \
    /tmp/preflight-test.json 2>&1)

if echo "$TEST_RESULT" | grep -q '"StatusCode": 200'; then
    echo -e "${GREEN}✅ PASS - Lambda responds${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌ FAIL - Lambda error${NC}"
    echo "$TEST_RESULT"
    ((CHECKS_FAILED++))
fi

echo ""
echo "====================================="
echo "6. Monitoring URLs"
echo "====================================="

echo ""
echo "Dashboard:"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=huntaze-prisma-migration"
echo ""
echo "X-Ray Service Map:"
echo "  https://console.aws.amazon.com/xray/home?region=$REGION#/service-map"
echo ""
echo "Logs Insights:"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:logs-insights"
echo ""

echo "====================================="
echo "📊 Pre-Flight Summary"
echo "====================================="
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}🚀 ALL SYSTEMS GO - Ready for beta launch!${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. ./enable-canary.sh"
        echo "  2. ./monitor-beta.sh --watch"
        echo "  3. Follow GO_NO_GO_CHECKLIST.md"
        echo ""
        exit 0
    else
        echo -e "${YELLOW}⚠️  CAUTION - Some warnings detected${NC}"
        echo ""
        echo "Review warnings above before proceeding."
        echo "If acceptable, proceed with:"
        echo "  1. ./enable-canary.sh"
        echo "  2. ./monitor-beta.sh --watch"
        echo ""
        exit 0
    fi
else
    echo -e "${RED}🛑 NOT READY - Fix failures before launch${NC}"
    echo ""
    echo "Fix the failed checks above, then re-run:"
    echo "  ./preflight-check.sh"
    echo ""
    exit 1
fi
