#!/bin/bash

# Deployment Readiness Verification Script
# This script checks all requirements before production deployment

set -e

echo "=========================================="
echo "Huntaze Beta Launch - Deployment Readiness Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version: $(node -v)"
else
    check_fail "Node.js version too old: $(node -v). Required: >= 18"
fi
echo ""

# 2. Check npm dependencies
echo "2. Checking npm dependencies..."
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules directory not found. Run: npm install"
fi
echo ""

# 3. Run TypeScript type check
echo "3. Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    check_pass "TypeScript type check passed"
else
    check_fail "TypeScript type check failed. Run: npm run type-check"
fi
echo ""

# 4. Run ESLint
echo "4. Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    check_pass "ESLint check passed"
else
    check_warn "ESLint check failed. Run: npm run lint"
fi
echo ""

# 5. Run security audit
echo "5. Running security audit..."
AUDIT_OUTPUT=$(npm audit --production 2>&1)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    check_pass "Security audit clean (0 vulnerabilities)"
else
    check_warn "Security vulnerabilities found. Run: npm audit"
fi
echo ""

# 6. Check environment variables
echo "6. Checking environment variables..."
ENV_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "ENCRYPTION_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "AWS_S3_BUCKET"
    "NEXT_PUBLIC_APP_URL"
)

for VAR in "${ENV_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        check_warn "Environment variable not set: $VAR"
    else
        check_pass "Environment variable set: $VAR"
    fi
done
echo ""

# 7. Check documentation
echo "7. Checking deployment documentation..."
DOCS=(
    "docs/BETA_DEPLOYMENT.md"
    "docs/ROLLBACK_PROCEDURE.md"
    "docs/DEPLOYMENT_CHECKLIST.md"
    "docs/MONITORING_ALERTING.md"
    "docs/DEPLOYMENT_SUMMARY.md"
)

for DOC in "${DOCS[@]}"; do
    if [ -f "$DOC" ]; then
        check_pass "Documentation exists: $DOC"
    else
        check_fail "Documentation missing: $DOC"
    fi
done
echo ""

# 8. Check Prisma schema
echo "8. Checking Prisma schema..."
if [ -f "prisma/schema.prisma" ]; then
    check_pass "Prisma schema exists"
    
    # Check if schema is valid
    if npx prisma validate > /dev/null 2>&1; then
        check_pass "Prisma schema is valid"
    else
        check_fail "Prisma schema validation failed"
    fi
else
    check_fail "Prisma schema not found"
fi
echo ""

# 9. Check AWS CLI
echo "9. Checking AWS CLI..."
if command -v aws &> /dev/null; then
    check_pass "AWS CLI installed: $(aws --version | head -n1)"
    
    # Check AWS credentials
    if aws sts get-caller-identity > /dev/null 2>&1; then
        check_pass "AWS credentials configured"
    else
        check_warn "AWS credentials not configured or invalid"
    fi
else
    check_warn "AWS CLI not installed (optional for deployment)"
fi
echo ""

# 10. Check Vercel CLI
echo "10. Checking Vercel CLI..."
if command -v vercel &> /dev/null; then
    check_pass "Vercel CLI installed: $(vercel --version)"
else
    check_warn "Vercel CLI not installed (optional for deployment)"
fi
echo ""

# 11. Check build configuration
echo "11. Checking build configuration..."
if [ -f "next.config.ts" ]; then
    check_pass "Next.js config exists"
else
    check_fail "Next.js config not found"
fi

if [ -f "tsconfig.json" ]; then
    check_pass "TypeScript config exists"
else
    check_fail "TypeScript config not found"
fi
echo ""

# 12. Check Lighthouse configuration
echo "12. Checking Lighthouse configuration..."
if [ -f "lighthouserc.js" ]; then
    check_pass "Lighthouse CI config exists"
else
    check_warn "Lighthouse CI config not found"
fi
echo ""

# 13. Check test files
echo "13. Checking test files..."
TEST_DIRS=("tests/unit" "tests/integration")
for DIR in "${TEST_DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        TEST_COUNT=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
        check_pass "Test directory exists: $DIR ($TEST_COUNT test files)"
    else
        check_warn "Test directory not found: $DIR"
    fi
done
echo ""

# 14. Check infrastructure files
echo "14. Checking infrastructure files..."
INFRA_FILES=(
    "infra/aws/s3-bucket-stack.yaml"
    "infra/aws/cloudfront-distribution-stack.yaml"
    "infra/lambda/security-headers.js"
    "infra/lambda/image-optimization.js"
)

for FILE in "${INFRA_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        check_pass "Infrastructure file exists: $FILE"
    else
        check_warn "Infrastructure file not found: $FILE"
    fi
done
echo ""

# 15. Check critical API routes
echo "15. Checking critical API routes..."
API_ROUTES=(
    "app/api/auth/register/route.ts"
    "app/api/auth/login/route.ts"
    "app/api/home/stats/route.ts"
    "app/api/integrations/status/route.ts"
    "app/api/csrf/token/route.ts"
)

for ROUTE in "${API_ROUTES[@]}"; do
    if [ -f "$ROUTE" ]; then
        check_pass "API route exists: $ROUTE"
    else
        check_fail "API route missing: $ROUTE"
    fi
done
echo ""

# 16. Check middleware
echo "16. Checking middleware..."
MIDDLEWARE_FILES=(
    "lib/middleware/csrf.ts"
    "lib/api/middleware/rate-limit.ts"
    "lib/api/middleware/auth.ts"
)

for FILE in "${MIDDLEWARE_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        check_pass "Middleware exists: $FILE"
    else
        check_fail "Middleware missing: $FILE"
    fi
done
echo ""

# 17. Check services
echo "17. Checking services..."
SERVICE_FILES=(
    "lib/services/cache.service.ts"
    "lib/services/s3Service.ts"
    "lib/monitoring/cloudwatch.service.ts"
)

for FILE in "${SERVICE_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        check_pass "Service exists: $FILE"
    else
        check_warn "Service not found: $FILE"
    fi
done
echo ""

# Summary
echo "=========================================="
echo "Deployment Readiness Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

# Determine overall status
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ READY FOR DEPLOYMENT${NC}"
        echo "All checks passed. You can proceed with deployment."
        exit 0
    else
        echo -e "${YELLOW}⚠ READY WITH WARNINGS${NC}"
        echo "Some warnings detected. Review them before deployment."
        exit 0
    fi
else
    echo -e "${RED}✗ NOT READY FOR DEPLOYMENT${NC}"
    echo "Critical issues detected. Fix them before deployment."
    exit 1
fi
