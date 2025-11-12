#!/bin/bash

# Deploy Wizard Completions Migration to Staging
# This script safely deploys the wizard completions table to staging environment

set -e  # Exit on any error

echo "🚀 Starting Wizard Completions Migration Deployment to Staging"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check AWS CLI is installed
echo "📋 Step 1: Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "   Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql is not installed. Please install PostgreSQL client.${NC}"
    echo "   macOS: brew install postgresql"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Check AWS credentials
echo "📋 Step 2: Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured or invalid.${NC}"
    echo "   Run: aws configure"
    exit 1
fi

AWS_IDENTITY=$(aws sts get-caller-identity --query 'Arn' --output text)
echo -e "${GREEN}✓ Authenticated as: ${AWS_IDENTITY}${NC}"
echo ""

# Step 3: Retrieve DATABASE_URL from AWS Secrets Manager
echo "📋 Step 3: Retrieving staging database URL from AWS Secrets Manager..."
SECRET_ID="huntaze/database"

SECRET_JSON=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ID" \
    --query SecretString \
    --output text 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to retrieve secret: $SECRET_ID${NC}"
    echo "   Error: $SECRET_JSON"
    echo "   Make sure the secret exists and you have permission to access it."
    exit 1
fi

# Parse DATABASE_URL from JSON
DATABASE_URL=$(echo "$SECRET_JSON" | grep -o '"DATABASE_URL":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DATABASE_URL" ]; then
    # Try parsing as plain text (not JSON)
    DATABASE_URL="$SECRET_JSON"
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL is empty${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database URL retrieved successfully${NC}"
echo ""

# Step 4: Test database connection
echo "📋 Step 4: Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "   Please check the DATABASE_URL and network connectivity."
    exit 1
fi

echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Step 5: Check if table already exists
echo "📋 Step 5: Checking if migration is needed..."
TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_wizard_completions');" | xargs)

if [ "$TABLE_EXISTS" = "t" ]; then
    echo -e "${YELLOW}⚠️  Table 'user_wizard_completions' already exists${NC}"
    read -p "Do you want to continue anyway? This is safe (uses IF NOT EXISTS). (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled."
        exit 0
    fi
fi

echo ""

# Step 6: Create backup (optional but recommended)
echo "📋 Step 6: Creating backup point..."
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "   Backup timestamp: $BACKUP_TIMESTAMP"
echo "   (Note: Actual backup should be done via your backup system)"
echo ""

# Step 7: Run the migration
echo "📋 Step 7: Running migration..."
MIGRATION_FILE="lib/db/migrations/2025-11-11-wizard-completions.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo "   Executing: $MIGRATION_FILE"
if ! psql "$DATABASE_URL" < "$MIGRATION_FILE"; then
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migration executed successfully${NC}"
echo ""

# Step 8: Verify migration
echo "📋 Step 8: Verifying migration..."

# Check table exists
TABLE_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_wizard_completions');" | xargs)
if [ "$TABLE_CHECK" != "t" ]; then
    echo -e "${RED}❌ Table was not created${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Table 'user_wizard_completions' exists${NC}"

# Check row count
ROW_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_wizard_completions;" | xargs)
echo -e "${GREEN}✓ Current row count: $ROW_COUNT${NC}"

# Check indexes
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'user_wizard_completions';" | xargs)
echo -e "${GREEN}✓ Indexes created: $INDEX_COUNT${NC}"

# Check view exists
VIEW_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'wizard_analytics');" | xargs)
if [ "$VIEW_CHECK" = "t" ]; then
    echo -e "${GREEN}✓ View 'wizard_analytics' exists${NC}"
else
    echo -e "${YELLOW}⚠️  View 'wizard_analytics' not found${NC}"
fi

# Check function exists
FUNCTION_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_user_wizard_config');" | xargs)
if [ "$FUNCTION_CHECK" = "t" ]; then
    echo -e "${GREEN}✓ Function 'get_user_wizard_config' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Function 'get_user_wizard_config' not found${NC}"
fi

echo ""
echo "=============================================================="
echo -e "${GREEN}🎉 Migration deployment completed successfully!${NC}"
echo "=============================================================="
echo ""
echo "Summary:"
echo "  • Table: user_wizard_completions"
echo "  • Rows: $ROW_COUNT"
echo "  • Indexes: $INDEX_COUNT"
echo "  • Environment: staging"
echo "  • Timestamp: $(date)"
echo ""
echo "Next steps:"
echo "  1. Test the wizard API endpoint"
echo "  2. Monitor application logs"
echo "  3. Check for any errors in staging"
echo ""
