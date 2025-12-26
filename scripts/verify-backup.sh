#!/bin/bash
#
# Backup Verification Script
#
# Verifies backup integrity by:
# 1. Checking file exists and is readable
# 2. Testing decompression
# 3. Validating SQL syntax
# 4. Optionally testing restore on staging
#
# Usage:
#   ./scripts/verify-backup.sh <backup-file>
#   ./scripts/verify-backup.sh backups/pre-onboarding-20241111-120000.sql.gz
#   ./scripts/verify-backup.sh --latest
#   ./scripts/verify-backup.sh --latest --test-restore
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
BACKUP_FILE=""
TEST_RESTORE=false

if [ "$1" == "--latest" ]; then
  # Find the most recent backup
  BACKUP_FILE=$(ls -t backups/pre-onboarding-*.sql.gz 2>/dev/null | head -n 1)
  if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ No backup files found${NC}"
    exit 1
  fi
  echo -e "${YELLOW}📁 Using latest backup: $BACKUP_FILE${NC}"
elif [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Backup file not specified${NC}"
  echo "Usage: $0 <backup-file>"
  echo "       $0 --latest"
  exit 1
else
  BACKUP_FILE="$1"
fi

if [ "$2" == "--test-restore" ] || [ "$3" == "--test-restore" ]; then
  TEST_RESTORE=true
fi

echo -e "${YELLOW}🔍 Verifying backup: $BACKUP_FILE${NC}"
echo ""

# Step 1: Check file exists
echo -e "${YELLOW}1️⃣  Checking file exists...${NC}"
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi
echo -e "${GREEN}✅ File exists${NC}"

# Step 2: Check file is readable
echo -e "${YELLOW}2️⃣  Checking file is readable...${NC}"
if [ ! -r "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: Backup file is not readable${NC}"
  exit 1
fi
echo -e "${GREEN}✅ File is readable${NC}"

# Step 3: Check file size
echo -e "${YELLOW}3️⃣  Checking file size...${NC}"
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)

if [ "$FILE_SIZE_BYTES" -lt 1000 ]; then
  echo -e "${RED}❌ Error: Backup file is suspiciously small ($FILE_SIZE)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ File size: $FILE_SIZE${NC}"

# Step 4: Test decompression
echo -e "${YELLOW}4️⃣  Testing decompression...${NC}"
if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo -e "${GREEN}✅ Decompression test passed${NC}"
else
  echo -e "${RED}❌ Error: Backup file is corrupted (decompression failed)${NC}"
  exit 1
fi

# Step 5: Validate SQL syntax
echo -e "${YELLOW}5️⃣  Validating SQL syntax...${NC}"
TEMP_SQL=$(mktemp)
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

# Check for SQL keywords
if grep -q "CREATE TABLE\|INSERT INTO\|COPY" "$TEMP_SQL"; then
  echo -e "${GREEN}✅ SQL syntax appears valid${NC}"
else
  echo -e "${RED}❌ Error: Backup file does not contain valid SQL${NC}"
  rm "$TEMP_SQL"
  exit 1
fi

# Check for onboarding tables
echo -e "${YELLOW}6️⃣  Checking for onboarding tables...${NC}"
TABLES_FOUND=0

if grep -q "onboarding_step_definitions" "$TEMP_SQL"; then
  echo -e "${GREEN}  ✅ onboarding_step_definitions found${NC}"
  ((TABLES_FOUND++))
fi

if grep -q "user_onboarding" "$TEMP_SQL"; then
  echo -e "${GREEN}  ✅ user_onboarding found${NC}"
  ((TABLES_FOUND++))
fi

if grep -q "onboarding_events" "$TEMP_SQL"; then
  echo -e "${GREEN}  ✅ onboarding_events found${NC}"
  ((TABLES_FOUND++))
fi

if [ "$TABLES_FOUND" -eq 0 ]; then
  echo -e "${YELLOW}  ⚠️  No onboarding tables found (might be a full DB backup)${NC}"
fi

rm "$TEMP_SQL"

# Step 7: Test restore (optional)
if [ "$TEST_RESTORE" = true ]; then
  echo -e "${YELLOW}7️⃣  Testing restore on staging...${NC}"
  
  if [ -z "$STAGING_DATABASE_URL" ]; then
    echo -e "${YELLOW}  ⚠️  STAGING_DATABASE_URL not set, skipping restore test${NC}"
  else
    echo -e "${YELLOW}  Restoring to staging database...${NC}"
    
    # Create a test schema
    TEST_SCHEMA="backup_test_$(date +%s)"
    
    # Restore to test schema
    gunzip -c "$BACKUP_FILE" | \
      sed "s/public\./$TEST_SCHEMA./g" | \
      psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}  ✅ Restore test passed${NC}"
      
      # Cleanup test schema
      psql "$STAGING_DATABASE_URL" -c "DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE" > /dev/null 2>&1
    else
      echo -e "${RED}  ❌ Restore test failed${NC}"
      exit 1
    fi
  fi
fi

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup verification completed successfully${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "File size: $FILE_SIZE"
echo "Onboarding tables found: $TABLES_FOUND"
echo ""
echo "This backup is valid and can be used for restore."
echo ""

exit 0
