#!/bin/bash

# Huntaze - Post-Deployment Verification Script
# Vérifie que tout fonctionne correctement après déploiement

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
AMPLIFY_URL=${AMPLIFY_URL:-"https://app.huntaze.com"}
REGION="us-east-1"

echo ""
echo -e "${BOLD}🔍 Huntaze - Post-Deployment Verification${NC}"
echo "=========================================="
echo ""
echo "Testing URL: $AMPLIFY_URL"
echo ""

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local check_name=$1
    local command=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Testing $name... "
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status, expected $expected_status)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# AWS Resources Checks
print_section "1. AWS Resources"

run_check "DynamoDB: huntaze-ai-costs-production" \
    "aws dynamodb describe-table --table-name huntaze-ai-costs-production --region $REGION"

run_check "DynamoDB: huntaze-cost-alerts-production" \
    "aws dynamodb describe-table --table-name huntaze-cost-alerts-production --region $REGION"

run_check "SQS: huntaze-hybrid-workflows" \
    "aws sqs get-queue-url --queue-name huntaze-hybrid-workflows --region $REGION"

run_check "SQS: huntaze-rate-limiter-queue" \
    "aws sqs get-queue-url --queue-name huntaze-rate-limiter-queue --region $REGION"

run_check "SNS: huntaze-cost-alerts" \
    "aws sns get-topic-attributes --topic-arn arn:aws:sns:$REGION:317805897534:huntaze-cost-alerts --region $REGION"

run_check "RDS: huntaze-postgres-production" \
    "aws rds describe-db-instances --db-instance-identifier huntaze-postgres-production --region $REGION"

# API Endpoints Checks
print_section "2. API Endpoints"

test_endpoint "Health Check" "$AMPLIFY_URL/api/health/hybrid-orchestrator" 200

test_endpoint "Cost Stats" "$AMPLIFY_URL/api/v2/costs/stats" 401  # Expected 401 (auth required)

test_endpoint "Campaign Status" "$AMPLIFY_URL/api/v2/campaigns/status" 401  # Expected 401

test_endpoint "Cost Breakdown" "$AMPLIFY_URL/api/v2/costs/breakdown" 401  # Expected 401

# Advanced endpoint checks (if you have a test token)
if [ -n "$TEST_AUTH_TOKEN" ]; then
    print_section "3. Authenticated Endpoints"
    
    echo -n "Testing authenticated campaign creation... "
    
    RESPONSE=$(curl -s -X POST "$AMPLIFY_URL/api/v2/campaigns/hybrid" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TEST_AUTH_TOKEN" \
        -d '{"type":"content_planning","platforms":["instagram"],"data":{"theme":"test"}}' \
        2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
else
    print_warning "Skipping authenticated tests (set TEST_AUTH_TOKEN to enable)"
fi

# Summary
print_section "4. Verification Summary"

echo ""
echo -e "${BOLD}Results:${NC}"
echo "  Total checks:   $TOTAL_CHECKS"
echo -e "  ${GREEN}Passed:${NC}         $PASSED_CHECKS"
echo -e "  ${RED}Failed:${NC}         $FAILED_CHECKS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 All checks passed! Deployment successful!${NC}"
    echo ""
    echo "Your Huntaze Hybrid Orchestrator is live and operational! 🚀"
    echo ""
    echo "Next steps:"
    echo "  • Monitor costs: curl $AMPLIFY_URL/api/v2/costs/stats"
    echo "  • Check health: curl $AMPLIFY_URL/api/health/hybrid-orchestrator"
    echo "  • View logs: aws logs tail /aws/amplify/huntaze --follow"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}❌ Some checks failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  • Check Amplify build logs: Amplify Console > Build history"
    echo "  • Check CloudWatch logs: aws logs tail /aws/amplify/huntaze --follow"
    echo "  • Verify env vars: Amplify Console > Environment variables"
    echo ""
    echo "Documentation:"
    echo "  • AMPLIFY_DEPLOYMENT_GUIDE.md"
    echo "  • HUNTAZE_QUICK_REFERENCE.md (Troubleshooting section)"
    echo ""
    exit 1
fi
