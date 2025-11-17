-- Rollback Migration: Remove onboarding_completed column from users table
-- Date: 2024-11-16
-- Feature: Auth Onboarding Flow

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- Drop the index first
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Remove the onboarding_completed column
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify column was removed:
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'onboarding_completed';
-- (Should return 0 rows)

-- Verify index was removed:
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed';
-- (Should return 0 rows)
