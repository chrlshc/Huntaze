#!/bin/bash

# Deploy Huntaze Core Infrastructure
# Usage: ./deploy-core.sh [db-password]

set -e

STACK_NAME="huntaze-core-infrastructure"
ENVIRONMENT="production"
DB_USERNAME="huntazeadmin"
DB_PASSWORD="${1:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}"

echo "🚀 Deploying Huntaze Core Infrastructure"
echo "=================================="
echo "Stack: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "DB Username: $DB_USERNAME"
echo "DB Password: [HIDDEN]"
echo ""

# Validate template
echo "📋 Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://core-infrastructure.yaml \
  --profile huntaze \
  --region us-east-1

# Deploy stack
echo "🔧 Deploying infrastructure..."
aws cloudformation deploy \
  --template-file core-infrastructure.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    Environment=$ENVIRONMENT \
    DBUsername=$DB_USERNAME \
    DBPassword="$DB_PASSWORD" \
  --capabilities CAPABILITY_IAM \
  --profile huntaze \
  --region us-east-1

echo ""
echo "✅ Stack deployed successfully!"
echo ""
echo "📊 Getting outputs..."

# Get outputs
REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
  --output text \
  --profile huntaze \
  --region us-east-1)

POSTGRES_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`PostgresEndpoint`].OutputValue' \
  --output text \
  --profile huntaze \
  --region us-east-1)

API_GATEWAY_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text \
  --profile huntaze \
  --region us-east-1)

# Save to .env file
cat > .env.infrastructure <<EOF
# Huntaze Core Infrastructure
# Generated: $(date)

# Redis Cache
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379

# PostgreSQL Database
POSTGRES_HOST=$POSTGRES_ENDPOINT
POSTGRES_PORT=5432
POSTGRES_DB=huntaze
POSTGRES_USER=$DB_USERNAME
POSTGRES_PASSWORD=$DB_PASSWORD

# API Gateway
API_GATEWAY_URL=$API_GATEWAY_URL
API_RATE_LIMIT=5000
API_BURST_LIMIT=10000

# Connection URLs
REDIS_URL=redis://$REDIS_ENDPOINT:6379
DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASSWORD@$POSTGRES_ENDPOINT:5432/huntaze
EOF

echo ""
echo "📝 Configuration saved to .env.infrastructure"
echo ""
echo "🔗 Endpoints:"
echo "  Redis: $REDIS_ENDPOINT:6379"
echo "  PostgreSQL: $POSTGRES_ENDPOINT:5432"
echo "  API Gateway: $API_GATEWAY_URL"
echo ""
echo "⚡ Next steps:"
echo "1. Update your application to use these endpoints"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Test Redis connection: redis-cli -h $REDIS_ENDPOINT ping"
echo "4. Configure API Gateway routes and authentication"
echo ""
echo "🔐 Database password has been stored in AWS Secrets Manager"
echo "   Secret name: huntaze-db-credentials-$ENVIRONMENT"