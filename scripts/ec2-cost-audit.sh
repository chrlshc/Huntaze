#!/usr/bin/env bash
set -euo pipefail

# EC2/VPC cost audit: highlights resources that commonly incur unexpected charges.
# - Instances, EBS volumes (including unattached), Elastic IPs, NAT Gateways, VPC Endpoints (Interface), Load Balancers, ENIs
# Usage examples:
#   ./scripts/ec2-cost-audit.sh -p myprofile -r us-east-1
#   ./scripts/ec2-cost-audit.sh -p myprofile            # defaults to us-east-1

PROFILE=""
REGION="us-east-1"

while getopts ":p:r:h" opt; do
  case $opt in
    p) PROFILE="--profile ${OPTARG}" ;;
    r) REGION="${OPTARG}" ;;
    h)
      cat <<EOF
Usage: $0 [-p PROFILE] [-r REGION]

Audits cost-incurring EC2/VPC resources in a region (default us-east-1):
- EC2 instances and their types
- EBS volumes (including unattached/orphaned)
- Elastic IPs (attached/unattached)
- NAT Gateways
- VPC Endpoints (Interface vs Gateway)
- Load Balancers (ALB/NLB/CLB)
- Available ENIs (orphaned interfaces)

Tip: Pair with Cost Explorer to pinpoint spend by service/region.
EOF
      exit 0
      ;;
    :) echo "Option -$OPTARG requires an argument" >&2; exit 1 ;;
    *) echo "Unknown option -$opt" >&2; exit 1 ;;
  esac
done

info() { printf "[info] %s\n" "$*"; }
section() { printf "\n==== %s ====\n" "$*"; }

AWS=(aws ${PROFILE} --region "${REGION}")

section "Region"
echo "${REGION}"

section "EC2 Instances"
${AWS[@]} ec2 describe-instances \
  --query 'Reservations[].Instances[].{Id:InstanceId,Type:InstanceType,State:State.Name,AZ:Placement.AvailabilityZone,Name:Tags[?Key==`Name`]|[0].Value}' \
  --output table || true

section "EBS Volumes (all)"
${AWS[@]} ec2 describe-volumes \
  --query 'Volumes[].{Id:VolumeId,Size:Size,State:State,Type:VolumeType,AZ:AvailabilityZone,Attached:length(Attachments)>0,Name:Tags[?Key==`Name`]|[0].Value}' \
  --output table || true

section "EBS Volumes (unattached/orphaned)"
${AWS[@]} ec2 describe-volumes --filters Name=status,Values=available \
  --query 'Volumes[].{Id:VolumeId,Size:Size,Type:VolumeType,AZ:AvailabilityZone,Created:CreateTime}' \
  --output table || true

section "Elastic IPs"
${AWS[@]} ec2 describe-addresses \
  --query 'Addresses[].{PublicIp:PublicIp,AllocationId:AllocationId,Associated:AssociationId!=null,Domain:Domain,Name:Tags[?Key==`Name`]|[0].Value}' \
  --output table || true
echo "Note: Since 2024, EIPs are billed per hour even when associated (small but non-zero)."

section "VPC Endpoints"
${AWS[@]} ec2 describe-vpc-endpoints \
  --query 'VpcEndpoints[].{Id:VpcEndpointId,Type:VpcEndpointType,Service:ServiceName,State:State,VpcId:VpcId,AZs:SubnetIds}' \
  --output table || true
echo "Interface endpoints incur hourly charges per AZ + data; Gateway endpoints (S3/DynamoDB) do not."

section "NAT Gateways"
${AWS[@]} ec2 describe-nat-gateways \
  --query 'NatGateways[].{Id:NatGatewayId,State:State,VpcId:VpcId,Subnets:SubnetIds,PublicEip:NatGatewayAddresses[0].PublicIp}' \
  --output table || true
echo "NAT Gateways are often a top EC2-network cost driver (hourly + data)."

section "Load Balancers"
${AWS[@]} elbv2 describe-load-balancers \
  --query 'LoadBalancers[].{Name:LoadBalancerName,Type:Type,Scheme:Scheme,State:State.Code,AZs:AvailabilityZones[].ZoneName}' \
  --output table 2>/dev/null || true
${AWS[@]} elb describe-load-balancers \
  --query 'LoadBalancerDescriptions[].{Name:LoadBalancerName,Scheme:Scheme,AZs:AvailabilityZones}' \
  --output table 2>/dev/null || true

section "Unattached ENIs (available)"
${AWS[@]} ec2 describe-network-interfaces --filters Name=status,Values=available \
  --query 'NetworkInterfaces[].{Id:NetworkInterfaceId,AZ:AvailabilityZone,Description:Description,PrivateIp:PrivateIpAddress}' \
  --output table || true

section "Hints"
cat <<'EOT'
- Consider right-sizing or stopping underutilized instances.
- Release unattached EBS volumes and EIPs you no longer need.
- Prefer Gateway endpoints (S3/DynamoDB) over Interface endpoints when possible.
- Avoid NAT if you can use VPC endpoints, or consider egress-only IPv6 + proxies.
- Consolidate or remove idle Load Balancers.
EOT

