#!/usr/bin/env bash
set -euo pipefail

# Usage: customize variables below or export them before running.

# Subscription / Resource group / Region
: "${SUBSCRIPTION_ID:=${1:-}}"  # can pass as first arg
: "${AZURE_REGION:=eastus2}"
: "${RESOURCE_GROUP:=huntaze-ai-rg}"

# Function App
: "${FUNC_APP:=huntaze-func-app}"
: "${STORAGE_ACCOUNT:=huntazefuncsa$RANDOM}"
# For consumption, we can use --consumption-plan-location (no plan resource)

# Cosmos
: "${COSMOS_ACCOUNT:=huntazecos$RANDOM}"
: "${COSMOS_DB:=huntaze}"

# Messaging
: "${SB_NAMESPACE:=huntaze-sb-$RANDOM}"
: "${SB_QUEUE:=autogen-drafts}"

if [[ -z "$SUBSCRIPTION_ID" ]]; then
  echo "SUBSCRIPTION_ID is required (pass as arg or export)" >&2
  exit 1
fi

echo "[*] Setting subscription $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

echo "[*] Ensuring resource providers are registered"
for ns in Microsoft.Web Microsoft.DocumentDB Microsoft.ServiceBus Microsoft.EventGrid Microsoft.CognitiveServices; do
  az provider register --namespace $ns >/dev/null || true
done

echo "[*] Creating resource group $RESOURCE_GROUP in $AZURE_REGION"
az group create -n "$RESOURCE_GROUP" -l "$AZURE_REGION" >/dev/null

echo "[*] Creating Storage Account $STORAGE_ACCOUNT"
az storage account create -n "$STORAGE_ACCOUNT" -g "$RESOURCE_GROUP" -l "$AZURE_REGION" --sku Standard_LRS >/dev/null

echo "[*] Creating Function App $FUNC_APP (Consumption Linux)"
az functionapp create -n "$FUNC_APP" -g "$RESOURCE_GROUP" --storage-account "$STORAGE_ACCOUNT" \
  --consumption-plan-location "$AZURE_REGION" --os-type Linux \
  --runtime node --runtime-version 20 --functions-version 4 >/dev/null

echo "[*] Assigning system identity to $FUNC_APP"
az functionapp identity assign -n "$FUNC_APP" -g "$RESOURCE_GROUP" >/dev/null

echo "[*] Deploying Cosmos (serverless) and containers"
az deployment group create -g "$RESOURCE_GROUP" -f azure/iac/cosmos-migrate.bicep \
  -p accountName="$COSMOS_ACCOUNT" location="$AZURE_REGION" databaseName="$COSMOS_DB" >/dev/null

echo "[*] Deploying Service Bus namespace/queue and Event Grid topic"
az deployment group create -g "$RESOURCE_GROUP" -f azure/iac/messaging.bicep \
  -p nsName="$SB_NAMESPACE" location="$AZURE_REGION" queueName="$SB_QUEUE" >/dev/null

COSMOS_ENDPOINT=$(az cosmosdb show -n "$COSMOS_ACCOUNT" -g "$RESOURCE_GROUP" --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list -n "$COSMOS_ACCOUNT" -g "$RESOURCE_GROUP" --type keys --query primaryMasterKey -o tsv)
SB_FQNS=$(az servicebus namespace show -n "$SB_NAMESPACE" -g "$RESOURCE_GROUP" --query serviceBusEndpoint -o tsv | sed 's;^https://\(.*\)/$;\1;')

echo "[*] Setting baseline app settings on $FUNC_APP (Cosmos + Service Bus)"
az functionapp config appsettings set -n "$FUNC_APP" -g "$RESOURCE_GROUP" --settings \
  COSMOS_ENDPOINT="$COSMOS_ENDPOINT" COSMOS_KEY="$COSMOS_KEY" COSMOS_DB="$COSMOS_DB" \
  COSMOS_CONTAINER_FANS=fans COSMOS_CONTAINER_TX=transactions COSMOS_CONTAINER_MSG=messages COSMOS_CONTAINER_SEG=segments \
  SERVICE_BUS_FQNS="$SB_FQNS" SERVICE_BUS_QUEUE_TRIAGE=triage.events >/dev/null

echo "[*] NOTE: You must also set AOAI/Content Safety/Text Analytics settings via set-appsettings.sh"
echo "[*] Building and ZIP deploying Functions"
pushd azure/functions >/dev/null
npm ci
npm run build
zip -r ../functions.zip dist package.json host.json node_modules >/dev/null
popd >/dev/null
az functionapp config appsettings set -n "$FUNC_APP" -g "$RESOURCE_GROUP" --settings \
  FUNCTIONS_WORKER_RUNTIME=node WEBSITE_RUN_FROM_PACKAGE=1 >/dev/null
az functionapp deployment source config-zip -g "$RESOURCE_GROUP" -n "$FUNC_APP" --src azure/functions.zip >/dev/null

echo "Done. Endpoints:"
echo "  TRIAGE:  https://$FUNC_APP.azurewebsites.net/api/triage/classify"
echo "  FAN360:  https://$FUNC_APP.azurewebsites.net/api/fan360/{fan_id}"
