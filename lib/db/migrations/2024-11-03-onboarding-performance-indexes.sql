-- Migration: Add Performance Indexes for Adaptive Onboarding
-- Date: 2024-11-03
-- Purpose: Optimize database queries for onboarding system performance

-- Onboarding Profile Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_id ON onboarding_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_level ON onboarding_profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_completion ON onboarding_profiles(completion_percentage);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_updated ON onboarding_profiles(updated_at DESC);

-- Feature Unlock Indexes  
CREATE INDEX IF NOT EXISTS idx_feature_unlocks_user_id ON feature_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_unlocks_feature ON feature_unlocks(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_unlocks_level ON feature_unlocks(unlock_level);
CREATE INDEX IF NOT EXISTS idx_feature_unlocks_unlocked ON feature_unlocks(unlocked_at DESC);

-- Onboarding Events Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_timestamp ON onboarding_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_timestamp ON onboarding_events(user_id, timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_user_level ON onboarding_profiles(user_id, current_level);
CREATE INDEX IF NOT EXISTS idx_feature_unlocks_user_feature ON feature_unlocks(user_id, feature_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_type ON onboarding_events(user_id, event_type);

-- Partial indexes for active onboarding sessions
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_active ON onboarding_profiles(user_id) 
WHERE completion_percentage < 100;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_onboarding_events_analytics ON onboarding_events(event_type, timestamp DESC)
WHERE timestamp >= NOW() - INTERVAL '30 days';