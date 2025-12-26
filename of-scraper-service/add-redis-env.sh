#!/bin/bash
# Add REDIS_URL to App Runner service

set -e

REGION="us-east-2"
SERVICE_NAME="huntaze-of-scraper"

# Get your Redis URL from Upstash or ElastiCache
# Format: redis://default:PASSWORD@HOST:PORT
REDIS_URL="${1:-}"

if [ -z "$REDIS_URL" ]; then
    echo "❌ Usage: ./add-redis-env.sh 'redis://default:xxx@xxx.upstash.io:6379'"
    echo ""
    echo "📋 Get a free Redis from Upstash:"
    echo "   1. Go to https://console.upstash.com"
    echo "   2. Create a Redis database in us-east-1 (closest to us-east-2)"
    echo "   3. Copy the Redis URL"
    exit 1
fi

echo "🔧 Getting service ARN..."
SERVICE_ARN=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
    --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo "❌ Service not found"
    exit 1
fi

echo "📦 Service: $SERVICE_ARN"
echo "🔑 Adding REDIS_URL environment variable..."

# Update the service with REDIS_URL
aws apprunner update-service --region $REGION \
    --service-arn "$SERVICE_ARN" \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "317805897534.dkr.ecr.us-east-2.amazonaws.com/huntaze-of-scraper:latest",
            "ImageRepositoryType": "ECR",
            "ImageConfiguration": {
                "Port": "8080",
                "RuntimeEnvironmentVariables": {
                    "NODE_ENV": "production",
                    "REDIS_URL": "'"$REDIS_URL"'"
                }
            }
        },
        "AutoDeploymentsEnabled": false
    }' \
    --output text

echo ""
echo "✅ REDIS_URL added! Service will redeploy automatically."
echo "⏳ Check status: aws apprunner list-services --region $REGION"
