#!/bin/bash

# Script pour vérifier les variables d'environnement sur AWS Amplify

set -e

APP_ID="d2gmcfr71gawhz"
BRANCH_NAME="staging"

echo "🔍 Vérification des variables d'environnement AWS Amplify..."
echo "📱 App ID: $APP_ID"
echo "🌿 Branch: $BRANCH_NAME"
echo ""

# Récupérer les variables d'environnement
echo "📋 Variables d'environnement actuelles:"
aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query 'branch.environmentVariables' \
    --output table \
    --no-cli-pager

echo ""
echo "🔑 Variables OAuth critiques à vérifier:"

# Liste des variables OAuth critiques
OAUTH_VARS=(
    "JWT_SECRET"
    "TIKTOK_CLIENT_KEY"
    "TIKTOK_CLIENT_SECRET"
    "FACEBOOK_APP_ID"
    "FACEBOOK_APP_SECRET"
    "INSTAGRAM_APP_SECRET"
    "REDDIT_CLIENT_ID"
    "REDDIT_CLIENT_SECRET"
    "THREADS_APP_SECRET"
    "GOOGLE_CLIENT_SECRET"
    "DATA_ENCRYPTION_KEY"
    "ENCRYPTION_KEY"
    "SESSION_SECRET"
)

# Récupérer toutes les variables
ALL_VARS=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query 'branch.environmentVariables' \
    --output json \
    --no-cli-pager)

# Vérifier chaque variable OAuth
missing_vars=()
for var in "${OAUTH_VARS[@]}"; do
    if echo "$ALL_VARS" | jq -e "has(\"$var\")" > /dev/null; then
        echo "✅ $var: Configurée"
    else
        echo "❌ $var: MANQUANTE"
        missing_vars+=("$var")
    fi
done

echo ""
if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "🎉 Toutes les variables OAuth sont configurées!"
    echo ""
    echo "🚀 Statut du dernier déploiement:"
    aws amplify list-jobs \
        --app-id "$APP_ID" \
        --branch-name "$BRANCH_NAME" \
        --max-results 1 \
        --query 'jobSummaries[0].[jobType,status,startTime]' \
        --output table \
        --no-cli-pager
else
    echo "⚠️  Variables manquantes: ${missing_vars[*]}"
    echo "💡 Exécutez ./scripts/push-oauth-to-amplify.sh pour les ajouter"
fi