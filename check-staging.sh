#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vérification du déploiement staging...${NC}"
echo ""

STAGING_URL="https://staging.huntaze.com"

# Test 1: Providers endpoint
echo -e "${YELLOW}1️⃣ Test API Providers...${NC}"
PROVIDERS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/auth/providers")
if [ "$PROVIDERS_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Providers endpoint: 200 OK${NC}"
else
  echo -e "${RED}❌ Providers endpoint: $PROVIDERS_STATUS${NC}"
fi

# Test 2: CSRF endpoint
echo -e "${YELLOW}2️⃣ Test CSRF Token...${NC}"
CSRF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/auth/csrf")
if [ "$CSRF_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ CSRF endpoint: 200 OK${NC}"
else
  echo -e "${RED}❌ CSRF endpoint: $CSRF_STATUS${NC}"
fi

# Test 3: Auth page
echo -e "${YELLOW}3️⃣ Test Auth Page...${NC}"
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/auth")
if [ "$AUTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Auth page: 200 OK${NC}"
else
  echo -e "${RED}❌ Auth page: $AUTH_STATUS${NC}"
fi

# Test 4: Check for 500 errors
echo -e "${YELLOW}4️⃣ Test Auth Callback (devrait être 302 ou 401, PAS 500)...${NC}"
CALLBACK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$STAGING_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}')

if [ "$CALLBACK_STATUS" = "500" ]; then
  echo -e "${RED}❌ Auth callback: 500 ERROR (PROBLÈME!)${NC}"
elif [ "$CALLBACK_STATUS" = "302" ] || [ "$CALLBACK_STATUS" = "401" ] || [ "$CALLBACK_STATUS" = "400" ]; then
  echo -e "${GREEN}✅ Auth callback: $CALLBACK_STATUS (Pas de 500!)${NC}"
else
  echo -e "${YELLOW}⚠️  Auth callback: $CALLBACK_STATUS (Inattendu mais pas 500)${NC}"
fi

echo ""
echo -e "${BLUE}📊 Résumé:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$PROVIDERS_STATUS" = "200" ] && [ "$CSRF_STATUS" = "200" ] && [ "$AUTH_STATUS" = "200" ] && [ "$CALLBACK_STATUS" != "500" ]; then
  echo -e "${GREEN}✅ TOUS LES TESTS PASSÉS!${NC}"
  echo -e "${GREEN}✅ L'authentification fonctionne sur staging${NC}"
  echo ""
  echo -e "${BLUE}🎉 Prochaine étape:${NC}"
  echo "   Teste la connexion réelle sur: $STAGING_URL/auth"
else
  echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo ""
  echo -e "${YELLOW}🔧 Actions recommandées:${NC}"
  echo "   1. Vérifier les logs CloudWatch"
  echo "   2. Vérifier NEXTAUTH_URL dans Amplify"
  echo "   3. Vérifier que le build est terminé"
  echo "   4. Consulter DEPLOYMENT_STATUS.md"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   AWS Console → CloudWatch → /aws/amplify/huntaze-staging"
echo ""
echo -e "${BLUE}🌐 URLs:${NC}"
echo "   Auth page: $STAGING_URL/auth"
echo "   Amplify Console: https://console.aws.amazon.com/amplify/"
