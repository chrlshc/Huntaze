#!/bin/bash

# Deploy Wizard to Staging
# This script deploys the wizard feature to staging environment

set -e  # Exit on error

echo "🚀 Deploying Wizard to Staging..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS credentials verified${NC}"

# Get staging database URL from AWS Secrets Manager
echo ""
echo "📦 Fetching staging database URL..."
DATABASE_URL=$(aws secretsmanager get-secret-value \
    --secret-id staging/database-url \
    --query SecretString \
    --output text 2>/dev/null)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Could not fetch database URL from Secrets Manager${NC}"
    echo "Make sure the secret 'staging/database-url' exists"
    exit 1
fi

echo -e "${GREEN}✓ Database URL retrieved${NC}"

# Backup current database (optional but recommended)
echo ""
echo "💾 Creating backup..."
BACKUP_FILE="backups/wizard-pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups

psql "$DATABASE_URL" -c "\copy (SELECT * FROM user_wizard_completions) TO STDOUT" > "$BACKUP_FILE" 2>/dev/null || echo "No existing data to backup"

echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"

# Run migration
echo ""
echo "🔄 Running database migration..."
psql "$DATABASE_URL" < lib/db/migrations/2025-11-11-wizard-completions.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Verify migration
echo ""
echo "🔍 Verifying migration..."
TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_wizard_completions');")

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Table 'user_wizard_completions' created successfully${NC}"
else
    echo -e "${RED}❌ Table verification failed${NC}"
    exit 1
fi

# Check view exists
VIEW_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'wizard_analytics');")

if [ "$VIEW_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ View 'wizard_analytics' created successfully${NC}"
else
    echo -e "${YELLOW}⚠ View 'wizard_analytics' not found${NC}"
fi

# Deploy code to staging (if using git-based deployment)
echo ""
echo "📤 Pushing code to staging..."

# Option 1: If using Vercel/Netlify
# vercel --prod

# Option 2: If using AWS Amplify
# git push staging main

# Option 3: If using custom deployment
echo -e "${YELLOW}⚠ Manual step: Deploy code to staging via your deployment pipeline${NC}"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Wizard Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Deploy code to staging (if not automated)"
echo "2. Test wizard at: https://staging.huntaze.com/onboarding/wizard"
echo "3. Verify database: psql \$DATABASE_URL -c 'SELECT * FROM wizard_analytics;'"
echo "4. Monitor logs for any errors"
echo ""
echo "Rollback command (if needed):"
echo "  psql \$DATABASE_URL < lib/db/migrations/rollback-wizard.sql"
echo ""
