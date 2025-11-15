-- Migration: Add Email Verification Fields
-- Date: 2025-11-15
-- Description: Adds email verification token and expiry fields to users table

-- Add email verification columns if they don't exist
DO $$ 
BEGIN
    -- Add email_verified column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified TIMESTAMP NULL;
        COMMENT ON COLUMN users.email_verified IS 'Timestamp when email was verified';
    END IF;

    -- Add email_verification_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verification_token'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
        COMMENT ON COLUMN users.email_verification_token IS 'Token for email verification';
    END IF;

    -- Add email_verification_expires column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verification_expires'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP NULL;
        COMMENT ON COLUMN users.email_verification_expires IS 'Expiry time for verification token';
    END IF;
END $$;

-- Create index on verification token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Create index on email_verified for filtering
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified) 
WHERE email_verified IS NOT NULL;

-- Display results
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expires')
ORDER BY ordinal_position;
