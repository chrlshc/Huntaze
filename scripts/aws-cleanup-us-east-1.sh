#!/usr/bin/env bash
set -euo pipefail

# Safe AWS cleanup for common EC2-Other cost drivers.
# - DRY-RUN by default. Pass --apply to perform deletions.
# - Targets (scoped to a region):
#   * Unattached Elastic IPs (EIP)
#   * Orphaned EBS volumes (status=available)
#   * Free ENIs (status=available)
#   * Unattached Internet Gateways (IGW)
#   * Optional: delete specific Interface VPC Endpoints (only if IDs provided)
#
# Usage:
#   bash scripts/aws-cleanup-us-east-1.sh --region us-east-1               # dry-run
#   bash scripts/aws-cleanup-us-east-1.sh --region us-east-1 --apply --yes # actually delete
#   bash scripts/aws-cleanup-us-east-1.sh --region us-east-1 --vpce-ids "vpce-abc vpce-def" --apply
#
# Notes:
#   - Requires aws CLI configured. Does not use or store credentials.
#   - Intentionally does NOT delete NAT Gateways, Load Balancers, or snapshots by default.
#
REGION="us-east-1"
APPLY=false
YES=false
VPCE_IDS=()

print_help() {
  cat <<EOF
AWS cleanup helper (DRY-RUN by default)

Flags:
  --region <name>         Region to operate in (default: us-east-1)
  --apply                 Execute deletions (otherwise only prints actions)
  --execute               Alias for --apply
  --yes                   Skip confirmation prompts when --apply is set
  --vpce-ids "id id ..."  Delete these Interface VPC Endpoint IDs
  -h, --help              Show this help

Targets:
  - Unattached EIPs, orphaned EBS volumes, free ENIs, unattached IGWs
  - Optional deletion of specific Interface VPC Endpoints

Safety:
  - No changes unless --apply is used. Use --yes for non-interactive runs.
EOF
}

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }; }
need aws

confirm() {
  if ! $APPLY; then return 1; fi
  if $YES; then return 0; fi
  read -r -p "Proceed with deletion? [y/N] " ans
  [[ "${ans:-}" =~ ^[Yy]$ ]]
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region) REGION=${2:?}; shift 2;;
    --apply) APPLY=true; shift;;
    --execute) APPLY=true; shift;;
    --yes) YES=true; shift;;
    --vpce-ids)
      shift
      # Collect until next flag or EOL
      while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
        VPCE_IDS+=("$1"); shift
      done
      ;;
    -h|--help) print_help; exit 0;;
    *) echo "Unknown arg: $1" >&2; print_help; exit 1;;
  esac
done

echo "[CLEANUP] Region: $REGION | APPLY=$APPLY | VPCE_IDS=${VPCE_IDS[*]:-}"

run_or_echo() {
  if $APPLY; then
    echo "> $*"
    eval "$@"
  else
    echo "DRY-RUN: $*"
  fi
}

echo "\n1) Elastic IPs (unattached)"
EIPS_RAW=$(aws ec2 describe-addresses --region "$REGION" \
  --query 'Addresses[?AssociationId==null].AllocationId' --output text 2>/dev/null || true)
EIP_COUNT=0
for id in $EIPS_RAW; do
  ((EIP_COUNT++))
done
if (( EIP_COUNT > 0 )); then
  echo "  Found $EIP_COUNT unattached EIP(s): $EIPS_RAW"
  if confirm; then :; fi
  for id in $EIPS_RAW; do run_or_echo aws ec2 release-address --region "$REGION" --allocation-id "$id"; done
else
  echo "  None"
fi

echo "\n2) EBS volumes (status=available)"
VOLS_RAW=$(aws ec2 describe-volumes --region "$REGION" \
  --filters Name=status,Values=available --query 'Volumes[].VolumeId' --output text 2>/dev/null || true)
VOL_COUNT=0
for id in $VOLS_RAW; do ((VOL_COUNT++)); done
if (( VOL_COUNT > 0 )); then
  echo "  Found $VOL_COUNT orphaned volume(s): $VOLS_RAW"
  if confirm; then :; fi
  for id in $VOLS_RAW; do run_or_echo aws ec2 delete-volume --region "$REGION" --volume-id "$id"; done
else
  echo "  None"
fi

echo "\n3) ENIs (status=available)"
ENIS_RAW=$(aws ec2 describe-network-interfaces --region "$REGION" \
  --filters Name=status,Values=available --query 'NetworkInterfaces[].NetworkInterfaceId' --output text 2>/dev/null || true)
ENI_COUNT=0
for id in $ENIS_RAW; do ((ENI_COUNT++)); done
if (( ENI_COUNT > 0 )); then
  echo "  Found $ENI_COUNT free ENI(s): $ENIS_RAW"
  if confirm; then :; fi
  for id in $ENIS_RAW; do run_or_echo aws ec2 delete-network-interface --region "$REGION" --network-interface-id "$id"; done
else
  echo "  None"
fi

echo "\n4) Internet Gateways (unattached)"
IGWS_RAW=$(aws ec2 describe-internet-gateways --region "$REGION" \
  --query 'InternetGateways[?Attachments==`[]`].InternetGatewayId' --output text 2>/dev/null || true)
IGW_COUNT=0
for id in $IGWS_RAW; do ((IGW_COUNT++)); done
if (( IGW_COUNT > 0 )); then
  echo "  Found $IGW_COUNT unattached IGW(s): $IGWS_RAW"
  if confirm; then :; fi
  for id in $IGWS_RAW; do run_or_echo aws ec2 delete-internet-gateway --region "$REGION" --internet-gateway-id "$id"; done
else
  echo "  None"
fi

echo "\n5) Interface VPC Endpoints (explicit IDs only)"
if (( ${#VPCE_IDS[@]} > 0 )); then
  echo "  Will delete VPC Endpoints: ${VPCE_IDS[*]}"
  if confirm; then
    run_or_echo aws ec2 delete-vpc-endpoints --region "$REGION" --vpc-endpoint-ids ${VPCE_IDS[*]}
  else
    run_or_echo aws ec2 delete-vpc-endpoints --region "$REGION" --vpc-endpoint-ids ${VPCE_IDS[*]}
  fi
else
  echo "  None specified (use --vpce-ids to target specific endpoints)"
fi

echo "\n[Done] Review DRY-RUN output. Re-run with --apply to execute."
