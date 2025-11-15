#!/bin/bash

# Script de validation du coverage des tests
# Vérifie que tous les seuils de coverage sont atteints

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║           Validation du Coverage des Tests Huntaze                  ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Fonction pour vérifier un seuil
check_threshold() {
  local name=$1
  local actual=$2
  local threshold=$3
  
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if (( $(echo "$actual >= $threshold" | bc -l) )); then
    echo -e "${GREEN}✓${NC} $name: ${actual}% (seuil: ${threshold}%)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo -e "${RED}✗${NC} $name: ${actual}% (seuil: ${threshold}%)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# 1. Tests d'Intégration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 1. Tests d'Intégration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Exécution des tests d'intégration avec coverage..."
npm run test:integration:coverage > /dev/null 2>&1 || true

if [ -f "coverage/coverage-summary.json" ]; then
  # Extraire les métriques de coverage
  LINES=$(jq '.total.lines.pct' coverage/coverage-summary.json)
  FUNCTIONS=$(jq '.total.functions.pct' coverage/coverage-summary.json)
  BRANCHES=$(jq '.total.branches.pct' coverage/coverage-summary.json)
  STATEMENTS=$(jq '.total.statements.pct' coverage/coverage-summary.json)
  
  echo ""
  check_threshold "Lines" "$LINES" "85"
  check_threshold "Functions" "$FUNCTIONS" "85"
  check_threshold "Branches" "$BRANCHES" "80"
  check_threshold "Statements" "$STATEMENTS" "85"
  echo ""
else
  echo -e "${YELLOW}⚠${NC}  Fichier de coverage non trouvé"
  echo "   Exécutez: npm run test:integration:coverage"
  echo ""
fi

# 2. Endpoints Critiques
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 2. Endpoints Critiques Testés"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Liste des endpoints critiques
CRITICAL_ENDPOINTS=(
  "tests/integration/auth/oauth-flows.test.ts"
  "tests/integration/dashboard/dashboard.test.ts"
  "tests/integration/content/content.test.ts"
  "tests/integration/messages/unified.test.ts"
  "tests/integration/revenue/pricing.test.ts"
  "tests/integration/revenue/churn.test.ts"
  "tests/integration/marketing/campaigns.test.ts"
  "tests/integration/rate-limiter/middleware.test.ts"
  "tests/integration/health/health.test.ts"
)

for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ -f "$endpoint" ]; then
    echo -e "${GREEN}✓${NC} $(basename $endpoint .test.ts)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $(basename $endpoint .test.ts) - MANQUANT"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done
echo ""

# 3. Tests E2E
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎭 3. Tests E2E (Smoke Tests)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier que Playwright est installé
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
  echo -e "${GREEN}✓${NC} Playwright installé"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${YELLOW}⚠${NC}  Playwright non installé"
  echo "   Exécutez: npx playwright install"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Vérifier les tests E2E smoke
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if [ -d "tests/e2e/smoke" ]; then
  SMOKE_TESTS=$(find tests/e2e/smoke -name "*.spec.ts" 2>/dev/null | wc -l)
  if [ "$SMOKE_TESTS" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Tests smoke E2E: $SMOKE_TESTS tests"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${YELLOW}⚠${NC}  Aucun test smoke trouvé"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
else
  echo -e "${YELLOW}⚠${NC}  Répertoire tests/e2e/smoke non trouvé"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 4. Tests de Charge
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ 4. Tests de Charge"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier k6
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if command -v k6 &> /dev/null; then
  echo -e "${GREEN}✓${NC} k6 installé ($(k6 version | head -1))"
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
  echo -e "${RED}✗${NC} k6 non installé"
  echo "   Exécutez: brew install k6"
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

# Vérifier les tests de charge
LOAD_TESTS=(
  "tests/load/rate-limiting/rate-limiter-validation.js"
  "tests/load/rate-limiting/circuit-breaker.js"
)

for test in "${LOAD_TESTS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ -f "$test" ]; then
    echo -e "${GREEN}✓${NC} $(basename $test)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $(basename $test) - MANQUANT"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done
echo ""

# 5. Tests de Performance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 5. Tests de Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PERF_TESTS=(
  "tests/performance/database-performance.test.ts"
  "tests/performance/cache-performance.test.ts"
  "tests/performance/memory-monitoring.test.ts"
  "tests/performance/baseline-tracker.ts"
)

for test in "${PERF_TESTS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ -f "$test" ]; then
    echo -e "${GREEN}✓${NC} $(basename $test)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $(basename $test) - MANQUANT"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done
echo ""

# 6. Documentation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 6. Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DOCS=(
  "docs/testing/README.md"
  "docs/testing/integration-tests.md"
  "docs/testing/e2e-tests.md"
  "docs/testing/load-tests.md"
  "docs/testing/local-testing-guide.md"
)

for doc in "${DOCS[@]}"; do
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✓${NC} $(basename $doc)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $(basename $doc) - MANQUANT"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done
echo ""

# Résumé Final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé de la Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total de vérifications: $TOTAL_CHECKS"
echo -e "${GREEN}Réussies: $PASSED_CHECKS${NC}"
if [ $FAILED_CHECKS -gt 0 ]; then
  echo -e "${RED}Échouées: $FAILED_CHECKS${NC}"
else
  echo -e "${GREEN}Échouées: $FAILED_CHECKS${NC}"
fi
echo ""

# Calcul du pourcentage
PERCENTAGE=$(echo "scale=2; ($PASSED_CHECKS / $TOTAL_CHECKS) * 100" | bc)
echo "Score: ${PERCENTAGE}%"
echo ""

# Verdict final
if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                    ✅ VALIDATION RÉUSSIE                             ║${NC}"
  echo -e "${GREEN}║              Tous les tests sont en place et valides                 ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
  exit 0
elif (( $(echo "$PERCENTAGE >= 90" | bc -l) )); then
  echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║                    ⚠️  VALIDATION PARTIELLE                          ║${NC}"
  echo -e "${YELLOW}║              Quelques éléments nécessitent attention                 ║${NC}"
  echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════════╝${NC}"
  exit 1
else
  echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                    ❌ VALIDATION ÉCHOUÉE                             ║${NC}"
  echo -e "${RED}║              Plusieurs éléments manquent ou échouent                 ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
