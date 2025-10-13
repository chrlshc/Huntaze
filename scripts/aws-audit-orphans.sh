#!/usr/bin/env bash
set -euo pipefail

# AWS Free-Tier/Orphan audit helper
# - Scans all (or selected) regions
# - Summarizes CloudWatch Alarms/Dashboards, SQS hot queues, Lambda recency, and KMS callers (via CloudTrail)
# Requirements: awscli; optional jq for nicer summaries

PROFILE=""
REGIONS=""
DAYS=7
INCLUDE_RE=""
EXCLUDE_RE=""

usage() {
  cat <<EOF
Usage: $0 [-p PROFILE] [-r "us-east-1 eu-west-1"] [-d DAYS] [-i INCLUDE_REGEX] [-x EXCLUDE_REGEX]

Examples:
  $0 -p myprofile
  $0 -p myprofile -r "us-east-1 eu-west-3" -d 3
  $0 -p myprofile -i 'byoid|onlyfans'   # filtrer par nom (insensible à la casse)

Notes:
  - jq is optional; without jq, KMS caller summary is less detailed.
  - CloudTrail event history keeps ~90 days of management events per region.
EOF
}

while getopts ":p:r:d:i:x:h" opt; do
  case $opt in
    p) PROFILE="--profile ${OPTARG}" ;;
    r) REGIONS="${OPTARG}" ;;
    d) DAYS="${OPTARG}" ;;
    i) INCLUDE_RE="${OPTARG}" ;;
    x) EXCLUDE_RE="${OPTARG}" ;;
    h) usage; exit 0 ;;
    :) echo "Option -$OPTARG requires an argument" >&2; usage; exit 1 ;;
    *) usage; exit 1 ;;
  esac
done

have_jq() { command -v jq >/dev/null 2>&1; }

# Compute ISO8601 UTC timestamps for start/end with cross-platform date
iso_now() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

iso_days_ago() {
  local days="$1"
  # Try BSD date (macOS)
  if date -v -1d +%s >/dev/null 2>&1; then
    date -u -v -"${days}"d +%Y-%m-%dT%H:%M:%SZ
  else
    # GNU date
    date -u -d "${days} days ago" +%Y-%m-%dT%H:%M:%SZ
  fi
}

get_regions() {
  if [ -n "$REGIONS" ]; then
    echo "$REGIONS"
  else
    aws ${PROFILE} ec2 describe-regions --all-regions --query 'Regions[].RegionName' --output text
  fi
}

section() { printf "\n==== %s ====\n" "$*"; }
info() { printf "[info] %s\n" "$*"; }
warn() { printf "[warn] %s\n" "$*"; }

match_name() {
  # returns 0 if name matches filters, 1 otherwise
  local name="$1"
  # Exclude takes precedence
  if [ -n "$EXCLUDE_RE" ] && echo "$name" | grep -Eiq "$EXCLUDE_RE"; then
    return 1
  fi
  if [ -n "$INCLUDE_RE" ]; then
    echo "$name" | grep -Eiq "$INCLUDE_RE"
    return $?
  fi
  return 0
}

START_TIME="$(iso_days_ago "$DAYS")"
END_TIME="$(iso_now)"

section "Audit window"
echo "From: ${START_TIME}  To: ${END_TIME}  (last ${DAYS} days)"

for REGION in $(get_regions); do
  section "Region ${REGION}"

  # CloudWatch Alarms
  ALARM_COUNT=$(aws ${PROFILE} --region "${REGION}" cloudwatch describe-alarms \
    --query 'length(MetricAlarms)' --output text 2>/dev/null || echo 0)
  echo "CloudWatch Alarms: ${ALARM_COUNT}"
  if [ "${ALARM_COUNT}" != "0" ]; then
    if [ -n "$INCLUDE_RE$EXCLUDE_RE" ]; then
      NAMES=$(aws ${PROFILE} --region "${REGION}" cloudwatch describe-alarms \
        --query 'MetricAlarms[].AlarmName' --output text 2>/dev/null || true)
      KEEP=0; DROP=0; for n in $NAMES; do if match_name "$n"; then KEEP=$((KEEP+1)); else DROP=$((DROP+1)); fi; done
      echo "  Filtered -> match: ${KEEP}, non-match: ${DROP}"
    fi
    # Show up to 10 oldest by StateUpdatedTimestamp
    info "Sample (<=10) oldest alarms:"
    aws ${PROFILE} --region "${REGION}" cloudwatch describe-alarms \
      --query 'sort_by(MetricAlarms,&StateUpdatedTimestamp)[].{Name:AlarmName,State:StateValue,Updated:StateUpdatedTimestamp}' \
      --output table | awk 'NR<=20{print}' || true
  fi

  # CloudWatch Dashboards
  DASH_COUNT=$(aws ${PROFILE} --region "${REGION}" cloudwatch list-dashboards \
    --query 'length(DashboardEntries)' --output text 2>/dev/null || echo 0)
  echo "CloudWatch Dashboards: ${DASH_COUNT}"
  if [ "${DASH_COUNT}" != "0" ] && [ -n "$INCLUDE_RE$EXCLUDE_RE" ]; then
    DNAMES=$(aws ${PROFILE} --region "${REGION}" cloudwatch list-dashboards \
      --query 'DashboardEntries[].DashboardName' --output text 2>/dev/null || true)
    KEEP=0; DROP=0; for n in $DNAMES; do if match_name "$n"; then KEEP=$((KEEP+1)); else DROP=$((DROP+1)); fi; done
    echo "  Filtered -> match: ${KEEP}, non-match: ${DROP}"
  fi

  # SQS Queues summary
  echo "SQS Queues (hot queues over last ${DAYS}d):"
  QURLS=$(aws ${PROFILE} --region "${REGION}" sqs list-queues --query 'QueueUrls' --output text 2>/dev/null || true)
  if [ -z "${QURLS}" ]; then
    echo "  (none)"
  else
    printf "%s\n" "QueueName,RecvWait(s),Sent(sum),Received(sum),Deleted(sum)"
    for QURL in ${QURLS}; do
      QNAME=$(echo "${QURL}" | awk -F/ '{print $NF}')
      if ! match_name "$QNAME"; then continue; fi
      ATTR_JSON=$(aws ${PROFILE} --region "${REGION}" sqs get-queue-attributes --queue-url "${QURL}" --attribute-names All --output json)
      RECV_WAIT=$(echo "${ATTR_JSON}" | jq -r '.Attributes.ReceiveMessageWaitTimeSeconds // "0"' 2>/dev/null || echo 0)

      # CloudWatch sums per metric
      MET_NS="AWS/SQS"
      PERIOD=$(( 3600 * 6 )) # 6h buckets to stay under API limits
      SENT=$(aws ${PROFILE} --region "${REGION}" cloudwatch get-metric-statistics \
        --namespace "${MET_NS}" --metric-name NumberOfMessagesSent \
        --dimensions Name=QueueName,Value="${QNAME}" \
        --start-time "${START_TIME}" --end-time "${END_TIME}" \
        --period ${PERIOD} --statistics Sum --query 'sum(Datapoints[].Sum)' --output text 2>/dev/null || echo 0)
      RECV=$(aws ${PROFILE} --region "${REGION}" cloudwatch get-metric-statistics \
        --namespace "${MET_NS}" --metric-name NumberOfMessagesReceived \
        --dimensions Name=QueueName,Value="${QNAME}" \
        --start-time "${START_TIME}" --end-time "${END_TIME}" \
        --period ${PERIOD} --statistics Sum --query 'sum(Datapoints[].Sum)' --output text 2>/dev/null || echo 0)
      DEL=$(aws ${PROFILE} --region "${REGION}" cloudwatch get-metric-statistics \
        --namespace "${MET_NS}" --metric-name NumberOfMessagesDeleted \
        --dimensions Name=QueueName,Value="${QNAME}" \
        --start-time "${START_TIME}" --end-time "${END_TIME}" \
        --period ${PERIOD} --statistics Sum --query 'sum(Datapoints[].Sum)' --output text 2>/dev/null || echo 0)

      printf "%s,%s,%s,%s,%s\n" "${QNAME}" "${RECV_WAIT}" "${SENT}" "${RECV}" "${DEL}"
    done | awk 'NR==1 || $3+$4+$5>0' | column -t -s, || true
  fi

  # Lambda recent functions + activity
  echo "Lambda Functions (recently modified, with invocations last ${DAYS}d):"
  FUNCS=$(aws ${PROFILE} --region "${REGION}" lambda list-functions --query 'Functions[].FunctionName' --output text 2>/dev/null || true)
  if [ -z "${FUNCS}" ]; then
    echo "  (none)"
  else
    echo "Name,LastModified,Invocations(sum)" | column -t -s,
    aws ${PROFILE} --region "${REGION}" lambda list-functions \
      --query 'Functions[].{Name:FunctionName,LastModified:LastModified}' --output json \
      | (have_jq && jq -r '.[]|[.Name,.LastModified]|@csv' || python - <<'PY'
import json,sys
for f in json.load(sys.stdin):
  print(','.join([f.get('Name',''),f.get('LastModified','')]))
PY
        ) | while IFS=, read -r NAME LASTMOD; do
          NAME=$(echo "$NAME" | sed 's/^"\|"$//g')
          LASTMOD=$(echo "$LASTMOD" | sed 's/^"\|"$//g')
          if ! match_name "$NAME"; then continue; fi
          INV=$(aws ${PROFILE} --region "${REGION}" cloudwatch get-metric-statistics \
            --namespace AWS/Lambda --metric-name Invocations \
            --dimensions Name=FunctionName,Value="${NAME}" \
            --start-time "${START_TIME}" --end-time "${END_TIME}" \
            --period 3600 --statistics Sum --query 'sum(Datapoints[].Sum)' --output text 2>/dev/null || echo 0)
          echo "${NAME},${LASTMOD},${INV}"
        done | column -t -s, | awk 'NR==1 || $3>0'
  fi

  # KMS callers via CloudTrail (Decrypt/Encrypt/GenerateDataKey), last N days
  echo "KMS top callers (CloudTrail, last ${DAYS}d):"
  CT_RAW=$(aws ${PROFILE} --region "${REGION}" cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventSource,AttributeValue=kms.amazonaws.com \
    --start-time "${START_TIME}" --end-time "${END_TIME}" \
    --max-results 50 2>/dev/null || true)
  if [ -z "${CT_RAW}" ]; then
    echo "  (no events or no permission)"
  else
    if have_jq; then
      echo "Caller,EventName,Count"
      RAW=$(echo "${CT_RAW}" | jq -r '.Events[].CloudTrailEvent' \
        | jq -r 'try (fromjson | [.userIdentity.arn, .eventName] | @tsv) catch empty')
      if [ -n "$INCLUDE_RE$EXCLUDE_RE" ]; then
        RAW=$(echo "$RAW" | while IFS=$'\t' read -r ARN ENAME; do
          NAME="$ARN"
          if match_name "$NAME"; then echo "$ARN\t$ENAME"; fi
        done)
      fi
      echo "$RAW" | awk -F"\t" '{key=$1","$2; c[key]++} END{for (k in c) print k","c[k]}' \
        | column -t -s, | sort -k3 -nr | awk 'NR<=10{print}'
    else
      echo "  (install jq for detailed summary)"
    fi
  fi

done

echo
section "Hints"
cat <<'EOT'
- SQS: haut volume => vérifier producteurs/consommateurs; activer long polling (ReceiveMessageWaitTimeSeconds=20) et batch.
- CloudWatch Alarms/Dashboards: si obsolètes, supprimer; regrouper en Composite Alarms si besoin.
- KMS: si appels par S3 (SSE-KMS), envisager S3 Bucket Keys; sinon identifier le service via CloudTrail (userIdentity.arn).
- Lambda: si aucune invocation récente et lié à ancien système, désactiver triggers & supprimer.
EOT
