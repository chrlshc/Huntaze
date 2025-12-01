-- Test-only migration to align Vitest schema with expected columns
-- Adds signup_method column and index if they are missing

ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_method VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_signup_method ON users(signup_method);
