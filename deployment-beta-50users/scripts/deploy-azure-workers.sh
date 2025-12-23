#!/bin/bash
# deploy-azure-workers.sh
# Déploiement complet Azure Functions + Service Bus pour Huntaze Workers

set -e

echo "🚀 Déploiement Azure Workers - Huntaze Beta"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
RG="huntaze-beta-rg"
LOCATION="eastus2"
TAG="huntaze-beta-50"

# Generate unique names
STORAGE="huntazesa$(openssl rand -hex 4)"
PLAN="huntaze-func-ep1"
FUNCAPP="huntaze-workers-$(openssl rand -hex 4)"
SB_NAMESPACE="huntaze-sb-$(openssl rand -hex 4)"

TOPIC_JOBS="huntaze-jobs"
TOPIC_EVENTS="huntaze-events"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not installed${NC}"
    echo "Install: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    echo "Run: az login"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI ready${NC}"
echo ""

# Confirm deployment
echo "Configuration:"
echo "  Resource Group: $RG"
echo "  Location: $LOCATION"
echo "  Function App: $FUNCAPP"
echo "  Service Bus: $SB_NAMESPACE"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# 1. Create Resource Group
echo ""
echo "📦 Creating Resource Group..."
az group create \
  --name "$RG" \
  --location "$LOCATION" \
  --tags "$TAG" \
  --output none

echo -e "${GREEN}✅ Resource Group created${NC}"

# 2. Create Storage Account
echo ""
echo "💾 Creating Storage Account..."
az storage account create \
  --name "$STORAGE" \
  --location "$LOCATION" \
  --resource-group "$RG" \
  --sku Standard_LRS \
  --output none

echo -e "${GREEN}✅ Storage Account created${NC}"

# 3. Create Premium Plan (EP1)
echo ""
echo "⚡ Creating Premium Plan (EP1)..."
az functionapp plan create \
  --name "$PLAN" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku EP1 \
  --output none

echo -e "${GREEN}✅ Premium Plan created${NC}"

# 4. Create Function App
echo ""
echo "🔧 Creating Function App..."
az functionapp create \
  --name "$FUNCAPP" \
  --storage-account "$STORAGE" \
  --plan "$PLAN" \
  --resource-group "$RG" \
  --functions-version 4 \
  --runtime node \
  --runtime-version 20 \
  --output none

echo -e "${GREEN}✅ Function App created${NC}"

# 5. Create Service Bus Namespace
echo ""
echo "📨 Creating Service Bus Namespace..."
az servicebus namespace create \
  --resource-group "$RG" \
  --name "$SB_NAMESPACE" \
  --location "$LOCATION" \
  --sku Standard \
  --output none

echo -e "${GREEN}✅ Service Bus Namespace created${NC}"

# 6. Create Topics
echo ""
echo "📋 Creating Topics..."
az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "$TOPIC_JOBS" \
  --output none

az servicebus topic create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "$TOPIC_EVENTS" \
  --output none

echo -e "${GREEN}✅ Topics created${NC}"

# 7. Create Subscriptions (Jobs)
echo ""
echo "📬 Creating Job Subscriptions..."

# Video Analysis
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "video-analysis" \
  --max-delivery-count 3 \
  --lock-duration PT2M \
  --default-message-time-to-live PT30M \
  --enable-dead-lettering-on-message-expiration true \
  --output none

# Chat Suggestions
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "chat-suggestions" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live PT10M \
  --enable-dead-lettering-on-message-expiration true \
  --output none

# Content Suggestions
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "content-suggestions" \
  --max-delivery-count 5 \
  --lock-duration PT1M \
  --default-message-time-to-live PT10M \
  --enable-dead-lettering-on-message-expiration true \
  --output none

# Content Analysis
az servicebus topic subscription create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --name "content-analysis" \
  --max-delivery-count 8 \
  --lock-duration PT2M \
  --default-message-time-to-live PT20M \
  --enable-dead-lettering-on-message-expiration true \
  --output none

echo -e "${GREEN}✅ Job Subscriptions created${NC}"

# 8. Create SQL Filters
echo ""
echo "🔍 Creating SQL Filters..."

# Remove default rules
for SUB in video-analysis chat-suggestions content-suggestions content-analysis; do
  az servicebus topic subscription rule delete \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "$TOPIC_JOBS" \
    --subscription-name "$SUB" \
    --name "\$Default" \
    --output none 2>/dev/null || true
done

# Add routing rules
az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "video-analysis" \
  --name "jobtype-video" \
  --filter-sql-expression "jobType = 'video.analysis'" \
  --output none

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "chat-suggestions" \
  --name "jobtype-chat" \
  --filter-sql-expression "jobType = 'chat.suggest'" \
  --output none

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "content-suggestions" \
  --name "jobtype-content-suggest" \
  --filter-sql-expression "jobType = 'content.suggest'" \
  --output none

az servicebus topic subscription rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --topic-name "$TOPIC_JOBS" \
  --subscription-name "content-analysis" \
  --name "jobtype-content-analyze" \
  --filter-sql-expression "jobType = 'content.analyze'" \
  --output none

echo -e "${GREEN}✅ SQL Filters created${NC}"

# 9. Create Subscriptions (Events)
echo ""
echo "📬 Creating Event Subscriptions..."

for SUB in notify-signalr notify-email notify-webhook metrics; do
  az servicebus topic subscription create \
    --resource-group "$RG" \
    --namespace-name "$SB_NAMESPACE" \
    --topic-name "$TOPIC_EVENTS" \
    --name "$SUB" \
    --max-delivery-count 10 \
    --lock-duration PT1M \
    --default-message-time-to-live P1D \
    --output none
done

echo -e "${GREEN}✅ Event Subscriptions created${NC}"

# 10. Create Authorization Rules
echo ""
echo "🔑 Creating Authorization Rules..."

# Send-only (Vercel)
az servicebus namespace authorization-rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "vercel-send" \
  --rights Send \
  --output none

# Listen + Send (Functions)
az servicebus namespace authorization-rule create \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "functions-rw" \
  --rights Listen Send \
  --output none

echo -e "${GREEN}✅ Authorization Rules created${NC}"

# 11. Get Connection Strings
echo ""
echo "🔑 Retrieving Connection Strings..."

SB_CONN_FUNCTIONS=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "functions-rw" \
  --query primaryConnectionString -o tsv)

SB_CONN_VERCEL=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RG" \
  --namespace-name "$SB_NAMESPACE" \
  --name "vercel-send" \
  --query primaryConnectionString -o tsv)

echo -e "${GREEN}✅ Connection Strings retrieved${NC}"

# 12. Configure Function App Settings
echo ""
echo "⚙️  Configuring Function App Settings..."

# Check for required environment variables
if [ -z "$AZURE_DEEPSEEK_V3_ENDPOINT" ]; then
    echo -e "${YELLOW}⚠️  AZURE_DEEPSEEK_V3_ENDPOINT not set${NC}"
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
fi

az functionapp config appsettings set \
  --resource-group "$RG" \
  --name "$FUNCAPP" \
  --settings \
  "SERVICEBUS_CONNECTION=$SB_CONN_FUNCTIONS" \
  "TOPIC_JOBS=$TOPIC_JOBS" \
  "TOPIC_EVENTS=$TOPIC_EVENTS" \
  "AZURE_DEEPSEEK_V3_ENDPOINT=${AZURE_DEEPSEEK_V3_ENDPOINT:-}" \
  "AZURE_DEEPSEEK_R1_ENDPOINT=${AZURE_DEEPSEEK_R1_ENDPOINT:-}" \
  "AZURE_PHI4_MULTIMODAL_ENDPOINT=${AZURE_PHI4_MULTIMODAL_ENDPOINT:-}" \
  "AZURE_SPEECH_KEY=${AZURE_SPEECH_KEY:-}" \
  "DATABASE_URL=${DATABASE_URL:-}" \
  "REDIS_URL=${REDIS_URL:-}" \
  --output none

echo -e "${GREEN}✅ Function App Settings configured${NC}"

# 13. Deploy Functions (if code exists)
echo ""
if [ -d "../huntaze-workers" ]; then
    echo "📤 Deploying Functions..."
    cd ../huntaze-workers
    npm run build
    func azure functionapp publish "$FUNCAPP"
    cd -
    echo -e "${GREEN}✅ Functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  huntaze-workers directory not found, skipping deployment${NC}"
    echo "   Create the project and deploy manually with:"
    echo "   func azure functionapp publish $FUNCAPP"
fi

# 14. Summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=============================================="
echo ""
echo "📋 Summary:"
echo "  Resource Group: $RG"
echo "  Location: $LOCATION"
echo "  Function App: $FUNCAPP"
echo "  Service Bus: $SB_NAMESPACE"
echo "  Topics: $TOPIC_JOBS, $TOPIC_EVENTS"
echo ""
echo "🔗 Connection Strings:"
echo ""
echo "For Vercel (Send-only):"
echo "SERVICEBUS_CONNECTION_SEND=\"$SB_CONN_VERCEL\""
echo ""
echo "For Functions (Listen + Send):"
echo "SERVICEBUS_CONNECTION=\"$SB_CONN_FUNCTIONS\""
echo ""
echo "🔗 Next Steps:"
echo "  1. Add SERVICEBUS_CONNECTION_SEND to Vercel environment variables"
echo "  2. Create huntaze-workers project: func init --typescript"
echo "  3. Copy worker code from AZURE-WORKERS-GUIDE.md"
echo "  4. Deploy: func azure functionapp publish $FUNCAPP"
echo "  5. Test: curl -X POST https://your-app.vercel.app/api/jobs/video-analysis"
echo "  6. Monitor: az monitor app-insights component show --app $FUNCAPP"
echo ""
echo "💰 Estimated Cost: ~$156.88/month"
echo "  - Premium EP1: $146.88/month"
echo "  - Service Bus Standard: $10/month"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
