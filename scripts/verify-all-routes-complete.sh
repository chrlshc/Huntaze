#!/bin/bash

# Script complet de vérification de toutes les routes
# Usage: ./scripts/verify-all-routes-complete.sh [base-url]

BASE_URL="${1:-http://localhost:3000}"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     VÉRIFICATION COMPLÈTE DES ROUTES HUNTAZE          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Exécuter les deux scripts
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  PARTIE 1: ROUTES MARKETING (Public)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
./scripts/verify-all-routes.sh "$BASE_URL"
MARKETING_EXIT=$?

echo ""
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  PARTIE 2: ROUTES APPLICATION (Protected)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
./scripts/verify-app-routes.sh "$BASE_URL"
APP_EXIT=$?

echo ""
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              RÉSUMÉ FINAL                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

if [ $MARKETING_EXIT -eq 0 ] && [ $APP_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCÈS TOTAL: Toutes les routes fonctionnent!${NC}"
    echo ""
    echo "Routes marketing: ✓"
    echo "Routes application: ✓"
    echo ""
    echo "Le site est prêt pour la production! 🚀"
    exit 0
else
    echo -e "${RED}❌ ÉCHEC: Certaines routes ne fonctionnent pas${NC}"
    [ $MARKETING_EXIT -ne 0 ] && echo "  - Routes marketing: ÉCHEC"
    [ $APP_EXIT -ne 0 ] && echo "  - Routes application: ÉCHEC"
    exit 1
fi
