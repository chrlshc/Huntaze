#!/bin/bash

# Diagnostic agressif pour trouver la cause de l'Internal Server Error

set -e

APP_ID="d2gmcfr71gawhz"
BRANCH_NAME="staging"
STAGING_URL="https://d2gmcfr71gawhz.amplifyapp.com"

echo "🔥 DIAGNOSTIC AGRESSIF - INTERNAL SERVER ERROR"
echo "=============================================="

# 1. Vérifier le statut du build actuel
echo "📊 1. STATUT DU BUILD AMPLIFY:"
aws amplify list-jobs \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --max-results 5 \
    --query 'jobSummaries[*].[jobType,status,startTime,endTime]' \
    --output table \
    --no-cli-pager

# 2. Récupérer les logs du dernier build
echo ""
echo "📋 2. LOGS DU DERNIER BUILD:"
latest_job=$(aws amplify list-jobs \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --max-results 1 \
    --query 'jobSummaries[0].jobId' \
    --output text \
    --no-cli-pager)

if [ "$latest_job" != "None" ]; then
    echo "Job ID: $latest_job"
    aws amplify get-job \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --job-id "$latest_job" \
        --query 'job.summary' \
        --output json \
        --no-cli-pager
else
    echo "❌ Aucun job trouvé"
fi

# 3. Test direct des endpoints
echo ""
echo "🌐 3. TEST DIRECT DES ENDPOINTS:"

# Test page d'accueil
echo "Testing homepage..."
curl -s -o /dev/null -w "Homepage: %{http_code} (Time: %{time_total}s)\n" "$STAGING_URL" || echo "❌ Homepage failed"

# Test API simple
echo "Testing simple API..."
curl -s -o /dev/null -w "API Test: %{http_code} (Time: %{time_total}s)\n" "$STAGING_URL/api/health/overall" || echo "❌ API failed"

# Test avec headers détaillés
echo ""
echo "🔍 4. HEADERS DE RÉPONSE DÉTAILLÉS:"
curl -I "$STAGING_URL" 2>/dev/null || echo "❌ Headers failed"

# 5. Test de connectivité base de données
echo ""
echo "🗄️ 5. TEST CONNECTIVITÉ BASE DE DONNÉES:"
echo "DATABASE_URL présente dans Amplify: $(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --query 'branch.environmentVariables.DATABASE_URL' --output text --no-cli-pager | cut -c1-50)..."

# 6. Vérifier les variables critiques
echo ""
echo "🔑 6. VARIABLES CRITIQUES:"
critical_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV" "NEXTAUTH_URL")
for var in "${critical_vars[@]}"; do
    value=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --query "branch.environmentVariables.$var" --output text --no-cli-pager)
    if [ "$value" != "None" ] && [ -n "$value" ]; then
        echo "✅ $var: Configurée"
    else
        echo "❌ $var: MANQUANTE"
    fi
done

# 7. Test avec différents endpoints
echo ""
echo "🎯 7. TEST ENDPOINTS SPÉCIFIQUES:"
endpoints=(
    "/api/health/database"
    "/api/health/auth"
    "/api/health/config"
    "/auth/login"
    "/dashboard"
)

for endpoint in "${endpoints[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL$endpoint" 2>/dev/null || echo "000")
    echo "$endpoint: $status"
done

# 8. Vérifier la configuration Amplify
echo ""
echo "⚙️ 8. CONFIGURATION AMPLIFY:"
aws amplify get-app \
    --app-id "$APP_ID" \
    --query 'app.[name,platform,repository,buildSpec]' \
    --output table \
    --no-cli-pager

echo ""
echo "🔧 9. RECOMMANDATIONS IMMÉDIATES:"
echo "- Vérifier les logs Amplify dans la console AWS"
echo "- Redémarrer le build si nécessaire"
echo "- Vérifier la configuration de la base de données"
echo "- Tester en local avec les mêmes variables d'environnement"

echo ""
echo "🚨 DIAGNOSTIC TERMINÉ - Analysez les résultats ci-dessus"