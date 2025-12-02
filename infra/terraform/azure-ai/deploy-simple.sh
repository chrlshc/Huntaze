#!/bin/bash

# ============================================================================
# HUNTAZE AZURE OPENAI - SCRIPT DE DÉPLOIEMENT SIMPLIFIÉ
# ============================================================================
# Ce script automatise le déploiement de l'infrastructure Azure OpenAI
# Usage: ./deploy-simple.sh
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     HUNTAZE AZURE OPENAI - DÉPLOIEMENT AUTOMATISÉ         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# ÉTAPE 1 : VÉRIFICATION DES PRÉREQUIS
# ============================================================================
print_step "Vérification des prérequis..."

# Vérifier Azure CLI
if ! command -v az &> /dev/null; then
    print_error "Azure CLI n'est pas installé"
    echo "Installation: brew install azure-cli (macOS) ou https://aka.ms/InstallAzureCLIDeb (Linux)"
    exit 1
fi
print_success "Azure CLI installé"

# Vérifier Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform n'est pas installé"
    echo "Installation: brew install terraform (macOS) ou https://www.terraform.io/downloads"
    exit 1
fi
print_success "Terraform installé"

# Vérifier la connexion Azure
print_step "Vérification de la connexion Azure..."
if ! az account show &> /dev/null; then
    print_warning "Non connecté à Azure"
    print_step "Connexion à Azure..."
    az login
else
    ACCOUNT_NAME=$(az account show --query name -o tsv)
    print_success "Connecté à Azure: $ACCOUNT_NAME"
fi

# ============================================================================
# ÉTAPE 2 : ENREGISTREMENT DES PROVIDERS
# ============================================================================
print_step "Enregistrement des providers Azure..."

az provider register --namespace Microsoft.CognitiveServices --wait
az provider register --namespace Microsoft.KeyVault --wait
az provider register --namespace Microsoft.Search --wait
az provider register --namespace Microsoft.Insights --wait

print_success "Providers enregistrés"

# ============================================================================
# ÉTAPE 3 : INITIALISATION TERRAFORM
# ============================================================================
print_step "Initialisation de Terraform..."

terraform init

print_success "Terraform initialisé"

# ============================================================================
# ÉTAPE 4 : VALIDATION
# ============================================================================
print_step "Validation de la configuration..."

terraform validate

print_success "Configuration valide"

# ============================================================================
# ÉTAPE 5 : PLAN
# ============================================================================
print_step "Génération du plan de déploiement..."

terraform plan -out=tfplan

echo ""
print_warning "Vérifiez le plan ci-dessus"
echo ""
read -p "Voulez-vous continuer avec le déploiement ? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    print_error "Déploiement annulé"
    rm -f tfplan
    exit 0
fi

# ============================================================================
# ÉTAPE 6 : DÉPLOIEMENT
# ============================================================================
print_step "Déploiement de l'infrastructure Azure..."
echo ""
print_warning "Cela peut prendre 3-5 minutes..."
echo ""

terraform apply tfplan

rm -f tfplan

print_success "Infrastructure déployée avec succès !"

# ============================================================================
# ÉTAPE 7 : RÉCUPÉRATION DES INFORMATIONS
# ============================================================================
echo ""
print_step "Récupération des informations de connexion..."
echo ""

ENDPOINT=$(terraform output -raw openai_primary_endpoint)
SEARCH_ENDPOINT=$(terraform output -raw cognitive_search_endpoint)
KV_URI=$(terraform output -raw key_vault_uri)

# Récupérer la clé API
RESOURCE_GROUP="huntaze-ai-production-rg"
ACCOUNT_NAME="huntaze-ai-production-openai-primary"

print_step "Récupération de la clé API..."
API_KEY=$(az cognitiveservices account keys list \
    --name $ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP \
    --query key1 -o tsv)

# ============================================================================
# ÉTAPE 8 : AFFICHAGE DES RÉSULTATS
# ============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 INFORMATIONS DE CONNEXION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Azure OpenAI Endpoint:"
echo "  $ENDPOINT"
echo ""
echo "Azure OpenAI API Key:"
echo "  $API_KEY"
echo ""
echo "Cognitive Search Endpoint:"
echo "  $SEARCH_ENDPOINT"
echo ""
echo "Key Vault URI:"
echo "  $KV_URI"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 MODÈLES DÉPLOYÉS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  • gpt-4-turbo-prod          (GPT-4 Turbo - Premium)"
echo "  • gpt-4-standard-prod        (GPT-4 - Standard)"
echo "  • gpt-35-turbo-prod          (GPT-3.5 Turbo - Économique)"
echo "  • gpt-4-vision-prod          (GPT-4 Vision - Images)"
echo "  • text-embedding-ada-002-prod (Embeddings - Vecteurs)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 VARIABLES D'ENVIRONNEMENT POUR AWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ajoute ces variables dans ton AWS Amplify ou .env.local:"
echo ""
echo "AZURE_OPENAI_ENDPOINT=\"$ENDPOINT\""
echo "AZURE_OPENAI_API_KEY=\"$API_KEY\""
echo "AZURE_API_VERSION=\"2024-05-01-preview\""
echo "AZURE_DEPLOYMENT_PREMIUM=\"gpt-4-turbo-prod\""
echo "AZURE_DEPLOYMENT_STANDARD=\"gpt-35-turbo-prod\""
echo "AZURE_DEPLOYMENT_VISION=\"gpt-4-vision-prod\""
echo "AZURE_DEPLOYMENT_EMBEDDING=\"text-embedding-ada-002-prod\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ PROCHAINES ÉTAPES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Copie les variables d'environnement ci-dessus"
echo "2. Ajoute-les dans AWS Amplify Console"
echo "3. Redémarre ton application"
echo "4. Teste la connexion Azure OpenAI"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Sauvegarder les infos dans un fichier
cat > ../../../.azure-credentials.txt << EOF
# HUNTAZE AZURE OPENAI - CREDENTIALS
# Généré le: $(date)
# ⚠️ NE PAS COMMITTER CE FICHIER

AZURE_OPENAI_ENDPOINT="$ENDPOINT"
AZURE_OPENAI_API_KEY="$API_KEY"
AZURE_API_VERSION="2024-05-01-preview"
AZURE_DEPLOYMENT_PREMIUM="gpt-4-turbo-prod"
AZURE_DEPLOYMENT_STANDARD="gpt-35-turbo-prod"
AZURE_DEPLOYMENT_VISION="gpt-4-vision-prod"
AZURE_DEPLOYMENT_EMBEDDING="text-embedding-ada-002-prod"

# Autres endpoints
COGNITIVE_SEARCH_ENDPOINT="$SEARCH_ENDPOINT"
KEY_VAULT_URI="$KV_URI"
EOF

print_success "Credentials sauvegardés dans .azure-credentials.txt"
echo ""
print_warning "⚠️  IMPORTANT: Ne committe JAMAIS le fichier .azure-credentials.txt"
echo ""
