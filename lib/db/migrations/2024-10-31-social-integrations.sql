-- Social Integrations Migration
-- Created: 2024-10-31
-- Purpose: Add tables for TikTok, Instagram, and other social platform integrations

-- OAuth accounts for all social platforms
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram', 'threads', 'reddit', 'twitter'
  open_id VARCHAR(255) NOT NULL, -- Platform-specific user ID
  scope TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB, -- Platform-specific data (username, profile_url, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, open_id)
);

-- Index for finding tokens that need refresh
CREATE INDEX idx_oauth_accounts_expires ON oauth_accounts(expires_at);

-- Index for user lookups
CREATE INDEX idx_oauth_accounts_user_provider ON oauth_accounts(user_id, provider);

-- TikTok posts tracking
CREATE TABLE IF NOT EXISTS tiktok_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  publish_id VARCHAR(255) UNIQUE NOT NULL, -- TikTok's publish_id
  status VARCHAR(50) NOT NULL, -- 'PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX', 'PUBLISH_COMPLETE', 'FAILED'
  source VARCHAR(50) NOT NULL, -- 'FILE_UPLOAD', 'PULL_FROM_URL'
  title TEXT,
  error_code VARCHAR(100),
  error_message TEXT,
  metadata JSONB, -- Additional data (video_url, thumbnail, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user's posts
CREATE INDEX idx_tiktok_posts_user ON tiktok_posts(user_id);

-- Index for pending posts (for status updates)
CREATE INDEX idx_tiktok_posts_status ON tiktok_posts(status) 
WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX');

-- Index for oauth account lookups
CREATE INDEX idx_tiktok_posts_oauth ON tiktok_posts(oauth_account_id);

-- Instagram accounts (Business/Creator accounts)
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  ig_business_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram Business Account ID
  page_id VARCHAR(255) NOT NULL, -- Facebook Page ID
  username VARCHAR(255) NOT NULL,
  access_level VARCHAR(50), -- Permissions granted
  metadata JSONB, -- Profile info, follower count, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ig_business_id)
);

-- Index for user lookups
CREATE INDEX idx_instagram_accounts_user ON instagram_accounts(user_id);

-- Instagram media (posts, reels, stories)
CREATE TABLE IF NOT EXISTS ig_media (
  id SERIAL PRIMARY KEY,
  instagram_account_id INTEGER NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram media ID
  media_type VARCHAR(50) NOT NULL, -- 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS'
  caption TEXT,
  permalink VARCHAR(500),
  timestamp TIMESTAMP,
  metrics_json JSONB, -- likes, comments, shares, reach, impressions, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for account's media
CREATE INDEX idx_ig_media_account ON ig_media(instagram_account_id);

-- Index for recent media
CREATE INDEX idx_ig_media_timestamp ON ig_media(timestamp DESC);

-- Instagram comments
CREATE TABLE IF NOT EXISTS ig_comments (
  id SERIAL PRIMARY KEY,
  ig_media_id INTEGER NOT NULL REFERENCES ig_media(id) ON DELETE CASCADE,
  ig_id VARCHAR(255) UNIQUE NOT NULL, -- Instagram comment ID
  from_user VARCHAR(255),
  text TEXT,
  hidden BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for media's comments
CREATE INDEX idx_ig_comments_media ON ig_comments(ig_media_id);

-- Index for recent comments
CREATE INDEX idx_ig_comments_timestamp ON ig_comments(timestamp DESC);

-- Webhook events (shared across all platforms)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'tiktok', 'instagram', etc.
  event_type VARCHAR(100) NOT NULL, -- Event type from platform
  external_id VARCHAR(255) UNIQUE NOT NULL, -- Platform's event ID (for idempotence)
  payload_json JSONB NOT NULL, -- Full webhook payload
  processed_at TIMESTAMP, -- NULL if not processed yet
  error_message TEXT, -- Error if processing failed
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for provider/type queries
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type);

-- Index for unprocessed events
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at)
WHERE processed_at IS NULL;

-- Index for retry logic
CREATE INDEX idx_webhook_events_retry ON webhook_events(retry_count, created_at)
WHERE processed_at IS NULL AND retry_count < 5;

-- Reddit posts tracking
CREATE TABLE IF NOT EXISTS reddit_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts(id) ON DELETE CASCADE,
  post_id VARCHAR(255) UNIQUE NOT NULL, -- Reddit post ID (without t3_ prefix)
  post_name VARCHAR(255) UNIQUE NOT NULL, -- Full name with t3_ prefix
  subreddit VARCHAR(255) NOT NULL, -- Subreddit name (without r/)
  title TEXT NOT NULL,
  kind VARCHAR(50) NOT NULL, -- 'link', 'self', 'image', 'video'
  url TEXT, -- For link posts
  selftext TEXT, -- For text posts
  permalink VARCHAR(500), -- Reddit permalink
  score INTEGER DEFAULT 0, -- Karma score
  num_comments INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT FALSE,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_utc BIGINT, -- Unix timestamp from Reddit
  metadata JSONB, -- Additional data (flair, awards, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user's posts
CREATE INDEX idx_reddit_posts_user ON reddit_posts(user_id);

-- Index for subreddit lookups
CREATE INDEX idx_reddit_posts_subreddit ON reddit_posts(subreddit);

-- Index for oauth account lookups
CREATE INDEX idx_reddit_posts_oauth ON reddit_posts(oauth_account_id);

-- Index for recent posts
CREATE INDEX idx_reddit_posts_created ON reddit_posts(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE oauth_accounts IS 'OAuth credentials for all social platform integrations';
COMMENT ON COLUMN oauth_accounts.access_token_encrypted IS 'Encrypted access token (AES-256-GCM)';
COMMENT ON COLUMN oauth_accounts.refresh_token_encrypted IS 'Encrypted refresh token (AES-256-GCM)';
COMMENT ON COLUMN oauth_accounts.expires_at IS 'When access token expires (for refresh scheduling)';

COMMENT ON TABLE tiktok_posts IS 'TikTok video posts uploaded via Content Posting API';
COMMENT ON COLUMN tiktok_posts.publish_id IS 'Unique ID from TikTok for tracking upload status';
COMMENT ON COLUMN tiktok_posts.status IS 'Current status: PROCESSING_UPLOAD, SEND_TO_USER_INBOX, PUBLISH_COMPLETE, FAILED';

COMMENT ON TABLE instagram_accounts IS 'Instagram Business/Creator accounts linked to users';
COMMENT ON COLUMN instagram_accounts.ig_business_id IS 'Instagram Business Account ID from Graph API';
COMMENT ON COLUMN instagram_accounts.page_id IS 'Facebook Page ID that owns the IG account';

COMMENT ON TABLE ig_media IS 'Instagram media (posts, reels, stories) synced from Graph API';
COMMENT ON COLUMN ig_media.metrics_json IS 'Insights metrics: likes, comments, shares, reach, impressions';

COMMENT ON TABLE webhook_events IS 'Webhook events from all platforms (idempotent processing)';
COMMENT ON COLUMN webhook_events.external_id IS 'Platform event ID for deduplication (UNIQUE constraint)';
COMMENT ON COLUMN webhook_events.processed_at IS 'NULL = pending, timestamp = processed';

COMMENT ON TABLE reddit_posts IS 'Reddit posts submitted via Reddit API';
COMMENT ON COLUMN reddit_posts.post_id IS 'Reddit post ID without t3_ prefix (e.g., abc123)';
COMMENT ON COLUMN reddit_posts.post_name IS 'Full Reddit name with t3_ prefix (e.g., t3_abc123)';
COMMENT ON COLUMN reddit_posts.score IS 'Karma score (upvotes - downvotes)';
COMMENT ON COLUMN reddit_posts.created_utc IS 'Unix timestamp when post was created on Reddit';
