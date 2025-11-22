-- Add role field to users table for admin authentication
-- Default role is 'user', admins will have 'admin' role

-- Add role column with default value
ALTER TABLE "users" ADD COLUMN "role" VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Create index for role lookups
CREATE INDEX "idx_users_role" ON "users"("role");

-- Update existing users to have 'user' role (already done by default)
-- Admin users will need to be manually updated in the database

-- Example: UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
