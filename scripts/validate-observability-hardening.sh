#!/bin/bash

# Observability Hardening Validation Script
# Vérifie que tous les durcissements sont en place

set -e

echo "🔍 Validation Observability Hardening"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Test 1: No withMonitoring usage
echo "📋 Test 1: Vérification withMonitoring supprimé..."
COUNT=$(grep -r "withMonitoring" app/api/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ PASS${NC} - Aucun withMonitoring trouvé"
else
  echo -e "${RED}❌ FAIL${NC} - $COUNT occurrences de withMonitoring trouvées"
  grep -r "withMonitoring" app/api/ 2>/dev/null || true
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: No top-level prom-client imports
echo "📋 Test 2: Vérification imports top-level prom-client..."
COUNT=$(grep -r "import.*prom-client" app/api/ 2>/dev/null | grep -v "await import" | wc -l | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
  echo -e "${GREEN}✅ PASS${NC} - Aucun import top-level de prom-client"
else
  echo -e "${RED}❌ FAIL${NC} - $COUNT imports top-level trouvés"
  grep -r "import.*prom-client" app/api/ 2>/dev/null | grep -v "await import" || true
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Metrics registry exists
echo "📋 Test 3: Vérification metrics-registry.ts existe..."
if [ -f "lib/metrics-registry.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - lib/metrics-registry.ts existe"
else
  echo -e "${RED}❌ FAIL${NC} - lib/metrics-registry.ts manquant"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Metrics route has runtime config
echo "📋 Test 4: Vérification config runtime sur /api/metrics..."
if grep -q "export const runtime = 'nodejs'" app/api/metrics/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - runtime='nodejs' configuré"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - runtime='nodejs' manquant"
  WARNINGS=$((WARNINGS + 1))
fi

if grep -q "export const dynamic = 'force-dynamic'" app/api/metrics/route.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - dynamic='force-dynamic' configuré"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - dynamic='force-dynamic' manquant"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 5: server-only protection
echo "📋 Test 5: Vérification protection server-only..."
if grep -q "import 'server-only'" lib/metrics-registry.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - server-only importé dans metrics-registry"
else
  echo -e "${YELLOW}⚠️  WARN${NC} - server-only manquant dans metrics-registry"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 6: ESLint hardening rules exist
echo "📋 Test 6: Vérification règles ESLint hardening..."
if grep -q "no-restricted-imports" .eslintrc.json 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC} - Règle no-restricted-imports configurée"
  
  if grep -q "prom-client" .eslintrc.json 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - Restriction prom-client configurée"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Restriction prom-client manquante"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  if grep -q "@/lib/monitoring" .eslintrc.json 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} - Restriction @/lib/monitoring configurée"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Restriction @/lib/monitoring manquante"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  WARN${NC} - Règle no-restricted-imports manquante"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 7: Documentation exists
echo "📋 Test 7: Vérification documentation..."
DOCS=(
  ".kiro/specs/observability-wrapper-build-fix/requirements.md"
  ".kiro/specs/observability-wrapper-build-fix/design.md"
  ".kiro/specs/observability-wrapper-build-fix/tasks.md"
  ".kiro/specs/observability-wrapper-build-fix/TEAM_BRIEFING.md"
  ".kiro/specs/observability-wrapper-build-fix/HARDENING.md"
  ".kiro/specs/observability-wrapper-build-fix/IMPLEMENTATION_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✅${NC} $(basename $doc)"
  else
    echo -e "${RED}❌${NC} $(basename $doc) manquant"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# Test 8: Build test (optional, can be slow)
if [ "${SKIP_BUILD:-0}" -eq 0 ]; then
  echo "📋 Test 8: Test de build (peut prendre quelques minutes)..."
  if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - Build réussit"
  else
    echo -e "${RED}❌ FAIL${NC} - Build échoue"
    ERRORS=$((ERRORS + 1))
  fi
  echo ""
else
  echo "📋 Test 8: Test de build SKIPPED (SKIP_BUILD=1)"
  echo ""
fi

# Summary
echo "======================================"
echo "📊 Résumé"
echo "======================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests passent!${NC}"
  echo ""
  echo "✅ Hardening complet et validé"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Tests passent avec $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Les avertissements sont des améliorations recommandées mais non bloquantes."
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
  echo ""
  echo "Veuillez corriger les erreurs avant de continuer."
  exit 1
fi
