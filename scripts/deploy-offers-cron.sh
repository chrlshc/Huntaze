#!/bin/bash

# ============================================
# Deploy Offers Cron Jobs to AWS EventBridge
# ============================================
# 
# Usage: ./scripts/deploy-offers-cron.sh
#
# Prerequisites:
# - AWS CLI configured
# - CRON_SECRET set in environment or .env.production

set -e

REGION="us-east-1"
APP_URL="${APP_URL:-https://huntaze.com}"
CRON_SECRET="${CRON_SECRET:-$(grep CRON_SECRET .env.production 2>/dev/null | cut -d'=' -f2)}"

if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  CRON_SECRET not set. Generating a new one..."
    CRON_SECRET=$(openssl rand -hex 32)
    echo "📝 Add this to your .env.production:"
    echo "CRON_SECRET=$CRON_SECRET"
fi

echo "🚀 Deploying Offers Cron Jobs to EventBridge"
echo "   Region: $REGION"
echo "   App URL: $APP_URL"

# ============================================
# 1. Create EventBridge Connection
# ============================================
echo ""
echo "📡 Creating EventBridge Connection..."

CONNECTION_ARN=$(aws events create-connection \
    --name huntaze-api-connection \
    --authorization-type API_KEY \
    --auth-parameters "{\"ApiKeyAuthParameters\":{\"ApiKeyName\":\"Authorization\",\"ApiKeyValue\":\"Bearer $CRON_SECRET\"}}" \
    --region $REGION \
    --query 'ConnectionArn' \
    --output text 2>/dev/null || \
    aws events describe-connection \
        --name huntaze-api-connection \
        --region $REGION \
        --query 'ConnectionArn' \
        --output text)

echo "   Connection ARN: $CONNECTION_ARN"

# ============================================
# 2. Create API Destinations
# ============================================
echo ""
echo "🎯 Creating API Destinations..."

# Expire offers destination
EXPIRE_DEST_ARN=$(aws events create-api-destination \
    --name huntaze-offers-expire \
    --connection-arn "$CONNECTION_ARN" \
    --invocation-endpoint "$APP_URL/api/cron/offers/expire" \
    --http-method POST \
    --invocation-rate-limit-per-second 1 \
    --region $REGION \
    --query 'ApiDestinationArn' \
    --output text 2>/dev/null || \
    aws events describe-api-destination \
        --name huntaze-offers-expire \
        --region $REGION \
        --query 'ApiDestinationArn' \
        --output text)

echo "   Expire Destination: $EXPIRE_DEST_ARN"

# Activate offers destination
ACTIVATE_DEST_ARN=$(aws events create-api-destination \
    --name huntaze-offers-activate \
    --connection-arn "$CONNECTION_ARN" \
    --invocation-endpoint "$APP_URL/api/cron/offers/activate" \
    --http-method POST \
    --invocation-rate-limit-per-second 1 \
    --region $REGION \
    --query 'ApiDestinationArn' \
    --output text 2>/dev/null || \
    aws events describe-api-destination \
        --name huntaze-offers-activate \
        --region $REGION \
        --query 'ApiDestinationArn' \
        --output text)

echo "   Activate Destination: $ACTIVATE_DEST_ARN"

# ============================================
# 3. Create IAM Role for EventBridge
# ============================================
echo ""
echo "🔐 Creating IAM Role..."

ROLE_NAME="huntaze-eventbridge-cron-role"

# Create trust policy
cat > /tmp/trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "events.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

ROLE_ARN=$(aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file:///tmp/trust-policy.json \
    --query 'Role.Arn' \
    --output text 2>/dev/null || \
    aws iam get-role \
        --role-name $ROLE_NAME \
        --query 'Role.Arn' \
        --output text)

echo "   Role ARN: $ROLE_ARN"

# Attach policy for API destinations
cat > /tmp/api-dest-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "events:InvokeApiDestination"
            ],
            "Resource": [
                "$EXPIRE_DEST_ARN",
                "$ACTIVATE_DEST_ARN"
            ]
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name huntaze-invoke-api-destinations \
    --policy-document file:///tmp/api-dest-policy.json 2>/dev/null || true

# ============================================
# 4. Create EventBridge Rules
# ============================================
echo ""
echo "⏰ Creating EventBridge Rules..."

# Expire offers rule (hourly)
aws events put-rule \
    --name huntaze-expire-offers \
    --schedule-expression "rate(1 hour)" \
    --state ENABLED \
    --description "Expire offers past their validUntil date - runs hourly" \
    --region $REGION

echo "   ✅ huntaze-expire-offers rule created"

# Activate offers rule (hourly)
aws events put-rule \
    --name huntaze-activate-offers \
    --schedule-expression "rate(1 hour)" \
    --state ENABLED \
    --description "Activate scheduled offers - runs hourly" \
    --region $REGION

echo "   ✅ huntaze-activate-offers rule created"

# ============================================
# 5. Create Targets
# ============================================
echo ""
echo "🎯 Attaching Targets to Rules..."

# Wait for role to propagate
sleep 5

# Expire offers target
aws events put-targets \
    --rule huntaze-expire-offers \
    --targets "[{
        \"Id\": \"expire-offers-api\",
        \"Arn\": \"$EXPIRE_DEST_ARN\",
        \"RoleArn\": \"$ROLE_ARN\",
        \"HttpParameters\": {
            \"HeaderParameters\": {
                \"Content-Type\": \"application/json\"
            }
        },
        \"RetryPolicy\": {
            \"MaximumEventAgeInSeconds\": 3600,
            \"MaximumRetryAttempts\": 3
        }
    }]" \
    --region $REGION

echo "   ✅ Expire offers target attached"

# Activate offers target
aws events put-targets \
    --rule huntaze-activate-offers \
    --targets "[{
        \"Id\": \"activate-offers-api\",
        \"Arn\": \"$ACTIVATE_DEST_ARN\",
        \"RoleArn\": \"$ROLE_ARN\",
        \"HttpParameters\": {
            \"HeaderParameters\": {
                \"Content-Type\": \"application/json\"
            }
        },
        \"RetryPolicy\": {
            \"MaximumEventAgeInSeconds\": 3600,
            \"MaximumRetryAttempts\": 3
        }
    }]" \
    --region $REGION

echo "   ✅ Activate offers target attached"

# ============================================
# 6. Verify Setup
# ============================================
echo ""
echo "🔍 Verifying Setup..."

echo ""
echo "Rules:"
aws events list-rules --name-prefix huntaze --region $REGION --query 'Rules[*].{Name:Name,State:State,Schedule:ScheduleExpression}' --output table

echo ""
echo "✅ Offers Cron Jobs Deployed Successfully!"
echo ""
echo "📋 Summary:"
echo "   - huntaze-expire-offers: Runs hourly to expire old offers"
echo "   - huntaze-activate-offers: Runs hourly to activate scheduled offers"
echo ""
echo "🔧 To test manually:"
echo "   curl -X POST $APP_URL/api/cron/offers/expire -H 'Authorization: Bearer $CRON_SECRET'"
echo "   curl -X POST $APP_URL/api/cron/offers/activate -H 'Authorization: Bearer $CRON_SECRET'"
echo ""
echo "📊 To monitor:"
echo "   aws events list-targets-by-rule --rule huntaze-expire-offers --region $REGION"
echo "   aws logs tail /aws/events/huntaze --follow --region $REGION"
