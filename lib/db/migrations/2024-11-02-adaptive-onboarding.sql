-- Adaptive Onboarding System Database Schema
-- Created: 2024-11-02
-- Description: Tables for intelligent onboarding with progressive feature unlocking

-- ============================================================================
-- ONBOARDING PROFILES TABLE
-- ============================================================================
-- Stores user onboarding state, creator level, and progress
CREATE TABLE IF NOT EXISTS onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Creator level assessment
  creator_level VARCHAR(20) NOT NULL DEFAULT 'beginner' CHECK (creator_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- User goals and preferences
  primary_goals TEXT[] NOT NULL DEFAULT '{}',
  
  -- Progress tracking
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  skipped_steps TEXT[] NOT NULL DEFAULT '{}',
  current_step VARCHAR(100),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Custom onboarding path (JSON array of step objects)
  custom_path JSONB DEFAULT '[]'::jsonb,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_time_remaining INTEGER DEFAULT 0, -- in minutes
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for onboarding_profiles
CREATE INDEX idx_onboarding_profiles_user_id ON onboarding_profiles(user_id);
CREATE INDEX idx_onboarding_profiles_creator_level ON onboarding_profiles(creator_level);
CREATE INDEX idx_onboarding_profiles_progress ON onboarding_profiles(progress_percentage);
CREATE INDEX idx_onboarding_profiles_completed_at ON onboarding_profiles(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================================================
-- FEATURE UNLOCK STATES TABLE
-- ============================================================================
-- Tracks which features are unlocked for each user
CREATE TABLE IF NOT EXISTS feature_unlock_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Feature tracking
  unlocked_features TEXT[] NOT NULL DEFAULT '{}',
  locked_features JSONB DEFAULT '[]'::jsonb, -- Array of {featureId, requirements[], priority}
  
  -- Timing
  last_unlock_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for feature_unlock_states
CREATE INDEX idx_feature_unlock_states_user_id ON feature_unlock_states(user_id);
CREATE INDEX idx_feature_unlock_states_last_unlock ON feature_unlock_states(last_unlock_at);

-- ============================================================================
-- ONBOARDING EVENTS TABLE
-- ============================================================================
-- Analytics and tracking for onboarding events
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('step_started', 'step_completed', 'step_skipped', 'feature_unlocked', 'level_changed', 'goal_updated')),
  step_id VARCHAR(100),
  
  -- Timing
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration INTEGER, -- in seconds
  
  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for onboarding_events
CREATE INDEX idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX idx_onboarding_events_type ON onboarding_events(event_type);
CREATE INDEX idx_onboarding_events_timestamp ON onboarding_events(timestamp DESC);
CREATE INDEX idx_onboarding_events_step_id ON onboarding_events(step_id) WHERE step_id IS NOT NULL;

-- Composite index for analytics queries
CREATE INDEX idx_onboarding_events_analytics ON onboarding_events(event_type, timestamp DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for onboarding_profiles
DROP TRIGGER IF EXISTS update_onboarding_profiles_updated_at ON onboarding_profiles;
CREATE TRIGGER update_onboarding_profiles_updated_at
  BEFORE UPDATE ON onboarding_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- Trigger for feature_unlock_states
DROP TRIGGER IF EXISTS update_feature_unlock_states_updated_at ON feature_unlock_states;
CREATE TRIGGER update_feature_unlock_states_updated_at
  BEFORE UPDATE ON feature_unlock_states
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate onboarding progress
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_steps INTEGER;
  v_completed_steps INTEGER;
  v_progress INTEGER;
BEGIN
  SELECT 
    array_length(custom_path::text[], 1),
    array_length(completed_steps, 1)
  INTO v_total_steps, v_completed_steps
  FROM onboarding_profiles
  WHERE user_id = p_user_id;
  
  IF v_total_steps IS NULL OR v_total_steps = 0 THEN
    RETURN 0;
  END IF;
  
  v_progress := (COALESCE(v_completed_steps, 0) * 100) / v_total_steps;
  
  RETURN LEAST(v_progress, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to check if feature is unlocked
CREATE OR REPLACE FUNCTION is_feature_unlocked(p_user_id UUID, p_feature_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_unlocked BOOLEAN;
BEGIN
  SELECT p_feature_id = ANY(unlocked_features)
  INTO v_unlocked
  FROM feature_unlock_states
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_unlocked, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE onboarding_profiles IS 'Stores user onboarding state, creator level, and progress tracking';
COMMENT ON TABLE feature_unlock_states IS 'Tracks which features are unlocked/locked for each user';
COMMENT ON TABLE onboarding_events IS 'Analytics events for onboarding flow tracking';

COMMENT ON COLUMN onboarding_profiles.creator_level IS 'User experience level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN onboarding_profiles.primary_goals IS 'Array of user goals: content_creation, audience_growth, monetization';
COMMENT ON COLUMN onboarding_profiles.custom_path IS 'Personalized onboarding steps based on goals';
COMMENT ON COLUMN onboarding_profiles.progress_percentage IS 'Completion percentage (0-100)';

COMMENT ON COLUMN feature_unlock_states.unlocked_features IS 'Array of feature IDs that are unlocked';
COMMENT ON COLUMN feature_unlock_states.locked_features IS 'JSON array of locked features with requirements';

COMMENT ON COLUMN onboarding_events.event_type IS 'Type of event: step_started, step_completed, step_skipped, feature_unlocked, level_changed, goal_updated';
COMMENT ON COLUMN onboarding_events.duration IS 'Time spent on step in seconds';
COMMENT ON COLUMN onboarding_events.metadata IS 'Additional event data as JSON';

-- ============================================================================
-- FEATURE TOUR PROGRESS TABLE
-- ============================================================================
-- Tracks user progress through feature tours for re-onboarding
CREATE TABLE IF NOT EXISTS feature_tour_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tour_id VARCHAR(100) NOT NULL,
  
  -- Progress tracking
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  dismissed_permanently BOOLEAN NOT NULL DEFAULT false,
  
  -- Timing
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tour_id)
);

-- Indexes for feature_tour_progress
CREATE INDEX idx_feature_tour_progress_user_id ON feature_tour_progress(user_id);
CREATE INDEX idx_feature_tour_progress_tour_id ON feature_tour_progress(tour_id);
CREATE INDEX idx_feature_tour_progress_completed ON feature_tour_progress(completed) WHERE completed = true;
CREATE INDEX idx_feature_tour_progress_dismissed ON feature_tour_progress(dismissed_permanently) WHERE dismissed_permanently = true;

-- Trigger for feature_tour_progress
DROP TRIGGER IF EXISTS update_feature_tour_progress_updated_at ON feature_tour_progress;
CREATE TRIGGER update_feature_tour_progress_updated_at
  BEFORE UPDATE ON feature_tour_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

COMMENT ON TABLE feature_tour_progress IS 'Tracks user progress through feature tours for re-onboarding';
COMMENT ON COLUMN feature_tour_progress.completed_steps IS 'Array of completed step IDs within the tour';
COMMENT ON COLUMN feature_tour_progress.dismissed_permanently IS 'User has permanently dismissed this tour';
