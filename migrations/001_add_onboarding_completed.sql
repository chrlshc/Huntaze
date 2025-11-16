-- Migration: Add onboarding_completed column to users table
-- Version: 001
-- Date: 2024-01-16
-- Description: Adds onboarding_completed boolean field to track user onboarding status
-- Requirements: 5.4

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Step 1: Add onboarding_completed column with default value false
-- This is a safe operation that won't block the table for long
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Step 2: Backfill existing users with onboarding_completed = true
-- This ensures backward compatibility - existing users are treated as having completed onboarding
-- Run this in batches if you have a large number of users (see batch script below)
UPDATE users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Step 3: Create index for query performance
-- Using CONCURRENTLY to avoid locking the table (PostgreSQL 11+)
-- Remove CONCURRENTLY if using an older version or different database
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_onboarding_completed 
ON users(onboarding_completed);

-- Step 4: Add comment to document the column
COMMENT ON COLUMN users.onboarding_completed IS 
'Tracks whether user has completed the onboarding flow. Default false for new users, true for existing users.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Verify all existing users are marked as completed
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users,
  COUNT(CASE WHEN onboarding_completed IS NULL THEN 1 END) as null_users
FROM users;

-- Verify index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- WARNING: This will permanently delete the onboarding_completed column and all data
-- Only run this if you need to completely revert the migration

-- Step 1: Drop the index
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Step 2: Drop the column
ALTER TABLE users 
DROP COLUMN IF EXISTS onboarding_completed;

-- Verify rollback
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
-- Should return 0 rows if rollback was successful
