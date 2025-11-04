#!/bin/bash

# Script pour pousser les variables OAuth vers AWS Amplify Staging
# Utilise les commandes AWS CLI spécifiques à Amplify

set -e

APP_ID="d2gmcfr71gawhz"
BRANCH_NAME="staging"

echo "🚀 Déploiement des variables OAuth sur AWS Amplify..."
echo "📱 App ID: $APP_ID"
echo "🌿 Branch: $BRANCH_NAME"

# Récupérer les variables existantes une seule fois
echo "📋 Récupération des variables existantes..."
existing_vars=$(aws amplify get-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --query 'branch.environmentVariables' \
    --output json \
    --no-cli-pager 2>/dev/null || echo '{}')

echo "Variables existantes récupérées: $(echo "$existing_vars" | jq 'keys | length') variables"

# Fonction pour ajouter une variable d'environnement au JSON
add_env_var() {
    local key=$1
    local value=$2
    echo "➕ Préparation de $key..."
    
    # Ajouter la nouvelle variable au JSON existant
    existing_vars=$(echo "$existing_vars" | jq --arg key "$key" --arg value "$value" '. + {($key): $value}')
}

# JWT Secret (nouveau - sécurisé)
echo "🔐 Configuration JWT Secret..."
add_env_var "JWT_SECRET" "0KqwgVKVlfmzZi+wPA+pmECDjx/cfWCEmCdKHHvZQib0L8KaV9bni0BJ7eBzayHBt9OURBjf8Dcybiax4YIdMA=="

# Variables OAuth TikTok
echo "🎵 Configuration TikTok OAuth..."
add_env_var "TIKTOK_CLIENT_KEY" "sbawig5ujktghe109j"
add_env_var "TIKTOK_CLIENT_SECRET" "uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK"

# Variables OAuth Instagram/Facebook
echo "📸 Configuration Instagram/Facebook OAuth..."
add_env_var "FACEBOOK_APP_ID" "618116867842215"
add_env_var "FACEBOOK_APP_SECRET" "89b366879681d15df0ebc6dc14823ce5"
add_env_var "NEXT_PUBLIC_INSTAGRAM_APP_ID" "618116867842215"
add_env_var "INSTAGRAM_APP_SECRET" "89b366879681d15df0ebc6dc14823ce5"

# Variables OAuth Reddit
echo "🔴 Configuration Reddit OAuth..."
add_env_var "REDDIT_CLIENT_ID" "P1FcvXXzGKNXUT38b06uPA"
add_env_var "REDDIT_CLIENT_SECRET" "UgAfLbC1p1zusbMfeIXim7VqvZFUBA"
add_env_var "REDDIT_USER_AGENT" "Huntaze:v1.0.0"

# Variables OAuth Threads
echo "🧵 Configuration Threads OAuth..."
add_env_var "NEXT_PUBLIC_THREADS_APP_ID" "1319037156503287"
add_env_var "THREADS_APP_SECRET" "233d011031dc18cf762f20daab2b50d8"

# Variables OAuth Google
echo "🔵 Configuration Google OAuth..."
add_env_var "GOOGLE_CLIENT_ID" "your-google-client-id"
add_env_var "GOOGLE_CLIENT_SECRET" "your-google-client-secret"
add_env_var "NEXT_PUBLIC_GOOGLE_CLIENT_ID" "your-google-client-id"

# Variables de support OAuth
echo "🔧 Configuration variables de support..."
add_env_var "REDIS_TLS" "true"
add_env_var "DATA_ENCRYPTION_KEY" "VGhpcyBpcyBhIDMyIGJ5dGUga2V5IGZvciBBRVMtMjU2IQ=="
add_env_var "ENCRYPTION_KEY" "a/POc95u0DOJUxAYfErYY/HfuM+JUlxRJkEFO8wSSCw="
add_env_var "SESSION_SECRET" "v8G/pTcTOKzYkGB5gsSWzyq70cUsUgisPCVPhEiVw7A="

# Mettre à jour toutes les variables en une seule fois
echo ""
echo "🔄 Mise à jour de toutes les variables sur AWS Amplify..."
aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --environment-variables "$existing_vars" \
    --no-cli-pager

echo ""
echo "✅ Toutes les variables OAuth ont été configurées!"
echo ""
echo "🔄 Déclenchement du redéploiement..."

# Déclencher un nouveau déploiement
echo "Création d'un nouveau déploiement..."
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
echo "🎉 Déploiement lancé avec succès!"
echo "📊 Vous pouvez suivre le progrès dans la console AWS Amplify"
echo "🔗 https://console.aws.amazon.com/amplify/home#/$APP_ID"