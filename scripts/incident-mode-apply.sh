#!/usr/bin/env bash
set -euo pipefail

# Incident Mode Apply — US-EAST-1 impairment toggles
# - Freezes ECS service scale-out (via Application Auto Scaling suspend out)
# - Optionally suspends ASG Launch process
# - Throttles Lambda SQS Event Source Mappings (batch/window/concurrency, optionally disable)
# - Extends SQS VisibilityTimeout to cover slower processing
# - (Optional) Lowers WAFv2 rate-based rule limit on a specific rule
#
# Usage:
#   ./scripts/incident-mode-apply.sh scripts/incident-config.json [scripts/incident-state.json]
#
# Requirements: awscli v2, jq

CFG_PATH=${1:-scripts/incident-config.json}
STATE_PATH=${2:-scripts/incident-state.json}

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found" >&2; exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found" >&2; exit 1
fi
if [[ ! -f "$CFG_PATH" ]]; then
  echo "Config file not found: $CFG_PATH" >&2; exit 1
fi

REGION=$(jq -r '.region // "us-east-1"' "$CFG_PATH")

echo "[Incident-Apply] Region: $REGION"
date -Iseconds

tmpdir=$(mktemp -d)
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

echo '{"time":"'$(date -Iseconds)'","region":"'"$REGION"'","ecs":[],"asg":[],"lambdaMappings":[],"sqs":[],"waf":null}' > "$STATE_PATH"

# Helper: add JSON to array property in state file
add_state() {
  local key="$1" json="$2"
  jq --argjson item "$json" \
     --arg key "$key" \
     '.[$key] += [$item]' "$STATE_PATH" > "$STATE_PATH.tmp" && mv "$STATE_PATH.tmp" "$STATE_PATH"
}

# ---------- ECS & Application Auto Scaling ----------
if jq -e '.ecs and (.ecs|length>0)' "$CFG_PATH" >/dev/null; then
  echo "[ECS] Suspending scale-out on services..."
  jq -c '.ecs[]' "$CFG_PATH" | while read -r svc; do
    CLUSTER=$(jq -r '.cluster' <<<"$svc")
    SERVICE=$(jq -r '.service' <<<"$svc")
    if [[ -z "$CLUSTER" || -z "$SERVICE" ]]; then continue; fi

    echo "  - $CLUSTER / $SERVICE"
    DESIRED=$(aws ecs describe-services --region "$REGION" --cluster "$CLUSTER" --services "$SERVICE" \
      --query 'services[0].desiredCount' --output text || echo "0")
    # Re-assert desired (no-op but documents intent)
    aws ecs update-service --region "$REGION" --cluster "$CLUSTER" --service "$SERVICE" --desired-count "$DESIRED" >/dev/null || true

    # Determine resource-id for App Auto Scaling
    CLUSTER_NAME="$CLUSTER"
    if [[ "$CLUSTER_NAME" == arn:* ]]; then
      CLUSTER_NAME="${CLUSTER_NAME##*/}"
    fi
    RES_ID="service/$CLUSTER_NAME/$SERVICE"

    PREV=$(aws application-autoscaling describe-scalable-targets \
      --service-namespace ecs \
      --scalable-dimension ecs:service:DesiredCount \
      --resource-id "$RES_ID" \
      --query 'ScalableTargets[0].SuspendedState' --output json 2>/dev/null || echo '{}')

    add_state ecs "$(jq -n --arg cluster "$CLUSTER" --arg service "$SERVICE" --arg res "$RES_ID" --argjson prev "$PREV" --argjson desired "$DESIRED" '{cluster:$cluster,service:$service,resourceId:$res,prevSuspended:($prev // {}),desiredCount:$desired}')"

    cat > "$tmpdir/suspend.json" <<JSON
{ "DynamicScalingInSuspended": false, "DynamicScalingOutSuspended": true, "ScheduledScalingSuspended": false }
JSON
    aws application-autoscaling register-scalable-target \
      --service-namespace ecs \
      --scalable-dimension ecs:service:DesiredCount \
      --resource-id "$RES_ID" \
      --suspended-state file://"$tmpdir/suspend.json" >/dev/null
  done
fi

# ---------- ASG Launch suspend ----------
if jq -e '.asg and (.asg|length>0)' "$CFG_PATH" >/dev/null; then
  echo "[ASG] Suspending Launch process..."
  jq -r '.asg[]' "$CFG_PATH" | while read -r ASG; do
    [[ -z "$ASG" ]] && continue
    echo "  - $ASG"
    PREV=$(aws autoscaling describe-auto-scaling-groups --region "$REGION" --auto-scaling-group-names "$ASG" --query 'AutoScalingGroups[0].SuspendedProcesses' --output json)
    WAS_LAUNCH_SUSPENDED=$(jq -e '.[]?|select(.ProcessName=="Launch")' <<<"$PREV" >/dev/null && echo true || echo false)
    add_state asg "$(jq -n --arg name "$ASG" --argjson was "$WAS_LAUNCH_SUSPENDED" '{name:$name,wasLaunchSuspended:$was}')"
    aws autoscaling suspend-processes --region "$REGION" --auto-scaling-group-name "$ASG" --scaling-processes Launch >/dev/null
  done
fi

# ---------- Lambda ESM (SQS) throttling ----------
if jq -e '.lambda and (.lambda.functions|length>0)' "$CFG_PATH" >/dev/null; then
  echo "[Lambda] Throttling SQS event source mappings..."
  BATCH=$(jq -r '.lambda.apply.batchSize // 5' "$CFG_PATH")
  WINDOW=$(jq -r '.lambda.apply.maxWindow // 10' "$CFG_PATH")
  MAXCONC=$(jq -r '.lambda.apply.maxConcurrency // 5' "$CFG_PATH")
  DISABLE=$(jq -r '.lambda.apply.disable // false' "$CFG_PATH")
  jq -r '.lambda.functions[]' "$CFG_PATH" | while read -r FN; do
    [[ -z "$FN" ]] && continue
    echo "  - Function: $FN"
    MAPS=$(aws lambda list-event-source-mappings --region "$REGION" --function-name "$FN" --query 'EventSourceMappings' --output json)
    echo "$MAPS" | jq -c '.[]' | while read -r M; do
      UUID=$(jq -r '.UUID' <<<"$M")
      ARN=$(jq -r '.EventSourceArn // ""' <<<"$M")
      if [[ "$ARN" != arn:aws:sqs:$REGION:* ]]; then continue; fi
      FULL=$(aws lambda get-event-source-mapping --region "$REGION" --uuid "$UUID")
      PREV_BATCH=$(jq -r '.BatchSize' <<<"$FULL")
      PREV_WIN=$(jq -r '.MaximumBatchingWindowInSeconds // 0' <<<"$FULL")
      PREV_CONC=$(jq -r '.ScalingConfig.MaximumConcurrency // 0' <<<"$FULL")
      PREV_STATE=$(jq -r '.State' <<<"$FULL")
      ENABLED=true; [[ "$PREV_STATE" == "Disabled" ]] && ENABLED=false
      add_state lambdaMappings "$(jq -n --arg uuid "$UUID" --arg function "$FN" --arg eventSourceArn "$ARN" --argjson batch "$PREV_BATCH" --argjson window "$PREV_WIN" --argjson conc "$PREV_CONC" --argjson enabled "$ENABLED" '{uuid:$uuid,function:$function,eventSourceArn:$eventSourceArn,prev:{batch:$batch,window:$window,maxConcurrency:$conc,enabled:$enabled}}')"
      ARGS=(--uuid "$UUID" --batch-size "$BATCH" --maximum-batching-window-in-seconds "$WINDOW" --scaling-config MaximumConcurrency="$MAXCONC")
      if [[ "$DISABLE" == "true" ]]; then ARGS+=(--no-enabled); fi
      aws lambda update-event-source-mapping --region "$REGION" "${ARGS[@]}" >/dev/null
    done
  done
fi

# ---------- SQS visibility timeout ----------
if jq -e '.sqs and (.sqs.queueUrls|length>0)' "$CFG_PATH" >/dev/null; then
  echo "[SQS] Increasing VisibilityTimeout..."
  VIS=$(jq -r '.sqs.visibilityTimeout // 900' "$CFG_PATH")
  jq -r '.sqs.queueUrls[]' "$CFG_PATH" | while read -r QURL; do
    [[ -z "$QURL" ]] && continue
    PREV=$(aws sqs get-queue-attributes --region "$REGION" --queue-url "$QURL" --attribute-names VisibilityTimeout --query 'Attributes.VisibilityTimeout' --output text || echo "30")
    add_state sqs "$(jq -n --arg url "$QURL" --argjson prev $(printf %s "$PREV") '{queueUrl:$url,prevVisibility:($prev|tonumber)}')"
    aws sqs set-queue-attributes --region "$REGION" --queue-url "$QURL" --attributes VisibilityTimeout="$VIS" >/dev/null
    echo "  - $QURL: $PREV -> $VIS"
  done
fi

# ---------- WAFv2 rate-based rule limit (optional) ----------
if jq -e '.waf and .waf.enabled==true' "$CFG_PATH" >/dev/null; then
  echo "[WAF] Lowering rate-based rule limit..."
  SCOPE=$(jq -r '.waf.scope' "$CFG_PATH")
  WEBACL=$(jq -r '.waf.webAclName' "$CFG_PATH")
  RULENAME=$(jq -r '.waf.ruleName' "$CFG_PATH")
  NEWLIMIT=$(jq -r '.waf.newLimit' "$CFG_PATH")
  # List and get WebACL
  ID=$(aws wafv2 list-web-acls --scope "$SCOPE" --region "$REGION" --query "WebACLs[?Name=='$WEBACL'].Id|[0]" --output text)
  if [[ "$ID" == "None" || -z "$ID" ]]; then echo "  ! WebACL not found: $WEBACL"; else
    ACL=$(aws wafv2 get-web-acl --name "$WEBACL" --scope "$SCOPE" --id "$ID" --region "$REGION")
    LOCK=$(jq -r '.LockToken' <<<"$ACL")
    PREV_LIMIT=$(jq -r ".WebACL.Rules[]?|select(.Name==\"$RULENAME\").Statement.RateBasedStatement.Limit" <<<"$ACL")
    if [[ -z "$PREV_LIMIT" || "$PREV_LIMIT" == "null" ]]; then echo "  ! Rule not found or not rate-based: $RULENAME"; else
      # Build updated request
      jq --arg rn "$RULENAME" --argjson lim "$NEWLIMIT" '
        .WebACL as $w | {
          Name: $w.Name,
          Scope: $w.Scope,
          Id: $w.Id,
          DefaultAction: $w.DefaultAction,
          Description: ($w.Description // null),
          Rules: ($w.Rules | map(if .Name==$rn then .Statement.RateBasedStatement.Limit=$lim else . end)),
          VisibilityConfig: $w.VisibilityConfig,
          LockToken: .LockToken
        }' <<<"$ACL" > "$tmpdir/waf-update.json"
      aws wafv2 update-web-acl --region "$REGION" --cli-input-json file://"$tmpdir/waf-update.json" >/dev/null
      jq '.waf = {scope: $s, webAclName: $n, webAclId: $id, ruleName: $r, previousLimit: ($prev|tonumber), newLimit: ($new|tonumber)}' \
        --arg s "$SCOPE" --arg n "$WEBACL" --arg id "$ID" --arg r "$RULENAME" --argjson prev "$PREV_LIMIT" --argjson new "$NEWLIMIT" \
        "$STATE_PATH" > "$STATE_PATH.tmp" && mv "$STATE_PATH.tmp" "$STATE_PATH"
      echo "  - Rule $RULENAME: $PREV_LIMIT -> $NEWLIMIT"
    fi
  fi
fi

echo "[Incident-Apply] Done. State saved to $STATE_PATH"

