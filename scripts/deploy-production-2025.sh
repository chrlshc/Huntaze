#!/bin/bash

###############################################################################
# Production Deployment Script 2025
# 
# Déploie l'application avec toutes les améliorations de sécurité et performance
###############################################################################

set -e

echo "🚀 Starting Production Deployment 2025..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"

###############################################################################
# 1. Pre-deployment Checks
###############################################################################

echo ""
echo "📋 Step 1: Pre-deployment Checks"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js 20.9+ required. Current: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js version OK: $(node -v)${NC}"

# Check dependencies
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
  npm ci
fi
echo -e "${GREEN}✅ Dependencies OK${NC}"

# Type check
echo "🔍 Running type check..."
npm run type-check
echo -e "${GREEN}✅ Type check passed${NC}"

# Lint
echo "🔍 Running linter..."
npm run lint
echo -e "${GREEN}✅ Lint passed${NC}"

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level=high
echo -e "${GREEN}✅ Security audit passed${NC}"

###############################################################################
# 2. Run Tests
###############################################################################

echo ""
echo "🧪 Step 2: Running Tests"

# Unit tests
echo "Running unit tests..."
npm run test:run
echo -e "${GREEN}✅ Unit tests passed${NC}"

# Integration tests
echo "Running integration tests..."
npm run test:run tests/integration/
echo -e "${GREEN}✅ Integration tests passed${NC}"

###############################################################################
# 3. Configure Secrets
###############################################################################

echo ""
echo "🔐 Step 3: Configuring Secrets"

# Check if secrets exist
SECRETS=(
  "huntaze/database/password"
  "huntaze/nextauth/secret"
  "huntaze/onlyfans/api-key"
)

for SECRET in "${SECRETS[@]}"; do
  if aws secretsmanager describe-secret --secret-id "$SECRET" --region "$AWS_REGION" &> /dev/null; then
    echo -e "${GREEN}✅ Secret exists: $SECRET${NC}"
  else
    echo -e "${RED}❌ Secret missing: $SECRET${NC}"
    echo "Create it with: aws secretsmanager create-secret --name $SECRET --secret-string 'value'"
    exit 1
  fi
done

###############################################################################
# 4. Database Migrations
###############################################################################

echo ""
echo "🗄️  Step 4: Database Migrations"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations applied${NC}"

###############################################################################
# 5. Build Application
###############################################################################

echo ""
echo "🏗️  Step 5: Building Application"

# Build
echo "Building Next.js application..."
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

###############################################################################
# 6. Configure CloudWatch Alarms
###############################################################################

echo ""
echo "📊 Step 6: Configuring CloudWatch Alarms"

# Create alarms from SLOs
echo "Creating CloudWatch alarms..."

# API 5xx errors > 2%
aws cloudwatch put-metric-alarm \
  --alarm-name "huntaze-api-5xx-errors" \
  --alarm-description "API 5xx errors > 2%" \
  --metric-name "5XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 0.02 \
  --comparison-operator "GreaterThanThreshold" \
  --region "$AWS_REGION"

echo -e "${GREEN}✅ CloudWatch alarms configured${NC}"

###############################################################################
# 7. Deploy to AWS
###############################################################################

echo ""
echo "🚀 Step 7: Deploying to AWS"

if [ "$ENVIRONMENT" == "production" ]; then
  echo -e "${YELLOW}⚠️  Deploying to PRODUCTION${NC}"
  read -p "Are you sure? (yes/no): " CONFIRM
  
  if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
  fi
fi

# Deploy based on infrastructure
if [ -f "sst.config.ts" ]; then
  echo "Deploying with SST..."
  npx sst deploy --stage "$ENVIRONMENT"
elif [ -f "amplify.yml" ]; then
  echo "Deploying with Amplify..."
  # Amplify auto-deploys on git push
  git push origin main
else
  echo -e "${RED}❌ No deployment configuration found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Deployment initiated${NC}"

###############################################################################
# 8. Post-deployment Verification
###############################################################################

echo ""
echo "✅ Step 8: Post-deployment Verification"

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 30

# Health check
echo "Running health check..."
HEALTH_URL="https://app.huntaze.com/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

# Smoke tests
echo "Running smoke tests..."
npm run test:e2e -- --grep "@smoke"
echo -e "${GREEN}✅ Smoke tests passed${NC}"

###############################################################################
# 9. Enable Monitoring
###############################################################################

echo ""
echo "📊 Step 9: Enabling Monitoring"

# Start CloudWatch Logs tailing (in background)
echo "CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\$252Fhuntaze\$252F$ENVIRONMENT"

# Metrics dashboard
echo "Metrics Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=huntaze-$ENVIRONMENT"

###############################################################################
# 10. Deployment Summary
###############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "URL: https://app.huntaze.com"
echo ""
echo "Next Steps:"
echo "1. Monitor CloudWatch alarms"
echo "2. Check error rates"
echo "3. Verify user flows"
echo "4. Update status page"
echo ""
echo "Rollback command:"
echo "  git revert HEAD && ./scripts/deploy-production-2025.sh $ENVIRONMENT"
echo ""
echo "═══════════════════════════════════════════════════════════"
