#!/bin/bash
# ============================================================================
# AWS Cleanup Script for Beta - Remove Unnecessary Resources
# ============================================================================
# This script removes AWS resources that are not needed for beta
# CAUTION: This will DELETE resources. Review carefully before running!
# ============================================================================

set -e

echo "⚠️  AWS CLEANUP FOR BETA ENVIRONMENT"
echo "========================================"
echo ""
echo "This script will DELETE AWS resources to reduce costs."
echo "Make sure you have reviewed the audit report first!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Credentials: use the standard AWS CLI credential chain (env vars, AWS_PROFILE, SSO, etc).
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured or expired."
    echo "   Fix: export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY(/AWS_SESSION_TOKEN) or run \`aws sso login\`, then retry."
    exit 1
fi

REGIONS=("us-east-1" "us-east-2")
CLEANUP_LOG="aws-cleanup-$(date +%Y%m%d-%H%M%S).log"

echo "📝 Cleanup log: $CLEANUP_LOG"
echo ""

# Function to safely delete resource
safe_delete() {
    local action=$1
    local description=$2
    
    echo "🗑️  $description" | tee -a "$CLEANUP_LOG"
    if eval "$action" 2>&1 | tee -a "$CLEANUP_LOG"; then
        echo "  ✅ Success" | tee -a "$CLEANUP_LOG"
    else
        echo "  ⚠️  Failed or already deleted" | tee -a "$CLEANUP_LOG"
    fi
    echo "" | tee -a "$CLEANUP_LOG"
}

echo "Starting cleanup..." | tee "$CLEANUP_LOG"
echo "Date: $(date)" | tee -a "$CLEANUP_LOG"
echo "========================================" | tee -a "$CLEANUP_LOG"
echo "" | tee -a "$CLEANUP_LOG"

for REGION in "${REGIONS[@]}"; do
    echo "" | tee -a "$CLEANUP_LOG"
    echo "🌍 REGION: $REGION" | tee -a "$CLEANUP_LOG"
    echo "========================================" | tee -a "$CLEANUP_LOG"
    
    # 1. Scale down ECS services to 1 task (MAJOR SAVINGS)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "📦 Scaling down ECS services to 1 task..." | tee -a "$CLEANUP_LOG"
    clusters=$(aws ecs list-clusters --region $REGION --query 'clusterArns[]' --output text 2>/dev/null || echo "")
    if [ -n "$clusters" ]; then
        for cluster in $clusters; do
            cluster_name=$(basename $cluster)
            services=$(aws ecs list-services --cluster $cluster --region $REGION --query 'serviceArns[]' --output text 2>/dev/null || echo "")
            for service in $services; do
                service_name=$(basename $service)
                safe_delete \
                    "aws ecs update-service --cluster $cluster_name --service $service_name --desired-count 1 --region $REGION" \
                    "Scale down $service_name to 1 task"
            done
        done
    fi
    
    # 2. Update auto-scaling to min=1, max=2 (SAVINGS)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "📊 Updating auto-scaling policies..." | tee -a "$CLEANUP_LOG"
    if [ -n "$clusters" ]; then
        for cluster in $clusters; do
            cluster_name=$(basename $cluster)
            services=$(aws ecs list-services --cluster $cluster --region $REGION --query 'serviceArns[]' --output text 2>/dev/null || echo "")
            for service in $services; do
                service_name=$(basename $service)
                resource_id="service/$cluster_name/$service_name"
                
                # Check if scalable target exists
                if aws application-autoscaling describe-scalable-targets \
                    --service-namespace ecs \
                    --resource-ids "$resource_id" \
                    --region $REGION 2>/dev/null | grep -q "ScalableTargets"; then
                    
                    safe_delete \
                        "aws application-autoscaling register-scalable-target \
                            --service-namespace ecs \
                            --resource-id '$resource_id' \
                            --scalable-dimension ecs:service:DesiredCount \
                            --min-capacity 1 \
                            --max-capacity 2 \
                            --region $REGION" \
                        "Update auto-scaling for $service_name (min=1, max=2)"
                fi
            done
        done
    fi
    
    # 3. Delete NAT Gateways (MAJOR SAVINGS ~$32/month each)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "🌐 Deleting NAT Gateways..." | tee -a "$CLEANUP_LOG"
    nat_gateways=$(aws ec2 describe-nat-gateways --region $REGION --query 'NatGateways[?State==`available`].NatGatewayId' --output text 2>/dev/null || echo "")
    if [ -n "$nat_gateways" ]; then
        for nat_id in $nat_gateways; do
            safe_delete \
                "aws ec2 delete-nat-gateway --nat-gateway-id $nat_id --region $REGION" \
                "Delete NAT Gateway $nat_id"
        done
    fi
    
    # 4. Delete unused Application Load Balancers (SAVINGS ~$16/month)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "⚖️  Checking Load Balancers..." | tee -a "$CLEANUP_LOG"
    echo "  ⚠️  Skipping ALB deletion - review manually if not needed" | tee -a "$CLEANUP_LOG"
    # Uncomment to delete:
    # albs=$(aws elbv2 describe-load-balancers --region $REGION --query 'LoadBalancers[].LoadBalancerArn' --output text 2>/dev/null || echo "")
    # for alb in $albs; do
    #     safe_delete "aws elbv2 delete-load-balancer --load-balancer-arn $alb --region $REGION" "Delete ALB $alb"
    # done
    
    # 5. Delete ElastiCache clusters (SAVINGS ~$15-50/month)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "💾 Checking ElastiCache..." | tee -a "$CLEANUP_LOG"
    echo "  ⚠️  Skipping ElastiCache deletion - review manually if not needed" | tee -a "$CLEANUP_LOG"
    # Uncomment to delete:
    # cache_clusters=$(aws elasticache describe-cache-clusters --region $REGION --query 'CacheClusters[].CacheClusterId' --output text 2>/dev/null || echo "")
    # for cluster_id in $cache_clusters; do
    #     safe_delete "aws elasticache delete-cache-cluster --cache-cluster-id $cluster_id --region $REGION" "Delete ElastiCache $cluster_id"
    # done
    
    # 6. Reduce CloudWatch log retention (SAVINGS on storage)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "📊 Reducing CloudWatch log retention to 7 days..." | tee -a "$CLEANUP_LOG"
    log_groups=$(aws logs describe-log-groups --region $REGION --query 'logGroups[].logGroupName' --output text 2>/dev/null || echo "")
    if [ -n "$log_groups" ]; then
        for log_group in $log_groups; do
            safe_delete \
                "aws logs put-retention-policy --log-group-name '$log_group' --retention-in-days 7 --region $REGION" \
                "Set retention to 7 days for $log_group"
        done
    fi
    
    # 7. Delete unused Lambda functions
    echo "" | tee -a "$CLEANUP_LOG"
    echo "⚡ Checking Lambda functions..." | tee -a "$CLEANUP_LOG"
    echo "  ⚠️  Review Lambda functions manually - keeping for now" | tee -a "$CLEANUP_LOG"
    
    # 8. Delete old CloudWatch log streams
    echo "" | tee -a "$CLEANUP_LOG"
    echo "🗑️  Cleaning old log streams..." | tee -a "$CLEANUP_LOG"
    if [ -n "$log_groups" ]; then
        for log_group in $log_groups; do
            # Delete log streams older than 30 days
            cutoff_date=$(date -u -d '30 days ago' +%s)000 2>/dev/null || cutoff_date=$(date -u -v-30d +%s)000
            old_streams=$(aws logs describe-log-streams \
                --log-group-name "$log_group" \
                --region $REGION \
                --query "logStreams[?lastEventTime<\`$cutoff_date\`].logStreamName" \
                --output text 2>/dev/null || echo "")
            
            if [ -n "$old_streams" ]; then
                for stream in $old_streams; do
                    safe_delete \
                        "aws logs delete-log-stream --log-group-name '$log_group' --log-stream-name '$stream' --region $REGION" \
                        "Delete old log stream $stream"
                done
            fi
        done
    fi
    
    # 9. Delete unused EventBridge rules (if any)
    echo "" | tee -a "$CLEANUP_LOG"
    echo "⏰ Checking EventBridge rules..." | tee -a "$CLEANUP_LOG"
    echo "  ℹ️  Keeping EventBridge rules (low cost)" | tee -a "$CLEANUP_LOG"
    
    # 10. Delete unused SQS queues
    echo "" | tee -a "$CLEANUP_LOG"
    echo "📬 Checking SQS queues..." | tee -a "$CLEANUP_LOG"
    echo "  ℹ️  Keeping SQS queues (low cost)" | tee -a "$CLEANUP_LOG"
    
done

# Summary
echo "" | tee -a "$CLEANUP_LOG"
echo "========================================" | tee -a "$CLEANUP_LOG"
echo "✅ CLEANUP COMPLETE" | tee -a "$CLEANUP_LOG"
echo "========================================" | tee -a "$CLEANUP_LOG"
echo "" | tee -a "$CLEANUP_LOG"
echo "Changes made:" | tee -a "$CLEANUP_LOG"
echo "1. ✅ Scaled ECS services to 1 task (save ~\$30-50/month)" | tee -a "$CLEANUP_LOG"
echo "2. ✅ Updated auto-scaling to min=1, max=2" | tee -a "$CLEANUP_LOG"
echo "3. ✅ Deleted NAT Gateways (save ~\$32/month each)" | tee -a "$CLEANUP_LOG"
echo "4. ✅ Reduced CloudWatch log retention to 7 days" | tee -a "$CLEANUP_LOG"
echo "5. ✅ Cleaned old log streams" | tee -a "$CLEANUP_LOG"
echo "" | tee -a "$CLEANUP_LOG"
echo "Manual review needed:" | tee -a "$CLEANUP_LOG"
echo "- Load Balancers (can save ~\$16/month if not needed)" | tee -a "$CLEANUP_LOG"
echo "- ElastiCache (can save ~\$15-50/month if not needed)" | tee -a "$CLEANUP_LOG"
echo "- RDS instance size (consider smaller instance)" | tee -a "$CLEANUP_LOG"
echo "" | tee -a "$CLEANUP_LOG"
echo "Estimated monthly savings: \$60-100+" | tee -a "$CLEANUP_LOG"
echo "" | tee -a "$CLEANUP_LOG"
echo "Log saved to: $CLEANUP_LOG"
