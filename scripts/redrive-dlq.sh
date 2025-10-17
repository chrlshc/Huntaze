#!/usr/bin/env bash
set -euo pipefail

# Redrive DLQ -> main queue using AWS SQS StartMessageMoveTask
# Safe-by-default: confirms, supports dry-run, rate limiting, and progress polling.
#
# Usage:
#   scripts/redrive-dlq.sh \
#     --source-arn arn:aws:sqs:eu-west-1:123456789012:my-queue-dlq \
#     --destination-arn arn:aws:sqs:eu-west-1:123456789012:my-queue \
#     --region eu-west-1 \
#     --max-pps 50 \
#     --wait \
#     --yes
#
# Notes:
# - Requires AWS CLI v2 and permissions for sqs:StartMessageMoveTask, sqs:ListMessageMoveTasks, sqs:GetQueueAttributes.
# - Works for Standard and FIFO queues. (Manual requeue is NOT attempted; we rely on StartMessageMoveTask.)

SRC_ARN=""
DST_ARN=""
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
MAX_PPS=50
POLL=5
DRY_RUN=0
AUTO_YES=0
WAIT=0

err() { echo "✖ $*" >&2; exit 1; }
info(){ echo "• $*"; }
ok()  { echo "✔ $*"; }
warn(){ echo "⚠ $*"; }

need() {
  command -v "$1" >/dev/null 2>&1 || err "Missing dependency: $1"
}

arn_to_url() {
  # arn:aws:sqs:<region>:<acct>:<name> -> https://sqs.<region>.amazonaws.com/<acct>/<name>
  local arn="$1"
  IFS=: read -r _ arn_aws sqs region acct name <<<"$arn"
  [[ "$arn_aws" == "aws" && "$sqs" == "sqs" ]] || err "Invalid SQS ARN: $arn"
  echo "https://sqs.${region}.amazonaws.com/${acct}/${name}"
}

get_attr() {
  local url="$1" attr="$2"
  aws sqs get-queue-attributes \
    --queue-url "$url" \
    --attribute-names "$attr" \
    ${REGION:+--region "$REGION"} \
    --query "Attributes.${attr}" --output text
}

visible_count() {
  get_attr "$1" "ApproximateNumberOfMessages"
}

not_visible_count() {
  get_attr "$1" "ApproximateNumberOfMessagesNotVisible"
}

usage() {
  cat <<EOF
Usage: $0 --source-arn ARN --destination-arn ARN [--region REGION] [--max-pps N] [--poll S] [--wait] [--dry-run] [--yes]

  --source-arn        DLQ ARN (source)
  --destination-arn   Main queue ARN (destination)
  --region            AWS region (defaults to env AWS_REGION/AWS_DEFAULT_REGION)
  --max-pps           Max messages per second to move (default: 50)
  --poll              Progress poll interval seconds (default: 5)
  --wait              Wait until DLQ visible == 0 (monitor progress)
  --dry-run           Show what would happen, do not move
  --yes               Skip confirmation prompt
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --source-arn) SRC_ARN="$2"; shift 2;;
    --destination-arn) DST_ARN="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    --max-pps) MAX_PPS="$2"; shift 2;;
    --poll) POLL="$2"; shift 2;;
    --wait) WAIT=1; shift;;
    --dry-run) DRY_RUN=1; shift;;
    --yes|-y) AUTO_YES=1; shift;;
    -h|--help) usage; exit 0;;
    *) err "Unknown arg: $1";;
  esac
done

[ -n "$SRC_ARN" ] || { usage; err "Missing --source-arn"; }
[ -n "$DST_ARN" ] || { usage; err "Missing --destination-arn"; }
[ -n "${REGION:-}" ] || err "Missing --region (or set AWS_REGION)"
[[ "$SRC_ARN" != "$DST_ARN" ]] || err "Source and destination must differ"

need aws

SRC_URL=$(arn_to_url "$SRC_ARN")
DST_URL=$(arn_to_url "$DST_ARN")

info "Region:          $REGION"
info "Source DLQ ARN:  $SRC_ARN"
info "Source DLQ URL:  $SRC_URL"
info "Dest   ARN:      $DST_ARN"
info "Dest   URL:      $DST_URL"
info "Max PPS:         $MAX_PPS"
info "Poll interval:   ${POLL}s"
[ $DRY_RUN -eq 1 ] && warn "DRY-RUN MODE (no changes will be made)"

# Pre-flight stats
DLQ_VIS=$(visible_count "$SRC_URL" || echo "N/A")
DLQ_NOTVIS=$(not_visible_count "$SRC_URL" || echo "N/A")
MAIN_VIS=$(visible_count "$DST_URL" || echo "N/A")
info "DLQ visible:     $DLQ_VIS"
info "DLQ in-flight:   $DLQ_NOTVIS"
info "Main visible:    $MAIN_VIS"

if [ $DRY_RUN -eq 0 ] && [ $AUTO_YES -eq 0 ]; then
  read -r -p "Proceed with redrive from DLQ to main at ${MAX_PPS} msg/s? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || err "Aborted by user"
fi

if [ $DRY_RUN -eq 1 ]; then
  ok "Dry-run complete. No redrive executed."
  exit 0
fi

info "Starting SQS message move task..."
# Kick off move task (no need to parse handle; we'll monitor via DLQ depth)
aws sqs start-message-move-task \
  --source-arn "$SRC_ARN" \
  --destination-arn "$DST_ARN" \
  --max-number-of-messages-per-second "$MAX_PPS" \
  --region "$REGION" >/dev/null

ok "Move task started."

if [ $WAIT -eq 1 ]; then
  info "Waiting for DLQ to drain (poll ${POLL}s)..."
  last="-1"
  stagnant=0
  while true; do
    sleep "$POLL"
    now=$(visible_count "$SRC_URL" || echo "0")
    infl=$(not_visible_count "$SRC_URL" || echo "0")
    echo "  -> DLQ visible: ${now}, in-flight: ${infl}"
    if [[ "$now" == "0" ]]; then
      ok "DLQ drained."
      break
    fi
    if [[ "$now" == "$last" ]]; then
      stagnant=$((stagnant+1))
      if [ $stagnant -ge 6 ]; then
        warn "DLQ depth unchanged for $((stagnant * POLL))s. Move may be complete or paused. Exiting monitor."
        break
      fi
    else
      stagnant=0
    fi
    last="$now"
  done
fi

ok "Redrive initiated. Verify on dashboard / metrics as needed."

