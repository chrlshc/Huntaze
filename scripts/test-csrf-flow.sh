#!/bin/bash

# Script de test du flow CSRF complet
# Usage: ./scripts/test-csrf-flow.sh

echo "🔍 Test du flow CSRF complet"
echo "================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Test de génération du token
echo "1️⃣  Test de génération du token CSRF..."
TOKEN_RESPONSE=$(curl -s -c /tmp/csrf_cookies.txt http://localhost:3000/api/csrf/token)
echo "Response: $TOKEN_RESPONSE"

# Extraire le token
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Échec: Token non généré${NC}"
  echo "Response complète: $TOKEN_RESPONSE"
  exit 1
else
  echo -e "${GREEN}✅ Token généré: ${TOKEN:0:50}...${NC}"
fi

echo ""

# 2. Vérifier les cookies
echo "2️⃣  Vérification des cookies..."
if [ -f /tmp/csrf_cookies.txt ]; then
  echo "Cookies stockés:"
  cat /tmp/csrf_cookies.txt | grep csrf
  echo -e "${GREEN}✅ Cookie CSRF trouvé${NC}"
else
  echo -e "${RED}❌ Aucun cookie stocké${NC}"
fi

echo ""

# 3. Test de soumission avec le token
echo "3️⃣  Test de soumission du formulaire avec token..."
SIGNUP_RESPONSE=$(curl -s -b /tmp/csrf_cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -X POST \
  -d '{"email":"test@example.com"}' \
  http://localhost:3000/api/auth/signup/email)

echo "Response: $SIGNUP_RESPONSE"

# Vérifier si la requête a réussi
if echo "$SIGNUP_RESPONSE" | grep -q "CSRF token is required"; then
  echo -e "${RED}❌ Échec: CSRF token is required${NC}"
  exit 1
elif echo "$SIGNUP_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✅ Succès: Requête acceptée${NC}"
else
  echo -e "${YELLOW}⚠️  Réponse inattendue${NC}"
fi

echo ""

# 4. Test sans token (devrait échouer)
echo "4️⃣  Test sans token (devrait échouer)..."
NO_TOKEN_RESPONSE=$(curl -s \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"email":"test@example.com"}' \
  http://localhost:3000/api/auth/signup/email)

if echo "$NO_TOKEN_RESPONSE" | grep -q "CSRF token is required"; then
  echo -e "${GREEN}✅ Protection CSRF fonctionne (requête rejetée)${NC}"
else
  echo -e "${RED}❌ Protection CSRF ne fonctionne pas${NC}"
  echo "Response: $NO_TOKEN_RESPONSE"
fi

echo ""
echo "================================"
echo "✅ Tests terminés"

# Cleanup
rm -f /tmp/csrf_cookies.txt
