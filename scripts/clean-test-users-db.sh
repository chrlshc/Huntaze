#!/bin/bash

# Clean test users from database
# Source .env.migration file before running this script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}[INFO]${NC} Cleaning test users from database..."

# Load credentials
if [ -f ".env.migration" ]; then
    source .env.migration
elif [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}[INFO]${NC} Using DATABASE_URL from environment"
else
    echo -e "${RED}[ERROR]${NC} No database credentials found"
    echo "Please create .env.migration or set DATABASE_URL"
    exit 1
fi

# Show test users
echo ""
echo -e "${YELLOW}[INFO]${NC} Users to delete:"
psql "$DATABASE_URL" -c "SELECT id, email, created_at FROM users WHERE email LIKE 'test%' OR email = 'hc.hbtpro@gmail.com' ORDER BY id;"

# Count
COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users WHERE email LIKE 'test%' OR email = 'hc.hbtpro@gmail.com';" | tr -d ' ')

if [ "$COUNT" -eq 0 ]; then
    echo -e "${GREEN}[INFO]${NC} No test users found"
    exit 0
fi

echo ""
echo -e "${YELLOW}[WARNING]${NC} Found $COUNT test user(s)"
read -p "Delete these users? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}[INFO]${NC} Cancelled"
    exit 0
fi

# Delete
echo ""
echo -e "${GREEN}[INFO]${NC} Deleting users..."
psql "$DATABASE_URL" -c "DELETE FROM users WHERE email LIKE 'test%' OR email = 'hc.hbtpro@gmail.com';"

echo -e "${GREEN}[SUCCESS]${NC} Users deleted!"
