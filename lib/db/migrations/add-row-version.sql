-- Add row_version column for optimistic locking
-- This migration adds a version column to track concurrent updates

BEGIN;

-- Add row_version column to user_onboarding table
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS row_version INTEGER DEFAULT 1 NOT NULL;

-- Update existing rows to have version 1
UPDATE user_onboarding 
SET row_version = 1 
WHERE row_version IS NULL;

-- Create index on row_version for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_row_version 
ON user_onboarding(row_version);

-- Add comment
COMMENT ON COLUMN user_onboarding.row_version IS 
'Version number for optimistic locking. Incremented on each update.';

COMMIT;

-- Verification
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_onboarding' 
    AND column_name = 'row_version'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ row_version column added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add row_version column';
  END IF;
END $$;
