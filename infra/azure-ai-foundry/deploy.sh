#!/bin/bash
# Azure AI Foundry Deployment Script
# Deploys DeepSeek-R1, Phi-4-mini, Llama-3.3-70B, Mistral-Large-2411

set -e

RESOURCE_GROUP="huntaze-ai-rg"
LOCATION="eastus2"
HUB_NAME="huntaze-ai-hub"
PROJECT_NAME="huntaze-ai-project"

echo "🚀 Azure AI Foundry Deployment"
echo "================================"

# Check if logged in
if ! az account show &>/dev/null; then
    echo "❌ Not logged in. Run: az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"

# Create resource group if not exists
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo "📦 Creating resource group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location $LOCATION
fi

# Create AI Hub if not exists
if ! az ml workspace show --name $HUB_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "🏠 Creating AI Hub: $HUB_NAME"
    az ml workspace create --name $HUB_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind hub
fi

# Create AI Project if not exists
if ! az ml workspace show --name $PROJECT_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "📁 Creating AI Project: $PROJECT_NAME"
    HUB_ID=$(az ml workspace show --name $HUB_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)
    az ml workspace create --name $PROJECT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind project --hub-id $HUB_ID
fi

echo ""
echo "📡 Deploying Serverless Endpoints..."
echo ""

# Deploy DeepSeek-R1
echo "🔹 DeepSeek-R1..."
az ml serverless-endpoint create --file deepseek-r1.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null || echo "   (already exists or error)"

# Deploy Phi-4-mini
echo "🔹 Phi-4-mini..."
az ml serverless-endpoint create --file phi-4-mini.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null || echo "   (already exists or error)"

# Deploy Llama-3.3-70B (requires Marketplace subscription)
echo "🔹 Llama-3.3-70B..."
az ml serverless-endpoint create --file llama-3.3-70b.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null || echo "   ⚠️ Requires Marketplace subscription"

# Deploy Mistral-Large
echo "🔹 Mistral-Large-2411..."
az ml serverless-endpoint create --file mistral-large.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null || echo "   ⚠️ Requires Marketplace subscription"

echo ""
echo "📋 Deployed Endpoints:"
az ml serverless-endpoint list --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME --output table

echo ""
echo "🔑 Getting API Keys..."
echo ""

for endpoint in deepseek-r1-endpoint phi-4-mini-endpoint; do
    echo "--- $endpoint ---"
    az ml serverless-endpoint get-credentials --name $endpoint --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME --output json 2>/dev/null | jq -r '.primaryKey' || echo "N/A"
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Add these to your .env.local:"
echo "   AZURE_DEEPSEEK_ENDPOINT=https://deepseek-r1-endpoint.eastus2.models.ai.azure.com"
echo "   AZURE_PHI4_ENDPOINT=https://phi-4-mini-endpoint.eastus2.models.ai.azure.com"
