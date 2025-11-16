-- Migration: Add onboarding_completed column to users table (BATCH VERSION)
-- Version: 001-batch
-- Date: 2024-01-16
-- Description: Batch update script for large tables to avoid long-running transactions
-- Use this version if you have more than 100,000 users

-- ============================================================================
-- BATCH UPDATE SCRIPT FOR LARGE TABLES
-- ============================================================================

-- This script updates users in batches to avoid locking the table for too long
-- Adjust BATCH_SIZE based on your database performance

DO $$
DECLARE
  batch_size INTEGER := 10000;  -- Adjust based on your needs
  rows_updated INTEGER;
  total_updated INTEGER := 0;
BEGIN
  -- Step 1: Add column (if not exists)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Column onboarding_completed added to users table';
  ELSE
    RAISE NOTICE 'Column onboarding_completed already exists';
  END IF;

  -- Step 2: Update in batches
  LOOP
    -- Update a batch of users
    WITH batch AS (
      SELECT id
      FROM users
      WHERE onboarding_completed IS NULL OR onboarding_completed = false
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    UPDATE users
    SET onboarding_completed = true
    FROM batch
    WHERE users.id = batch.id;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    total_updated := total_updated + rows_updated;
    
    RAISE NOTICE 'Updated % users (total: %)', rows_updated, total_updated;
    
    -- Exit loop if no more rows to update
    EXIT WHEN rows_updated = 0;
    
    -- Small delay to avoid overwhelming the database
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  RAISE NOTICE 'Batch update complete. Total users updated: %', total_updated;
  
  -- Step 3: Create index concurrently
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_onboarding_completed'
  ) THEN
    CREATE INDEX CONCURRENTLY idx_users_onboarding_completed 
    ON users(onboarding_completed);
    RAISE NOTICE 'Index idx_users_onboarding_completed created';
  ELSE
    RAISE NOTICE 'Index idx_users_onboarding_completed already exists';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed_users,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete_users,
  COUNT(CASE WHEN onboarding_completed IS NULL THEN 1 END) as null_users
FROM users;
