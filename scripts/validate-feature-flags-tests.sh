#!/bin/bash

# Feature Flags Tests Validation Script
# Vérifie que tous les tests sont en place et fonctionnels

set -e

echo "🔍 Validation Feature Flags Tests"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Test 1: Fichiers de test existent
echo "📋 Test 1: Vérification fichiers de test..."
FILES=(
  "tests/integration/api/admin-feature-flags.test.ts"
  "tests/integration/api/fixtures/feature-flags-samples.ts"
  "tests/integration/api/admin-feature-flags-README.md"
  "FEATURE_FLAGS_TESTS_QUICK_START.md"
  "FEATURE_FLAGS_TESTS_COMPLETE.md"
  "FEATURE_FLAGS_TESTS_COMMIT.txt"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 2: Nombre de tests
echo "📋 Test 2: Vérification nombre de tests..."
TEST_COUNT=$(grep -c "it('should" tests/integration/api/admin-feature-flags.test.ts || echo "0")
if [ "$TEST_COUNT" -ge 40 ]; then
  echo -e "${GREEN}✅ PASS${NC} - $TEST_COUNT tests trouvés (attendu: ≥40)"
else
  echo -e "${RED}❌ FAIL${NC} - $TEST_COUNT tests trouvés (attendu: ≥40)"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Describe blocks
echo "📋 Test 3: Vérification structure des tests..."
DESCRIBE_COUNT=$(grep -c "describe(" tests/integration/api/admin-feature-flags.test.ts || echo "0")
if [ "$DESCRIBE_COUNT" -ge 15 ]; then
  echo -e "${GREEN}✅ PASS${NC} - $DESCRIBE_COUNT describe blocks (attendu: ≥15)"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - $DESCRIBE_COUNT describe blocks (attendu: ≥15)"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 4: Imports nécessaires
echo "📋 Test 4: Vérification imports..."
REQUIRED_IMPORTS=(
  "import.*vitest"
  "import.*zod"
  "BASE_URL"
  "FEATURE_FLAGS_ENDPOINT"
)

for import in "${REQUIRED_IMPORTS[@]}"; do
  if grep -q "$import" tests/integration/api/admin-feature-flags.test.ts; then
    echo -e "${GREEN}✅${NC} $import présent"
  else
    echo -e "${RED}❌${NC} $import manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 5: Schemas Zod
echo "📋 Test 5: Vérification schemas Zod..."
SCHEMAS=(
  "OnboardingFlagsSchema"
  "GetFlagsResponseSchema"
  "PostFlagsResponseSchema"
  "ErrorResponseSchema"
)

for schema in "${SCHEMAS[@]}"; do
  if grep -q "$schema" tests/integration/api/admin-feature-flags.test.ts; then
    echo -e "${GREEN}✅${NC} $schema défini"
  else
    echo -e "${RED}❌${NC} $schema manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 6: Fixtures
echo "📋 Test 6: Vérification fixtures..."
FIXTURES=(
  "validFeatureFlags"
  "validUpdateRequests"
  "invalidUpdateRequests"
  "concurrentUpdateScenarios"
  "performanceBenchmarks"
)

for fixture in "${FIXTURES[@]}"; do
  if grep -q "export const $fixture" tests/integration/api/fixtures/feature-flags-samples.ts; then
    echo -e "${GREEN}✅${NC} $fixture exporté"
  else
    echo -e "${RED}❌${NC} $fixture manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 7: Documentation
echo "📋 Test 7: Vérification documentation..."
DOC_SECTIONS=(
  "## Overview"
  "## Test Coverage"
  "## Running Tests"
  "## Test Scenarios"
)

for section in "${DOC_SECTIONS[@]}"; do
  if grep -q "$section" tests/integration/api/admin-feature-flags-README.md; then
    echo -e "${GREEN}✅${NC} Section '$section' présente"
  else
    echo -e "${YELLOW}⚠️${NC} Section '$section' manquante"
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo ""

# Test 8: Quick Start Guide
echo "📋 Test 8: Vérification Quick Start..."
if grep -q "Démarrage Rapide" FEATURE_FLAGS_TESTS_QUICK_START.md; then
  echo -e "${GREEN}✅ PASS${NC} - Quick Start guide complet"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Quick Start guide incomplet"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 9: Scénarios de test critiques
echo "📋 Test 9: Vérification scénarios critiques..."
CRITICAL_SCENARIOS=(
  "Authentication.*Authorization"
  "Request Validation"
  "Concurrent Access"
  "Performance"
  "Security"
)

for scenario in "${CRITICAL_SCENARIOS[@]}"; do
  if grep -q "$scenario" tests/integration/api/admin-feature-flags.test.ts; then
    echo -e "${GREEN}✅${NC} Scénario '$scenario' présent"
  else
    echo -e "${RED}❌${NC} Scénario '$scenario' manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 10: Documentation dans docs/api-tests.md
echo "📋 Test 10: Vérification intégration docs/api-tests.md..."
if grep -q "/api/admin/feature-flags" docs/api-tests.md; then
  echo -e "${GREEN}✅ PASS${NC} - Section ajoutée à docs/api-tests.md"
else
  echo -e "${RED}❌ FAIL${NC} - Section manquante dans docs/api-tests.md"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 11: Syntaxe TypeScript (optionnel, nécessite tsc)
echo "📋 Test 11: Vérification syntaxe TypeScript..."
if command -v npx &> /dev/null; then
  if npx tsc --noEmit tests/integration/api/admin-feature-flags.test.ts 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ FAIL${NC} - Erreurs TypeScript détectées"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✅ PASS${NC} - Pas d'erreurs TypeScript"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} - tsc non disponible"
fi
echo ""

# Summary
echo "======================================"
echo "📊 Résumé"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests de validation passent!${NC}"
  echo ""
  echo "✅ Tests d'intégration complets"
  echo "✅ Fixtures disponibles"
  echo "✅ Documentation complète"
  echo "✅ Prêt pour exécution"
  echo ""
  echo "Prochaine étape: npm run test:integration tests/integration/api/admin-feature-flags.test.ts"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Validation réussie avec $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Les avertissements sont des améliorations recommandées mais non bloquantes."
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Veuillez corriger les erreurs avant de continuer."
  exit 1
fi
