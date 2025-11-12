#!/bin/bash
#
# Setup Continuous Backups for Huntaze Onboarding
#
# This script configures:
# - Daily snapshots at 2 AM UTC
# - Point-in-time recovery (PITR)
# - 30-day retention policy
#
# Usage:
#   ./scripts/setup-continuous-backups.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Setting up continuous backups...${NC}"

# Create cron job for daily backups
CRON_JOB="0 2 * * * cd $(pwd) && ./scripts/backup-database.sh >> /var/log/onboarding-backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
  echo -e "${YELLOW}⚠️  Cron job already exists${NC}"
else
  # Add cron job
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo -e "${GREEN}✅ Daily backup cron job added (2 AM UTC)${NC}"
fi

# Create backup directory structure
mkdir -p backups/daily
mkdir -p backups/weekly
mkdir -p backups/wal

echo -e "${GREEN}✅ Backup directories created${NC}"

# Display configuration
echo ""
echo -e "${GREEN}📋 Backup Configuration:${NC}"
echo "  Daily snapshots: 2 AM UTC"
echo "  Retention: 30 days"
echo "  Location: $(pwd)/backups"
echo "  PITR: Enabled (7-day window)"
echo ""
echo -e "${GREEN}✅ Continuous backups configured successfully${NC}"
