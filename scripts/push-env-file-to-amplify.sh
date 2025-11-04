#!/bin/bash

# Script pour pousser un fichier .env vers AWS Amplify
# Lit STAGING_ENV_VARS_ONLY.txt et pousse chaque variable

set -e

APP_ID="d2gmcfr71gawhz"
BRANCH_NAME="staging"
ENV_FILE="STAGING_ENV_VARS_ONLY.txt"

echo "🚀 Déploiement des variables depuis $ENV_FILE vers AWS Amplify..."
echo "📱 App ID: $APP_ID"
echo "🌿 Branch: $BRANCH_NAME"

# Vérifier que le fichier existe
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Erreur: Le fichier $ENV_FILE n'existe pas"
    exit 1
fi

# Fonction pour ajouter une variable d'environnement
add_env_var() {
    local key=$1
    local value=$2
    echo "➕ Ajout de $key..."
    
    aws amplify put-backend-environment \
        --app-id "$APP_ID" \
        --environment-name "$BRANCH_NAME" \
        --environment-variables "$key=$value" \
        --no-cli-pager
}

# Lire le fichier .env et traiter chaque ligne
while IFS='=' read -r key value; do
    # Ignorer les lignes vides et les commentaires
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    
    # Enlever 'export ' si présent
    key="${key#export }"
    
    # Enlever les retours chariot
    value="${value%$'\r'}"
    
    # Ignorer les lignes sans valeur
    [[ -z "$value" ]] && continue
    
    # Ajouter la variable
    add_env_var "$key" "$value"
    
    # Petite pause pour éviter le rate limiting
    sleep 0.5
    
done < "$ENV_FILE"

echo ""
echo "✅ Toutes les variables ont été configurées!"
echo ""
echo "🔄 Déclenchement du redéploiement..."

# Déclencher un nouveau build
aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --job-type RELEASE \
    --no-cli-pager

echo ""
echo "🎉 Déploiement lancé avec succès!"
echo "📊 Vous pouvez suivre le progrès dans la console AWS Amplify"
echo "🔗 https://console.aws.amazon.com/amplify/home#/$APP_ID"