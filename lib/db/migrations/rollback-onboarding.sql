-- Rollback Script for Huntaze Onboarding System
-- 
-- This script safely removes all onboarding-related database objects.
-- It is idempotent and can be run multiple times safely.
--
-- Usage:
--   psql $DATABASE_URL < lib/db/migrations/rollback-onboarding.sql
--
-- WARNING: This will delete all onboarding data!
-- Make sure you have a backup before running this script.

BEGIN;

-- Display warning
DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: This will delete all onboarding data!';
  RAISE NOTICE 'Make sure you have a backup before proceeding.';
  RAISE NOTICE 'Press Ctrl+C within 5 seconds to cancel...';
  PERFORM pg_sleep(5);
END $$;

-- Drop tables in reverse order (respecting foreign key dependencies)
-- Order: events -> user_onboarding -> step_definitions

RAISE NOTICE '🗑️  Dropping onboarding_events table...';
DROP TABLE IF EXISTS onboarding_events CASCADE;

RAISE NOTICE '🗑️  Dropping user_onboarding table...';
DROP TABLE IF EXISTS user_onboarding CASCADE;

RAISE NOTICE '🗑️  Dropping onboarding_step_definitions table...';
DROP TABLE IF EXISTS onboarding_step_definitions CASCADE;

-- Drop functions
RAISE NOTICE '🗑️  Dropping functions...';

DROP FUNCTION IF EXISTS calculate_onboarding_progress(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS has_step_done(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS can_transition_to(TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS get_user_onboarding_state(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_onboarding_progress(UUID) CASCADE;

-- Drop indexes (if any remain)
RAISE NOTICE '🗑️  Dropping indexes...';

DROP INDEX IF EXISTS idx_user_onboarding_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_onboarding_step_id CASCADE;
DROP INDEX IF EXISTS idx_user_onboarding_status CASCADE;
DROP INDEX IF EXISTS idx_onboarding_events_user_id CASCADE;
DROP INDEX IF EXISTS idx_onboarding_events_step_id CASCADE;
DROP INDEX IF EXISTS idx_onboarding_events_created_at CASCADE;
DROP INDEX IF EXISTS idx_step_definitions_market CASCADE;
DROP INDEX IF EXISTS idx_step_definitions_active CASCADE;

-- Drop types (if any)
RAISE NOTICE '🗑️  Dropping types...';

DROP TYPE IF EXISTS onboarding_status CASCADE;
DROP TYPE IF EXISTS onboarding_event_type CASCADE;

-- Drop triggers (if any)
RAISE NOTICE '🗑️  Dropping triggers...';

DROP TRIGGER IF EXISTS update_onboarding_progress_trigger ON user_onboarding CASCADE;
DROP TRIGGER IF EXISTS log_onboarding_event_trigger ON user_onboarding CASCADE;

-- Verify cleanup
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Check for remaining tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%onboarding%';
    
  -- Check for remaining functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname LIKE '%onboarding%';
  
  IF table_count > 0 THEN
    RAISE WARNING 'Found % remaining onboarding tables', table_count;
  END IF;
  
  IF function_count > 0 THEN
    RAISE WARNING 'Found % remaining onboarding functions', function_count;
  END IF;
  
  IF table_count = 0 AND function_count = 0 THEN
    RAISE NOTICE '✅ All onboarding objects removed successfully';
  END IF;
END $$;

COMMIT;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Rollback completed successfully';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE 'All onboarding database objects have been removed.';
  RAISE NOTICE 'To restore from backup, run:';
  RAISE NOTICE '  gunzip -c <backup-file> | psql $DATABASE_URL';
  RAISE NOTICE '';
END $$;
