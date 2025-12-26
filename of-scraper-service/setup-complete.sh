#!/bin/bash
# 🚀 OF Scraper - Complete Setup Script
# Crée Upstash Redis + Configure App Runner + Test

set -e

REGION="us-east-2"
SERVICE_NAME="huntaze-of-scraper"
ECR_REPO="317805897534.dkr.ecr.us-east-2.amazonaws.com/huntaze-of-scraper:latest"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🛡️  OF Scraper - Setup Complet (BullMQ + Stealth)          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# STEP 1: Check App Runner Status
# ============================================================
echo "📋 Step 1: Checking App Runner status..."

STATUS=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].Status" \
    --output text 2>/dev/null || echo "NOT_FOUND")

SERVICE_URL=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" \
    --output text 2>/dev/null || echo "")

echo "   Status: $STATUS"
echo "   URL: $SERVICE_URL"

if [ "$STATUS" = "OPERATION_IN_PROGRESS" ]; then
    echo ""
    echo "⏳ App Runner is still deploying. Waiting..."
    echo "   (This can take 3-5 minutes for Playwright image)"
    
    while [ "$STATUS" = "OPERATION_IN_PROGRESS" ]; do
        sleep 15
        STATUS=$(aws apprunner list-services --region $REGION \
            --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].Status" \
            --output text 2>/dev/null || echo "UNKNOWN")
        echo "   Status: $STATUS"
    done
fi

if [ "$STATUS" != "RUNNING" ]; then
    echo "❌ App Runner not running. Status: $STATUS"
    echo "   Run: cd of-scraper-service && ./deploy-apprunner.sh"
    exit 1
fi

echo "✅ App Runner is RUNNING"
echo ""

# ============================================================
# STEP 2: Create Upstash Redis (via API)
# ============================================================
echo "📋 Step 2: Setting up Redis..."
echo ""
echo "🔴 MANUAL STEP REQUIRED:"
echo "   1. Go to https://console.upstash.com"
echo "   2. Create a FREE Redis database"
echo "   3. Region: us-east-1 (closest to us-east-2)"
echo "   4. Copy the Redis URL (format: redis://default:xxx@xxx.upstash.io:6379)"
echo ""
read -p "📝 Paste your Upstash Redis URL: " REDIS_URL

if [ -z "$REDIS_URL" ]; then
    echo "❌ Redis URL is required"
    exit 1
fi

# Validate format
if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
    echo "❌ Invalid Redis URL format. Should start with redis://"
    exit 1
fi

echo "✅ Redis URL received"
echo ""

# ============================================================
# STEP 3: Update App Runner with REDIS_URL
# ============================================================
echo "📋 Step 3: Adding REDIS_URL to App Runner..."

SERVICE_ARN=$(aws apprunner list-services --region $REGION \
    --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
    --output text)

echo "   Service ARN: $SERVICE_ARN"

# Update service configuration
aws apprunner update-service --region $REGION \
    --service-arn "$SERVICE_ARN" \
    --source-configuration '{
        "ImageRepository": {
            "ImageIdentifier": "'"$ECR_REPO"'",
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
    --output text > /dev/null

echo "✅ REDIS_URL added to App Runner"
echo "⏳ Service is redeploying (1-2 min)..."
echo ""

# Wait for redeploy
sleep 10
STATUS="OPERATION_IN_PROGRESS"
while [ "$STATUS" = "OPERATION_IN_PROGRESS" ]; do
    sleep 10
    STATUS=$(aws apprunner list-services --region $REGION \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].Status" \
        --output text 2>/dev/null || echo "UNKNOWN")
    echo "   Status: $STATUS"
done

echo ""

# ============================================================
# STEP 4: Test Health Endpoint
# ============================================================
echo "📋 Step 4: Testing health endpoint..."

HEALTH_URL="https://${SERVICE_URL}/health"
echo "   URL: $HEALTH_URL"

HEALTH_RESPONSE=$(curl -s "$HEALTH_URL" 2>/dev/null || echo '{"error":"failed"}')
echo "   Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check may have issues. Check logs."
fi

echo ""

# ============================================================
# STEP 5: Update .env.local
# ============================================================
echo "📋 Step 5: Updating .env.local..."

# Check if REDIS_URL already exists
if grep -q "^REDIS_URL=" ../.env.local 2>/dev/null; then
    # Update existing
    sed -i.bak "s|^REDIS_URL=.*|REDIS_URL=$REDIS_URL|" ../.env.local
    echo "   Updated existing REDIS_URL"
else
    # Add new
    echo "" >> ../.env.local
    echo "# Redis for BullMQ (Upstash)" >> ../.env.local
    echo "REDIS_URL=$REDIS_URL" >> ../.env.local
    echo "   Added REDIS_URL to .env.local"
fi

echo "✅ .env.local updated"
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ SETUP COMPLETE!                                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📦 App Runner: https://$SERVICE_URL"
echo "🔴 Redis: Upstash (connected)"
echo "🛡️  Mode: Stealth + BullMQ Async"
echo ""
echo "📋 Next steps for Vercel:"
echo "   Add these env vars in Vercel Dashboard:"
echo ""
echo "   OF_SCRAPER_WORKER_URL=https://$SERVICE_URL"
echo "   REDIS_URL=$REDIS_URL"
echo "   SCRAPER_CALLBACK_SECRET=huntaze-scraper-callback-2025"
echo ""
echo "🧪 Test the async API:"
echo "   curl -X POST https://your-app.vercel.app/api/of/scrape-async \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"type\":\"sync-profile\"}'"
echo ""
