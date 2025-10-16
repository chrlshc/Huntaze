#!/usr/bin/env bash
set -euo pipefail

# AWS cost-driver audit (read-only)
# - Focuses on EC2-related steady charges: EC2 instances, Elastic IPs, Interface
#   VPC Endpoints, NAT Gateways, ALBs/NLBs, orphaned EBS volumes, free ENIs.
# - Produces a concise per-region report and rough monthly estimates.
#
# Requirements:
#   - aws CLI v2 configured (via SSO/profile or env vars)
#   - Permissions: ec2:Describe*, elbv2:DescribeLoadBalancers, elb:DescribeLoadBalancers
#
# Usage examples:
#   bash scripts/aws-audit.sh                          # default us-east-1
#   bash scripts/aws-audit.sh --region us-east-1       # specific region
#   bash scripts/aws-audit.sh --all-regions            # all opted-in regions
#   bash scripts/aws-audit.sh --region us-east-1 --estimates
#   AWS_PROFILE=prod bash scripts/aws-audit.sh --all-regions

REGION="us-east-1"
ALL_REGIONS=false
ESTIMATES=false

print_help() {
  cat <<EOF
AWS EC2 cost-driver audit (read-only)

Flags:
  --region <name>      Region to audit (default: us-east-1)
  --all-regions        Audit all opted-in regions
  --estimates          Print rough monthly cost estimates
  -h, --help           Show this help

Environment:
  Respects AWS CLI env/profile settings (e.g., AWS_PROFILE, AWS_REGION).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION=${2:?}; shift 2;;
    --all-regions)
      ALL_REGIONS=true; shift;;
    --estimates)
      ESTIMATES=true; shift;;
    -h|--help)
      print_help; exit 0;;
    *)
      echo "Unknown arg: $1" >&2; print_help; exit 1;;
  esac
done

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing dependency: $1" >&2; exit 1; }
}

need aws

timestamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

# Constants (us-east-1 ballpark) — estimates only, excludes data/process fees
EIP_PER_HOUR=0.005           # public IPv4 address (in-use or idle)
VPCE_IF_PER_HOUR=0.01        # Interface endpoint (varies by service/region)
NAT_PER_HOUR=0.045           # NAT Gateway hourly (excl. data processed)
ALB_PER_HOUR=0.0225          # ALB/NLB hourly (very rough)

regions=()
if $ALL_REGIONS; then
  # All opted-in regions
  mapfile -t regions < <(aws ec2 describe-regions \
    --query 'Regions[].RegionName' --output text | tr '\t' '\n' | sort)
else
  regions=($REGION)
fi

echo "[AWS AUDIT] Started $(timestamp)" >&2
echo "Profile: ${AWS_PROFILE:-default} | Regions: ${regions[*]}" >&2
echo

total_warn=0

for r in "${regions[@]}"; do
  echo "===== Region: ${r} ====="

  # Instances
  instances_json=$(aws ec2 describe-instances --region "$r" \
    --filters Name=instance-state-name,Values=pending,running,stopping,stopped \
    --query 'Reservations[].Instances[].{Id:InstanceId,State:State.Name,Type:InstanceType,Name:Tags[?Key==`Name`]|[0].Value}')
  inst_running=$(echo "$instances_json" | jq -r '[.[]|select(.State=="running")] | length' 2>/dev/null || true)
  inst_total=$(echo "$instances_json" | jq -r 'length' 2>/dev/null || true)
  if [[ -z "$inst_running" || "$inst_running" == "null" ]]; then
    # Fallback without jq
    inst_running=$(aws ec2 describe-instances --region "$r" \
      --filters Name=instance-state-name,Values=running \
      --query 'length(Reservations[].Instances[])' --output text 2>/dev/null || echo 0)
    inst_total=$(aws ec2 describe-instances --region "$r" \
      --filters Name=instance-state-name,Values=pending,running,stopping,stopped \
      --query 'length(Reservations[].Instances[])' --output text 2>/dev/null || echo 0)
  fi

  # EBS volumes
  vol_available=$(aws ec2 describe-volumes --region "$r" \
    --filters Name=status,Values=available \
    --query 'length(Volumes[])' --output text 2>/dev/null || echo 0)
  vol_inuse=$(aws ec2 describe-volumes --region "$r" \
    --filters Name=status,Values=in-use \
    --query 'length(Volumes[])' --output text 2>/dev/null || echo 0)

  # Elastic IPs
  eip_total=$(aws ec2 describe-addresses --region "$r" \
    --query 'length(Addresses[])' --output text 2>/dev/null || echo 0)
  eip_unattached=$(aws ec2 describe-addresses --region "$r" \
    --query 'length(Addresses[?AssociationId==null])' --output text 2>/dev/null || echo 0)

  # VPC Endpoints
  vpce_if=$(aws ec2 describe-vpc-endpoints --region "$r" \
    --query 'length(VpcEndpoints[?VpcEndpointType==`Interface` && State==`available`])' --output text 2>/dev/null || echo 0)
  vpce_gw=$(aws ec2 describe-vpc-endpoints --region "$r" \
    --query 'length(VpcEndpoints[?VpcEndpointType==`Gateway` && State==`available`])' --output text 2>/dev/null || echo 0)

  # NAT Gateways
  nat_count=$(aws ec2 describe-nat-gateways --region "$r" \
    --filter Name=state,Values=available,pending \
    --query 'length(NatGateways[])' --output text 2>/dev/null || echo 0)

  # Load balancers (ALB/NLB via elbv2)
  lb_count=$(aws elbv2 describe-load-balancers --region "$r" \
    --query 'length(LoadBalancers[])' --output text 2>/dev/null || echo 0)

  # Free (no hourly) but useful signals
  eni_free=$(aws ec2 describe-network-interfaces --region "$r" \
    --filters Name=status,Values=available \
    --query 'length(NetworkInterfaces[])' --output text 2>/dev/null || echo 0)

  printf -- "- Instances: %s running (%s total)\n" "$inst_running" "$inst_total"
  printf -- "- EBS volumes: %s in-use, %s available (orphans)\n" "$vol_inuse" "$vol_available"
  printf -- "- Elastic IPs: %s total, %s unattached\n" "$eip_total" "$eip_unattached"
  printf -- "- VPC Endpoints: %s Interface, %s Gateway\n" "$vpce_if" "$vpce_gw"
  printf -- "- NAT Gateways: %s\n" "$nat_count"
  printf -- "- Load balancers (ALB/NLB): %s\n" "$lb_count"
  printf -- "- Free ENIs (deletable): %s\n" "$eni_free"

  if $ESTIMATES; then
    # 30 days x 24 hours
    hrs=$((30*24))
    cost_eip=$(awk -v c=$eip_total -v p=$EIP_PER_HOUR -v h=$hrs 'BEGIN { printf "%.2f", c*p*h }')
    cost_vpce_if=$(awk -v c=$vpce_if -v p=$VPCE_IF_PER_HOUR -v h=$hrs 'BEGIN { printf "%.2f", c*p*h }')
    cost_nat=$(awk -v c=$nat_count -v p=$NAT_PER_HOUR -v h=$hrs 'BEGIN { printf "%.2f", c*p*h }')
    cost_lb=$(awk -v c=$lb_count -v p=$ALB_PER_HOUR -v h=$hrs 'BEGIN { printf "%.2f", c*p*h }')
    # EC2 instance cost varies by type — not estimated here
    est_total=$(awk -v a=$cost_eip -v b=$cost_vpce_if -v c=$cost_nat -v d=$cost_lb 'BEGIN { printf "%.2f", a+b+c+d }')
    echo "  ~ Est. monthly steady charges (excl. EC2, data):"
    printf -- "    - EIPs: ~$%s\n" "$cost_eip"
    printf -- "    - Interface Endpoints: ~$%s\n" "$cost_vpce_if"
    printf -- "    - NAT Gateways: ~$%s\n" "$cost_nat"
    printf -- "    - ALB/NLB: ~$%s\n" "$cost_lb"
    printf -- "    => Subtotal (excl. EC2 + data): ~$%s/mo\n" "$est_total"
  fi

  # Quick hints
  hints=()
  if [[ "$eip_total" -gt 0 ]]; then hints+=("release unused Elastic IPs"); fi
  if [[ "$vpce_if" -gt 0 ]]; then hints+=("delete unnecessary Interface VPC Endpoints"); fi
  if [[ "$vol_available" -gt 0 ]]; then hints+=("delete orphaned EBS volumes"); fi
  if [[ "$nat_count" -gt 0 ]]; then hints+=("evaluate NAT Gateways (costly)"); fi
  if [[ "$lb_count" -gt 0 ]]; then hints+=("review ALB/NLB usage"); fi
  if [[ "$eni_free" -gt 0 ]]; then hints+=("delete free ENIs"); fi

  if (( ${#hints[@]} > 0 )); then
    echo "  Suggestions: ${hints[*]}"
    ((total_warn++))
  fi

  echo
done

echo "[AWS AUDIT] Finished $(timestamp)." >&2

if (( total_warn == 0 )); then
  echo "No obvious cost drivers found beyond EC2/EBS in audited regions."
else
  echo "See suggestions above for likely savings. Use Cost Explorer for exact spend."
fi
