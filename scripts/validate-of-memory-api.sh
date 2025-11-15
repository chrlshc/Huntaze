#!/bin/bash

# OnlyFans AI Memory Service - API Validation Script
# Vérifie que toutes les optimisations sont en place

set -e

echo "🔍 Validation OnlyFans AI Memory Service API"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Test 1: Service file exists with optimizations
echo "📋 Test 1: Vérification fichier service..."
if [ -f "lib/of-memory/services/user-memory-service.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Fichier service existe"
  
  # Check for retry logic
  if grep -q "withRetry" lib/of-memory/services/user-memory-service.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Retry logic implémentée"
  else
    echo -e "${RED}❌ FAIL${NC} - Retry logic manquante"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check for timeout protection
  if grep -q "withTimeout" lib/of-memory/services/user-memory-service.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Timeout protection implémentée"
  else
    echo -e "${RED}❌ FAIL${NC} - Timeout protection manquante"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check for correlation IDs
  if grep -q "correlationId" lib/of-memory/services/user-memory-service.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Correlation IDs implémentés"
  else
    echo -e "${RED}❌ FAIL${NC} - Correlation IDs manquants"
    ERRORS=$((ERRORS + 1))
  fi
  
  # Check for custom error types
  if grep -q "MemoryServiceException" lib/of-memory/services/user-memory-service.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Custom error types implémentés"
  else
    echo -e "${RED}❌ FAIL${NC} - Custom error types manquants"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${RED}❌ FAIL${NC} - Fichier service manquant"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: API types file exists
echo "📋 Test 2: Vérification types API..."
if [ -f "lib/of-memory/api-types.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Fichier types API existe"
  
  # Check for Zod schemas
  if grep -q "z.object" lib/of-memory/api-types.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Schémas Zod implémentés"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Schémas Zod manquants"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ FAIL${NC} - Fichier types API manquant"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Documentation exists
echo "📋 Test 3: Vérification documentation..."
if [ -f "docs/api/of-memory-service.md" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Documentation API existe"
else
  echo -e "${RED}❌ FAIL${NC} - Documentation API manquante"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Integration tests exist
echo "📋 Test 4: Vérification tests d'intégration..."
if [ -f "tests/integration/api/of-memory.test.ts" ]; then
  echo -e "${GREEN}✅ PASS${NC} - Tests d'intégration existent"
  
  # Check for key test scenarios
  if grep -q "Memory Context Retrieval" tests/integration/api/of-memory.test.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Tests de récupération de contexte"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Tests de récupération manquants"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  if grep -q "Error Handling" tests/integration/api/of-memory.test.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Tests de gestion d'erreurs"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Tests d'erreurs manquants"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  if grep -q "Performance" tests/integration/api/of-memory.test.ts; then
    echo -e "${GREEN}✅ PASS${NC} - Tests de performance"
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - Tests de performance manquants"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ FAIL${NC} - Tests d'intégration manquants"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 5: Summary documents exist
echo "📋 Test 5: Vérification documents de résumé..."
DOCS=(
  "OF_MEMORY_API_OPTIMIZATION_COMPLETE.md"
  "OF_MEMORY_API_OPTIMIZATION_COMMIT.txt"
  "OF_MEMORY_API_QUICK_START.md"
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

# Test 6: TypeScript compilation
echo "📋 Test 6: Vérification compilation TypeScript..."
if command -v tsc &> /dev/null; then
  if tsc --noEmit lib/of-memory/services/user-memory-service.ts 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ FAIL${NC} - Erreurs de compilation TypeScript"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✅ PASS${NC} - Compilation TypeScript OK"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} - TypeScript compiler non disponible"
fi
echo ""

# Summary
echo "=============================================="
echo "📊 Résumé"
echo "=============================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}🎉 Tous les tests passent!${NC}"
  echo ""
  echo "✅ Service optimisé et prêt pour production"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Review du code par l'équipe"
  echo "2. Tests en environnement staging"
  echo "3. Validation des métriques de performance"
  echo "4. Déploiement en production"
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
