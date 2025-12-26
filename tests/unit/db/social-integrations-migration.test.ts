/**
 * Unit Tests - Social Integrations Migration
 * 
 * Tests to validate the social integrations database schema
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 1)
 * 
 * Coverage:
 * - SQL syntax validation
 * - Table structure validation
 * - Index definitions
 * - Foreign key constraints
 * - Column types and constraints
 * - Comments and documentation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Migration - SQL Structure', () => {
  let migrationSQL: string;

  beforeAll(() => {
    const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
    migrationSQL = readFileSync(migrationPath, 'utf-8');
  });

  describe('oauth_accounts Table', () => {
    it('should create oauth_accounts table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS oauth_accounts');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/oauth_accounts\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have user_id with foreign key to users', () => {
      expect(migrationSQL).toContain('user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE');
    });

    it('should have provider column', () => {
      expect(migrationSQL).toMatch(/provider VARCHAR\(50\) NOT NULL/);
    });

    it('should have open_id column', () => {
      expect(migrationSQL).toMatch(/open_id VARCHAR\(255\) NOT NULL/);
    });

    it('should have scope column', () => {
      expect(migrationSQL).toMatch(/scope TEXT NOT NULL/);
    });

    it('should have encrypted token columns', () => {
      expect(migrationSQL).toContain('access_token_encrypted TEXT NOT NULL');
      expect(migrationSQL).toContain('refresh_token_encrypted TEXT');
    });

    it('should have expires_at timestamp', () => {
      expect(migrationSQL).toMatch(/expires_at TIMESTAMP NOT NULL/);
    });

    it('should have metadata JSONB column', () => {
      expect(migrationSQL).toMatch(/metadata JSONB/);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/);
      expect(migrationSQL).toMatch(/updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/);
    });

    it('should have unique constraint on user_id, provider, open_id', () => {
      expect(migrationSQL).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*provider\s*,\s*open_id\s*\)/);
    });

    it('should have index on expires_at for token refresh', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_oauth_accounts_expires ON oauth_accounts(expires_at)');
    });

    it('should have index on user_id and provider', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_oauth_accounts_user_provider ON oauth_accounts(user_id, provider)');
    });

    it('should have documentation comments', () => {
      expect(migrationSQL).toContain("COMMENT ON TABLE oauth_accounts IS 'OAuth credentials for all social platform integrations'");
      expect(migrationSQL).toContain("COMMENT ON COLUMN oauth_accounts.access_token_encrypted IS 'Encrypted access token (AES-256-GCM)'");
    });
  });

  describe('tiktok_posts Table', () => {
    it('should create tiktok_posts table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS tiktok_posts');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/tiktok_posts\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have user_id with foreign key', () => {
      expect(migrationSQL).toMatch(/tiktok_posts[^;]*user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/s);
    });

    it('should have oauth_account_id with foreign key', () => {
      expect(migrationSQL).toMatch(/oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts\(id\) ON DELETE CASCADE/);
    });

    it('should have publish_id as unique', () => {
      expect(migrationSQL).toMatch(/publish_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have status column', () => {
      expect(migrationSQL).toMatch(/status VARCHAR\(50\) NOT NULL/);
    });

    it('should have source column', () => {
      expect(migrationSQL).toMatch(/source VARCHAR\(50\) NOT NULL/);
    });

    it('should have title column', () => {
      expect(migrationSQL).toMatch(/title TEXT/);
    });

    it('should have error columns', () => {
      expect(migrationSQL).toMatch(/error_code VARCHAR\(100\)/);
      expect(migrationSQL).toMatch(/error_message TEXT/);
    });

    it('should have metadata JSONB column', () => {
      expect(migrationSQL).toMatch(/tiktok_posts[^;]*metadata JSONB/s);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/tiktok_posts[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
      expect(migrationSQL).toMatch(/tiktok_posts[^;]*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have index on user_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_tiktok_posts_user ON tiktok_posts(user_id)');
    });

    it('should have partial index on status for pending posts', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_tiktok_posts_status ON tiktok_posts(status)');
      expect(migrationSQL).toMatch(/WHERE status IN \('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX'\)/);
    });

    it('should have index on oauth_account_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_tiktok_posts_oauth ON tiktok_posts(oauth_account_id)');
    });

    it('should have documentation comments', () => {
      expect(migrationSQL).toContain("COMMENT ON TABLE tiktok_posts IS 'TikTok video posts uploaded via Content Posting API'");
      expect(migrationSQL).toContain("COMMENT ON COLUMN tiktok_posts.publish_id IS 'Unique ID from TikTok for tracking upload status'");
    });
  });

  describe('instagram_accounts Table', () => {
    it('should create instagram_accounts table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS instagram_accounts');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/instagram_accounts\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have user_id with foreign key', () => {
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/s);
    });

    it('should have oauth_account_id with foreign key', () => {
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts\(id\) ON DELETE CASCADE/s);
    });

    it('should have ig_business_id as unique', () => {
      expect(migrationSQL).toMatch(/ig_business_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have page_id column', () => {
      expect(migrationSQL).toMatch(/page_id VARCHAR\(255\) NOT NULL/);
    });

    it('should have username column', () => {
      expect(migrationSQL).toMatch(/username VARCHAR\(255\) NOT NULL/);
    });

    it('should have access_level column', () => {
      expect(migrationSQL).toMatch(/access_level VARCHAR\(50\)/);
    });

    it('should have metadata JSONB column', () => {
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*metadata JSONB/s);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have unique constraint on user_id and ig_business_id', () => {
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*UNIQUE\s*\(\s*user_id\s*,\s*ig_business_id\s*\)/s);
    });

    it('should have index on user_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_instagram_accounts_user ON instagram_accounts(user_id)');
    });

    it('should have documentation comments', () => {
      expect(migrationSQL).toContain("COMMENT ON TABLE instagram_accounts IS 'Instagram Business/Creator accounts linked to users'");
      expect(migrationSQL).toContain("COMMENT ON COLUMN instagram_accounts.ig_business_id IS 'Instagram Business Account ID from Graph API'");
    });
  });

  describe('ig_media Table', () => {
    it('should create ig_media table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS ig_media');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/ig_media\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have instagram_account_id with foreign key', () => {
      expect(migrationSQL).toMatch(/instagram_account_id INTEGER NOT NULL REFERENCES instagram_accounts\(id\) ON DELETE CASCADE/);
    });

    it('should have ig_id as unique', () => {
      expect(migrationSQL).toMatch(/ig_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have media_type column', () => {
      expect(migrationSQL).toMatch(/media_type VARCHAR\(50\) NOT NULL/);
    });

    it('should have caption column', () => {
      expect(migrationSQL).toMatch(/ig_media[^;]*caption TEXT/s);
    });

    it('should have permalink column', () => {
      expect(migrationSQL).toMatch(/permalink VARCHAR\(500\)/);
    });

    it('should have timestamp column', () => {
      expect(migrationSQL).toMatch(/ig_media[^;]*timestamp TIMESTAMP[^,]*/s);
    });

    it('should have metrics_json JSONB column', () => {
      expect(migrationSQL).toMatch(/metrics_json JSONB/);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/ig_media[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
      expect(migrationSQL).toMatch(/ig_media[^;]*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have index on instagram_account_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_ig_media_account ON ig_media(instagram_account_id)');
    });

    it('should have index on timestamp for recent media', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_ig_media_timestamp ON ig_media(timestamp DESC)');
    });

    it('should have documentation comments', () => {
      expect(migrationSQL).toContain("COMMENT ON TABLE ig_media IS 'Instagram media (posts, reels, stories) synced from Graph API'");
      expect(migrationSQL).toContain("COMMENT ON COLUMN ig_media.metrics_json IS 'Insights metrics: likes, comments, shares, reach, impressions'");
    });
  });

  describe('ig_comments Table', () => {
    it('should create ig_comments table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS ig_comments');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/ig_comments\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have ig_media_id with foreign key', () => {
      expect(migrationSQL).toMatch(/ig_media_id INTEGER NOT NULL REFERENCES ig_media\(id\) ON DELETE CASCADE/);
    });

    it('should have ig_id as unique', () => {
      expect(migrationSQL).toMatch(/ig_comments[^;]*ig_id VARCHAR\(255\) UNIQUE NOT NULL/s);
    });

    it('should have from_user column', () => {
      expect(migrationSQL).toMatch(/from_user VARCHAR\(255\)/);
    });

    it('should have text column', () => {
      expect(migrationSQL).toMatch(/ig_comments[^;]*text TEXT/s);
    });

    it('should have hidden boolean column', () => {
      expect(migrationSQL).toMatch(/hidden BOOLEAN DEFAULT FALSE/);
    });

    it('should have timestamp column', () => {
      expect(migrationSQL).toMatch(/ig_comments[^;]*timestamp TIMESTAMP[^,]*/s);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/ig_comments[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
      expect(migrationSQL).toMatch(/ig_comments[^;]*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have index on ig_media_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_ig_comments_media ON ig_comments(ig_media_id)');
    });

    it('should have index on timestamp for recent comments', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_ig_comments_timestamp ON ig_comments(timestamp DESC)');
    });
  });

  describe('webhook_events Table', () => {
    it('should create webhook_events table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS webhook_events');
    });

    it('should have id as BIGSERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/webhook_events\s*\([^)]*id BIGSERIAL PRIMARY KEY/s);
    });

    it('should have provider column', () => {
      expect(migrationSQL).toMatch(/webhook_events[^;]*provider VARCHAR\(50\) NOT NULL/s);
    });

    it('should have event_type column', () => {
      expect(migrationSQL).toMatch(/event_type VARCHAR\(100\) NOT NULL/);
    });

    it('should have external_id as unique', () => {
      expect(migrationSQL).toMatch(/external_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have payload_json JSONB column', () => {
      expect(migrationSQL).toMatch(/payload_json JSONB NOT NULL/);
    });

    it('should have processed_at timestamp', () => {
      expect(migrationSQL).toMatch(/processed_at TIMESTAMP/);
    });

    it('should have error_message column', () => {
      expect(migrationSQL).toMatch(/error_message TEXT/);
    });

    it('should have retry_count with default', () => {
      expect(migrationSQL).toMatch(/retry_count INTEGER DEFAULT 0/);
    });

    it('should have created_at timestamp', () => {
      expect(migrationSQL).toMatch(/webhook_events[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have index on provider and event_type', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_webhook_events_provider ON webhook_events(provider, event_type)');
    });

    it('should have partial index on unprocessed events', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at)');
      expect(migrationSQL).toMatch(/WHERE processed_at IS NULL/);
    });

    it('should have partial index for retry logic', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_webhook_events_retry ON webhook_events(retry_count, created_at)');
      expect(migrationSQL).toMatch(/WHERE processed_at IS NULL AND retry_count < 5/);
    });

    it('should have documentation comments', () => {
      expect(migrationSQL).toContain("COMMENT ON TABLE webhook_events IS 'Webhook events from all platforms (idempotent processing)'");
      expect(migrationSQL).toContain("COMMENT ON COLUMN webhook_events.external_id IS 'Platform event ID for deduplication (UNIQUE constraint)'");
    });
  });

  describe('reddit_posts Table', () => {
    it('should create reddit_posts table', () => {
      expect(migrationSQL).toContain('CREATE TABLE IF NOT EXISTS reddit_posts');
    });

    it('should have id as SERIAL PRIMARY KEY', () => {
      expect(migrationSQL).toMatch(/reddit_posts\s*\([^)]*id SERIAL PRIMARY KEY/s);
    });

    it('should have user_id with foreign key to users', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*user_id INTEGER NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/s);
    });

    it('should have oauth_account_id with foreign key to oauth_accounts', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*oauth_account_id INTEGER NOT NULL REFERENCES oauth_accounts\(id\) ON DELETE CASCADE/s);
    });

    it('should have post_id as unique', () => {
      expect(migrationSQL).toMatch(/post_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have post_name as unique', () => {
      expect(migrationSQL).toMatch(/post_name VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have subreddit column', () => {
      expect(migrationSQL).toMatch(/subreddit VARCHAR\(255\) NOT NULL/);
    });

    it('should have title column', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*title TEXT NOT NULL/s);
    });

    it('should have kind column for post type', () => {
      expect(migrationSQL).toMatch(/kind VARCHAR\(50\) NOT NULL/);
    });

    it('should have url column for link posts', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*url TEXT[^,]*/s);
    });

    it('should have selftext column for text posts', () => {
      expect(migrationSQL).toMatch(/selftext TEXT/);
    });

    it('should have permalink column', () => {
      expect(migrationSQL).toMatch(/permalink VARCHAR\(500\)/);
    });

    it('should have score column with default', () => {
      expect(migrationSQL).toMatch(/score INTEGER DEFAULT 0/);
    });

    it('should have num_comments column with default', () => {
      expect(migrationSQL).toMatch(/num_comments INTEGER DEFAULT 0/);
    });

    it('should have is_nsfw boolean with default', () => {
      expect(migrationSQL).toMatch(/is_nsfw BOOLEAN DEFAULT FALSE/);
    });

    it('should have is_spoiler boolean with default', () => {
      expect(migrationSQL).toMatch(/is_spoiler BOOLEAN DEFAULT FALSE/);
    });

    it('should have created_utc for Reddit timestamp', () => {
      expect(migrationSQL).toMatch(/created_utc BIGINT/);
    });

    it('should have metadata JSONB column', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*metadata JSONB/s);
    });

    it('should have timestamps', () => {
      expect(migrationSQL).toMatch(/reddit_posts[^;]*created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
      expect(migrationSQL).toMatch(/reddit_posts[^;]*updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP/s);
    });

    it('should have index on user_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_reddit_posts_user ON reddit_posts(user_id)');
    });

    it('should have index on subreddit', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_reddit_posts_subreddit ON reddit_posts(subreddit)');
    });

    it('should have index on oauth_account_id', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_reddit_posts_oauth ON reddit_posts(oauth_account_id)');
    });

    it('should have index on created_at for recent posts', () => {
      expect(migrationSQL).toContain('CREATE INDEX idx_reddit_posts_created ON reddit_posts(created_at DESC)');
    });

    it('should support different post kinds', () => {
      // Comment in SQL indicates: 'link', 'self', 'image', 'video'
      expect(migrationSQL).toMatch(/kind VARCHAR\(50\) NOT NULL/);
    });

    it('should have Unix timestamp field for Reddit data', () => {
      expect(migrationSQL).toMatch(/created_utc BIGINT/);
    });

    it('should have unique constraints on Reddit identifiers', () => {
      expect(migrationSQL).toMatch(/post_id VARCHAR\(255\) UNIQUE NOT NULL/);
      expect(migrationSQL).toMatch(/post_name VARCHAR\(255\) UNIQUE NOT NULL/);
    });
  });

  describe('Migration Script Validation', () => {
    it('should use IF NOT EXISTS for all tables', () => {
      const tableCreations = migrationSQL.match(/CREATE TABLE/g) || [];
      const ifNotExists = migrationSQL.match(/CREATE TABLE IF NOT EXISTS/g) || [];
      
      expect(tableCreations.length).toBe(ifNotExists.length);
    });

    it('should have CASCADE delete on all foreign keys', () => {
      const foreignKeys = migrationSQL.match(/REFERENCES \w+\(\w+\)/g) || [];
      const cascadeDeletes = migrationSQL.match(/ON DELETE CASCADE/g) || [];
      
      expect(cascadeDeletes.length).toBeGreaterThan(0);
      expect(cascadeDeletes.length).toBe(foreignKeys.length);
    });

    it('should have proper index naming convention', () => {
      const indexes = migrationSQL.match(/CREATE INDEX (\w+)/g) || [];
      
      indexes.forEach(index => {
        expect(index).toMatch(/CREATE INDEX idx_\w+/);
      });
    });

    it('should have comments for all main tables', () => {
      const tables = [
        'oauth_accounts',
        'tiktok_posts',
        'instagram_accounts',
        'ig_media',
        'webhook_events'
      ];

      tables.forEach(table => {
        expect(migrationSQL).toContain(`COMMENT ON TABLE ${table} IS`);
      });
    });

    it('should have proper SQL formatting', () => {
      // Check for proper semicolons
      const createStatements = migrationSQL.match(/CREATE TABLE[^;]+;/gs) || [];
      expect(createStatements.length).toBeGreaterThan(0);

      // Check for proper index statements
      const indexStatements = migrationSQL.match(/CREATE INDEX[^;]+;/gs) || [];
      expect(indexStatements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Types Validation', () => {
    it('should use appropriate VARCHAR lengths', () => {
      expect(migrationSQL).toContain('VARCHAR(50)'); // provider, status
      expect(migrationSQL).toContain('VARCHAR(100)'); // error_code, event_type
      expect(migrationSQL).toContain('VARCHAR(255)'); // IDs, usernames
      expect(migrationSQL).toContain('VARCHAR(500)'); // URLs
    });

    it('should use TEXT for long content', () => {
      expect(migrationSQL).toMatch(/scope TEXT/);
      expect(migrationSQL).toMatch(/title TEXT/);
      expect(migrationSQL).toMatch(/caption TEXT/);
      expect(migrationSQL).toMatch(/error_message TEXT/);
    });

    it('should use JSONB for structured data', () => {
      expect(migrationSQL).toMatch(/metadata JSONB/);
      expect(migrationSQL).toMatch(/metrics_json JSONB/);
      expect(migrationSQL).toMatch(/payload_json JSONB/);
    });

    it('should use TIMESTAMP for dates', () => {
      const timestamps = migrationSQL.match(/TIMESTAMP/g) || [];
      expect(timestamps.length).toBeGreaterThan(20); // Many timestamp columns
    });

    it('should use INTEGER for foreign keys', () => {
      expect(migrationSQL).toMatch(/user_id INTEGER/);
      expect(migrationSQL).toMatch(/oauth_account_id INTEGER/);
      expect(migrationSQL).toMatch(/instagram_account_id INTEGER/);
    });

    it('should use SERIAL for auto-increment IDs', () => {
      expect(migrationSQL).toMatch(/id SERIAL PRIMARY KEY/);
    });

    it('should use BIGSERIAL for high-volume tables', () => {
      expect(migrationSQL).toMatch(/webhook_events[^;]*id BIGSERIAL PRIMARY KEY/s);
    });
  });

  describe('Performance Optimization', () => {
    it('should have indexes on all foreign keys', () => {
      // user_id indexes
      expect(migrationSQL).toContain('idx_tiktok_posts_user');
      expect(migrationSQL).toContain('idx_instagram_accounts_user');
      
      // oauth_account_id indexes
      expect(migrationSQL).toContain('idx_tiktok_posts_oauth');
      
      // Relationship indexes
      expect(migrationSQL).toContain('idx_ig_media_account');
      expect(migrationSQL).toContain('idx_ig_comments_media');
    });

    it('should have indexes on frequently queried columns', () => {
      // Expiry for token refresh
      expect(migrationSQL).toContain('idx_oauth_accounts_expires');
      
      // Status for pending posts
      expect(migrationSQL).toContain('idx_tiktok_posts_status');
      
      // Timestamps for recent items
      expect(migrationSQL).toContain('idx_ig_media_timestamp');
      expect(migrationSQL).toContain('idx_ig_comments_timestamp');
      
      // Webhook processing
      expect(migrationSQL).toContain('idx_webhook_events_processed');
      expect(migrationSQL).toContain('idx_webhook_events_retry');
    });

    it('should use partial indexes for filtered queries', () => {
      // Only index pending posts
      expect(migrationSQL).toMatch(/idx_tiktok_posts_status.*WHERE status IN/s);
      
      // Only index unprocessed webhooks
      expect(migrationSQL).toMatch(/idx_webhook_events_processed.*WHERE processed_at IS NULL/s);
      
      // Only index retryable webhooks
      expect(migrationSQL).toMatch(/idx_webhook_events_retry.*WHERE processed_at IS NULL AND retry_count < 5/s);
    });

    it('should have composite indexes for common queries', () => {
      expect(migrationSQL).toContain('idx_oauth_accounts_user_provider ON oauth_accounts(user_id, provider)');
      expect(migrationSQL).toContain('idx_webhook_events_provider ON webhook_events(provider, event_type)');
    });
  });

  describe('Security and Data Integrity', () => {
    it('should encrypt sensitive token data', () => {
      expect(migrationSQL).toContain('access_token_encrypted');
      expect(migrationSQL).toContain('refresh_token_encrypted');
      expect(migrationSQL).toContain('AES-256-GCM');
    });

    it('should have unique constraints for idempotence', () => {
      // Prevent duplicate OAuth accounts
      expect(migrationSQL).toMatch(/oauth_accounts[^;]*UNIQUE\s*\(\s*user_id\s*,\s*provider\s*,\s*open_id\s*\)/s);
      
      // Prevent duplicate TikTok posts
      expect(migrationSQL).toMatch(/publish_id VARCHAR\(255\) UNIQUE NOT NULL/);
      
      // Prevent duplicate Instagram accounts
      expect(migrationSQL).toMatch(/ig_business_id VARCHAR\(255\) UNIQUE NOT NULL/);
      expect(migrationSQL).toMatch(/instagram_accounts[^;]*UNIQUE\s*\(\s*user_id\s*,\s*ig_business_id\s*\)/s);
      
      // Prevent duplicate webhook events
      expect(migrationSQL).toMatch(/external_id VARCHAR\(255\) UNIQUE NOT NULL/);
    });

    it('should have NOT NULL constraints on critical columns', () => {
      expect(migrationSQL).toMatch(/user_id INTEGER NOT NULL/);
      expect(migrationSQL).toMatch(/provider VARCHAR\(50\) NOT NULL/);
      expect(migrationSQL).toMatch(/access_token_encrypted TEXT NOT NULL/);
      expect(migrationSQL).toMatch(/expires_at TIMESTAMP NOT NULL/);
      expect(migrationSQL).toMatch(/status VARCHAR\(50\) NOT NULL/);
    });

    it('should cascade deletes to maintain referential integrity', () => {
      // When user is deleted, delete all their OAuth accounts
      expect(migrationSQL).toMatch(/oauth_accounts[^;]*REFERENCES users\(id\) ON DELETE CASCADE/s);
      
      // When OAuth account is deleted, delete all related posts
      expect(migrationSQL).toMatch(/tiktok_posts[^;]*REFERENCES oauth_accounts\(id\) ON DELETE CASCADE/s);
      
      // When Instagram account is deleted, delete all media
      expect(migrationSQL).toMatch(/ig_media[^;]*REFERENCES instagram_accounts\(id\) ON DELETE CASCADE/s);
      
      // When media is deleted, delete all comments
      expect(migrationSQL).toMatch(/ig_comments[^;]*REFERENCES ig_media\(id\) ON DELETE CASCADE/s);
    });
  });

  describe('Requirements Coverage', () => {
    it('should support TikTok OAuth (Requirement 1.3)', () => {
      expect(migrationSQL).toContain('oauth_accounts');
      expect(migrationSQL).toContain('access_token_encrypted');
      expect(migrationSQL).toContain('refresh_token_encrypted');
      expect(migrationSQL).toContain('expires_at');
    });

    it('should support TikTok content posting (Requirement 4.1, 4.2)', () => {
      expect(migrationSQL).toContain('tiktok_posts');
      expect(migrationSQL).toContain('publish_id');
      expect(migrationSQL).toContain('status');
      expect(migrationSQL).toContain('source');
    });

    it('should support webhook processing (Requirement 4.1, 4.2)', () => {
      expect(migrationSQL).toContain('webhook_events');
      expect(migrationSQL).toContain('external_id');
      expect(migrationSQL).toContain('processed_at');
      expect(migrationSQL).toContain('retry_count');
    });

    it('should support Instagram OAuth (Requirement 5.1-5.5)', () => {
      expect(migrationSQL).toContain('instagram_accounts');
      expect(migrationSQL).toContain('ig_business_id');
      expect(migrationSQL).toContain('page_id');
    });

    it('should support Instagram media sync (Requirement 8.1-8.5)', () => {
      expect(migrationSQL).toContain('ig_media');
      expect(migrationSQL).toContain('ig_id');
      expect(migrationSQL).toContain('media_type');
      expect(migrationSQL).toContain('metrics_json');
    });

    it('should support Instagram comments (Requirement 8.3)', () => {
      expect(migrationSQL).toContain('ig_comments');
      expect(migrationSQL).toContain('from_user');
      expect(migrationSQL).toContain('hidden');
    });
  });
});
