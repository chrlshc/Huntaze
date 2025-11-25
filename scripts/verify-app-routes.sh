#!/bin/bash

# Script de vérification des routes de l'application (app)
# Ces routes nécessitent généralement une authentification
# Usage: ./scripts/verify-app-routes.sh [base-url]

BASE_URL="${1:-http://localhost:3000}"
FAILED_ROUTES=()
SUCCESS_COUNT=0
TOTAL_COUNT=0

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Vérification des routes de l'application (app)"
echo "Base URL: $BASE_URL"
echo "Note: Ces routes peuvent rediriger vers /auth si non authentifié (302/301 = OK)"
echo "----------------------------------------"

# Fonction pour tester une route
test_route() {
    local route=$1
    local description=$2
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    echo -n "Testing $route ... "
    
    # Faire la requête avec timeout de 10 secondes
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$route" 2>/dev/null)
    
    # 200 = OK, 301/302 = Redirect (probablement vers auth), 401 = Unauthorized (OK aussi)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✓ $HTTP_CODE${NC} - $description"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗ $HTTP_CODE${NC} - $description"
        FAILED_ROUTES+=("$route ($HTTP_CODE)")
    fi
}

echo ""
echo "📊 ANALYTICS & REVENUE"
echo "----------------------------------------"
test_route "/analytics" "Analytics dashboard"
test_route "/analytics/payouts" "Payouts analytics"
test_route "/analytics/pricing" "Pricing analytics"
test_route "/analytics/churn" "Churn analytics"
test_route "/analytics/forecast" "Revenue forecast"
test_route "/analytics/upsells" "Upsells analytics"
test_route "/revenue" "Revenue page"

echo ""
echo "🎯 PERFORMANCE & DESIGN"
echo "----------------------------------------"
test_route "/performance" "Performance page"
test_route "/design-system" "Design system"
test_route "/flows" "User flows"

echo ""
echo "💳 BILLING"
echo "----------------------------------------"
test_route "/billing" "Billing page"
test_route "/billing/packs" "Message packs"

echo ""
echo "🚀 ONBOARDING"
echo "----------------------------------------"
test_route "/onboarding" "Onboarding main"
test_route "/onboarding/huntaze" "Huntaze onboarding"
test_route "/onboarding/setup" "Setup onboarding"
test_route "/onboarding/wizard" "Onboarding wizard"
test_route "/onboarding/dashboard" "Onboarding dashboard"
test_route "/onboarding/optimize" "Optimize onboarding"
test_route "/skip-onboarding" "Skip onboarding"

echo ""
echo "👥 FANS & CAMPAIGNS"
echo "----------------------------------------"
test_route "/fans" "Fans page"
test_route "/campaigns" "Campaigns list"
test_route "/campaigns/new" "New campaign"

echo ""
echo "📱 MARKETING"
echo "----------------------------------------"
test_route "/marketing" "Marketing dashboard"
test_route "/marketing/social" "Social media"
test_route "/marketing/calendar" "Marketing calendar"
test_route "/marketing/campaigns/new" "New marketing campaign"

echo ""
echo "🤖 AUTOMATIONS"
echo "----------------------------------------"
test_route "/automations" "Automations page"

echo ""
echo "👤 ACCOUNT"
echo "----------------------------------------"
test_route "/account" "Account settings"

echo ""
echo "========================================"
echo "📊 RÉSULTATS"
echo "========================================"
echo -e "Total routes testées: $TOTAL_COUNT"
echo -e "${GREEN}Succès: $SUCCESS_COUNT${NC}"
echo -e "${RED}Échecs: ${#FAILED_ROUTES[@]}${NC}"

if [ ${#FAILED_ROUTES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Routes en échec:${NC}"
    for route in "${FAILED_ROUTES[@]}"; do
        echo -e "  ${RED}✗${NC} $route"
    done
    exit 1
else
    echo ""
    echo -e "${GREEN}✅ Toutes les routes fonctionnent correctement!${NC}"
    exit 0
fi
