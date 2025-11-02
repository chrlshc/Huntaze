-- CRM Tables Migration
-- Created: 2024-10-31
-- Purpose: Migrate CRM data from in-memory to PostgreSQL

-- User Profiles (extended user data)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  timezone VARCHAR(50),
  niche VARCHAR(50), -- 'fitness', 'gaming', 'adult', 'fashion', etc.
  goals JSONB, -- ['revenue', 'growth', 'time', 'engagement']
  avatar_url VARCHAR(500),
  metadata JSONB, -- Additional flexible data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Configurations per user
CREATE TABLE IF NOT EXISTS ai_configs (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  personality VARCHAR(50), -- 'friendly', 'flirty', 'professional', 'mysterious'
  response_style VARCHAR(50), -- 'friendly', 'flirty', 'professional', 'motivational'
  tone VARCHAR(50), -- 'casual', 'balanced', 'formal'
  response_length VARCHAR(50), -- 'short', 'medium', 'detailed'
  platforms JSONB, -- ['onlyfans', 'fansly', 'patreon']
  custom_responses JSONB, -- Custom AI responses
  pricing JSONB, -- Pricing configuration
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fans/Subscribers
CREATE TABLE IF NOT EXISTS fans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50), -- 'onlyfans', 'fansly', 'patreon', etc.
  platform_id VARCHAR(255), -- ID on the platform
  handle VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  avatar VARCHAR(500),
  tags JSONB, -- ['vip', 'whale', 'new', etc.]
  value_cents INTEGER DEFAULT 0, -- Lifetime value in cents
  last_seen_at TIMESTAMP,
  notes TEXT,
  metadata JSONB, -- Additional flexible data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, platform_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fan_id INTEGER NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  platform VARCHAR(50), -- 'onlyfans', 'fansly', etc.
  platform_conversation_id VARCHAR(255), -- ID on the platform
  last_message_at TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fan_id, platform)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  fan_id INTEGER NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL, -- 'in' or 'out'
  text TEXT,
  price_cents INTEGER, -- For PPV messages
  read BOOLEAN DEFAULT FALSE,
  attachments JSONB, -- [{id, type, url, name, size}]
  platform_message_id VARCHAR(255), -- ID on the platform
  sent_by_ai BOOLEAN DEFAULT FALSE, -- Was this sent by AI?
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'welcome', 're-engagement', 'ppv', 'custom'
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed'
  template JSONB, -- Campaign template data
  target_audience JSONB, -- Targeting rules
  schedule JSONB, -- Scheduling configuration
  metrics JSONB, -- {sent: 0, delivered: 0, opened: 0, clicked: 0, revenue_cents: 0}
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform Connections (OAuth tokens, etc.)
CREATE TABLE IF NOT EXISTS platform_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'onlyfans', 'tiktok', 'instagram', 'reddit'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'revoked'
  metadata JSONB, -- Platform-specific data
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform)
);

-- Quick Replies Templates
CREATE TABLE IF NOT EXISTS quick_replies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  category VARCHAR(50), -- 'greeting', 'ppv', 'custom', etc.
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Events (for tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'message_sent', 'campaign_launched', etc.
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_niche ON user_profiles(niche);

CREATE INDEX IF NOT EXISTS idx_ai_configs_user_id ON ai_configs(user_id);

CREATE INDEX IF NOT EXISTS idx_fans_user_id ON fans(user_id);
CREATE INDEX IF NOT EXISTS idx_fans_platform ON fans(platform);
CREATE INDEX IF NOT EXISTS idx_fans_user_platform ON fans(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_fans_last_seen ON fans(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_fans_value ON fans(value_cents DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_fan_id ON conversations(fan_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_unread ON conversations(unread_count) WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_fan_id ON messages(fan_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);

CREATE INDEX IF NOT EXISTS idx_platform_connections_user_id ON platform_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_status ON platform_connections(status);

CREATE INDEX IF NOT EXISTS idx_quick_replies_user_id ON quick_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_replies_category ON quick_replies(category);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON ai_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fans_updated_at BEFORE UPDATE ON fans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_replies_updated_at BEFORE UPDATE ON quick_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile data (niche, goals, timezone, etc.)';
COMMENT ON TABLE ai_configs IS 'AI assistant configuration per user';
COMMENT ON TABLE fans IS 'Fans/subscribers from all platforms';
COMMENT ON TABLE conversations IS 'Conversation threads with fans';
COMMENT ON TABLE messages IS 'Individual messages in conversations';
COMMENT ON TABLE campaigns IS 'Marketing campaigns';
COMMENT ON TABLE platform_connections IS 'OAuth connections to external platforms';
COMMENT ON TABLE quick_replies IS 'Quick reply templates for users';
COMMENT ON TABLE analytics_events IS 'Analytics and tracking events';
