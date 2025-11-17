-- Migration: Add onboarding_completed column to users table
-- Date: 2024-11-16
-- Feature: Auth Onboarding Flow
-- Requirements: 1.3, 2.1, 5.3, 5.4

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Add onboarding_completed column with default value false
-- This ensures new users will have onboarding_completed = false by default
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Backfill existing users with onboarding_completed = true for backward compatibility
-- This ensures existing users are not forced through onboarding again
UPDATE users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Create index on onboarding_completed for query performance
-- This optimizes queries that filter by onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON users(onboarding_completed);

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS idx_users_onboarding_completed;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify column was added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'onboarding_completed';

-- Verify existing users were backfilled:
-- SELECT COUNT(*) as total_users, 
--        SUM(CASE WHEN onboarding_completed = true THEN 1 ELSE 0 END) as completed_onboarding,
--        SUM(CASE WHEN onboarding_completed = false THEN 1 ELSE 0 END) as incomplete_onboarding
-- FROM users;

-- Verify index was created:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
