#!/bin/bash
# ============================================================================
# AWS Cost Audit for Beta - Identify and Remove Unnecessary Resources
# ============================================================================
# This script audits your AWS infrastructure and identifies resources
# that are not needed for a beta environment to reduce costs from $400/month
# ============================================================================

set -e

echo "🔍 AWS Cost Audit for Beta Environment"
echo "========================================"
echo ""

# Credentials: use the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
# Verify auth first to avoid confusing empty outputs.
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  echo "❌ AWS credentials not configured or expired."
  echo "   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry."
  exit 1
fi

REGIONS=("us-east-1" "us-east-2" "eu-west-1")
REPORT_FILE="aws-cost-audit-$(date +%Y%m%d-%H%M%S).txt"

echo "📝 Report will be saved to: $REPORT_FILE"
echo ""

# Function to check and report resources
check_resource() {
    local service=$1
    local description=$2
    local command=$3
    local region=$4
    
    echo "Checking $service in $region..."
    result=$(eval "$command" 2>/dev/null || echo "")
    if [ -n "$result" ]; then
        echo "  ✓ Found: $description" | tee -a "$REPORT_FILE"
        echo "$result" | tee -a "$REPORT_FILE"
        echo "" | tee -a "$REPORT_FILE"
    fi
}

# Start audit
echo "Starting AWS Resource Audit..." | tee "$REPORT_FILE"
echo "Date: $(date)" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

for REGION in "${REGIONS[@]}"; do
    echo "" | tee -a "$REPORT_FILE"
    echo "🌍 REGION: $REGION" | tee -a "$REPORT_FILE"
    echo "========================================" | tee -a "$REPORT_FILE"
    
    # 1. ECS Clusters and Services (EXPENSIVE)
    echo "" | tee -a "$REPORT_FILE"
    echo "📦 ECS CLUSTERS (High Cost)" | tee -a "$REPORT_FILE"
    check_resource "ECS" "ECS Clusters" \
        "aws ecs list-clusters --region $REGION --output table" \
        "$REGION"
    
    # Get ECS services for each cluster
    clusters=$(aws ecs list-clusters --region $REGION --query 'clusterArns[]' --output text 2>/dev/null || echo "")
    if [ -n "$clusters" ]; then
        for cluster in $clusters; do
            cluster_name=$(basename $cluster)
            echo "  Services in $cluster_name:" | tee -a "$REPORT_FILE"
            aws ecs list-services --cluster $cluster --region $REGION --output table 2>/dev/null | tee -a "$REPORT_FILE"
            
            # Get task count
            tasks=$(aws ecs list-tasks --cluster $cluster --region $REGION --query 'taskArns[]' --output text 2>/dev/null || echo "")
            task_count=$(echo "$tasks" | wc -w)
            echo "  Running tasks: $task_count" | tee -a "$REPORT_FILE"
        done
    fi
    
    # 2. Load Balancers (EXPENSIVE)
    echo "" | tee -a "$REPORT_FILE"
    echo "⚖️  LOAD BALANCERS (High Cost)" | tee -a "$REPORT_FILE"
    check_resource "ALB" "Application Load Balancers" \
        "aws elbv2 describe-load-balancers --region $REGION --output table" \
        "$REGION"
    
    # 3. NAT Gateways (VERY EXPENSIVE)
    echo "" | tee -a "$REPORT_FILE"
    echo "🌐 NAT GATEWAYS (Very High Cost - ~$32/month each)" | tee -a "$REPORT_FILE"
    check_resource "NAT" "NAT Gateways" \
        "aws ec2 describe-nat-gateways --region $REGION --output table" \
        "$REGION"
    
    # 4. RDS Instances (EXPENSIVE)
    echo "" | tee -a "$REPORT_FILE"
    echo "🗄️  RDS DATABASES (High Cost)" | tee -a "$REPORT_FILE"
    check_resource "RDS" "RDS Instances" \
        "aws rds describe-db-instances --region $REGION --output table" \
        "$REGION"
    
    # 5. ElastiCache (EXPENSIVE)
    echo "" | tee -a "$REPORT_FILE"
    echo "💾 ELASTICACHE CLUSTERS (High Cost)" | tee -a "$REPORT_FILE"
    check_resource "ElastiCache" "ElastiCache Clusters" \
        "aws elasticache describe-cache-clusters --region $REGION --output table" \
        "$REGION"
    
    # 6. Lambda Functions
    echo "" | tee -a "$REPORT_FILE"
    echo "⚡ LAMBDA FUNCTIONS (Pay per use)" | tee -a "$REPORT_FILE"
    check_resource "Lambda" "Lambda Functions" \
        "aws lambda list-functions --region $REGION --output table" \
        "$REGION"
    
    # 7. CloudFront Distributions
    if [ "$REGION" == "us-east-1" ]; then
        echo "" | tee -a "$REPORT_FILE"
        echo "🌐 CLOUDFRONT DISTRIBUTIONS (Moderate Cost)" | tee -a "$REPORT_FILE"
        check_resource "CloudFront" "CloudFront Distributions" \
            "aws cloudfront list-distributions --output table" \
            "$REGION"
    fi
    
    # 8. S3 Buckets (in us-east-1 only)
    if [ "$REGION" == "us-east-1" ]; then
        echo "" | tee -a "$REPORT_FILE"
        echo "🪣 S3 BUCKETS (Storage Cost)" | tee -a "$REPORT_FILE"
        check_resource "S3" "S3 Buckets" \
            "aws s3 ls" \
            "$REGION"
    fi
    
    # 9. EC2 Instances
    echo "" | tee -a "$REPORT_FILE"
    echo "🖥️  EC2 INSTANCES (High Cost if running)" | tee -a "$REPORT_FILE"
    check_resource "EC2" "EC2 Instances" \
        "aws ec2 describe-instances --region $REGION --query 'Reservations[].Instances[].[InstanceId,InstanceType,State.Name]' --output table" \
        "$REGION"
    
    # 10. VPCs and Subnets
    echo "" | tee -a "$REPORT_FILE"
    echo "🔌 VPCs (Free, but check for unused)" | tee -a "$REPORT_FILE"
    check_resource "VPC" "VPCs" \
        "aws ec2 describe-vpcs --region $REGION --output table" \
        "$REGION"
    
    # 11. EventBridge Rules
    echo "" | tee -a "$REPORT_FILE"
    echo "⏰ EVENTBRIDGE RULES (Low Cost)" | tee -a "$REPORT_FILE"
    check_resource "EventBridge" "EventBridge Rules" \
        "aws events list-rules --region $REGION --output table" \
        "$REGION"
    
    # 12. SQS Queues
    echo "" | tee -a "$REPORT_FILE"
    echo "📬 SQS QUEUES (Low Cost)" | tee -a "$REPORT_FILE"
    check_resource "SQS" "SQS Queues" \
        "aws sqs list-queues --region $REGION --output table" \
        "$REGION"
    
    # 13. CloudWatch Log Groups
    echo "" | tee -a "$REPORT_FILE"
    echo "📊 CLOUDWATCH LOG GROUPS (Storage Cost)" | tee -a "$REPORT_FILE"
    check_resource "CloudWatch" "Log Groups" \
        "aws logs describe-log-groups --region $REGION --query 'logGroups[].[logGroupName,storedBytes]' --output table" \
        "$REGION"
    
    # 14. Secrets Manager
    echo "" | tee -a "$REPORT_FILE"
    echo "🔐 SECRETS MANAGER (Cost per secret)" | tee -a "$REPORT_FILE"
    check_resource "Secrets" "Secrets Manager Secrets" \
        "aws secretsmanager list-secrets --region $REGION --output table" \
        "$REGION"
done

# Cost Estimation Summary
echo "" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "💰 COST REDUCTION RECOMMENDATIONS" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "For a BETA environment, consider removing:" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "1. ❌ NAT Gateways (~\$32/month each)" | tee -a "$REPORT_FILE"
echo "   → Use public subnets for beta or VPC endpoints" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "2. ❌ Multiple ECS Tasks (Fargate ~\$30-50/month per task)" | tee -a "$REPORT_FILE"
echo "   → Scale down to 1 task for beta" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "3. ❌ Application Load Balancers (~\$16/month + data)" | tee -a "$REPORT_FILE"
echo "   → Use CloudFront or direct ECS access for beta" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "4. ❌ ElastiCache Redis (~\$15-50/month)" | tee -a "$REPORT_FILE"
echo "   → Use in-memory caching or free Redis tier" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "5. ❌ Multi-AZ RDS (~2x cost)" | tee -a "$REPORT_FILE"
echo "   → Use single-AZ for beta" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "6. ❌ CloudWatch Log retention > 7 days" | tee -a "$REPORT_FILE"
echo "   → Reduce retention to 3-7 days for beta" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "7. ❌ Unused Lambda functions" | tee -a "$REPORT_FILE"
echo "   → Delete functions not actively used" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"
echo "8. ❌ Auto-scaling (min 2 tasks)" | tee -a "$REPORT_FILE"
echo "   → Set min to 1 for beta" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

echo "✅ Audit complete! Report saved to: $REPORT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the report: cat $REPORT_FILE"
echo "2. Run cleanup script: ./scripts/aws-cleanup-beta.sh"
echo "3. Monitor costs in AWS Cost Explorer"
