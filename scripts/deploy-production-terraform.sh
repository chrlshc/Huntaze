#!/bin/bash
# Deploy Production Hardening Infrastructure

set -e

echo "🚀 Deploying Production Hardening Infrastructure..."
echo ""

cd infra/terraform/production-hardening

# Check if plan exists
if [ ! -f "production.tfplan" ]; then
  echo "❌ No plan file found. Run terraform plan first."
  exit 1
fi

echo "📋 Plan Summary:"
terraform show -json production.tfplan | jq -r '.resource_changes[] | select(.change.actions[] | contains("create")) | .address' | wc -l | xargs echo "Resources to create:"

echo ""
echo "⚠️  This will create ~113 AWS resources including:"
echo "  - Security services (GuardDuty, Security Hub, CloudTrail)"
echo "  - CloudWatch alarms and dashboards"
echo "  - S3 encryption and lifecycle policies"
echo "  - ECS auto-scaling and Container Insights"
echo "  - Cost monitoring and budgets"
echo ""

read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

echo ""
echo "🔨 Applying Terraform configuration..."
terraform apply production.tfplan

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Verify resources in AWS Console"
echo "  2. Run validation: ./scripts/validate-security-comprehensive.sh"
echo "  3. Check CloudWatch alarms"
echo "  4. Review cost impact in Cost Explorer"
