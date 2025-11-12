#!/bin/bash
#
# Migration Dry-Run Script
#
# Tests database migrations on staging with anonymized production data.
# This ensures migrations work correctly before running on production.
#
# Steps:
# 1. Copy production data to staging (anonymized)
# 2. Run migration
# 3. Verify table creation
# 4. Verify data integrity
# 5. Seed test data
# 6. Run integration tests
#
# Usage:
#   ./scripts/dry-run-migration.sh
#   ./scripts/dry-run-migration.sh --skip-copy  # Skip data copy step
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SKIP_COPY=false
START_TIME=$(date +%s)

# Parse arguments
if [ "$1" == "--skip-copy" ]; then
  SKIP_COPY=true
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Migration Dry-Run on Staging${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check environment variables
if [ -z "$STAGING_DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: STAGING_DATABASE_URL not set${NC}"
  exit 1
fi

if [ "$SKIP_COPY" = false ] && [ -z "$PRODUCTION_DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: PRODUCTION_DATABASE_URL not set${NC}"
  exit 1
fi

# Step 1: Copy production data to staging (anonymized)
if [ "$SKIP_COPY" = false ]; then
  echo -e "${YELLOW}📋 Step 1: Copying production data to staging...${NC}"
  
  TEMP_DUMP=$(mktemp)
  ANON_DUMP=$(mktemp)
  
  echo "  Dumping production database..."
  pg_dump "$PRODUCTION_DATABASE_URL" \
    --no-owner \
    --no-acl \
    > "$TEMP_DUMP"
  
  echo "  Anonymizing PII..."
  ./scripts/anonymize-pii.sh < "$TEMP_DUMP" > "$ANON_DUMP"
  
  echo "  Loading to staging..."
  psql "$STAGING_DATABASE_URL" < "$ANON_DUMP"
  
  rm "$TEMP_DUMP" "$ANON_DUMP"
  
  echo -e "${GREEN}  ✅ Data copied and anonymized${NC}"
else
  echo -e "${YELLOW}⏭️  Step 1: Skipped (--skip-copy flag)${NC}"
fi

# Step 2: Run migration
echo ""
echo -e "${YELLOW}🔄 Step 2: Running migration...${NC}"

MIGRATION_START=$(date +%s)

psql "$STAGING_DATABASE_URL" \
  < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

MIGRATION_END=$(date +%s)
MIGRATION_DURATION=$((MIGRATION_END - MIGRATION_START))

echo -e "${GREEN}  ✅ Migration completed in ${MIGRATION_DURATION}s${NC}"

# Step 3: Verify table creation
echo ""
echo -e "${YELLOW}🔍 Step 3: Verifying table creation...${NC}"

TABLES=(
  "onboarding_step_definitions"
  "user_onboarding"
  "onboarding_events"
)

for table in "${TABLES[@]}"; do
  if psql "$STAGING_DATABASE_URL" -c "\d $table" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Table exists: $table${NC}"
  else
    echo -e "${RED}  ❌ Table missing: $table${NC}"
    exit 1
  fi
done

# Step 4: Verify data integrity
echo ""
echo -e "${YELLOW}🔍 Step 4: Verifying data integrity...${NC}"

# Check row counts
for table in "${TABLES[@]}"; do
  ROW_COUNT=$(psql "$STAGING_DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;")
  echo "  $table: $ROW_COUNT rows"
done

# Check foreign keys
echo ""
echo "  Checking foreign key constraints..."
FK_VIOLATIONS=$(psql "$STAGING_DATABASE_URL" -t -c "
  SELECT COUNT(*)
  FROM user_onboarding uo
  LEFT JOIN onboarding_step_definitions osd ON uo.step_id = osd.id
  WHERE osd.id IS NULL;
")

if [ "$FK_VIOLATIONS" -eq 0 ]; then
  echo -e "${GREEN}  ✅ No foreign key violations${NC}"
else
  echo -e "${RED}  ❌ Found $FK_VIOLATIONS foreign key violations${NC}"
  exit 1
fi

# Check indexes
echo ""
echo "  Checking indexes..."
INDEXES=$(psql "$STAGING_DATABASE_URL" -t -c "
  SELECT COUNT(*)
  FROM pg_indexes
  WHERE tablename LIKE '%onboarding%';
")
echo "  Found $INDEXES indexes"

# Step 5: Seed test data
echo ""
echo -e "${YELLOW}🌱 Step 5: Seeding test data...${NC}"

if [ -f "scripts/seed-huntaze-onboarding.js" ]; then
  node scripts/seed-huntaze-onboarding.js
  echo -e "${GREEN}  ✅ Test data seeded${NC}"
else
  echo -e "${YELLOW}  ⚠️  Seed script not found, skipping${NC}"
fi

# Step 6: Run integration tests
echo ""
echo -e "${YELLOW}🧪 Step 6: Running integration tests...${NC}"

if npm run test:integration > /dev/null 2>&1; then
  echo -e "${GREEN}  ✅ Integration tests passed${NC}"
else
  echo -e "${RED}  ❌ Integration tests failed${NC}"
  echo "  Run 'npm run test:integration' for details"
  exit 1
fi

# Calculate total duration
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Dry-run completed successfully${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Summary:"
echo "  Migration duration: ${MIGRATION_DURATION}s"
echo "  Total duration: ${TOTAL_DURATION}s"
echo "  Tables created: ${#TABLES[@]}"
echo "  Indexes created: $INDEXES"
echo "  Foreign key violations: 0"
echo ""
echo -e "${GREEN}✅ Migration is ready for production${NC}"
echo ""

exit 0
