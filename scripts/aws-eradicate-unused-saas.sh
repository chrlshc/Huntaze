#!/usr/bin/env bash
# ============================================================================
# AWS Eradicate Unused (SaaS) - Safe Interactive Cleanup
# ============================================================================
# Focus: remove/disable resources that are NOT used by the SaaS runtime but
# still generate charges (WAF/Config/SecurityHub/CloudTrail/Dashboards + us-west-1 leftovers).
#
# Notes:
# - Uses the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
# - If `.env.aws.local` exists and no AWS creds/profile are set, it will be sourced.
# - Nothing destructive runs without an explicit "yes".
# ============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.aws.local"

if [ -f "${ENV_FILE}" ] && [ -z "${AWS_ACCESS_KEY_ID:-}" ] && [ -z "${AWS_PROFILE:-}" ]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS credentials not configured or expired."
  echo "   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry."
  exit 1
fi

confirm() {
  local prompt="$1"
  local response
  read -r -p "${prompt} (yes/no): " response
  [ "${response}" = "yes" ]
}

iso_days_ago() {
  local days="$1"
  if date -v -1d +%s >/dev/null 2>&1; then
    date -u -v -"${days}"d +%Y-%m-%dT%H:%M:%SZ
  else
    date -u -d "${days} days ago" +%Y-%m-%dT%H:%M:%SZ
  fi
}

sum_metric() {
  local region="$1"
  local namespace="$2"
  local metric="$3"
  local dimension_name="$4"
  local dimension_value="$5"
  local start_time="$6"
  local end_time="$7"

  local value
  value=$(aws cloudwatch get-metric-statistics \
    --region "${region}" \
    --namespace "${namespace}" \
    --metric-name "${metric}" \
    --dimensions "Name=${dimension_name},Value=${dimension_value}" \
    --start-time "${start_time}" \
    --end-time "${end_time}" \
    --period 86400 \
    --statistics Sum \
    --query 'sum(Datapoints[].Sum)' \
    --output text 2>/dev/null || echo 0)

  if [ -z "${value}" ] || [ "${value}" = "None" ]; then
    echo 0
  else
    echo "${value}"
  fi
}

echo "🧹 AWS Eradicate Unused (SaaS)"
echo "=============================="
echo ""
echo "This will propose deleting/disabling resources that are NOT used by the current SaaS runtime."
echo "Nothing destructive will run unless you type 'yes' for each step."
echo ""

if ! confirm "Continue"; then
  echo "Cancelled."
  exit 0
fi

LOG_FILE="${ROOT_DIR}/aws-eradicate-unused-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Log: ${LOG_FILE}"
echo "" | tee "${LOG_FILE}" >/dev/null

# ----------------------------------------------------------------------------
# 1) WAFv2: delete unassociated WebACLs
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== WAFv2 (unused WebACLs) ==" | tee -a "${LOG_FILE}"

delete_waf_acl() {
  local name="$1"
  local id="$2"
  local scope="$3"
  local region="$4"

  local arn
  arn=$(aws wafv2 get-web-acl \
    --name "${name}" --id "${id}" --scope "${scope}" --region "${region}" \
    --query 'WebACL.ARN' --output text 2>/dev/null || true)
  if [ -z "${arn}" ] || [ "${arn}" = "None" ]; then
    echo "  ⚠️  Could not resolve ARN for ${name} (${scope} ${region})" | tee -a "${LOG_FILE}"
    return 0
  fi

  # Best-effort remove logging configuration first (can block deletion).
  aws wafv2 delete-logging-configuration --resource-arn "${arn}" --region "${region}" >/dev/null 2>&1 || true

  local lock_token
  lock_token=$(aws wafv2 get-web-acl \
    --name "${name}" --id "${id}" --scope "${scope}" --region "${region}" \
    --query 'LockToken' --output text 2>/dev/null || true)

  if [ -z "${lock_token}" ] || [ "${lock_token}" = "None" ]; then
    echo "  ⚠️  Could not resolve LockToken for ${name} (${scope} ${region})" | tee -a "${LOG_FILE}"
    return 0
  fi

  aws wafv2 delete-web-acl \
    --name "${name}" --id "${id}" --scope "${scope}" --region "${region}" \
    --lock-token "${lock_token}" 2>&1 | tee -a "${LOG_FILE}"
}

check_and_offer_delete_waf() {
  local scope="$1"
  local region="$2"

  local types=()
  if [ "${scope}" = "REGIONAL" ]; then
    types=(APPLICATION_LOAD_BALANCER API_GATEWAY APPSYNC COGNITO_USER_POOL VERIFIED_ACCESS_INSTANCE)
  else
    types=(CLOUDFRONT)
  fi

  while IFS=$'\t' read -r name id; do
      [ -z "${name}" ] && continue

      local arn
      arn=$(aws wafv2 get-web-acl \
        --name "${name}" --id "${id}" --scope "${scope}" --region "${region}" \
        --query 'WebACL.ARN' --output text 2>/dev/null || true)
      if [ -z "${arn}" ] || [ "${arn}" = "None" ]; then
        continue
      fi

      local associated="no"
      for t in "${types[@]}"; do
        local count
        count=$(aws wafv2 list-resources-for-web-acl \
          --web-acl-arn "${arn}" --resource-type "${t}" --region "${region}" \
          --query 'length(ResourceArns)' --output text 2>/dev/null || echo 0)
        count=${count/None/0}
        if [ "${count}" != "0" ]; then
          associated="yes"
          break
        fi
      done

      if [ "${associated}" = "yes" ]; then
        echo "  - KEEP (associated): ${name} (${scope} ${region})" | tee -a "${LOG_FILE}"
        continue
      fi

      echo "  - UNUSED (unassociated): ${name} (${scope} ${region})" | tee -a "${LOG_FILE}"
      if confirm "    Delete ${name}?"; then
        delete_waf_acl "${name}" "${id}" "${scope}" "${region}"
        echo "    ✅ Deleted ${name}" | tee -a "${LOG_FILE}"
      else
        echo "    ⏭️  Skipped ${name}" | tee -a "${LOG_FILE}"
      fi
    done < <(aws wafv2 list-web-acls \
      --scope "${scope}" --region "${region}" \
      --query 'WebACLs[].[Name,Id]' --output text 2>/dev/null || true)
}

check_and_offer_delete_waf REGIONAL us-east-1
check_and_offer_delete_waf REGIONAL us-east-2
check_and_offer_delete_waf REGIONAL us-west-1
check_and_offer_delete_waf CLOUDFRONT us-east-1

# ----------------------------------------------------------------------------
# 2) Security Hub: disable if enabled
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== Security Hub ==" | tee -a "${LOG_FILE}"

if aws securityhub describe-hub --region us-east-1 >/dev/null 2>&1; then
  echo "  - ENABLED: us-east-1" | tee -a "${LOG_FILE}"
  if confirm "  Disable Security Hub in us-east-1?"; then
    aws securityhub disable-security-hub --region us-east-1 2>&1 | tee -a "${LOG_FILE}"
    echo "  ✅ Disabled Security Hub (us-east-1)" | tee -a "${LOG_FILE}"
  else
    echo "  ⏭️  Skipped Security Hub disable" | tee -a "${LOG_FILE}"
  fi
else
  echo "  - DISABLED: us-east-1" | tee -a "${LOG_FILE}"
fi

# ----------------------------------------------------------------------------
# 3) AWS Config: stop/delete recorder in regions you don't use
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== AWS Config ==" | tee -a "${LOG_FILE}"

for region in us-east-1 us-west-1; do
  recorder_names=$(aws configservice describe-configuration-recorders \
    --region "${region}" --query 'ConfigurationRecorders[].name' --output text 2>/dev/null || true)
  if [ -z "${recorder_names}" ]; then
    echo "  - ${region}: no recorders" | tee -a "${LOG_FILE}"
    continue
  fi

  for recorder in ${recorder_names}; do
    recording=$(aws configservice describe-configuration-recorder-status \
      --region "${region}" --configuration-recorder-names "${recorder}" \
      --query 'ConfigurationRecordersStatus[0].recording' --output text 2>/dev/null || echo "unknown")
    echo "  - ${region}: recorder=${recorder} recording=${recording}" | tee -a "${LOG_FILE}"

    if [ "${recording}" = "True" ] && confirm "    Stop recorder ${recorder} in ${region}?"; then
      aws configservice stop-configuration-recorder \
        --configuration-recorder-name "${recorder}" --region "${region}" 2>&1 | tee -a "${LOG_FILE}"
      echo "    ✅ Stopped recorder ${recorder} (${region})" | tee -a "${LOG_FILE}"
    fi

    if confirm "    Delete AWS Config recorder+delivery channel in ${region}?"; then
      channels=$(aws configservice describe-delivery-channels \
        --region "${region}" --query 'DeliveryChannels[].name' --output text 2>/dev/null || true)
      for channel in ${channels}; do
        aws configservice delete-delivery-channel \
          --delivery-channel-name "${channel}" --region "${region}" 2>&1 | tee -a "${LOG_FILE}"
      done

      aws configservice delete-configuration-recorder \
        --configuration-recorder-name "${recorder}" --region "${region}" 2>&1 | tee -a "${LOG_FILE}"
      echo "    ✅ Deleted AWS Config in ${region}" | tee -a "${LOG_FILE}"
    fi
  done
done

# ----------------------------------------------------------------------------
# 4) CloudTrail: remove duplication + optionally remove S3 data events
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== CloudTrail ==" | tee -a "${LOG_FILE}"

trails=$(aws cloudtrail describe-trails --region us-east-1 --query 'trailList[].Name' --output text 2>/dev/null || true)
if [ -z "${trails}" ]; then
  echo "  - No trails found in us-east-1" | tee -a "${LOG_FILE}"
else
  echo "  Trails: ${trails}" | tee -a "${LOG_FILE}"
fi

if echo " ${trails} " | grep -q " huntaze-production-trail "; then
  echo "  - huntaze-production-trail has AdvancedEventSelectors (includes S3 write data events)" | tee -a "${LOG_FILE}"
  if confirm "  Remove S3 data events from huntaze-production-trail (keep management events only)?"; then
    read -r -d '' ADV_SELECTORS <<'JSON' || true
[{"Name":"Log all management events","FieldSelectors":[{"Field":"eventCategory","Equals":["Management"]}]}]
JSON
    aws cloudtrail put-event-selectors \
      --trail-name huntaze-production-trail \
      --region us-east-1 \
      --advanced-event-selectors "${ADV_SELECTORS}" 2>&1 | tee -a "${LOG_FILE}"
    echo "  ✅ Updated huntaze-production-trail selectors" | tee -a "${LOG_FILE}"
  fi
fi

if echo " ${trails} " | grep -q " huntaze-trail "; then
  echo "  - huntaze-trail is a second multi-region trail (duplicate management events)" | tee -a "${LOG_FILE}"
  if confirm "  Delete duplicate trail huntaze-trail?"; then
    aws cloudtrail stop-logging --name huntaze-trail --region us-east-1 >/dev/null 2>&1 || true
    aws cloudtrail delete-trail --name huntaze-trail --region us-east-1 2>&1 | tee -a "${LOG_FILE}"
    echo "  ✅ Deleted huntaze-trail" | tee -a "${LOG_FILE}"
  fi
fi

# ----------------------------------------------------------------------------
# 5) CloudWatch Dashboards: delete in unused regions (common hidden cost)
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== CloudWatch Dashboards ==" | tee -a "${LOG_FILE}"

for region in us-west-1 us-east-2 us-east-1; do
  count=$(aws cloudwatch list-dashboards --region "${region}" \
    --query 'length(DashboardEntries)' --output text 2>/dev/null || echo 0)
  count=${count/None/0}
  if [ "${count}" = "0" ]; then
    echo "  - ${region}: 0 dashboards" | tee -a "${LOG_FILE}"
    continue
  fi

  echo "  - ${region}: ${count} dashboards" | tee -a "${LOG_FILE}"
  if confirm "    Delete ALL dashboards in ${region}?"; then
    names=$(aws cloudwatch list-dashboards --region "${region}" \
      --query 'DashboardEntries[].DashboardName' --output text 2>/dev/null || true)
    if [ -n "${names}" ]; then
      # shellcheck disable=SC2086
      aws cloudwatch delete-dashboards --region "${region}" --dashboard-names ${names} 2>&1 | tee -a "${LOG_FILE}"
      echo "    ✅ Deleted dashboards in ${region}" | tee -a "${LOG_FILE}"
    fi
  fi
done

# ----------------------------------------------------------------------------
# 6) us-west-1 leftovers: empty ECS cluster + idle Lambdas + idle SQS queue
# ----------------------------------------------------------------------------
echo "" | tee -a "${LOG_FILE}"
echo "== us-west-1 leftovers ==" | tee -a "${LOG_FILE}"

START_30D="$(iso_days_ago 30)"
END_NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ECS empty clusters
while IFS= read -r cluster_arn; do
    [ -z "${cluster_arn}" ] && continue
    cluster_name="$(basename "${cluster_arn}")"
    services_count=$(aws ecs list-services --cluster "${cluster_name}" --region us-west-1 \
      --query 'length(serviceArns)' --output text 2>/dev/null || echo 0)
    services_count=${services_count/None/0}
    if [ "${services_count}" = "0" ]; then
      echo "  - EMPTY ECS cluster: ${cluster_name}" | tee -a "${LOG_FILE}"
      if confirm "    Delete ECS cluster ${cluster_name} (us-west-1)?"; then
        aws ecs delete-cluster --cluster "${cluster_name}" --region us-west-1 2>&1 | tee -a "${LOG_FILE}"
        echo "    ✅ Deleted ${cluster_name}" | tee -a "${LOG_FILE}"
      fi
    fi
  done < <(aws ecs list-clusters --region us-west-1 --query 'clusterArns[]' --output text 2>/dev/null \
    | tr '\t' '\n')

# Idle Lambdas (0 invocations last 30d)
lambda_names=$(aws lambda list-functions --region us-west-1 --query 'Functions[].FunctionName' --output text 2>/dev/null || true)
if [ -n "${lambda_names}" ]; then
  echo "  - Lambda functions in us-west-1 (checking invocations last 30d)..." | tee -a "${LOG_FILE}"
  while IFS= read -r fn; do
    [ -z "${fn}" ] && continue
    invocations=$(sum_metric us-west-1 AWS/Lambda Invocations FunctionName "${fn}" "${START_30D}" "${END_NOW}")
    if [ "${invocations}" = "0" ] || [ "${invocations}" = "0.0" ]; then
      echo "    - IDLE: ${fn} invocations=${invocations}" | tee -a "${LOG_FILE}"
      if confirm "      Delete Lambda ${fn} (us-west-1)?"; then
        aws lambda delete-function --function-name "${fn}" --region us-west-1 2>&1 | tee -a "${LOG_FILE}"
        echo "      ✅ Deleted ${fn}" | tee -a "${LOG_FILE}"
      fi
    else
      echo "    - KEEP: ${fn} invocations=${invocations}" | tee -a "${LOG_FILE}"
    fi
  done < <(printf '%s\n' "${lambda_names}" | tr '\t' '\n')
fi

# Idle SQS queue (0 sent/received/deleted last 30d)
qname="huntaze-video-processing-production"
qurl=$(aws sqs get-queue-url --region us-west-1 --queue-name "${qname}" --query 'QueueUrl' --output text 2>/dev/null || true)
if [ -n "${qurl}" ] && [ "${qurl}" != "None" ]; then
  sent=$(sum_metric us-west-1 AWS/SQS NumberOfMessagesSent QueueName "${qname}" "${START_30D}" "${END_NOW}")
  recv=$(sum_metric us-west-1 AWS/SQS NumberOfMessagesReceived QueueName "${qname}" "${START_30D}" "${END_NOW}")
  del=$(sum_metric us-west-1 AWS/SQS NumberOfMessagesDeleted QueueName "${qname}" "${START_30D}" "${END_NOW}")
  echo "  - SQS ${qname}: sent=${sent} received=${recv} deleted=${del} (last 30d)" | tee -a "${LOG_FILE}"
  if [ "${sent}" = "0" ] && [ "${recv}" = "0" ] && [ "${del}" = "0" ]; then
    if confirm "    Delete SQS queue ${qname} (us-west-1)?"; then
      aws sqs delete-queue --queue-url "${qurl}" --region us-west-1 2>&1 | tee -a "${LOG_FILE}"
      echo "    ✅ Deleted ${qname}" | tee -a "${LOG_FILE}"
    fi
  fi
fi

echo "" | tee -a "${LOG_FILE}"
echo "✅ Done. Log saved to: ${LOG_FILE}" | tee -a "${LOG_FILE}"
