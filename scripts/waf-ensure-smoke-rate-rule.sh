#!/usr/bin/env bash
set -euo pipefail

# Ensure a WAFv2 rate-based rule with a scope-down statement on a specific URI path exists (or is updated)
# Scope defaults to CLOUDFRONT (global). Region must be us-east-1 for CLOUDFRONT.
#
# Usage:
#   WEBACL_NAME=<name> [SCOPE=CLOUDFRONT] [REGION=us-east-1] [RULE_NAME=rate-limit-azure-smoke] \
#   [LIMIT=120] [ACTION=BLOCK] [URI_PATH=/api/ai/azure/smoke] \
#   ./scripts/waf-ensure-smoke-rate-rule.sh
#
# Requirements: awscli v2, jq

WEBACL_NAME=${WEBACL_NAME:-}
SCOPE=${SCOPE:-CLOUDFRONT}
REGION=${REGION:-us-east-1}
RULE_NAME=${RULE_NAME:-rate-limit-azure-smoke}
LIMIT=${LIMIT:-120}
ACTION=${ACTION:-BLOCK} # BLOCK|COUNT|CAPTCHA|CHALLENGE
URI_PATH=${URI_PATH:-/api/ai/azure/smoke}

[[ -z "$WEBACL_NAME" ]] && { echo "WEBACL_NAME is required" >&2; exit 2; }
command -v aws >/dev/null || { echo "aws not found" >&2; exit 2; }
command -v jq >/dev/null || { echo "jq not found" >&2; exit 2; }

echo "[WAF] Ensuring rule '$RULE_NAME' on WebACL '$WEBACL_NAME' (scope=$SCOPE, region=$REGION)"

WEBACL_ID=$(aws wafv2 list-web-acls --scope "$SCOPE" --region "$REGION" \
  --query "WebACLs[?Name=='$WEBACL_NAME'].Id | [0]" --output text)
[[ "$WEBACL_ID" == "None" || -z "$WEBACL_ID" ]] && { echo "WebACL not found: $WEBACL_NAME" >&2; exit 3; }

ACL=$(aws wafv2 get-web-acl --name "$WEBACL_NAME" --scope "$SCOPE" --id "$WEBACL_ID" --region "$REGION")
LOCK=$(jq -r '.LockToken' <<<"$ACL")

# Determine if rule exists and choose a priority
EXISTS=$(jq --arg rn "$RULE_NAME" -r '.WebACL.Rules[]? | select(.Name==$rn) | 1' <<<"$ACL" || true)
if [[ "$EXISTS" == "1" ]]; then
  PRIORITY=$(jq --arg rn "$RULE_NAME" -r '.WebACL.Rules[] | select(.Name==$rn) | .Priority' <<<"$ACL")
else
  # pick next available priority (use gaps of 10 for readability)
  MAXP=$(jq -r '[.WebACL.Rules[].Priority] | max // 0' <<<"$ACL")
  PRIORITY=$(( (MAXP + 10) - ( (MAXP + 10) % 10 ) ))
  if [[ "$PRIORITY" -le "$MAXP" ]]; then PRIORITY=$((MAXP+1)); fi
fi

echo "  - Using priority: $PRIORITY"

# Build the new/updated rule block
RULE=$(jq -n \
  --arg name "$RULE_NAME" \
  --argjson prio "$PRIORITY" \
  --arg action "$ACTION" \
  --argjson limit "$LIMIT" \
  --arg path "$URI_PATH" \
  '{
    Name: $name,
    Priority: $prio,
    Action: ( $action|ascii_downcase|. as $a | if $a=="block" then {Block:{}} elif $a=="count" then {Count:{}} elif $a=="captcha" then {Captcha:{}} else {Challenge:{}} end ),
    Statement: {
      RateBasedStatement: {
        Limit: $limit,
        AggregateKeyType: "IP",
        ScopeDownStatement: {
          ByteMatchStatement: {
            FieldToMatch: { UriPath: {} },
            PositionalConstraint: "EXACTLY",
            SearchString: $path,
            TextTransformations: [ { Priority: 0, Type: "NONE" } ]
          }
        }
      }
    },
    VisibilityConfig: {
      SampledRequestsEnabled: true,
      CloudWatchMetricsEnabled: true,
      MetricName: ("rate_limit_" + ($name|gsub("[^A-Za-z0-9_]";"_")))
    }
  }')

# Merge rule into ACL rules (replace or append)
UPDATED=$(jq --arg rn "$RULE_NAME" --argjson rule "$RULE" '
  .WebACL as $w | {
    Name: $w.Name,
    Scope: $w.Scope,
    Id: $w.Id,
    DefaultAction: $w.DefaultAction,
    Description: ($w.Description // null),
    Rules: (
      if ($w.Rules | any(.Name==$rn)) then
        ($w.Rules | map(if .Name==$rn then $rule else . end))
      else
        ($w.Rules + [$rule])
      end
    ),
    VisibilityConfig: $w.VisibilityConfig,
    LockToken: .LockToken
  }
' <<<"$ACL")

TMP=$(mktemp)
echo "$UPDATED" > "$TMP"
aws wafv2 update-web-acl --region "$REGION" --cli-input-json file://"$TMP" >/dev/null
rm -f "$TMP"
echo "[WAF] Rule '$RULE_NAME' ensured with limit=$LIMIT, action=$ACTION on path=$URI_PATH"

