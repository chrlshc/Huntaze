#!/usr/bin/env bash
set -euo pipefail

# Dry-run cleanup helper for common EC2/VPC cost culprits.
# By default, prints actions it would take. Use --execute to actually delete.
#
# Targets:
# - Unattached EIPs (release)
# - Unattached EBS volumes (delete)
# - Available ENIs (delete)
# - Interface VPC Endpoints (delete) matching a regex filter
# - Unattached Internet Gateways (delete)
#
# Usage:
#   ./scripts/ec2-cleanup-dryrun.sh -p myprofile -r us-east-1                 # dry-run
#   ./scripts/ec2-cleanup-dryrun.sh -p myprofile -r us-east-1 --execute       # confirm + execute
#   ./scripts/ec2-cleanup-dryrun.sh -p myprofile -r us-east-1 -i 'ssm|logs'   # only endpoints matching regex

PROFILE=""
REGION="us-east-1"
EXECUTE=0
ENDPOINT_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--profile) PROFILE="--profile $2"; shift 2 ;;
    -r|--region) REGION="$2"; shift 2 ;;
    --execute) EXECUTE=1; shift ;;
    -i|--endpoint-filter) ENDPOINT_FILTER="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Usage: $0 [-p PROFILE] [-r REGION] [--execute] [-i REGEX]

Deletes:
  - Unattached EIPs, EBS volumes, ENIs
  - Interface VPC Endpoints matching REGEX (optional)
  - Unattached Internet Gateways

Dry-run by default. Use --execute to apply changes.
EOF
      exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

AWS=(aws ${PROFILE} --region "${REGION}")

confirm() {
  local prompt="$1"; local ans
  read -r -p "$prompt [y/N]: " ans || ans=""
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

action() {
  if [[ $EXECUTE -eq 1 ]]; then
    echo "[exec] $*"; eval "$@"
  else
    echo "[dry]  $*"
  fi
}

echo "Region: ${REGION}  (execute=${EXECUTE})"

echo "\n== Unattached Elastic IPs =="
mapfile -t EIP_IDS < <(${AWS[@]} ec2 describe-addresses --query 'Addresses[?AssociationId==null].AllocationId' --output text 2>/dev/null | tr '\t' '\n' | sed '/^$/d')
if [[ ${#EIP_IDS[@]} -eq 0 ]]; then echo "(none)"; else printf '%s\n' "${EIP_IDS[@]}"; fi
if [[ ${#EIP_IDS[@]} -gt 0 ]]; then
  if [[ $EXECUTE -eq 1 ]]; then confirm "Release ${#EIP_IDS[@]} EIP(s)?" && for id in "${EIP_IDS[@]}"; do action "${AWS[*]} ec2 release-address --allocation-id $id"; done; else echo "(use --execute to release)"; fi
fi

echo "\n== Unattached EBS volumes =="
mapfile -t VOL_IDS < <(${AWS[@]} ec2 describe-volumes --filters Name=status,Values=available --query 'Volumes[].VolumeId' --output text 2>/dev/null | tr '\t' '\n' | sed '/^$/d')
if [[ ${#VOL_IDS[@]} -eq 0 ]]; then echo "(none)"; else printf '%s\n' "${VOL_IDS[@]}"; fi
if [[ ${#VOL_IDS[@]} -gt 0 ]]; then
  if [[ $EXECUTE -eq 1 ]]; then confirm "Delete ${#VOL_IDS[@]} volume(s)?" && for id in "${VOL_IDS[@]}"; do action "${AWS[*]} ec2 delete-volume --volume-id $id"; done; else echo "(use --execute to delete)"; fi
fi

echo "\n== Available ENIs (unattached) =="
mapfile -t ENI_IDS < <(${AWS[@]} ec2 describe-network-interfaces --filters Name=status,Values=available --query 'NetworkInterfaces[].NetworkInterfaceId' --output text 2>/dev/null | tr '\t' '\n' | sed '/^$/d')
if [[ ${#ENI_IDS[@]} -eq 0 ]]; then echo "(none)"; else printf '%s\n' "${ENI_IDS[@]}"; fi
if [[ ${#ENI_IDS[@]} -gt 0 ]]; then
  if [[ $EXECUTE -eq 1 ]]; then confirm "Delete ${#ENI_IDS[@]} ENI(s)?" && for id in "${ENI_IDS[@]}"; do action "${AWS[*]} ec2 delete-network-interface --network-interface-id $id"; done; else echo "(use --execute to delete)"; fi
fi

echo "\n== Interface VPC Endpoints =="
mapfile -t VPCE_ALL < <(${AWS[@]} ec2 describe-vpc-endpoints --query 'VpcEndpoints[?VpcEndpointType==`Interface`].[VpcEndpointId,ServiceName,State]' --output text 2>/dev/null | sed '/^$/d')
if [[ ${#VPCE_ALL[@]} -eq 0 ]]; then echo "(none)"; else printf '%s\n' "${VPCE_ALL[@]}" | column -t; fi
if [[ -n "$ENDPOINT_FILTER" && ${#VPCE_ALL[@]} -gt 0 ]]; then
  mapfile -t VPCE_IDS < <(printf '%s\n' "${VPCE_ALL[@]}" | awk -v re="$ENDPOINT_FILTER" '$0 ~ re {print $1}')
  if [[ ${#VPCE_IDS[@]} -gt 0 ]]; then
    if [[ $EXECUTE -eq 1 ]]; then confirm "Delete ${#VPCE_IDS[@]} interface endpoint(s) matching /$ENDPOINT_FILTER/?" && action "${AWS[*]} ec2 delete-vpc-endpoints --vpc-endpoint-ids ${VPCE_IDS[*]}"; else echo "(use --execute to delete: ${VPCE_IDS[*]})"; fi
  else
    echo "No interface endpoints match regex: $ENDPOINT_FILTER"
  fi
else
  echo "(tip: use -i 'ssm|logs' to target specific endpoints)"
fi

echo "\n== Unattached Internet Gateways =="
mapfile -t IGW_IDS < <(${AWS[@]} ec2 describe-internet-gateways --query 'InternetGateways[?Attachments==`[]`].InternetGatewayId' --output text 2>/dev/null | tr '\t' '\n' | sed '/^$/d')
if [[ ${#IGW_IDS[@]} -eq 0 ]]; then echo "(none)"; else printf '%s\n' "${IGW_IDS[@]}"; fi
if [[ ${#IGW_IDS[@]} -gt 0 ]]; then
  if [[ $EXECUTE -eq 1 ]]; then confirm "Delete ${#IGW_IDS[@]} unattached IGW(s)?" && for id in "${IGW_IDS[@]}"; do action "${AWS[*]} ec2 delete-internet-gateway --internet-gateway-id $id"; done; else echo "(use --execute to delete)"; fi
fi

echo "\nDone. Review dry-run output above before executing with --execute."

