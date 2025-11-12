-- Migration: Wizard Completions Table
-- Created: 2025-11-11
-- Purpose: Store user wizard completion data and AI configuration

BEGIN;

-- Create wizard completions table
CREATE TABLE IF NOT EXISTS user_wizard_completions (
  user_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('onlyfans', 'instagram', 'tiktok', 'reddit', 'other')),
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('grow', 'automate', 'content', 'all')),
  ai_tone TEXT NOT NULL CHECK (ai_tone IN ('playful', 'professional', 'casual', 'seductive')),
  follower_range TEXT,
  time_to_complete INTEGER DEFAULT 0,
  questions_skipped JSONB DEFAULT '[]'::jsonb,
  ai_config_json JSONB NOT NULL,
  template_selections JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on platform for analytics
CREATE INDEX IF NOT EXISTS idx_wizard_platform ON user_wizard_completions(platform);

-- Create index on primary_goal for analytics
CREATE INDEX IF NOT EXISTS idx_wizard_goal ON user_wizard_completions(primary_goal);

-- Create index on completed_at for time-series queries
CREATE INDEX IF NOT EXISTS idx_wizard_completed_at ON user_wizard_completions(completed_at DESC);

-- Create index on time_to_complete for performance analysis
CREATE INDEX IF NOT EXISTS idx_wizard_time_to_complete ON user_wizard_completions(time_to_complete);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wizard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wizard_updated_at
  BEFORE UPDATE ON user_wizard_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_wizard_updated_at();

-- Create view for wizard analytics
CREATE OR REPLACE VIEW wizard_analytics AS
SELECT
  platform,
  primary_goal,
  ai_tone,
  COUNT(*) as completion_count,
  AVG(time_to_complete) as avg_time_to_complete,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_to_complete) as median_time_to_complete,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_to_complete) as p95_time_to_complete,
  COUNT(*) FILTER (WHERE jsonb_array_length(questions_skipped) > 0) as skip_count,
  ROUND(
    COUNT(*) FILTER (WHERE jsonb_array_length(questions_skipped) > 0)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as skip_rate_percent
FROM user_wizard_completions
GROUP BY platform, primary_goal, ai_tone;

-- Create function to get user's wizard config
CREATE OR REPLACE FUNCTION get_user_wizard_config(p_user_id TEXT)
RETURNS TABLE (
  platform TEXT,
  primary_goal TEXT,
  ai_tone TEXT,
  ai_config JSONB,
  templates JSONB,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.platform,
    w.primary_goal,
    w.ai_tone,
    w.ai_config_json,
    w.template_selections,
    w.completed_at
  FROM user_wizard_completions w
  WHERE w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO user_wizard_completions (
--   user_id, platform, primary_goal, ai_tone, follower_range,
--   time_to_complete, questions_skipped, ai_config_json, template_selections
-- ) VALUES (
--   'test_user_123',
--   'onlyfans',
--   'automate',
--   'professional',
--   '10k_50k',
--   35,
--   '[4]'::jsonb,
--   '{
--     "tone": "professional",
--     "platform": "onlyfans",
--     "creativity_level": "medium",
--     "emoji_frequency": "none",
--     "response_length": "medium",
--     "system_prompt": "Professional, helpful assistant for OnlyFans creators..."
--   }'::jsonb,
--   '{
--     "dm_auto_response": true,
--     "ppv_promo": true,
--     "subscriber_welcome": true
--   }'::jsonb
-- );

COMMIT;

-- Rollback script (save as separate file if needed)
-- BEGIN;
-- DROP VIEW IF EXISTS wizard_analytics;
-- DROP FUNCTION IF EXISTS get_user_wizard_config(TEXT);
-- DROP TRIGGER IF EXISTS trigger_update_wizard_updated_at ON user_wizard_completions;
-- DROP FUNCTION IF EXISTS update_wizard_updated_at();
-- DROP TABLE IF EXISTS user_wizard_completions CASCADE;
-- COMMIT;
