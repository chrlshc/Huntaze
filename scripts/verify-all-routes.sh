#!/bin/bash

# Script de vérification de toutes les routes de l'application
# Usage: ./scripts/verify-all-routes.sh [base-url]

BASE_URL="${1:-http://localhost:3000}"
FAILED_ROUTES=()
SUCCESS_COUNT=0
TOTAL_COUNT=0

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Vérification des routes de l'application"
echo "Base URL: $BASE_URL"
echo "----------------------------------------"

# Fonction pour tester une route
test_route() {
    local route=$1
    local description=$2
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    echo -n "Testing $route ... "
    
    # Faire la requête avec timeout de 10 secondes
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL$route" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✓ $HTTP_CODE${NC} - $description"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗ $HTTP_CODE${NC} - $description"
        FAILED_ROUTES+=("$route ($HTTP_CODE)")
    fi
}

echo ""
echo "📄 MARKETING PAGES"
echo "----------------------------------------"
test_route "/" "Homepage"
test_route "/about" "About page"
test_route "/pricing" "Pricing page"
test_route "/features" "Features overview"
test_route "/how-it-works" "How it works"
test_route "/why-huntaze" "Why Huntaze"
test_route "/use-cases" "Use cases"
test_route "/case-studies" "Case studies"
test_route "/blog" "Blog"
test_route "/careers" "Careers"
test_route "/roadmap" "Product roadmap"
test_route "/platform" "Platform overview"
test_route "/business" "Business page"
test_route "/learn" "Learn page"
test_route "/beta" "Beta landing"

echo ""
echo "🤖 AI FEATURES"
echo "----------------------------------------"
test_route "/ai/assistant" "AI Assistant"
test_route "/ai/training" "AI Training"
test_route "/ai-technology" "AI Technology"

echo ""
echo "🎯 FEATURE PAGES"
echo "----------------------------------------"
test_route "/features/analytics" "Analytics feature"
test_route "/features/automation" "Automation feature"
test_route "/features/ai-chat" "AI Chat feature"
test_route "/features/dashboard" "Dashboard feature"
test_route "/features/content-scheduler" "Content Scheduler"

echo ""
echo "🔗 PLATFORM CONNECTIONS"
echo "----------------------------------------"
test_route "/platforms/connect" "Connect platforms"
test_route "/platforms/connect/instagram" "Instagram connect"
test_route "/platforms/connect/tiktok" "TikTok connect"
test_route "/platforms/connect/reddit" "Reddit connect"
test_route "/platforms/connect/onlyfans" "OnlyFans connect"

echo ""
echo "📊 PLATFORM FEATURES"
echo "----------------------------------------"
test_route "/platforms/tiktok/upload" "TikTok upload"
test_route "/platforms/reddit/publish" "Reddit publish"
test_route "/platforms/onlyfans/analytics" "OnlyFans analytics"
test_route "/platforms/import/onlyfans" "OnlyFans import"

echo ""
echo "👤 CREATOR TOOLS"
echo "----------------------------------------"
test_route "/creator/messages" "Creator messages"

echo ""
echo "🔐 AUTH & LEGAL"
echo "----------------------------------------"
test_route "/auth" "Auth page"
test_route "/privacy" "Privacy policy"
test_route "/terms" "Terms of service"
test_route "/data-deletion" "Data deletion"

echo ""
echo "📈 STATUS & COMPARISON"
echo "----------------------------------------"
test_route "/status" "System status"
test_route "/agency-comparison" "Agency comparison"

echo ""
echo "🧪 TEST PAGES"
echo "----------------------------------------"
test_route "/test-simple" "Simple test page"
test_route "/test-root" "Root test page"

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
