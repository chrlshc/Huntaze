-- Migration: Add onboarding data fields to users table
-- Requirements: 5.1, 5.4, 5.6, 5.9
-- Date: 2024-11-18

-- Add content_types array field
ALTER TABLE users ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT '{}';

-- Add goal field
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal VARCHAR(100);

-- Add revenue_goal field
ALTER TABLE users ADD COLUMN IF NOT EXISTS revenue_goal INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN users.content_types IS 'Array of content types: photos, videos, stories, ppv';
COMMENT ON COLUMN users.goal IS 'Primary goal: grow-audience, increase-revenue, save-time, all';
COMMENT ON COLUMN users.revenue_goal IS 'Optional monthly revenue goal in dollars';
