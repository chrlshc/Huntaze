#!/bin/bash
#
# Setup Data Cleanup Cron Job
#
# Configures daily automated cleanup of old onboarding data
# for GDPR compliance.
#
# Schedule: Daily at 2 AM UTC
# Retention: 365 days for events
#
# Usage:
#   ./scripts/setup-data-cleanup-cron.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Setting up data cleanup cron job...${NC}"

# Get the project directory
PROJECT_DIR=$(pwd)

# Create log directory
mkdir -p /var/log/huntaze

# Cron job configuration
CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
CRON_COMMAND="cd $PROJECT_DIR && npm run cleanup:data >> /var/log/huntaze/data-cleanup.log 2>&1"
CRON_JOB="$CRON_SCHEDULE $CRON_COMMAND"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "cleanup:data"; then
  echo -e "${YELLOW}⚠️  Cron job already exists${NC}"
  echo "Current cron jobs:"
  crontab -l | grep "cleanup:data"
else
  # Add cron job
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo -e "${GREEN}✅ Cron job added successfully${NC}"
fi

# Display configuration
echo ""
echo -e "${GREEN}📋 Cron Job Configuration:${NC}"
echo "  Schedule: Daily at 2 AM UTC"
echo "  Command: npm run cleanup:data"
echo "  Log file: /var/log/huntaze/data-cleanup.log"
echo "  Project: $PROJECT_DIR"
echo ""

# Verify cron service is running
if command -v systemctl &> /dev/null; then
  if systemctl is-active --quiet cron || systemctl is-active --quiet crond; then
    echo -e "${GREEN}✅ Cron service is running${NC}"
  else
    echo -e "${YELLOW}⚠️  Cron service may not be running${NC}"
    echo "Start it with: sudo systemctl start cron"
  fi
fi

echo ""
echo -e "${GREEN}✅ Setup complete${NC}"
echo ""
echo "To verify the cron job:"
echo "  crontab -l | grep cleanup"
echo ""
echo "To view logs:"
echo "  tail -f /var/log/huntaze/data-cleanup.log"
echo ""
echo "To test manually:"
echo "  npm run cleanup:data:dry-run"
