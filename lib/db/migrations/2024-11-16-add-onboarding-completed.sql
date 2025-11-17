-- Migration: Add onboarding_completed field to users table
-- Date: 2024-11-16
-- Description: Adds a boolean flag to track whether users have completed onboarding

BEGIN;

-- Add column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 
  'Indicates whether user has completed the onboarding flow. Default: false';

-- Optional: Update existing users to have explicit false value
-- (Only needed if column was previously nullable)
UPDATE users 
SET onboarding_completed = false 
WHERE onboarding_completed IS NULL;

-- Log migration
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('2024-11-16-add-onboarding-completed', 'Add onboarding_completed field', NOW())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- Rollback script (run separately if needed):
-- BEGIN;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- DELETE FROM schema_migrations WHERE version = '2024-11-16-add-onboarding-completed';
-- COMMIT;
