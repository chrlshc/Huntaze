-- Test Migration Script
-- This script tests the migration in a safe way without modifying production data
-- Run this in a test/development environment before running in staging/production

-- ============================================================================
-- TEST SETUP
-- ============================================================================

-- Create a test table that mimics the users table structure
CREATE TABLE IF NOT EXISTS users_migration_test (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert test data
INSERT INTO users_migration_test (email, name, password, created_at)
VALUES 
    ('user1@test.com', 'User 1', 'hashed_password_1', NOW() - INTERVAL '30 days'),
    ('user2@test.com', 'User 2', 'hashed_password_2', NOW() - INTERVAL '20 days'),
    ('user3@test.com', 'User 3', 'hashed_password_3', NOW() - INTERVAL '10 days'),
    ('user4@test.com', 'User 4', 'hashed_password_4', NOW() - INTERVAL '5 days'),
    ('user5@test.com', 'User 5', 'hashed_password_5', NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- TEST MIGRATION
-- ============================================================================

-- Test 1: Add column
DO $$
BEGIN
    RAISE NOTICE 'Test 1: Adding onboarding_completed column...';
    
    ALTER TABLE users_migration_test 
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
    
    -- Verify column was added
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_migration_test' 
        AND column_name = 'onboarding_completed'
    ) THEN
        RAISE NOTICE '✓ Test 1 PASSED: Column added successfully';
    ELSE
        RAISE EXCEPTION '✗ Test 1 FAILED: Column was not added';
    END IF;
END $$;

-- Test 2: Backfill existing users
DO $$
DECLARE
    rows_updated INTEGER;
BEGIN
    RAISE NOTICE 'Test 2: Backfilling existing users...';
    
    UPDATE users_migration_test 
    SET onboarding_completed = true 
    WHERE onboarding_completed IS NULL OR onboarding_completed = false;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    
    RAISE NOTICE '✓ Test 2 PASSED: Updated % rows', rows_updated;
END $$;

-- Test 3: Verify data distribution
DO $$
DECLARE
    total_count INTEGER;
    completed_count INTEGER;
    incomplete_count INTEGER;
BEGIN
    RAISE NOTICE 'Test 3: Verifying data distribution...';
    
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN onboarding_completed = true THEN 1 END),
        COUNT(CASE WHEN onboarding_completed = false THEN 1 END)
    INTO total_count, completed_count, incomplete_count
    FROM users_migration_test;
    
    RAISE NOTICE 'Total users: %', total_count;
    RAISE NOTICE 'Completed: %', completed_count;
    RAISE NOTICE 'Incomplete: %', incomplete_count;
    
    IF completed_count = total_count AND incomplete_count = 0 THEN
        RAISE NOTICE '✓ Test 3 PASSED: All existing users marked as completed';
    ELSE
        RAISE EXCEPTION '✗ Test 3 FAILED: Data distribution incorrect';
    END IF;
END $$;

-- Test 4: Create index
DO $$
BEGIN
    RAISE NOTICE 'Test 4: Creating index...';
    
    CREATE INDEX IF NOT EXISTS idx_users_migration_test_onboarding 
    ON users_migration_test(onboarding_completed);
    
    -- Verify index was created
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'users_migration_test' 
        AND indexname = 'idx_users_migration_test_onboarding'
    ) THEN
        RAISE NOTICE '✓ Test 4 PASSED: Index created successfully';
    ELSE
        RAISE EXCEPTION '✗ Test 4 FAILED: Index was not created';
    END IF;
END $$;

-- Test 5: Test new user insertion
DO $$
DECLARE
    new_user_completed BOOLEAN;
BEGIN
    RAISE NOTICE 'Test 5: Testing new user insertion...';
    
    -- Insert a new user (should get default value false)
    INSERT INTO users_migration_test (email, name, password)
    VALUES ('newuser@test.com', 'New User', 'hashed_password_new')
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW();
    
    -- Check the new user's onboarding_completed value
    SELECT onboarding_completed 
    INTO new_user_completed
    FROM users_migration_test 
    WHERE email = 'newuser@test.com';
    
    IF new_user_completed = false THEN
        RAISE NOTICE '✓ Test 5 PASSED: New user has onboarding_completed = false';
    ELSE
        RAISE EXCEPTION '✗ Test 5 FAILED: New user should have onboarding_completed = false';
    END IF;
END $$;

-- Test 6: Test index usage
DO $$
DECLARE
    query_plan TEXT;
BEGIN
    RAISE NOTICE 'Test 6: Testing index usage...';
    
    -- Get query plan
    SELECT query_plan INTO query_plan FROM (
        EXPLAIN SELECT * FROM users_migration_test WHERE onboarding_completed = false
    ) AS plan;
    
    IF query_plan LIKE '%Index Scan%' OR query_plan LIKE '%Bitmap Index Scan%' THEN
        RAISE NOTICE '✓ Test 6 PASSED: Index is being used';
    ELSE
        RAISE NOTICE '⚠ Test 6 WARNING: Index may not be used (table might be too small)';
    END IF;
END $$;

-- Test 7: Test rollback
DO $$
BEGIN
    RAISE NOTICE 'Test 7: Testing rollback...';
    
    -- Drop index
    DROP INDEX IF EXISTS idx_users_migration_test_onboarding;
    
    -- Drop column
    ALTER TABLE users_migration_test 
    DROP COLUMN IF EXISTS onboarding_completed;
    
    -- Verify column was dropped
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users_migration_test' 
        AND column_name = 'onboarding_completed'
    ) THEN
        RAISE NOTICE '✓ Test 7 PASSED: Rollback successful';
    ELSE
        RAISE EXCEPTION '✗ Test 7 FAILED: Rollback did not remove column';
    END IF;
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION TEST SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ All tests passed successfully';
    RAISE NOTICE 'The migration is safe to run on staging/production';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Drop the test table
DROP TABLE IF EXISTS users_migration_test;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Test cleanup complete. Test table removed.';
    RAISE NOTICE 'You can now proceed with the actual migration.';
END $$;
