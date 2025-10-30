#!/bin/bash

# Script pour lister les déploiements Azure OpenAI disponibles

echo "🔍 Recherche des déploiements Azure OpenAI..."
echo ""

RESOURCE_NAME="huntaze-ai-eus2-29796"
RESOURCE_GROUP="huntaze-ai-rg"

# Vérifier si Azure CLI est installé
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI n'est pas installé"
    echo ""
    echo "Pour installer Azure CLI :"
    echo "  macOS: brew install azure-cli"
    echo "  Windows: https://aka.ms/installazurecliwindows"
    echo "  Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    echo ""
    echo "📖 Consultez docs/FIND_AZURE_DEPLOYMENT_NAME.md pour trouver le nom via Azure Portal"
    exit 1
fi

# Vérifier si l'utilisateur est connecté
if ! az account show &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Azure"
    echo ""
    echo "Connectez-vous avec : az login"
    exit 1
fi

echo "✅ Azure CLI détecté et connecté"
echo ""
echo "📋 Déploiements disponibles dans la ressource '$RESOURCE_NAME' :"
echo ""

# Lister les déploiements
az cognitiveservices account deployment list \
  --name "$RESOURCE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].{Nom:name, Modele:properties.model.name, Version:properties.model.version, Status:properties.provisioningState}" \
  --output table

echo ""
echo "💡 Utilisez le nom exact de la colonne 'Nom' dans votre fichier .env"
echo "   AZURE_OPENAI_DEPLOYMENT=<nom_du_deploiement>"
