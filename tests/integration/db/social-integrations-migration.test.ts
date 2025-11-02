/**
 * Integration Tests - Social Integrations Migration
 * 
 * Tests to validate the social integrations migration execution
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 1)
 * 
 * Coverage:
 * - Migration script execution
 * - Table creation verification
 * - Index creation verification
 * - Foreign key constraints
 * - Data insertion and retrieval
 * - Cascade delete behavior
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Social Integrations Migration - Integration Tests', () => {
  let pool: Pool;
  let testUserId: number;

  beforeAll(async () => {
    // Create test database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : false,
    });

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, email_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['test-social@example.com', 'Test User', 'hashed', true]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Migration Execution', () => {
    it('should execute migration without errors', async () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      await expect(pool.query(migrationSQL)).resolves.not.toThrow();
    });

    it('should be idempotent (can run multiple times)', async () => {
      const migrationPath = join(process.cwd(), 'lib/db/migrations/2024-10-31-social-integrations.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      // Run migration twice
      await pool.query(migrationSQL);
      await expect(pool.query(migrationSQL)).resolves.not.toThrow();
    });
  });

  describe('Table Existence', () => {
    it('should create oauth_accounts table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'oauth_accounts'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should create tiktok_posts table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tiktok_posts'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should create instagram_accounts table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'instagram_accounts'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should create ig_media table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ig_media'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should create ig_comments table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ig_comments'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should create webhook_events table', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'webhook_events'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Index Verification', () => {
    it('should create indexes on oauth_accounts', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'oauth_accounts'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_oauth_accounts_expires');
      expect(indexNames).toContain('idx_oauth_accounts_user_provider');
    });

    it('should create indexes on tiktok_posts', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'tiktok_posts'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_tiktok_posts_user');
      expect(indexNames).toContain('idx_tiktok_posts_status');
      expect(indexNames).toContain('idx_tiktok_posts_oauth');
    });

    it('should create indexes on instagram_accounts', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'instagram_accounts'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_instagram_accounts_user');
    });

    it('should create indexes on ig_media', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'ig_media'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_ig_media_account');
      expect(indexNames).toContain('idx_ig_media_timestamp');
    });

    it('should create indexes on ig_comments', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'ig_comments'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_ig_comments_media');
      expect(indexNames).toContain('idx_ig_comments_timestamp');
    });

    it('should create indexes on webhook_events', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'webhook_events'
        ORDER BY indexname
      `);

      const indexNames = result.rows.map(row => row.indexname);
      
      expect(indexNames).toContain('idx_webhook_events_provider');
      expect(indexNames).toContain('idx_webhook_events_processed');
      expect(indexNames).toContain('idx_webhook_events_retry');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key from oauth_accounts to users', async () => {
      const result = await pool.query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'oauth_accounts'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].foreign_table_name).toBe('users');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('should have foreign keys from tiktok_posts', async () => {
      const result = await pool.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'tiktok_posts'
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.column_name
      `);

      const foreignKeys = result.rows.map(row => ({
        column: row.column_name,
        references: row.foreign_table_name
      }));

      expect(foreignKeys).toContainEqual({ column: 'user_id', references: 'users' });
      expect(foreignKeys).toContainEqual({ column: 'oauth_account_id', references: 'oauth_accounts' });
    });

    it('should have foreign keys from instagram_accounts', async () => {
      const result = await pool.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'instagram_accounts'
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.column_name
      `);

      const foreignKeys = result.rows.map(row => ({
        column: row.column_name,
        references: row.foreign_table_name
      }));

      expect(foreignKeys).toContainEqual({ column: 'user_id', references: 'users' });
      expect(foreignKeys).toContainEqual({ column: 'oauth_account_id', references: 'oauth_accounts' });
    });
  });

  describe('Data Operations - oauth_accounts', () => {
    let oauthAccountId: number;

    it('should insert OAuth account', async () => {
      const result = await pool.query(`
        INSERT INTO oauth_accounts (
          user_id, provider, open_id, scope,
          access_token_encrypted, refresh_token_encrypted,
          expires_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        testUserId,
        'tiktok',
        'tiktok_user_123',
        'user.info.basic,video.upload',
        'encrypted_access_token',
        'encrypted_refresh_token',
        new Date(Date.now() + 86400000), // 24 hours from now
        JSON.stringify({ username: 'test_user' })
      ]);

      oauthAccountId = result.rows[0].id;
      expect(oauthAccountId).toBeGreaterThan(0);
    });

    it('should retrieve OAuth account', async () => {
      const result = await pool.query(
        'SELECT * FROM oauth_accounts WHERE id = $1',
        [oauthAccountId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].provider).toBe('tiktok');
      expect(result.rows[0].open_id).toBe('tiktok_user_123');
    });

    it('should enforce unique constraint on user_id, provider, open_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO oauth_accounts (
            user_id, provider, open_id, scope,
            access_token_encrypted, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          testUserId,
          'tiktok',
          'tiktok_user_123', // Same as above
          'user.info.basic',
          'encrypted_token',
          new Date(Date.now() + 86400000)
        ])
      ).rejects.toThrow();
    });

    it('should update OAuth tokens', async () => {
      await pool.query(`
        UPDATE oauth_accounts 
        SET access_token_encrypted = $1,
            refresh_token_encrypted = $2,
            expires_at = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [
        'new_encrypted_access_token',
        'new_encrypted_refresh_token',
        new Date(Date.now() + 172800000), // 48 hours from now
        oauthAccountId
      ]);

      const result = await pool.query(
        'SELECT access_token_encrypted FROM oauth_accounts WHERE id = $1',
        [oauthAccountId]
      );

      expect(result.rows[0].access_token_encrypted).toBe('new_encrypted_access_token');
    });

    it('should find tokens expiring soon', async () => {
      // Create account expiring in 30 minutes
      await pool.query(`
        INSERT INTO oauth_accounts (
          user_id, provider, open_id, scope,
          access_token_encrypted, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        testUserId,
        'instagram',
        'ig_user_456',
        'instagram_basic',
        'encrypted_token',
        new Date(Date.now() + 1800000) // 30 minutes from now
      ]);

      const result = await pool.query(`
        SELECT * FROM oauth_accounts
        WHERE expires_at < $1
        ORDER BY expires_at
      `, [new Date(Date.now() + 3600000)]); // 1 hour from now

      expect(result.rows.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Clean up OAuth accounts
      await pool.query('DELETE FROM oauth_accounts WHERE user_id = $1', [testUserId]);
    });
  });

  describe('Data Operations - tiktok_posts', () => {
    let oauthAccountId: number;
    let postId: number;

    beforeAll(async () => {
      // Create OAuth account for testing
      const result = await pool.query(`
        INSERT INTO oauth_accounts (
          user_id, provider, open_id, scope,
          access_token_encrypted, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        testUserId,
        'tiktok',
        'tiktok_post_test',
        'video.upload',
        'encrypted_token',
        new Date(Date.now() + 86400000)
      ]);
      oauthAccountId = result.rows[0].id;
    });

    it('should insert TikTok post', async () => {
      const result = await pool.query(`
        INSERT INTO tiktok_posts (
          user_id, oauth_account_id, publish_id,
          status, source, title, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        testUserId,
        oauthAccountId,
        'publish_123456',
        'PROCESSING_UPLOAD',
        'FILE_UPLOAD',
        'Test Video',
        JSON.stringify({ duration: 30 })
      ]);

      postId = result.rows[0].id;
      expect(postId).toBeGreaterThan(0);
    });

    it('should retrieve TikTok post', async () => {
      const result = await pool.query(
        'SELECT * FROM tiktok_posts WHERE id = $1',
        [postId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].publish_id).toBe('publish_123456');
      expect(result.rows[0].status).toBe('PROCESSING_UPLOAD');
    });

    it('should enforce unique constraint on publish_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO tiktok_posts (
            user_id, oauth_account_id, publish_id,
            status, source
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          testUserId,
          oauthAccountId,
          'publish_123456', // Same as above
          'PROCESSING_UPLOAD',
          'FILE_UPLOAD'
        ])
      ).rejects.toThrow();
    });

    it('should update post status', async () => {
      await pool.query(`
        UPDATE tiktok_posts 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, ['PUBLISH_COMPLETE', postId]);

      const result = await pool.query(
        'SELECT status FROM tiktok_posts WHERE id = $1',
        [postId]
      );

      expect(result.rows[0].status).toBe('PUBLISH_COMPLETE');
    });

    it('should find pending posts using partial index', async () => {
      // Create pending post
      await pool.query(`
        INSERT INTO tiktok_posts (
          user_id, oauth_account_id, publish_id,
          status, source
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        testUserId,
        oauthAccountId,
        'publish_pending_789',
        'SEND_TO_USER_INBOX',
        'PULL_FROM_URL'
      ]);

      const result = await pool.query(`
        SELECT * FROM tiktok_posts
        WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX')
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Clean up
      await pool.query('DELETE FROM tiktok_posts WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM oauth_accounts WHERE id = $1', [oauthAccountId]);
    });
  });

  describe('Data Operations - webhook_events', () => {
    let eventId: number;

    it('should insert webhook event', async () => {
      const result = await pool.query(`
        INSERT INTO webhook_events (
          provider, event_type, external_id, payload_json
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        'tiktok',
        'video.publish.complete',
        'event_123456',
        JSON.stringify({ publish_id: 'publish_123', status: 'COMPLETE' })
      ]);

      eventId = result.rows[0].id;
      expect(eventId).toBeGreaterThan(0);
    });

    it('should enforce unique constraint on external_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO webhook_events (
            provider, event_type, external_id, payload_json
          ) VALUES ($1, $2, $3, $4)
        `, [
          'tiktok',
          'video.publish.complete',
          'event_123456', // Same as above
          JSON.stringify({ test: 'data' })
        ])
      ).rejects.toThrow();
    });

    it('should mark event as processed', async () => {
      await pool.query(`
        UPDATE webhook_events 
        SET processed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [eventId]);

      const result = await pool.query(
        'SELECT processed_at FROM webhook_events WHERE id = $1',
        [eventId]
      );

      expect(result.rows[0].processed_at).not.toBeNull();
    });

    it('should find unprocessed events using partial index', async () => {
      // Create unprocessed event
      await pool.query(`
        INSERT INTO webhook_events (
          provider, event_type, external_id, payload_json
        ) VALUES ($1, $2, $3, $4)
      `, [
        'instagram',
        'media.update',
        'event_unprocessed_789',
        JSON.stringify({ media_id: 'ig_123' })
      ]);

      const result = await pool.query(`
        SELECT * FROM webhook_events
        WHERE processed_at IS NULL
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should increment retry count', async () => {
      const unprocessedResult = await pool.query(`
        SELECT id FROM webhook_events
        WHERE processed_at IS NULL
        LIMIT 1
      `);

      const unprocessedId = unprocessedResult.rows[0].id;

      await pool.query(`
        UPDATE webhook_events 
        SET retry_count = retry_count + 1,
            error_message = $1
        WHERE id = $2
      `, ['Processing failed', unprocessedId]);

      const result = await pool.query(
        'SELECT retry_count FROM webhook_events WHERE id = $1',
        [unprocessedId]
      );

      expect(result.rows[0].retry_count).toBeGreaterThan(0);
    });

    afterAll(async () => {
      // Clean up
      await pool.query('DELETE FROM webhook_events WHERE provider IN ($1, $2)', ['tiktok', 'instagram']);
    });
  });

  describe('Cascade Delete Behavior', () => {
    let testUserId2: number;
    let oauthAccountId: number;
    let instagramAccountId: number;
    let mediaId: number;

    beforeAll(async () => {
      // Create test user
      const userResult = await pool.query(`
        INSERT INTO users (email, name, password_hash, email_verified)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['cascade-test@example.com', 'Cascade Test', 'hashed', true]);
      testUserId2 = userResult.rows[0].id;

      // Create OAuth account
      const oauthResult = await pool.query(`
        INSERT INTO oauth_accounts (
          user_id, provider, open_id, scope,
          access_token_encrypted, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        testUserId2,
        'instagram',
        'ig_cascade_test',
        'instagram_basic',
        'encrypted_token',
        new Date(Date.now() + 86400000)
      ]);
      oauthAccountId = oauthResult.rows[0].id;

      // Create Instagram account
      const igAccountResult = await pool.query(`
        INSERT INTO instagram_accounts (
          user_id, oauth_account_id, ig_business_id,
          page_id, username
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        testUserId2,
        oauthAccountId,
        'ig_business_cascade',
        'page_123',
        'cascade_user'
      ]);
      instagramAccountId = igAccountResult.rows[0].id;

      // Create media
      const mediaResult = await pool.query(`
        INSERT INTO ig_media (
          instagram_account_id, ig_id, media_type, caption
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        instagramAccountId,
        'ig_media_cascade',
        'IMAGE',
        'Test post'
      ]);
      mediaId = mediaResult.rows[0].id;

      // Create comment
      await pool.query(`
        INSERT INTO ig_comments (
          ig_media_id, ig_id, from_user, text
        ) VALUES ($1, $2, $3, $4)
      `, [
        mediaId,
        'ig_comment_cascade',
        'commenter',
        'Nice post!'
      ]);

      // Create TikTok post
      await pool.query(`
        INSERT INTO tiktok_posts (
          user_id, oauth_account_id, publish_id,
          status, source
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        testUserId2,
        oauthAccountId,
        'publish_cascade',
        'PUBLISH_COMPLETE',
        'FILE_UPLOAD'
      ]);
    });

    it('should cascade delete from user to all related records', async () => {
      // Verify records exist
      const beforeOAuth = await pool.query('SELECT COUNT(*) FROM oauth_accounts WHERE user_id = $1', [testUserId2]);
      const beforeTikTok = await pool.query('SELECT COUNT(*) FROM tiktok_posts WHERE user_id = $1', [testUserId2]);
      const beforeIG = await pool.query('SELECT COUNT(*) FROM instagram_accounts WHERE user_id = $1', [testUserId2]);

      expect(parseInt(beforeOAuth.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(beforeTikTok.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(beforeIG.rows[0].count)).toBeGreaterThan(0);

      // Delete user
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId2]);

      // Verify cascade delete
      const afterOAuth = await pool.query('SELECT COUNT(*) FROM oauth_accounts WHERE user_id = $1', [testUserId2]);
      const afterTikTok = await pool.query('SELECT COUNT(*) FROM tiktok_posts WHERE user_id = $1', [testUserId2]);
      const afterIG = await pool.query('SELECT COUNT(*) FROM instagram_accounts WHERE user_id = $1', [testUserId2]);

      expect(parseInt(afterOAuth.rows[0].count)).toBe(0);
      expect(parseInt(afterTikTok.rows[0].count)).toBe(0);
      expect(parseInt(afterIG.rows[0].count)).toBe(0);
    });
  });

  describe('Data Operations - reddit_posts', () => {
    let oauthAccountId: number;
    let postId: number;

    beforeAll(async () => {
      // Create OAuth account for testing
      const result = await pool.query(`
        INSERT INTO oauth_accounts (
          user_id, provider, open_id, scope,
          access_token_encrypted, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        testUserId,
        'reddit',
        'reddit_post_test',
        'submit,read',
        'encrypted_token',
        new Date(Date.now() + 86400000)
      ]);
      oauthAccountId = result.rows[0].id;
    });

    it('should insert Reddit post', async () => {
      const result = await pool.query(`
        INSERT INTO reddit_posts (
          user_id, oauth_account_id, post_id, post_name,
          subreddit, title, kind, score, num_comments,
          is_nsfw, is_spoiler, created_utc, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        testUserId,
        oauthAccountId,
        'abc123',
        't3_abc123',
        'test',
        'Test Post Title',
        'self',
        42,
        10,
        false,
        false,
        Math.floor(Date.now() / 1000),
        JSON.stringify({ flair: 'Discussion' })
      ]);

      postId = result.rows[0].id;
      expect(postId).toBeGreaterThan(0);
    });

    it('should retrieve Reddit post', async () => {
      const result = await pool.query(
        'SELECT * FROM reddit_posts WHERE id = $1',
        [postId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].post_id).toBe('abc123');
      expect(result.rows[0].post_name).toBe('t3_abc123');
      expect(result.rows[0].subreddit).toBe('test');
      expect(result.rows[0].title).toBe('Test Post Title');
      expect(result.rows[0].kind).toBe('self');
      expect(result.rows[0].score).toBe(42);
      expect(result.rows[0].num_comments).toBe(10);
    });

    it('should enforce unique constraint on post_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO reddit_posts (
            user_id, oauth_account_id, post_id, post_name,
            subreddit, title, kind
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          testUserId,
          oauthAccountId,
          'abc123', // Same as above
          't3_abc123_duplicate',
          'test',
          'Duplicate Post',
          'self'
        ])
      ).rejects.toThrow();
    });

    it('should enforce unique constraint on post_name', async () => {
      await expect(
        pool.query(`
          INSERT INTO reddit_posts (
            user_id, oauth_account_id, post_id, post_name,
            subreddit, title, kind
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          testUserId,
          oauthAccountId,
          'xyz789',
          't3_abc123', // Same as above
          'test',
          'Duplicate Post Name',
          'self'
        ])
      ).rejects.toThrow();
    });

    it('should update post metrics', async () => {
      await pool.query(`
        UPDATE reddit_posts 
        SET score = $1, num_comments = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [100, 25, postId]);

      const result = await pool.query(
        'SELECT score, num_comments FROM reddit_posts WHERE id = $1',
        [postId]
      );

      expect(result.rows[0].score).toBe(100);
      expect(result.rows[0].num_comments).toBe(25);
    });

    it('should find posts by subreddit using index', async () => {
      const result = await pool.query(`
        SELECT * FROM reddit_posts
        WHERE subreddit = $1
      `, ['test']);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should find recent posts using created_at index', async () => {
      const result = await pool.query(`
        SELECT * FROM reddit_posts
        ORDER BY created_at DESC
        LIMIT 10
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should support different post kinds', async () => {
      const kinds = ['link', 'image', 'video'];
      
      for (const kind of kinds) {
        await pool.query(`
          INSERT INTO reddit_posts (
            user_id, oauth_account_id, post_id, post_name,
            subreddit, title, kind
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          testUserId,
          oauthAccountId,
          `${kind}_post_${Date.now()}`,
          `t3_${kind}_${Date.now()}`,
          'test',
          `Test ${kind} Post`,
          kind
        ]);
      }

      const result = await pool.query(`
        SELECT DISTINCT kind FROM reddit_posts
        WHERE user_id = $1
      `, [testUserId]);

      const foundKinds = result.rows.map(r => r.kind);
      expect(foundKinds).toContain('self');
      expect(foundKinds).toContain('link');
      expect(foundKinds).toContain('image');
      expect(foundKinds).toContain('video');
    });

    it('should store JSONB metadata', async () => {
      const metadata = {
        flair: 'Discussion',
        awards: ['gold', 'silver'],
        crosspost_parent: 't3_parent123'
      };

      await pool.query(`
        UPDATE reddit_posts 
        SET metadata = $1
        WHERE id = $2
      `, [JSON.stringify(metadata), postId]);

      const result = await pool.query(
        'SELECT metadata FROM reddit_posts WHERE id = $1',
        [postId]
      );

      expect(result.rows[0].metadata).toEqual(metadata);
    });

    afterAll(async () => {
      // Clean up
      await pool.query('DELETE FROM reddit_posts WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM oauth_accounts WHERE id = $1', [oauthAccountId]);
    });
  });

  describe('Performance Validation', () => {
    it('should use indexes for common queries', async () => {
      // Query plan for finding expiring tokens
      const expiringPlan = await pool.query(`
        EXPLAIN SELECT * FROM oauth_accounts
        WHERE expires_at < NOW() + INTERVAL '1 hour'
      `);

      const expiringPlanText = expiringPlan.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(expiringPlanText).toContain('Index');
    });

    it('should use partial index for pending posts', async () => {
      const pendingPlan = await pool.query(`
        EXPLAIN SELECT * FROM tiktok_posts
        WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX')
      `);

      const pendingPlanText = pendingPlan.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(pendingPlanText).toContain('Index');
    });

    it('should use partial index for unprocessed webhooks', async () => {
      const webhookPlan = await pool.query(`
        EXPLAIN SELECT * FROM webhook_events
        WHERE processed_at IS NULL
      `);

      const webhookPlanText = webhookPlan.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(webhookPlanText).toContain('Index');
    });

    it('should use index for subreddit queries', async () => {
      const subredditPlan = await pool.query(`
        EXPLAIN SELECT * FROM reddit_posts
        WHERE subreddit = 'test'
      `);

      const subredditPlanText = subredditPlan.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(subredditPlanText).toContain('Index');
    });

    it('should use index for recent Reddit posts', async () => {
      const recentPlan = await pool.query(`
        EXPLAIN SELECT * FROM reddit_posts
        ORDER BY created_at DESC
        LIMIT 10
      `);

      const recentPlanText = recentPlan.rows.map(r => r['QUERY PLAN']).join('\n');
      expect(recentPlanText).toContain('Index');
    });
  });
});
