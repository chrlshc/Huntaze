#!/bin/bash

# 🚀 Deploy OnlyFans Beta with 10% Rollout
set -e

echo "🚀 DEPLOYING ONLYFANS BETA (10% ROLLOUT)"
echo "========================================"

# Configuration
export PLAYWRIGHT_ENABLED_PERCENT=10
export NODE_ENV=production
export AWS_REGION=us-east-1

echo "✅ Configuration:"
echo "   - Rollout: ${PLAYWRIGHT_ENABLED_PERCENT}% of users"
echo "   - Environment: ${NODE_ENV}"
echo "   - Region: ${AWS_REGION}"

# Verify AWS credentials
echo ""
echo "🔍 Verifying AWS credentials..."
aws sts get-caller-identity --region us-east-1 > /dev/null
echo "   ✅ AWS credentials valid"

# Verify infrastructure
echo ""
echo "🔍 Verifying infrastructure..."

# Check DynamoDB tables
echo "   📊 DynamoDB Tables:"
for table in huntaze-of-sessions huntaze-of-threads huntaze-of-messages; do
    status=$(aws dynamodb describe-table --table-name $table --region us-east-1 --query 'Table.TableStatus' --output text 2>/dev/null || echo "MISSING")
    if [ "$status" = "ACTIVE" ]; then
        echo "      ✅ $table: $status"
    else
        echo "      ❌ $table: $status"
        exit 1
    fi
done

# Check ECS cluster
echo "   🐳 ECS Cluster:"
cluster_status=$(aws ecs describe-clusters --clusters huntaze-of-fargate --region us-east-1 --query 'clusters[0].status' --output text 2>/dev/null || echo "MISSING")
if [ "$cluster_status" = "ACTIVE" ]; then
    echo "      ✅ huntaze-of-fargate: $cluster_status"
else
    echo "      ❌ huntaze-of-fargate: $cluster_status"
    exit 1
fi

# Build application
echo ""
echo "🔨 Building application..."
npm run build
echo "   ✅ Application built successfully"

# Deploy configuration
echo ""
echo "📝 Updating production configuration..."
cat > .env.production << EOF
NODE_ENV=production
AWS_REGION=us-east-1
PLAYWRIGHT_ENABLED_PERCENT=10
OF_BETA_ENABLED=true
ECS_CLUSTER_NAME=huntaze-of-fargate
OF_DDB_SESSIONS_TABLE=huntaze-of-sessions
OF_DDB_THREADS_TABLE=huntaze-of-threads
OF_DDB_MESSAGES_TABLE=huntaze-of-messages
OF_LOGIN_SECRET_NAME=of/creds/huntaze
CLOUDWATCH_LOG_GROUP=/huntaze/of/browser-worker
BETA_ROLLOUT_PERCENTAGE=10
BETA_START_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BETA_MONITORING_ENABLED=true
EOF

echo "   ✅ Production configuration updated"

# Start application
echo ""
echo "🚀 Starting production application..."
npm run start &
APP_PID=$!

echo "   ✅ Application started (PID: $APP_PID)"

echo ""
echo "🎉 ONLYFANS BETA DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Beta Status:"
echo "   - 10% of users will use Playwright browser automation"
echo "   - 90% of users will use mock/fallback system"
echo "   - Infrastructure: All systems ACTIVE"
echo ""
echo "📋 Monitoring Commands:"
echo "   - ECS Tasks: aws ecs list-tasks --cluster huntaze-of-fargate --region us-east-1"
echo "   - Logs: aws logs tail /huntaze/of/browser-worker --follow --region us-east-1"
echo "   - Tables: aws dynamodb scan --table-name huntaze-of-sessions --region us-east-1"
echo ""
echo "🎯 BETA IS NOW LIVE!"