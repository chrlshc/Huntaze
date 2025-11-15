#!/bin/bash

# Authentication System Verification Script
# Verifies that all auth system files are in place and valid

set -e

echo "🔍 Verifying Authentication System..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
        ((FAILED++))
        return 1
    fi
}

# Function to check environment variable
check_env() {
    if grep -q "^$1=" .env.example 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 (in .env.example)"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $1 (not in .env.example)"
        ((WARNINGS++))
        return 1
    fi
}

echo "📁 Checking Core Files..."
check_file "app/api/auth/[...nextauth]/route.ts"
check_file "lib/auth/types.ts"
check_file "lib/auth/errors.ts"
check_file "lib/auth/validators.ts"
check_file "lib/auth/session.ts"
check_file "lib/auth/index.ts"
check_file "lib/auth/README.md"
echo ""

echo "📁 Checking Documentation..."
check_file "AUTH_API_OPTIMIZATION_SUMMARY.md"
check_file "AUTH_SYSTEM_COMPLETE.md"
check_file "docs/AUTH_MIGRATION_GUIDE.md"
echo ""

echo "📁 Checking Examples..."
check_file "components/auth/SignInForm.tsx"
echo ""

echo "📁 Checking Tests..."
check_file "tests/unit/auth/validators.test.ts"
echo ""

echo "🔧 Checking Environment Variables..."
check_env "NEXTAUTH_SECRET"
check_env "NEXTAUTH_URL"
echo ""

echo "📦 Checking Dependencies..."
if grep -q '"next-auth"' package.json; then
    echo -e "${GREEN}✓${NC} next-auth (in package.json)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} next-auth (not in package.json)"
    ((FAILED++))
fi
echo ""

echo "🔍 Checking TypeScript Compilation..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit --skipLibCheck 2>&1 | grep -q "lib/auth"; then
        echo -e "${RED}✗${NC} TypeScript errors in lib/auth"
        ((FAILED++))
    else
        echo -e "${GREEN}✓${NC} No TypeScript errors"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} TypeScript not found (skipping)"
    ((WARNINGS++))
fi
echo ""

echo "📊 Summary"
echo "=========="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Authentication system verification complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set NEXTAUTH_SECRET in your .env file"
    echo "2. Set NEXTAUTH_URL in your .env file"
    echo "3. Run tests: npm test tests/unit/auth/"
    echo "4. Review migration guide: docs/AUTH_MIGRATION_GUIDE.md"
    exit 0
else
    echo -e "${RED}❌ Authentication system verification failed!${NC}"
    echo ""
    echo "Please fix the missing files and try again."
    exit 1
fi
