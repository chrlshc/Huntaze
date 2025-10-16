#!/usr/bin/env bash
set -euo pipefail

# Cost Explorer breakdown helper for "EC2 - Other".
# - Prints top breakdowns by Usage Type Group, Usage Type, and Operation.
# - Defaults to month-to-date. Requires aws ce permissions.
#
# Usage:
#   bash scripts/aws-ce-ec2-other.sh                      # MTD, monthly
#   bash scripts/aws-ce-ec2-other.sh --daily              # daily granularity
#   bash scripts/aws-ce-ec2-other.sh --start 2025-10-01 --end 2025-10-29
#
START=${START:-$(date +%Y-%m-01)}
END=${END:-$(date +%F)}
GRANULARITY="MONTHLY"

print_help() {
  cat <<EOF
EC2 - Other cost breakdown (Cost Explorer)

Flags:
  --start YYYY-MM-DD     Start date (default: first of current month)
  --end YYYY-MM-DD       End date (default: today)
  --daily                Use DAILY granularity (default: MONTHLY)
  -h, --help             Show this help

Outputs:
  - Top by USAGE_TYPE_GROUP (e.g., EBS, Data Transfer, EIP, VPCE)
  - Top by USAGE_TYPE (specific line items)
  - Example: a focused daily view for a single day via --daily
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start) START=${2:?}; shift 2;;
    --end) END=${2:?}; shift 2;;
    --daily) GRANULARITY="DAILY"; shift;;
    -h|--help) print_help; exit 0;;
    *) echo "Unknown arg: $1" >&2; print_help; exit 1;;
  esac
done

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need aws

echo "[CE] EC2 - Other | $START → $END | $GRANULARITY"

echo "\n1) By USAGE_TYPE"
aws ce get-cost-and-usage \
  --time-period Start="$START",End="$END" \
  --granularity "$GRANULARITY" \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["EC2 - Other"]}}' \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=USAGE_TYPE \
  --output json | \
  jq -r '.ResultsByTime[].Groups[] | {k:.Keys[0], v:(.Metrics.UnblendedCost.Amount|tonumber)} | select(.v>0) | @tsv' 2>/dev/null | \
  sort -k2,2nr | head -20 | \
  awk -F"\t" '{printf "  - %-45s $%.2f\n", $1, $2}' || echo "  (Install jq for pretty output)"

echo "\n2) By OPERATION (useful on a spiky day; switch to --daily)"
aws ce get-cost-and-usage \
  --time-period Start="$START",End="$END" \
  --granularity "$GRANULARITY" \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["EC2 - Other"]}}' \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=OPERATION \
  --output json | \
  jq -r '.ResultsByTime[].Groups[] | {k:.Keys[0], v:(.Metrics.UnblendedCost.Amount|tonumber)} | select(.v>0) | @tsv' 2>/dev/null | \
  sort -k2,2nr | head -20 | \
  awk -F"\t" '{printf "  - %-35s $%.2f\n", $1, $2}' || echo "  (Install jq for pretty output)"

echo "\nTip: Add --daily to spot spikes or change --start/--end to a single day."
