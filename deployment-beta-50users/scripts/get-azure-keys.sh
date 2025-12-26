#!/bin/bash

# ============================================================================
# 🔑 RÉCUPÉRATION AUTOMATIQUE DES CLÉS AZURE
# ============================================================================

set -e

echo "🔑 Récupération des clés Azure via CLI"
echo "======================================"
echo ""

# Vérifier que Azure CLI est installé
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI n'est pas installé"
    echo ""
    echo "Installation:"
    echo "  macOS: brew install azure-cli"
    echo "  Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    echo "  Windows: https://aka.ms/installazurecliwindows"
    exit 1
fi

echo "✅ Azure CLI installé"
echo ""

# Vérifier la connexion Azure
echo "🔐 Vérification de la connexion Azure..."
if ! az account show &> /dev/null; then
    echo "❌ Non connecté à Azure"
    echo ""
    echo "Connexion en cours..."
    az login
fi

ACCOUNT_NAME=$(az account show --query name -o tsv)
echo "✅ Connecté à Azure: $ACCOUNT_NAME"
echo ""

# ============================================================================
# 1️⃣ RÉCUPÉRER LES CLÉS AZURE AI
# ============================================================================

echo "📋 1. RÉCUPÉRATION DES CLÉS AZURE AI"
echo ""

# Lister les resource groups
echo "🔍 Recherche du resource group Azure AI..."
RG_NAME=$(az group list --query "[?contains(name, 'huntaze') || contains(name, 'ai')].name" -o tsv | head -n 1)

if [ -z "$RG_NAME" ]; then
    echo "⚠️  Resource group non trouvé automatiquement"
    echo ""
    echo "Resource groups disponibles:"
    az group list --query "[].name" -o tsv
    echo ""
    read -p "Entre le nom du resource group: " RG_NAME
fi

echo "✅ Resource group: $RG_NAME"
echo ""

# Récupérer les Azure AI Services
echo "🔍 Recherche des Azure AI Services..."
AI_SERVICES=$(az cognitiveservices account list --resource-group "$RG_NAME" --query "[?kind=='AIServices' || kind=='OpenAI'].name" -o tsv)

if [ -z "$AI_SERVICES" ]; then
    echo "⚠️  Aucun Azure AI Service trouvé"
    echo ""
    echo "Services disponibles:"
    az cognitiveservices account list --resource-group "$RG_NAME" --query "[].{Name:name, Kind:kind}" -o table
    echo ""
    read -p "Entre le nom du service Azure AI: " AI_SERVICE_NAME
else
    AI_SERVICE_NAME=$(echo "$AI_SERVICES" | head -n 1)
fi

echo "✅ Azure AI Service: $AI_SERVICE_NAME"
echo ""

# Récupérer la clé Azure AI
echo "🔑 Récupération de la clé Azure AI..."
AZURE_AI_KEY=$(az cognitiveservices account keys list \
    --name "$AI_SERVICE_NAME" \
    --resource-group "$RG_NAME" \
    --query "key1" -o tsv)

if [ -z "$AZURE_AI_KEY" ]; then
    echo "❌ Impossible de récupérer la clé Azure AI"
    exit 1
fi

echo "✅ Clé Azure AI récupérée"
echo ""

# Récupérer l'endpoint Azure AI
AZURE_AI_ENDPOINT=$(az cognitiveservices account show \
    --name "$AI_SERVICE_NAME" \
    --resource-group "$RG_NAME" \
    --query "properties.endpoint" -o tsv)

echo "✅ Endpoint Azure AI: $AZURE_AI_ENDPOINT"
echo ""

# ============================================================================
# 2️⃣ RÉCUPÉRER LES CLÉS AZURE SPEECH
# ============================================================================

echo "📋 2. RÉCUPÉRATION DES CLÉS AZURE SPEECH"
echo ""

# Rechercher le service Speech
echo "🔍 Recherche du service Azure Speech..."
SPEECH_SERVICES=$(az cognitiveservices account list --resource-group "$RG_NAME" --query "[?kind=='SpeechServices'].name" -o tsv)

if [ -z "$SPEECH_SERVICES" ]; then
    echo "⚠️  Aucun service Speech trouvé"
    echo ""
    echo "Création d'un service Speech..."
    
    # Demander la région
    read -p "Région (francecentral/eastus): " SPEECH_REGION
    SPEECH_REGION=${SPEECH_REGION:-francecentral}
    
    SPEECH_SERVICE_NAME="huntaze-speech-$SPEECH_REGION"
    
    az cognitiveservices account create \
        --name "$SPEECH_SERVICE_NAME" \
        --resource-group "$RG_NAME" \
        --kind SpeechServices \
        --sku S0 \
        --location "$SPEECH_REGION" \
        --yes
    
    echo "✅ Service Speech créé: $SPEECH_SERVICE_NAME"
else
    SPEECH_SERVICE_NAME=$(echo "$SPEECH_SERVICES" | head -n 1)
    echo "✅ Service Speech trouvé: $SPEECH_SERVICE_NAME"
fi

echo ""

# Récupérer la clé Speech
echo "🔑 Récupération de la clé Azure Speech..."
AZURE_SPEECH_KEY=$(az cognitiveservices account keys list \
    --name "$SPEECH_SERVICE_NAME" \
    --resource-group "$RG_NAME" \
    --query "key1" -o tsv)

if [ -z "$AZURE_SPEECH_KEY" ]; then
    echo "❌ Impossible de récupérer la clé Azure Speech"
    exit 1
fi

echo "✅ Clé Azure Speech récupérée"
echo ""

# Récupérer la région Speech
SPEECH_REGION=$(az cognitiveservices account show \
    --name "$SPEECH_SERVICE_NAME" \
    --resource-group "$RG_NAME" \
    --query "location" -o tsv)

echo "✅ Région Speech: $SPEECH_REGION"
echo ""

# ============================================================================
# 3️⃣ RÉCUPÉRER LES ENDPOINTS DES MODÈLES
# ============================================================================

echo "📋 3. RÉCUPÉRATION DES ENDPOINTS DES MODÈLES"
echo ""

# Déterminer la région des modèles
echo "🔍 Détection de la région des modèles..."

# Chercher les déploiements Azure AI
DEPLOYMENTS=$(az cognitiveservices account deployment list \
    --name "$AI_SERVICE_NAME" \
    --resource-group "$RG_NAME" \
    --query "[].name" -o tsv 2>/dev/null || echo "")

if [ -n "$DEPLOYMENTS" ]; then
    echo "✅ Déploiements trouvés:"
    echo "$DEPLOYMENTS" | while read -r deployment; do
        echo "  - $deployment"
    done
    echo ""
    
    # Construire les endpoints
    AI_REGION=$(echo "$AZURE_AI_ENDPOINT" | sed -n 's/.*https:\/\/[^.]*\.\([^.]*\)\.cognitive.*/\1/p')
    
    if [ -z "$AI_REGION" ]; then
        AI_REGION="francecentral"
    fi
else
    echo "⚠️  Aucun déploiement trouvé"
    echo ""
    read -p "Région des modèles (francecentral/eastus): " AI_REGION
    AI_REGION=${AI_REGION:-francecentral}
fi

echo "✅ Région des modèles: $AI_REGION"
echo ""

# Construire les endpoints
DEEPSEEK_V3_ENDPOINT="https://huntaze-ai-deepseek-v3.$AI_REGION.models.ai.azure.com"
DEEPSEEK_R1_ENDPOINT="https://huntaze-ai-deepseek-r1.$AI_REGION.models.ai.azure.com"
PHI4_MULTIMODAL_ENDPOINT="https://huntaze-ai-phi4-multimodal.$AI_REGION.models.ai.azure.com"
PHI4_MINI_ENDPOINT="https://huntaze-ai-phi4-mini.$AI_REGION.models.ai.azure.com"
LLAMA_ENDPOINT="https://huntaze-ai-llama.$AI_REGION.models.ai.azure.com"
MISTRAL_ENDPOINT="https://huntaze-ai-mistral.$AI_REGION.models.ai.azure.com"
SPEECH_ENDPOINT="https://$SPEECH_REGION.api.cognitive.microsoft.com"

# ============================================================================
# 4️⃣ SAUVEGARDER LES CLÉS
# ============================================================================

echo "📋 4. SAUVEGARDE DES CLÉS"
echo ""

OUTPUT_FILE="deployment-beta-50users/azure-keys.env"

cat > "$OUTPUT_FILE" << EOF
# Azure Keys - Récupérées automatiquement
# Date: $(date)
# Resource Group: $RG_NAME

# Azure AI
AZURE_AI_API_KEY=$AZURE_AI_KEY
AZURE_AI_ENDPOINT=$AZURE_AI_ENDPOINT

# Azure Speech
AZURE_SPEECH_KEY=$AZURE_SPEECH_KEY
AZURE_SPEECH_REGION=$SPEECH_REGION
AZURE_SPEECH_ENDPOINT=$SPEECH_ENDPOINT

# Azure AI Models Endpoints ($AI_REGION)
AZURE_DEEPSEEK_V3_ENDPOINT=$DEEPSEEK_V3_ENDPOINT
AZURE_DEEPSEEK_R1_ENDPOINT=$DEEPSEEK_R1_ENDPOINT
AZURE_PHI4_MULTIMODAL_ENDPOINT=$PHI4_MULTIMODAL_ENDPOINT
AZURE_PHI4_MINI_ENDPOINT=$PHI4_MINI_ENDPOINT
AZURE_LLAMA_ENDPOINT=$LLAMA_ENDPOINT
AZURE_MISTRAL_ENDPOINT=$MISTRAL_ENDPOINT
EOF

echo "✅ Clés sauvegardées: $OUTPUT_FILE"
echo ""

# ============================================================================
# 5️⃣ AFFICHER LES CLÉS
# ============================================================================

echo "============================================"
echo "📋 CLÉS AZURE RÉCUPÉRÉES"
echo "============================================"
echo ""
echo "Azure AI:"
echo "  AZURE_AI_API_KEY=$AZURE_AI_KEY"
echo "  AZURE_AI_ENDPOINT=$AZURE_AI_ENDPOINT"
echo ""
echo "Azure Speech:"
echo "  AZURE_SPEECH_KEY=$AZURE_SPEECH_KEY"
echo "  AZURE_SPEECH_REGION=$SPEECH_REGION"
echo "  AZURE_SPEECH_ENDPOINT=$SPEECH_ENDPOINT"
echo ""
echo "Endpoints des Modèles ($AI_REGION):"
echo "  AZURE_DEEPSEEK_V3_ENDPOINT=$DEEPSEEK_V3_ENDPOINT"
echo "  AZURE_DEEPSEEK_R1_ENDPOINT=$DEEPSEEK_R1_ENDPOINT"
echo "  AZURE_PHI4_MULTIMODAL_ENDPOINT=$PHI4_MULTIMODAL_ENDPOINT"
echo "  AZURE_PHI4_MINI_ENDPOINT=$PHI4_MINI_ENDPOINT"
echo "  AZURE_LLAMA_ENDPOINT=$LLAMA_ENDPOINT"
echo "  AZURE_MISTRAL_ENDPOINT=$MISTRAL_ENDPOINT"
echo ""
echo "============================================"
echo ""

# ============================================================================
# 6️⃣ METTRE À JOUR COPY-PASTE-VERCEL.txt
# ============================================================================

echo "📋 5. MISE À JOUR DE COPY-PASTE-VERCEL.txt"
echo ""

VERCEL_FILE="deployment-beta-50users/COPY-PASTE-VERCEL.txt"

# Créer une copie de backup
cp "$VERCEL_FILE" "${VERCEL_FILE}.backup"

# Remplacer les placeholders
sed -i.tmp "s|<TA_CLE_AZURE_AI>|$AZURE_AI_KEY|g" "$VERCEL_FILE"
sed -i.tmp "s|<TA_CLE_AZURE_SPEECH>|$AZURE_SPEECH_KEY|g" "$VERCEL_FILE"
rm -f "${VERCEL_FILE}.tmp"

echo "✅ COPY-PASTE-VERCEL.txt mis à jour"
echo ""

# ============================================================================
# 7️⃣ TESTER LES CLÉS
# ============================================================================

echo "📋 6. TEST DES CLÉS"
echo ""

# Test Azure AI
echo "🧪 Test Azure AI..."
TEST_RESPONSE=$(curl -s -X POST "$DEEPSEEK_V3_ENDPOINT/v1/chat/completions" \
    -H "Content-Type: application/json" \
    -H "api-key: $AZURE_AI_KEY" \
    -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":5}' \
    2>&1 || echo "ERROR")

if echo "$TEST_RESPONSE" | grep -q "choices\|error"; then
    if echo "$TEST_RESPONSE" | grep -q "choices"; then
        echo "✅ Azure AI fonctionne"
    else
        echo "⚠️  Azure AI répond mais avec erreur (endpoint peut-être incorrect)"
        echo "   Réponse: $(echo "$TEST_RESPONSE" | head -c 200)"
    fi
else
    echo "❌ Azure AI ne répond pas"
    echo "   Réponse: $(echo "$TEST_RESPONSE" | head -c 200)"
fi
echo ""

# Test Azure Speech
echo "🧪 Test Azure Speech..."
SPEECH_TEST=$(curl -s -X POST "$SPEECH_ENDPOINT/sts/v1.0/issuetoken" \
    -H "Ocp-Apim-Subscription-Key: $AZURE_SPEECH_KEY" \
    2>&1 || echo "ERROR")

if [ ${#SPEECH_TEST} -gt 50 ]; then
    echo "✅ Azure Speech fonctionne"
else
    echo "❌ Azure Speech ne répond pas"
    echo "   Réponse: $SPEECH_TEST"
fi
echo ""

# ============================================================================
# 8️⃣ RÉSUMÉ
# ============================================================================

echo "============================================"
echo "✅ RÉCUPÉRATION TERMINÉE"
echo "============================================"
echo ""
echo "📁 Fichiers créés:"
echo "  - $OUTPUT_FILE"
echo "  - ${VERCEL_FILE}.backup (backup)"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifie les clés dans: $OUTPUT_FILE"
echo "  2. Copie les variables depuis: $VERCEL_FILE"
echo "  3. Colle dans Vercel (Settings → Environment Variables)"
echo "  4. Déploie: vercel --prod"
echo ""
echo "🔐 Sécurité:"
echo "  ⚠️  Ne commite PAS ces fichiers dans Git!"
echo "  ⚠️  Ajoute-les au .gitignore"
echo ""

# Ajouter au .gitignore
if ! grep -q "azure-keys.env" .gitignore 2>/dev/null; then
    echo "azure-keys.env" >> .gitignore
    echo "✅ azure-keys.env ajouté au .gitignore"
fi

echo "🎉 Terminé!"
