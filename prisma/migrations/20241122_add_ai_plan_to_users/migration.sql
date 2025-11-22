-- Add ai_plan column to users table
-- Task: 17.3 Intégrer le système de plans et quotas
-- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

-- Add ai_plan column with default value 'starter'
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_plan VARCHAR(20) DEFAULT 'starter';

-- Add check constraint to ensure valid plan values
ALTER TABLE users ADD CONSTRAINT users_ai_plan_check 
  CHECK (ai_plan IN ('starter', 'pro', 'business'));

-- Create index for faster plan lookups
CREATE INDEX IF NOT EXISTS idx_users_ai_plan ON users(ai_plan);

-- Update existing users to have starter plan if NULL
UPDATE users SET ai_plan = 'starter' WHERE ai_plan IS NULL;

-- Add comment
COMMENT ON COLUMN users.ai_plan IS 'AI usage plan tier: starter ($10/month), pro ($50/month), or business (unlimited)';
