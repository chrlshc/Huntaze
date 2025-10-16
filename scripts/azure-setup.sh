#!/usr/bin/env bash
set -euo pipefail

# Azure AI Foundry (AI Hub + Project) bootstrap script
# Prereqs: az CLI installed and logged in: az login

LOCATION=${LOCATION:-eastus}
RG=${RG:-huntaze-ai}
HUB=${HUB:-huntaze-ai-hub}
PROJECT=${PROJECT:-huntaze-agents}

echo "[Azure] Ensuring resource group ${RG} in ${LOCATION}"
az group create --name "${RG}" --location "${LOCATION}" >/dev/null

echo "[Azure] Installing ml extension (if missing)"
az extension add --name ml >/dev/null 2>&1 || az extension update --name ml >/dev/null 2>&1 || true

echo "[Azure] Creating AI Hub: ${HUB}"
az ml workspace create \
  --name "${HUB}" \
  --resource-group "${RG}" \
  --location "${LOCATION}" \
  --kind hub >/dev/null

echo "[Azure] Creating AI Project: ${PROJECT}"
HUB_ID=$(az ml workspace show --name "${HUB}" --resource-group "${RG}" --query id -o tsv)
az ml workspace create \
  --name "${PROJECT}" \
  --resource-group "${RG}" \
  --kind project \
  --hub-id "${HUB_ID}" >/dev/null

echo "Done. Configure AZURE_AI_PROJECT_ENDPOINT for the project endpoint in your environment."

