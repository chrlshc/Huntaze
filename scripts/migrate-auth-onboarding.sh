#!/bin/bash

# Migration script for auth-onboarding-flow feature
# Adds onboarding_completed column to users table

set -e

echo "=========================================="
echo "Auth Onboarding Flow - Database Migration"
echo "=========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set DATABASE_URL before running this script:"
  echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
  exit 1
fi

echo "📋 Migration Details:"
echo "  - Add onboarding_completed column (BOOLEAN, default false)"
echo "  - Backfill existing users with true (backward compatibility)"
echo "  - Create index on onboarding_completed"
echo ""

# Prompt for confirmation
read -p "Do you want to proceed with the migration? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run the migration
psql "$DATABASE_URL" -f lib/db/migrations/2024-11-16-auth-onboarding-flow.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📊 Verification:"
  echo ""
  
  # Verify the migration
  psql "$DATABASE_URL" -c "
    SELECT 
      column_name, 
      data_type, 
      column_default,
      is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_completed';
  "
  
  echo ""
  psql "$DATABASE_URL" -c "
    SELECT 
      COUNT(*) as total_users, 
      SUM(CASE WHEN onboarding_completed = true THEN 1 ELSE 0 END) as completed_onboarding,
      SUM(CASE WHEN onboarding_completed = false THEN 1 ELSE 0 END) as incomplete_onboarding
    FROM users;
  "
  
  echo ""
  psql "$DATABASE_URL" -c "
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
  "
  
  echo ""
  echo "=========================================="
  echo "✅ Migration Complete"
  echo "=========================================="
  echo ""
  echo "Next steps:"
  echo "  1. Deploy backend changes (NextAuth config, API endpoints)"
  echo "  2. Deploy frontend changes (auth page, onboarding page)"
  echo "  3. Test registration and login flows"
  echo ""
else
  echo ""
  echo "❌ Migration failed!"
  echo ""
  echo "To rollback, run:"
  echo "  psql \$DATABASE_URL -f lib/db/migrations/2024-11-16-auth-onboarding-flow-rollback.sql"
  exit 1
fi
