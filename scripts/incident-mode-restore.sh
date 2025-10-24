#!/usr/bin/env bash
set -euo pipefail

# Incident Mode Restore — revert toggles from incident-mode-apply
# Usage:
#   ./scripts/incident-mode-restore.sh scripts/incident-state.json

STATE_PATH=${1:-scripts/incident-state.json}

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found" >&2; exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found" >&2; exit 1
fi
if [[ ! -f "$STATE_PATH" ]]; then
  echo "State file not found: $STATE_PATH" >&2; exit 1
fi

REGION=$(jq -r '.region // "us-east-1"' "$STATE_PATH")
echo "[Incident-Restore] Region: $REGION"
date -Iseconds

# ---------- Restore WAF (if present) ----------
if jq -e '.waf != null' "$STATE_PATH" >/dev/null; then
  echo "[WAF] Restoring rate-based rule limit..."
  SCOPE=$(jq -r '.waf.scope' "$STATE_PATH")
  WEBACL=$(jq -r '.waf.webAclName' "$STATE_PATH")
  ID=$(jq -r '.waf.webAclId' "$STATE_PATH")
  RULENAME=$(jq -r '.waf.ruleName' "$STATE_PATH")
  PREV=$(jq -r '.waf.previousLimit' "$STATE_PATH")
  ACL=$(aws wafv2 get-web-acl --name "$WEBACL" --scope "$SCOPE" --id "$ID" --region "$REGION")
  jq --arg rn "$RULENAME" --argjson lim "$PREV" '
    .WebACL as $w | {
      Name: $w.Name,
      Scope: $w.Scope,
      Id: $w.Id,
      DefaultAction: $w.DefaultAction,
      Description: ($w.Description // null),
      Rules: ($w.Rules | map(if .Name==$rn then .Statement.RateBasedStatement.Limit=$lim else . end)),
      VisibilityConfig: $w.VisibilityConfig,
      LockToken: .LockToken
    }' <<<"$ACL" > /tmp/waf-update.json
  aws wafv2 update-web-acl --region "$REGION" --cli-input-json file:///tmp/waf-update.json >/dev/null
fi

# ---------- Restore SQS visibility timeouts ----------
if jq -e '.sqs and (.sqs|length>0)' "$STATE_PATH" >/dev/null; then
  echo "[SQS] Restoring VisibilityTimeout..."
  jq -c '.sqs[]' "$STATE_PATH" | while read -r item; do
    URL=$(jq -r '.queueUrl' <<<"$item")
    PREV=$(jq -r '.prevVisibility' <<<"$item")
    aws sqs set-queue-attributes --region "$REGION" --queue-url "$URL" --attributes VisibilityTimeout="$PREV" >/dev/null
    echo "  - $URL: restored to $PREV"
  done
fi

# ---------- Restore Lambda ESM settings ----------
if jq -e '.lambdaMappings and (.lambdaMappings|length>0)' "$STATE_PATH" >/dev/null; then
  echo "[Lambda] Restoring event source mappings..."
  jq -c '.lambdaMappings[]' "$STATE_PATH" | while read -r m; do
    UUID=$(jq -r '.uuid' <<<"$m")
    FN=$(jq -r '.function' <<<"$m")
    BATCH=$(jq -r '.prev.batch' <<<"$m")
    WIN=$(jq -r '.prev.window' <<<"$m")
    CONC=$(jq -r '.prev.maxConcurrency' <<<"$m")
    EN=$(jq -r '.prev.enabled' <<<"$m")
    echo "  - $FN / $UUID"
    ARGS=(--uuid "$UUID" --batch-size "$BATCH" --maximum-batching-window-in-seconds "$WIN")
    if [[ "$CONC" != "0" && "$CONC" != "null" ]]; then
      ARGS+=(--scaling-config MaximumConcurrency="$CONC")
    fi
    if [[ "$EN" == "true" ]]; then ARGS+=(--enabled); else ARGS+=(--no-enabled); fi
    aws lambda update-event-source-mapping --region "$REGION" "${ARGS[@]}" >/dev/null
  done
fi

# ---------- Restore ASG Launch process ----------
if jq -e '.asg and (.asg|length>0)' "$STATE_PATH" >/dev/null; then
  echo "[ASG] Restoring Launch process if we suspended it..."
  jq -c '.asg[]' "$STATE_PATH" | while read -r a; do
    NAME=$(jq -r '.name' <<<"$a")
    WAS=$(jq -r '.wasLaunchSuspended' <<<"$a")
    if [[ "$WAS" == "false" ]]; then
      aws autoscaling resume-processes --region "$REGION" --auto-scaling-group-name "$NAME" --scaling-processes Launch >/dev/null
      echo "  - $NAME: resumed Launch"
    else
      echo "  - $NAME: Launch was already suspended before incident; leaving as is"
    fi
  done
fi

# ---------- Restore ECS Application Auto Scaling ----------
if jq -e '.ecs and (.ecs|length>0)' "$STATE_PATH" >/dev/null; then
  echo "[ECS] Restoring Application Auto Scaling suspended state..."
  jq -c '.ecs[]' "$STATE_PATH" | while read -r e; do
    RES=$(jq -r '.resourceId' <<<"$e")
    PREV=$(jq -c '.prevSuspended' <<<"$e")
    DIN=$(jq -r '.DynamicScalingInSuspended // .prevSuspended.DynamicScalingInSuspended // false' <<<"$PREV")
    DOUT=$(jq -r '.DynamicScalingOutSuspended // .prevSuspended.DynamicScalingOutSuspended // false' <<<"$PREV")
    DSCH=$(jq -r '.ScheduledScalingSuspended // .prevSuspended.ScheduledScalingSuspended // false' <<<"$PREV")
    cat > /tmp/restore-suspend.json <<JSON
{ "DynamicScalingInSuspended": ${DIN}, "DynamicScalingOutSuspended": ${DOUT}, "ScheduledScalingSuspended": ${DSCH} }
JSON
    aws application-autoscaling register-scalable-target \
      --service-namespace ecs \
      --scalable-dimension ecs:service:DesiredCount \
      --resource-id "$RES" \
      --suspended-state file:///tmp/restore-suspend.json >/dev/null
    echo "  - $RES: restored suspended state"
  done
fi

echo "[Incident-Restore] Done."

