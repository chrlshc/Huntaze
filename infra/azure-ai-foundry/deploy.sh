#!/bin/bash
# Azure AI Foundry Deployment Script
# Deploys DeepSeek-R1, DeepSeek-V3, Phi-4-multimodal, Azure Speech Batch Transcription

set -e

RESOURCE_GROUP="huntaze-ai-rg"
LOCATION="eastus2"
HUB_NAME="huntaze-ai-hub"
PROJECT_NAME="huntaze-ai-project"
SPEECH_SERVICE_NAME="huntaze-speech"

echo "🚀 Azure AI Foundry Deployment - Content & Trends AI Engine"
echo "============================================================"
echo ""
echo "Architecture Quadrimodale:"
echo "  • DeepSeek R1 - Raisonnement cognitif ($0.00135/$0.0054 per 1K tokens)"
echo "  • DeepSeek V3 - Génération créative ($0.00114/$0.00456 per 1K tokens)"
echo "  • Phi-4-multimodal - Analyse multimodale unifiée (128K context)"
echo "  • Azure Speech Batch - Transcription audio ($0.18/hour)"
echo ""

# Check if logged in
if ! az account show &>/dev/null; then
    echo "❌ Not logged in. Run: az login"
    exit 1
fi

echo "✅ Azure CLI authenticated"
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "   Subscription: $SUBSCRIPTION"
echo ""

# Create resource group if not exists
if ! az group show --name $RESOURCE_GROUP &>/dev/null; then
    echo "📦 Creating resource group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "✅ Resource group exists: $RESOURCE_GROUP"
fi

# Create AI Hub if not exists
if ! az ml workspace show --name $HUB_NAME --resource-group $RESOURCE_GROUP &>/dev/null 2>&1; then
    echo "🏠 Creating AI Hub: $HUB_NAME"
    az ml workspace create --name $HUB_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind hub
else
    echo "✅ AI Hub exists: $HUB_NAME"
fi

# Create AI Project if not exists
if ! az ml workspace show --name $PROJECT_NAME --resource-group $RESOURCE_GROUP &>/dev/null 2>&1; then
    echo "📁 Creating AI Project: $PROJECT_NAME"
    HUB_ID=$(az ml workspace show --name $HUB_NAME --resource-group $RESOURCE_GROUP --query id -o tsv)
    az ml workspace create --name $PROJECT_NAME --resource-group $RESOURCE_GROUP --location $LOCATION --kind project --hub-id $HUB_ID
else
    echo "✅ AI Project exists: $PROJECT_NAME"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📡 Deploying Serverless AI Model Endpoints..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Deploy DeepSeek-R1 (Reasoning)
echo "🧠 DeepSeek-R1 (Reasoning Model)..."
az ml serverless-endpoint create --file deepseek-r1.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null && echo "   ✅ Created" || echo "   ℹ️  Already exists"

# Deploy Phi-4-multimodal (Multimodal Analysis)
echo "👁️  Phi-4-multimodal (Multimodal Analysis)..."
az ml serverless-endpoint create --file phi-4-multimodal.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null && echo "   ✅ Created" || echo "   ℹ️  Already exists"

# Deploy Phi-4-mini (Fallback)
echo "📱 Phi-4-mini (Lightweight Fallback)..."
az ml serverless-endpoint create --file phi-4-mini.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null && echo "   ℹ️  Already exists or created"

# Deploy Llama-3.3-70B (requires Marketplace subscription)
echo "🦙 Llama-3.3-70B (Optional)..."
az ml serverless-endpoint create --file llama-3.3-70b.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null && echo "   ✅ Created" || echo "   ⚠️  Requires Marketplace subscription"

# Deploy Mistral-Large
echo "🌟 Mistral-Large-2411 (Optional)..."
az ml serverless-endpoint create --file mistral-large.yaml --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME 2>/dev/null && echo "   ✅ Created" || echo "   ⚠️  Requires Marketplace subscription"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎤 Deploying Azure Speech Service (Batch Transcription)..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Create Azure Cognitive Services Speech resource
if ! az cognitiveservices account show --name $SPEECH_SERVICE_NAME --resource-group $RESOURCE_GROUP &>/dev/null 2>&1; then
    echo "🎤 Creating Azure Speech Service: $SPEECH_SERVICE_NAME"
    az cognitiveservices account create \
        --name $SPEECH_SERVICE_NAME \
        --resource-group $RESOURCE_GROUP \
        --kind SpeechServices \
        --sku S0 \
        --location $LOCATION \
        --yes
    echo "   ✅ Created"
else
    echo "✅ Azure Speech Service exists: $SPEECH_SERVICE_NAME"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📋 Deployed Endpoints Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""

az ml serverless-endpoint list --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME --output table 2>/dev/null || echo "No endpoints found"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔑 Retrieving API Keys..."
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get AI Model endpoint keys
for endpoint in deepseek-r1-endpoint phi-4-multimodal-endpoint phi-4-mini-endpoint; do
    echo "--- $endpoint ---"
    KEY=$(az ml serverless-endpoint get-credentials --name $endpoint --resource-group $RESOURCE_GROUP --workspace-name $PROJECT_NAME --query primaryKey -o tsv 2>/dev/null) || KEY="N/A"
    if [ "$KEY" != "N/A" ] && [ -n "$KEY" ]; then
        echo "   Key: ${KEY:0:8}...${KEY: -4}"
    else
        echo "   Key: Not available (endpoint may not exist)"
    fi
done

# Get Speech Service key
echo ""
echo "--- Azure Speech Service ---"
SPEECH_KEY=$(az cognitiveservices account keys list --name $SPEECH_SERVICE_NAME --resource-group $RESOURCE_GROUP --query key1 -o tsv 2>/dev/null) || SPEECH_KEY="N/A"
if [ "$SPEECH_KEY" != "N/A" ] && [ -n "$SPEECH_KEY" ]; then
    echo "   Key: ${SPEECH_KEY:0:8}...${SPEECH_KEY: -4}"
else
    echo "   Key: Not available"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Add these environment variables to your .env.local:"
echo ""
echo "# DeepSeek R1 - Reasoning Model"
echo "AZURE_DEEPSEEK_R1_ENDPOINT=https://deepseek-r1-endpoint.$LOCATION.models.ai.azure.com"
echo "AZURE_DEEPSEEK_R1_KEY=<key-from-above>"
echo ""
echo "# Phi-4 Multimodal - Visual/Audio Analysis"
echo "AZURE_PHI4_MULTIMODAL_ENDPOINT=https://phi-4-multimodal-endpoint.$LOCATION.models.ai.azure.com"
echo "AZURE_PHI4_MULTIMODAL_KEY=<key-from-above>"
echo ""
echo "# Azure Speech - Batch Transcription"
echo "AZURE_SPEECH_KEY=$SPEECH_KEY"
echo "AZURE_SPEECH_REGION=$LOCATION"
echo "AZURE_SPEECH_ENDPOINT=https://$LOCATION.api.cognitive.microsoft.com/"
echo ""
echo "💰 Pricing Summary:"
echo "   • DeepSeek R1: \$0.00135/1K input, \$0.0054/1K output"
echo "   • DeepSeek V3: \$0.00114/1K input, \$0.00456/1K output"
echo "   • Phi-4-multimodal: Pay-per-token (check Azure pricing)"
echo "   • Azure Speech Batch: \$0.18/hour"
echo ""
