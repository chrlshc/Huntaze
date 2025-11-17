-- Create a test user for staging environment
-- Run this with: psql $DATABASE_URL -f scripts/create-test-user.sql

-- Insert test user
INSERT INTO users (
  id,
  email,
  name,
  password_hash,
  email_verified,
  onboarding_completed,
  created_at,
  updated_at
) VALUES (
  'test-user-' || gen_random_uuid()::text,
  'test@huntaze.com',
  'Test User',
  '$2a$10$YourHashedPasswordHere', -- bcrypt hash of "TestPassword123!"
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  updated_at = NOW();

-- Display the created user
SELECT id, email, name, email_verified, onboarding_completed, created_at
FROM users
WHERE email = 'test@huntaze.com';
