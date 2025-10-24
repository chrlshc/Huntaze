#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DISTRIBUTION_ID=E123456789 POLICY_NAME=huntaze-security-headers-v1 \
#   ./scripts/cloudfront-attach-headers.sh infra/cloudfront/response-headers-policy.json
#
# Requires AWS CLI v2 and credentials with CloudFront permissions.

JSON_FILE=${1:-infra/cloudfront/response-headers-policy.json}
: "${DISTRIBUTION_ID:?Set DISTRIBUTION_ID}"
POLICY_NAME=${POLICY_NAME:-huntaze-security-headers-v1}

echo "Looking up existing Response Headers Policy: ${POLICY_NAME}"
set +e
EXISTING_ID=$(aws cloudfront list-response-headers-policies \
  --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${POLICY_NAME}'].ResponseHeadersPolicy.Id | [0]" \
  --output text 2>/dev/null)
set -e

if [[ -z "${EXISTING_ID}" || "${EXISTING_ID}" == "None" ]]; then
  echo "Creating policy from ${JSON_FILE}"
  EXISTING_ID=$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config file://${JSON_FILE} \
    --query 'ResponseHeadersPolicy.Id' --output text)
  echo "Created policy: ${EXISTING_ID}"
else
  echo "Found existing policy: ${EXISTING_ID}"
fi

echo "Fetching distribution config for ${DISTRIBUTION_ID}"
aws cloudfront get-distribution-config --id "${DISTRIBUTION_ID}" --output json > /tmp/dist.json
ETAG=$(jq -r .ETag /tmp/dist.json)

# Extract DistributionConfig for update
jq '.DistributionConfig' /tmp/dist.json > /tmp/dist-config.json

# Set ResponseHeadersPolicyId on default and all cache behaviors
jq --arg pid "${EXISTING_ID}" '
  (.DefaultCacheBehavior.ResponseHeadersPolicyId = $pid)
  | (if .CacheBehaviors and .CacheBehaviors.Quantity > 0 then (.CacheBehaviors.Items |= map(.ResponseHeadersPolicyId = $pid)) else . end)
' /tmp/dist-config.json > /tmp/dist-config-updated.json

echo "Updating distribution to attach policy ${EXISTING_ID} (default + all behaviors)"
aws cloudfront update-distribution \
  --id "${DISTRIBUTION_ID}" \
  --if-match "${ETAG}" \
  --distribution-config file:///tmp/dist-config-updated.json >/dev/null

echo "Done. Consider invalidating cache if needed (usually not required for headers)."
