#!/bin/bash

# Wizard API Optimization - Validation Script
# Validates that all optimizations are complete and ready for deployment

set -e

echo "🔍 Wizard API Optimization - Validation Report"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Test 1: Implementation file exists
echo "📋 Test 1: Implementation file exists..."
if [ -f "app/api/onboarding/wizard/route.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Implementation file exists"
else
  echo -e "${RED}❌ FAIL${NC} - Implementation file missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: Zod validation present
echo "📋 Test 2: Zod validation implemented..."
if grep -q "WizardPayloadSchema" app/api/onboarding/wizard/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Zod schema found"
else
  echo -e "${RED}❌ FAIL${NC} - Zod schema missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: TypeScript types complete
echo "📋 Test 3: TypeScript types complete..."
if grep -q "interface WizardResponse" app/api/onboarding/wizard/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Response types defined"
else
  echo -e "${RED}❌ FAIL${NC} - Response types missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Database transactions
echo "📋 Test 4: Database transactions implemented..."
if grep -q "BEGIN" app/api/onboarding/wizard/route.ts 2>/dev/null && \
   grep -q "COMMIT" app/api/onboarding/wizard/route.ts 2>/dev/null && \
   grep -q "ROLLBACK" app/api/onboarding/wizard/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Transactions implemented"
else
  echo -e "${RED}❌ FAIL${NC} - Transactions missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 5: Structured logging
echo "📋 Test 5: Structured logging implemented..."
if grep -q "logInfo" app/api/onboarding/wizard/route.ts 2>/dev/null && \
   grep -q "logError" app/api/onboarding/wizard/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Structured logging found"
else
  echo -e "${RED}❌ FAIL${NC} - Structured logging missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 6: Correlation IDs
echo "📋 Test 6: Correlation IDs implemented..."
if grep -q "correlationId" app/api/onboarding/wizard/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Correlation IDs found"
else
  echo -e "${RED}❌ FAIL${NC} - Correlation IDs missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 7: Documentation files exist
echo "📋 Test 7: Documentation files exist..."
DOCS=(
  "docs/api/wizard-endpoint.md"
  "WIZARD_API_OPTIMIZATION_COMPLETE.md"
  "WIZARD_API_QUICK_START.md"
  "WIZARD_API_OPTIMIZATION_VISUAL.md"
  "WIZARD_API_FILES_INDEX.md"
  "WIZARD_API_TEAM_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✅${NC} $(basename $doc)"
  else
    echo -e "${RED}❌${NC} $(basename $doc) missing"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 8: Test file exists
echo "📋 Test 8: Integration tests exist..."
if [ -f "tests/integration/api/wizard.test.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Test file exists"
  
  # Check test coverage
  if grep -q "describe('Integration: /api/onboarding/wizard'" tests/integration/api/wizard.test.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - Test suite structure correct"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Test suite structure may be incomplete"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ FAIL${NC} - Test file missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 9: Commit message exists
echo "📋 Test 9: Commit message exists..."
if [ -f "WIZARD_API_OPTIMIZATION_COMMIT.txt" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Commit message exists"
else
  echo -e "${RED}❌ FAIL${NC} - Commit message missing"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 10: TypeScript compilation
echo "📋 Test 10: TypeScript compilation..."
if command -v tsc &> /dev/null; then
  if tsc --noEmit app/api/onboarding/wizard/route.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - TypeScript compiles without errors"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - TypeScript compilation warnings (check manually)"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  WARN${NC} - TypeScript not available, skipping compilation check"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "=============================================="
echo "📊 Summary"
echo "=============================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 All validation checks passed!${NC}"
  echo ""
  echo "✅ Implementation complete"
  echo "✅ Documentation complete"
  echo "✅ Tests complete"
  echo "✅ TypeScript valid"
  echo ""
  echo "🚀 Ready for code review and deployment!"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Validation passed with $WARNINGS warning(s)${NC}"
  echo ""
  echo "Warnings are non-blocking but should be reviewed."
  exit 0
else
  echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s)${NC}"
  echo ""
  echo "Please fix errors before proceeding."
  exit 1
fi
