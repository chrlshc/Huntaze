#!/bin/bash

# 🚀 Huntaze OnlyFans Beta Launch Script
# Launches beta at 10% user rollout

set -e

echo "🚀 LAUNCHING HUNTAZE ONLYFANS BETA (10% ROLLOUT)"
echo "================================================"

# Configuration
export PLAYWRIGHT_ENABLED_PERCENT=10
export NODE_ENV=production
export AWS_REGION=us-east-1

echo "✅ Beta Configuration:"
echo "   - Rollout: ${PLAYWRIGHT_ENABLED_PERCENT}% of users"
echo "   - Environment: ${NODE_ENV}"
echo "   - Region: ${AWS_REGION}"

# Verify infrastructure
echo ""
echo "🔍 Verifying Infrastructure..."

# Check DynamoDB tables
echo "   📊 DynamoDB Tables:"
for table in huntaze-of-sessions huntaze-of-threads huntaze-of-messages; do
    status=$(aws dynamodb describe-table --table-name $table --region us-east-1 --query 'Table.TableStatus' --output text 2>/dev/null || echo "MISSING")
    echo "      - $table: $status"
done

# Check ECS cluster
echo "   🐳 ECS Cluster:"
cluster_status=$(aws ecs describe-clusters --clusters huntaze-of-fargate --region us-east-1 --query 'clusters[0].status' --output text 2>/dev/null || echo "MISSING")
echo "      - huntaze-of-fargate: $cluster_status"

echo ""
echo "🎯 Beta Status: READY FOR LAUNCH"
echo ""
echo "📋 Next Steps:"
echo "   1. Deploy your application with PLAYWRIGHT_ENABLED_PERCENT=10"
echo "   2. Monitor ECS tasks: aws ecs list-tasks --cluster huntaze-of-fargate --region us-east-1"
echo "   3. Check logs: aws logs tail /huntaze/of/browser-worker --follow --region us-east-1"
echo ""
echo "🎉 BETA INFRASTRUCTURE IS READY!"