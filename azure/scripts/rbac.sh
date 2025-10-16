#!/usr/bin/env bash
set -euo pipefail

: "${SUBSCRIPTION_ID:=}"
: "${RESOURCE_GROUP:=huntaze-ai-rg}"
: "${FUNC_APP:=huntaze-func-app}"

# Resource IDs to target (provide if you want RBAC assigned)
# Example: /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<name>
: "${AOAI_RESOURCE_ID:=}"
: "${CS_RESOURCE_ID:=}"
: "${TA_RESOURCE_ID:=}"
: "${COSMOS_ACCOUNT_ID:=}"
: "${SB_NAMESPACE_ID:=}"

[[ -n "$SUBSCRIPTION_ID" ]] && az account set --subscription "$SUBSCRIPTION_ID"

PRINCIPAL_ID=$(az functionapp identity show -n "$FUNC_APP" -g "$RESOURCE_GROUP" --query principalId -o tsv)
if [[ -z "$PRINCIPAL_ID" ]]; then
  echo "Function App has no system-assigned identity; run: az functionapp identity assign -n $FUNC_APP -g $RESOURCE_GROUP" >&2
  exit 1
fi
echo "[*] Function MI: $PRINCIPAL_ID"

assign() {
  local scope="$1" role="$2"
  if [[ -n "$scope" ]]; then
    echo "  -> $role on $scope"
    az role assignment create --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal \
      --role "$role" --scope "$scope" >/dev/null || true
  fi
}

assign "$AOAI_RESOURCE_ID" "Cognitive Services OpenAI User"
assign "$CS_RESOURCE_ID" "Cognitive Services User"
assign "$TA_RESOURCE_ID" "Cognitive Services User"
assign "$COSMOS_ACCOUNT_ID" "Cosmos DB Built-in Data Contributor"
assign "$SB_NAMESPACE_ID" "Azure Service Bus Data Sender"

echo "RBAC assignments attempted (idempotent)."

