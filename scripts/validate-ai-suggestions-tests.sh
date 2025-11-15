#!/bin/bash

# AI Suggestions API Tests Validation Script
# Validates that all AI suggestions tests pass

set -e

echo "🧪 Validation AI Suggestions API Tests"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if server is running
echo "📋 Test 1: Vérification serveur..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Serveur accessible"
else
  echo -e "${RED}❌ FAIL${NC} - Serveur non accessible"
  echo ""
  echo "Démarrez le serveur avec:"
  echo "  npm run dev"
  echo "ou"
  echo "  npm run build && npm start"
  exit 1
fi
echo ""

# Check test file exists
echo "📋 Test 2: Vérification fichiers de test..."
if [ -f "tests/integration/api/ai-suggestions.test.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Fichier de test existe"
else
  echo -e "${RED}❌ FAIL${NC} - Fichier de test manquant"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check fixtures exist
echo "📋 Test 3: Vérification fixtures..."
if [ -f "tests/integration/api/fixtures/ai-suggestions-samples.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Fixtures existent"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Fixtures manquantes"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check README exists
echo "📋 Test 4: Vérification documentation..."
if [ -f "tests/integration/api/ai-suggestions-README.md" ]; then
  echo -e "${GREEN}✅ PASS${NC} - README existe"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - README manquant"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Run the tests
echo "📋 Test 5: Exécution des tests d'intégration..."
echo -e "${BLUE}Running: npm run test:integration tests/integration/api/ai-suggestions.test.ts${NC}"
echo ""

if npm run test:integration tests/integration/api/ai-suggestions.test.ts 2>&1 | tee /tmp/ai-suggestions-test-output.log; then
  echo ""
  echo -e "${GREEN}✅ PASS${NC} - Tous les tests passent"
else
  echo ""
  echo -e "${RED}❌ FAIL${NC} - Certains tests échouent"
  ERRORS=$((ERRORS + 1))
  
  echo ""
  echo "Logs des erreurs:"
  grep -A 5 "FAIL" /tmp/ai-suggestions-test-output.log || true
fi
echo ""

# Check test coverage
echo "📋 Test 6: Vérification couverture de test..."
TEST_COUNT=$(grep -c "it('should" tests/integration/api/ai-suggestions.test.ts || echo "0")
if [ "$TEST_COUNT" -ge 40 ]; then
  echo -e "${GREEN}✅ PASS${NC} - $TEST_COUNT scénarios de test"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Seulement $TEST_COUNT scénarios (recommandé: 40+)"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check endpoint is accessible
echo "📋 Test 7: Vérification endpoint health..."
if curl -s http://localhost:3000/api/ai/suggestions > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC} - Endpoint accessible"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Endpoint non accessible (peut nécessiter auth)"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check for test patterns
echo "📋 Test 8: Vérification patterns de test..."
PATTERNS=(
  "describe.*POST.*Generate Suggestions"
  "describe.*GET.*Health Check"
  "describe.*Performance"
  "describe.*Security"
  "describe.*Rate Limiting"
  "describe.*Concurrent Access"
)

for pattern in "${PATTERNS[@]}"; do
  if grep -q "$pattern" tests/integration/api/ai-suggestions.test.ts 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Pattern trouvé: $pattern"
  else
    echo -e "${YELLOW}⚠️${NC} Pattern manquant: $pattern"
    WARNINGS=$((WARNINGS + 1))
  fi
done
echo ""

# Check Zod schemas
echo "📋 Test 9: Vérification schémas Zod..."
if grep -q "SuggestionSchema" tests/integration/api/ai-suggestions.test.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Schémas Zod définis"
else
  echo -e "${RED}❌ FAIL${NC} - Schémas Zod manquants"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Check documentation updated
echo "📋 Test 10: Vérification documentation API..."
if grep -q "/api/ai/suggestions" docs/api-tests.md 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Documentation mise à jour"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Documentation non mise à jour"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Résumé"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests passent!${NC}"
  echo ""
  echo "✅ Tests d'intégration validés"
  echo "✅ Fixtures créées"
  echo "✅ Documentation complète"
  echo "✅ Patterns de test corrects"
  echo ""
  echo -e "${GREEN}Prêt pour le déploiement!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Tests passent avec $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Les avertissements sont des améliorations recommandées."
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Veuillez corriger les erreurs avant de continuer."
  exit 1
fi
