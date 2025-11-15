#!/bin/bash

echo "🔍 Vérification avant déploiement..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if files exist
echo "📁 Vérification des fichiers..."
files=(
  "auth.ts"
  "app/api/auth/[...nextauth]/route.ts"
  "app/api/auth/register/route.ts"
  "next.config.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file (MANQUANT)"
  fi
done

echo ""
echo "📦 Vérification de package.json..."
if grep -q '"next-auth": ".*5\.0\.0-beta' package.json; then
  echo -e "${GREEN}✅${NC} next-auth v5 installé"
else
  echo -e "${RED}❌${NC} next-auth v5 NON installé"
fi

echo ""
echo "🔐 Vérification des variables d'environnement..."
env_vars=(
  "NEXTAUTH_SECRET"
  "NEXTAUTH_URL"
  "DATABASE_URL"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
)

for var in "${env_vars[@]}"; do
  if grep -q "^$var=" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $var"
  else
    echo -e "${RED}❌${NC} $var (MANQUANT dans .env.local)"
  fi
done

echo ""
echo "📝 Documentation créée..."
docs=(
  "AUTH_V5_MIGRATION_COMPLETE.md"
  "AUTH_STAGING_DEPLOYMENT_READY.md"
  "AUTH_FIX_SUMMARY.md"
  "AUTH_FIX_VISUAL_SUMMARY.md"
  "COMMIT_MESSAGE.txt"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo -e "${GREEN}✅${NC} $doc"
  else
    echo -e "${YELLOW}⚠️${NC} $doc (optionnel)"
  fi
done

echo ""
echo "🎯 Prochaines étapes:"
echo "1. git add ."
echo "2. git commit -F COMMIT_MESSAGE.txt"
echo "3. git push origin main"
echo "4. Vérifier le build sur AWS Amplify"
echo "5. Tester sur staging: https://staging.huntaze.com/auth"
echo ""
echo "✅ Tout est prêt pour le déploiement!"
