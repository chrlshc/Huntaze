#!/bin/bash
#
# Database Backup Script for Huntaze Onboarding
# 
# Creates a timestamped backup of the database before migrations.
# Compresses the backup and stores it in the backups directory.
#
# Usage:
#   ./scripts/backup-database.sh
#   ./scripts/backup-database.sh --tables-only  # Backup only onboarding tables
#

set -e  # Exit on error

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre-onboarding-${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
  echo "Please set DATABASE_URL before running this script"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🔄 Starting database backup...${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Backup file: $BACKUP_FILE"

# Check if --tables-only flag is provided
if [ "$1" == "--tables-only" ]; then
  echo -e "${YELLOW}📋 Backing up onboarding tables only...${NC}"
  
  # Backup only onboarding-related tables
  pg_dump "$DATABASE_URL" \
    --table=onboarding_step_definitions \
    --table=user_onboarding \
    --table=onboarding_events \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE"
else
  echo -e "${YELLOW}📋 Backing up entire database...${NC}"
  
  # Full database backup
  pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE"
fi

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database backup created successfully${NC}"
  
  # Get backup file size
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup size: $BACKUP_SIZE"
  
  # Compress the backup
  echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
  gzip "$BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup compressed successfully${NC}"
    echo "Compressed size: $COMPRESSED_SIZE"
    echo "Compressed file: $COMPRESSED_FILE"
    
    # Calculate compression ratio
    echo ""
    echo -e "${GREEN}📊 Backup Summary:${NC}"
    echo "  Original size: $BACKUP_SIZE"
    echo "  Compressed size: $COMPRESSED_SIZE"
    echo "  Location: $COMPRESSED_FILE"
    echo ""
    
    # List recent backups
    echo -e "${YELLOW}📁 Recent backups:${NC}"
    ls -lh "$BACKUP_DIR" | tail -n 5
    
    # Cleanup old backups (keep last 30 days)
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 30 days)...${NC}"
    find "$BACKUP_DIR" -name "pre-onboarding-*.sql.gz" -mtime +30 -delete
    
    REMAINING_BACKUPS=$(ls -1 "$BACKUP_DIR"/pre-onboarding-*.sql.gz 2>/dev/null | wc -l)
    echo "Remaining backups: $REMAINING_BACKUPS"
    
    echo ""
    echo -e "${GREEN}✅ Backup process completed successfully${NC}"
    echo ""
    echo "To restore this backup, run:"
    echo "  gunzip -c $COMPRESSED_FILE | psql \$DATABASE_URL"
    
    exit 0
  else
    echo -e "${RED}❌ Error: Failed to compress backup${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Error: Database backup failed${NC}"
  exit 1
fi
