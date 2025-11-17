#!/bin/bash
# Test du flow complet d'inscription et login

echo "🧪 Test du flow d'inscription et login automatique"
echo "=================================================="
echo ""

# Générer un email unique
TIMESTAMP=$(date +%s)
EMAIL="test-flow-${TIMESTAMP}@example.com"
PASSWORD="TestPass123!"

echo "📧 Email de test: $EMAIL"
echo ""

# Étape 1: Inscription
echo "1️⃣  Inscription..."
REGISTER_RESPONSE=$(curl -s -X POST https://staging.huntaze.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test User\"}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "201" ]; then
  echo "   ✅ Inscription réussie"
  echo "   Response: $RESPONSE_BODY"
else
  echo "   ❌ Inscription échouée (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
  exit 1
fi

echo ""

# Étape 2: Login avec NextAuth
echo "2️⃣  Test de login avec NextAuth..."
LOGIN_RESPONSE=$(curl -s -X POST https://staging.huntaze.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"redirect\":\"false\"}" \
  -w "\n%{http_code}" \
  -c /tmp/cookies.txt)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
  echo "   ✅ Login réussi (HTTP $HTTP_CODE)"
  if [ -f /tmp/cookies.txt ]; then
    echo "   🍪 Cookies reçus:"
    cat /tmp/cookies.txt | grep -v "^#" | awk '{print "      - " $6 ": " $7}'
  fi
else
  echo "   ❌ Login échoué (HTTP $HTTP_CODE)"
  echo "   Response: $RESPONSE_BODY"
  exit 1
fi

echo ""
echo "✅ Test complet réussi!"
echo ""
echo "📊 Résumé:"
echo "   - Email: $EMAIL"
echo "   - Inscription: ✅"
echo "   - Login: ✅"
