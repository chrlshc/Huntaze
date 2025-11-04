#!/bin/bash

# Script pour ajouter les variables d'environnement manquantes critiques

set -e

APP_ID="d2gmcfr71gawhz"
BRANCH_NAME="staging"

echo "🔧 Ajout des variables d'environnement critiques manquantes..."

# Récupérer les variables existantes
echo "📋 Récupération des variables existantes..."
existing_vars=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query 'branch.environmentVariables' \
    --output json \
    --no-cli-pager)

echo "Variables existantes: $(echo "$existing_vars" | jq 'keys | length') variables"

# Ajouter les variables manquantes critiques
echo "➕ Ajout de DATABASE_URL..."
existing_vars=$(echo "$existing_vars" | jq '. + {"DATABASE_URL": "postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public&sslmode=require"}')

echo "➕ Ajout de NODE_ENV..."
existing_vars=$(echo "$existing_vars" | jq '. + {"NODE_ENV": "production"}')

echo "➕ Ajout de NEXT_PUBLIC_APP_URL..."
existing_vars=$(echo "$existing_vars" | jq '. + {"NEXT_PUBLIC_APP_URL": "https://d2gmcfr71gawhz.amplifyapp.com"}')

echo "➕ Ajout de NEXTAUTH_URL..."
existing_vars=$(echo "$existing_vars" | jq '. + {"NEXTAUTH_URL": "https://d2gmcfr71gawhz.amplifyapp.com"}')

echo "➕ Ajout de TOKEN_ENCRYPTION_KEY..."
existing_vars=$(echo "$existing_vars" | jq '. + {"TOKEN_ENCRYPTION_KEY": "LJz2qNC7qwUCIWO7ow8krpoOtJP1tDXLg8bIav8LnLY="}')

echo "➕ Ajout des variables Azure OpenAI..."
existing_vars=$(echo "$existing_vars" | jq '. + {
    "AZURE_OPENAI_API_KEY": "9YrdPSyu9StY896EE9Csqx6UBPhnYMpiTLgg6KK5aIqaLrGz5558JQQJ99BJACHYHv6XJ3w3AAABACOGfXiX",
    "AZURE_OPENAI_ENDPOINT": "https://huntaze-ai-eus2-29796.openai.azure.com",
    "AZURE_OPENAI_API_VERSION": "2024-05-01-preview",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4o"
}')

echo "➕ Ajout des variables Redis..."
existing_vars=$(echo "$existing_vars" | jq '. + {
    "REDIS_URL": "redis://huntaze-redis-production.c2ryoow8c5m4.cache.amazonaws.com:6379",
    "REDIS_ENDPOINT": "huntaze-redis-production.c2ryoow8c5m4.cache.amazonaws.com:6379"
}')

# Mettre à jour toutes les variables
echo ""
echo "🔄 Mise à jour de toutes les variables sur AWS Amplify..."
aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --environment-variables "$existing_vars" \
    --no-cli-pager

echo ""
echo "✅ Variables critiques ajoutées avec succès!"
echo ""
echo "🔄 Déclenchement d'un nouveau build..."

# Créer un nouveau déploiement
deployment_id=$(aws amplify create-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query 'deploymentId' \
    --output text \
    --no-cli-pager)

echo "Démarrage du déploiement $deployment_id..."
aws amplify start-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --deployment-id "$deployment_id" \
    --no-cli-pager

echo ""
echo "🎉 Déploiement lancé avec les variables critiques!"
echo "📊 Suivez le progrès dans la console AWS Amplify"