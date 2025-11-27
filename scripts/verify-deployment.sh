#!/bin/bash

# Script de Vérification Post-Déploiement
# Vérifie que le déploiement s'est bien passé et que l'application fonctionne

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URL à tester (par défaut staging)
URL="${1:-https://staging.huntaze.com}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Vérification Post-Déploiement                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "URL testée: $URL"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$endpoint" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK ($status)${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL (got $status, expected $expected_status)${NC}"
        return 1
    fi
}

# Compteur de tests
TOTAL=0
PASSED=0
FAILED=0

# 1. Test de disponibilité
echo -e "${BLUE}1. Tests de Disponibilité${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

((TOTAL++))
if test_endpoint "/" "200" "Page d'accueil"; then
    ((PASSED++))
else
    ((FAILED++))
fi

((TOTAL++))
if test_endpoint "/api/health" "200" "Health check API"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""

# 2. Tests des endpoints critiques
echo -e "${BLUE}2. Tests des Endpoints Critiques${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

((TOTAL++))
if test_endpoint "/api/auth/signin" "200" "Page de connexion"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""

# 3. Tests de performance
echo -e "${BLUE}3. Tests de Performance${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "Temps de réponse page d'accueil... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$URL/" || echo "0")
response_time_ms=$(echo "$response_time * 1000" | bc)

if (( $(echo "$response_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}✓ OK (${response_time_ms}ms)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SLOW (${response_time_ms}ms)${NC}"
    ((FAILED++))
fi
((TOTAL++))

echo ""

# 4. Tests des headers de sécurité
echo -e "${BLUE}4. Tests des Headers de Sécurité${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

headers=$(curl -s -I "$URL/" || echo "")

check_header() {
    local header=$1
    local description=$2
    
    echo -n "Checking $description... "
    ((TOTAL++))
    
    if echo "$headers" | grep -qi "$header"; then
        echo -e "${GREEN}✓ Present${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ Missing${NC}"
        ((FAILED++))
        return 1
    fi
}

check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"
check_header "strict-transport-security" "HSTS"

echo ""

# 5. Tests SSL/TLS
echo -e "${BLUE}5. Tests SSL/TLS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $URL == https://* ]]; then
    echo -n "Vérification du certificat SSL... "
    ((TOTAL++))
    
    if curl -s --head "$URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Valid${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Invalid${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Skipped (HTTP URL)${NC}"
fi

echo ""

# 6. Résumé
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Résumé des Tests                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Total: $TOTAL tests"
echo -e "${GREEN}Passés: $PASSED${NC}"
echo -e "${RED}Échoués: $FAILED${NC}"
echo ""

# Calcul du pourcentage
if [ $TOTAL -gt 0 ]; then
    percentage=$((PASSED * 100 / TOTAL))
    echo "Taux de réussite: $percentage%"
    echo ""
fi

# Verdict final
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ Tous les tests sont passés!                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $FAILED -le 2 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ Quelques tests ont échoué (non-critique)              ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ Plusieurs tests ont échoué - Investigation requise    ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
