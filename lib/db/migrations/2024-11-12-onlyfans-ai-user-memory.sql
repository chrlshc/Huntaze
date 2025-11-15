-- OnlyFans AI User Memory System Database Migration
-- Created: 2024-11-12
-- Description: Persistent memory system for AI assistant with personality calibration,
--              preference learning, and emotional state tracking

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- FAN MEMORIES TABLE
-- ============================================================================
-- Stores conversation history and message context for each fan
CREATE TABLE IF NOT EXISTS fan_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  
  -- Message content
  message_content TEXT NOT NULL,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('fan', 'creator', 'ai')),
  
  -- Sentiment analysis
  sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  
  -- Topic extraction
  topics TEXT[], -- Array of extracted topics from message
  
  -- Additional metadata (flexible JSONB for future extensions)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate messages at same timestamp
  CONSTRAINT fan_memories_fan_creator_time_unique UNIQUE (fan_id, creator_id, created_at)
);

-- ============================================================================
-- FAN PREFERENCES TABLE
-- ============================================================================
-- Stores learned preferences for content, communication, and purchase patterns
CREATE TABLE IF NOT EXISTS fan_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  
  -- Content preferences (JSONB for flexibility)
  -- Structure: { "photos": { "score": 0.8, "confidence": 0.9, "evidenceCount": 15 }, ... }
  content_preferences JSONB NOT NULL DEFAULT '{}',
  
  -- Topic interests
  -- Structure: { "fitness": 0.7, "travel": 0.9, ... }
  topic_interests JSONB NOT NULL DEFAULT '{}',
  
  -- Purchase patterns
  -- Structure: [{ "contentType": "ppv", "averageAmount": 25, "frequency": 2, "preferredDays": [5,6], "preferredHours": [20,21,22] }]
  purchase_patterns JSONB NOT NULL DEFAULT '[]',
  
  -- Communication preferences
  -- Structure: { "preferredResponseTime": "immediate", "messageFrequency": "high", ... }
  communication_preferences JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per fan-creator pair
  CONSTRAINT fan_preferences_unique UNIQUE (fan_id, creator_id)
);

-- ============================================================================
-- PERSONALITY PROFILES TABLE
-- ============================================================================
-- Stores calibrated AI personality settings for each fan
CREATE TABLE IF NOT EXISTS personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  
  -- Personality parameters
  tone VARCHAR(20) NOT NULL CHECK (tone IN ('flirty', 'friendly', 'professional', 'playful', 'dominant')),
  emoji_frequency DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (emoji_frequency >= 0 AND emoji_frequency <= 1),
  message_length_preference VARCHAR(10) NOT NULL CHECK (message_length_preference IN ('short', 'medium', 'long')),
  punctuation_style VARCHAR(10) NOT NULL CHECK (punctuation_style IN ('casual', 'proper')),
  
  -- Preferred emojis (learned from interactions)
  preferred_emojis TEXT[] DEFAULT '{}',
  
  -- Response timing
  response_speed VARCHAR(20) NOT NULL DEFAULT 'variable' CHECK (response_speed IN ('immediate', 'delayed', 'variable')),
  
  -- Calibration metadata
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  interaction_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  last_calibrated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One personality profile per fan-creator pair
  CONSTRAINT personality_profiles_unique UNIQUE (fan_id, creator_id)
);

-- ============================================================================
-- ENGAGEMENT METRICS TABLE
-- ============================================================================
-- Tracks engagement scores and interaction statistics
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  
  -- Engagement scoring
  engagement_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (engagement_score >= 0 AND engagement_score <= 1),
  
  -- Interaction statistics
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Response timing
  avg_response_time_seconds INTEGER,
  
  -- Last interaction tracking
  last_interaction TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One metrics record per fan-creator pair
  CONSTRAINT engagement_metrics_unique UNIQUE (fan_id, creator_id)
);

-- ============================================================================
-- EMOTIONAL STATES TABLE
-- ============================================================================
-- Tracks emotional state and sentiment history for each fan
CREATE TABLE IF NOT EXISTS emotional_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id VARCHAR(255) NOT NULL,
  creator_id VARCHAR(255) NOT NULL,
  
  -- Current emotional state
  current_sentiment VARCHAR(10) NOT NULL CHECK (current_sentiment IN ('positive', 'negative', 'neutral')),
  
  -- Sentiment history (last 30 days)
  -- Structure: [{ "timestamp": "2024-11-12T10:00:00Z", "sentiment": "positive", "intensity": 0.8 }, ...]
  sentiment_history JSONB NOT NULL DEFAULT '[]',
  
  -- Dominant emotions
  dominant_emotions TEXT[] DEFAULT '{}',
  
  -- Engagement level
  engagement_level VARCHAR(10) NOT NULL CHECK (engagement_level IN ('high', 'medium', 'low')),
  
  -- Interaction timestamps
  last_positive_interaction TIMESTAMP WITH TIME ZONE,
  last_negative_interaction TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One emotional state record per fan-creator pair
  CONSTRAINT emotional_states_unique UNIQUE (fan_id, creator_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Fan memories indexes
CREATE INDEX idx_fan_memories_fan_creator ON fan_memories(fan_id, creator_id);
CREATE INDEX idx_fan_memories_created_at ON fan_memories(created_at DESC);
CREATE INDEX idx_fan_memories_sentiment ON fan_memories(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX idx_fan_memories_sender ON fan_memories(sender);
CREATE INDEX idx_fan_memories_topics ON fan_memories USING GIN(topics);

-- Fan preferences indexes
CREATE INDEX idx_fan_preferences_fan_creator ON fan_preferences(fan_id, creator_id);
CREATE INDEX idx_fan_preferences_last_updated ON fan_preferences(last_updated DESC);

-- Personality profiles indexes
CREATE INDEX idx_personality_profiles_fan_creator ON personality_profiles(fan_id, creator_id);
CREATE INDEX idx_personality_profiles_confidence ON personality_profiles(confidence_score DESC);
CREATE INDEX idx_personality_profiles_last_calibrated ON personality_profiles(last_calibrated DESC);

-- Engagement metrics indexes
CREATE INDEX idx_engagement_metrics_fan_creator ON engagement_metrics(fan_id, creator_id);
CREATE INDEX idx_engagement_metrics_score ON engagement_metrics(engagement_score DESC);
CREATE INDEX idx_engagement_metrics_last_interaction ON engagement_metrics(last_interaction DESC);
CREATE INDEX idx_engagement_metrics_revenue ON engagement_metrics(total_revenue DESC);

-- Emotional states indexes
CREATE INDEX idx_emotional_states_fan_creator ON emotional_states(fan_id, creator_id);
CREATE INDEX idx_emotional_states_sentiment ON emotional_states(current_sentiment);
CREATE INDEX idx_emotional_states_engagement ON emotional_states(engagement_level);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Reuse existing update_updated_at_column function if available
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_fan_preferences_updated_at ON fan_preferences;
CREATE TRIGGER update_fan_preferences_updated_at
  BEFORE UPDATE ON fan_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_metrics_updated_at ON engagement_metrics;
CREATE TRIGGER update_engagement_metrics_updated_at
  BEFORE UPDATE ON engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emotional_states_updated_at ON emotional_states;
CREATE TRIGGER update_emotional_states_updated_at
  BEFORE UPDATE ON emotional_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get recent messages for a fan
CREATE OR REPLACE FUNCTION get_recent_fan_messages(
  p_fan_id VARCHAR(255),
  p_creator_id VARCHAR(255),
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  message_content TEXT,
  sender VARCHAR(10),
  sentiment VARCHAR(10),
  topics TEXT[],
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fm.id,
    fm.message_content,
    fm.sender,
    fm.sentiment,
    fm.topics,
    fm.created_at
  FROM fan_memories fm
  WHERE fm.fan_id = p_fan_id 
    AND fm.creator_id = p_creator_id
  ORDER BY fm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_fan_id VARCHAR(255),
  p_creator_id VARCHAR(255)
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_message_count INTEGER;
  v_purchase_count INTEGER;
  v_avg_response_time INTEGER;
  v_positive_sentiment_ratio DECIMAL(3,2);
  v_score DECIMAL(3,2);
BEGIN
  -- Get message count (last 30 days)
  SELECT COUNT(*) INTO v_message_count
  FROM fan_memories
  WHERE fan_id = p_fan_id 
    AND creator_id = p_creator_id
    AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Get purchase count
  SELECT total_purchases INTO v_purchase_count
  FROM engagement_metrics
  WHERE fan_id = p_fan_id 
    AND creator_id = p_creator_id;
  
  -- Get positive sentiment ratio
  SELECT 
    COALESCE(
      COUNT(*) FILTER (WHERE sentiment = 'positive')::DECIMAL / NULLIF(COUNT(*), 0),
      0.5
    ) INTO v_positive_sentiment_ratio
  FROM fan_memories
  WHERE fan_id = p_fan_id 
    AND creator_id = p_creator_id
    AND created_at >= NOW() - INTERVAL '30 days'
    AND sentiment IS NOT NULL;
  
  -- Calculate weighted score
  v_score := (
    (LEAST(v_message_count, 100)::DECIMAL / 100) * 0.3 +  -- Message frequency (30%)
    (LEAST(COALESCE(v_purchase_count, 0), 10)::DECIMAL / 10) * 0.4 +  -- Purchase activity (40%)
    v_positive_sentiment_ratio * 0.3  -- Sentiment (30%)
  );
  
  RETURN LEAST(GREATEST(v_score, 0), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to detect disengagement signals
CREATE OR REPLACE FUNCTION detect_disengagement(
  p_fan_id VARCHAR(255),
  p_creator_id VARCHAR(255)
)
RETURNS TABLE (
  signal_type TEXT,
  severity TEXT,
  detected_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_recent_message_count INTEGER;
  v_avg_message_length DECIMAL;
  v_negative_sentiment_count INTEGER;
  v_last_interaction TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get recent activity metrics
  SELECT 
    COUNT(*),
    AVG(LENGTH(message_content)),
    COUNT(*) FILTER (WHERE sentiment = 'negative')
  INTO 
    v_recent_message_count,
    v_avg_message_length,
    v_negative_sentiment_count
  FROM fan_memories
  WHERE fan_id = p_fan_id 
    AND creator_id = p_creator_id
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Get last interaction
  SELECT last_interaction INTO v_last_interaction
  FROM engagement_metrics
  WHERE fan_id = p_fan_id 
    AND creator_id = p_creator_id;
  
  -- Check for short responses (disengagement signal)
  IF v_avg_message_length < 20 AND v_recent_message_count > 3 THEN
    RETURN QUERY SELECT 
      'short_responses'::TEXT,
      'medium'::TEXT,
      NOW();
  END IF;
  
  -- Check for long delays (no interaction in 14 days)
  IF v_last_interaction < NOW() - INTERVAL '14 days' THEN
    RETURN QUERY SELECT 
      'long_delays'::TEXT,
      'high'::TEXT,
      NOW();
  END IF;
  
  -- Check for negative sentiment spike
  IF v_negative_sentiment_count >= 3 THEN
    RETURN QUERY SELECT 
      'negative_sentiment'::TEXT,
      'high'::TEXT,
      NOW();
  END IF;
  
  -- Check for reduced frequency
  IF v_recent_message_count < 2 AND v_last_interaction >= NOW() - INTERVAL '14 days' THEN
    RETURN QUERY SELECT 
      'reduced_frequency'::TEXT,
      'low'::TEXT,
      NOW();
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old memories (GDPR compliance - 24 month retention)
CREATE OR REPLACE FUNCTION cleanup_old_memories()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete memories older than 24 months
  WITH deleted AS (
    DELETE FROM fan_memories
    WHERE created_at < NOW() - INTERVAL '24 months'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fan_memories IS 'Stores conversation history and message context for AI memory system';
COMMENT ON TABLE fan_preferences IS 'Learned preferences for content, communication, and purchase patterns';
COMMENT ON TABLE personality_profiles IS 'Calibrated AI personality settings for each fan';
COMMENT ON TABLE engagement_metrics IS 'Engagement scores and interaction statistics';
COMMENT ON TABLE emotional_states IS 'Emotional state and sentiment history tracking';

COMMENT ON COLUMN fan_memories.sender IS 'Message sender: fan, creator, or ai';
COMMENT ON COLUMN fan_memories.sentiment IS 'Analyzed sentiment: positive, negative, or neutral';
COMMENT ON COLUMN fan_memories.topics IS 'Array of extracted topics from message content';
COMMENT ON COLUMN fan_memories.metadata IS 'Flexible JSONB for additional context (e.g., PPV offers, tips)';

COMMENT ON COLUMN fan_preferences.content_preferences IS 'JSONB map of content categories to preference scores';
COMMENT ON COLUMN fan_preferences.topic_interests IS 'JSONB map of topics to interest scores (0-1)';
COMMENT ON COLUMN fan_preferences.purchase_patterns IS 'JSONB array of purchase behavior patterns';

COMMENT ON COLUMN personality_profiles.tone IS 'AI tone: flirty, friendly, professional, playful, or dominant';
COMMENT ON COLUMN personality_profiles.emoji_frequency IS 'Emoji usage frequency (0-1)';
COMMENT ON COLUMN personality_profiles.confidence_score IS 'Calibration confidence (0-1, higher = more data)';
COMMENT ON COLUMN personality_profiles.interaction_count IS 'Number of interactions used for calibration';

COMMENT ON COLUMN engagement_metrics.engagement_score IS 'Calculated engagement score (0-1)';
COMMENT ON COLUMN engagement_metrics.avg_response_time_seconds IS 'Average fan response time in seconds';

COMMENT ON COLUMN emotional_states.sentiment_history IS 'JSONB array of recent sentiment data points';
COMMENT ON COLUMN emotional_states.dominant_emotions IS 'Array of dominant emotions (joy, excitement, etc.)';
COMMENT ON COLUMN emotional_states.engagement_level IS 'Current engagement level: high, medium, or low';

COMMIT;
