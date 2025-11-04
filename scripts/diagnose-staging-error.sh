#!/bin/bash

# Script de diagnostic pour l'erreur Internal Server Error sur staging

set -e

echo "🔍 Diagnostic de l'erreur staging..."
echo "=================================="

# 1. Vérifier les variables d'environnement
echo "📋 1. Variables d'environnement critiques:"
./scripts/verify-amplify-env-vars.sh

echo ""
echo "🔗 2. Test de connectivité base de données:"
echo "DATABASE_URL configurée: $(echo $DATABASE_URL | cut -c1-30)..."

echo ""
echo "🔐 3. Test JWT Secret:"
if [ -n "$JWT_SECRET" ]; then
    echo "✅ JWT_SECRET configuré (longueur: ${#JWT_SECRET})"
else
    echo "❌ JWT_SECRET manquant"
fi

echo ""
echo "🌐 4. Test des endpoints de santé:"
echo "Testing health endpoints..."

# Test health endpoints
curl -s -o /dev/null -w "Health Overall: %{http_code}\n" https://d2gmcfr71gawhz.amplifyapp.com/api/health/overall || echo "❌ Health endpoint failed"
curl -s -o /dev/null -w "Health Auth: %{http_code}\n" https://d2gmcfr71gawhz.amplifyapp.com/api/health/auth || echo "❌ Auth endpoint failed"
curl -s -o /dev/null -w "Health Database: %{http_code}\n" https://d2gmcfr71gawhz.amplifyapp.com/api/health/database || echo "❌ Database endpoint failed"

echo ""
echo "📊 5. Vérification du build Amplify:"
aws amplify list-jobs \
    --app-id d2gmcfr71gawhz \
    --branch-name staging \
    --max-results 3 \
    --query 'jobSummaries[*].[jobType,status,startTime,endTime]' \
    --output table \
    --no-cli-pager

echo ""
echo "🔧 6. Recommandations:"
echo "- Vérifier les logs Amplify dans la console AWS"
echo "- Tester les endpoints API individuellement"
echo "- Vérifier la configuration de la base de données"
echo "- S'assurer que toutes les variables d'environnement sont correctes"