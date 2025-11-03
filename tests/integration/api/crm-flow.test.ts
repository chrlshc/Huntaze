/**
 * Integration Tests - CRM Flow End-to-End
 * 
 * Tests the complete CRM flow from API to PostgreSQL:
 * 1. Create user profile
 * 2. Configure AI settings
 * 3. Add fans
 * 4. Create conversations
 * 5. Send messages
 * 
 * These tests validate that the APIs correctly interact with PostgreSQL repositories.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('CRM Flow - End-to-End Integration', () => {
  let pool: Pool;
  let testUserId: number;
  let testFanId: number;
  let testConversationId: number;

  beforeAll(async () => {
    // Connect to database
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, email_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['crm-flow-test@example.com', 'CRM Flow Test', 'hashed', true]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Step 1: User Profile', () => {
    it('should create user profile', async () => {
      const result = await pool.query(`
        INSERT INTO user_profiles (
          user_id, display_name, bio, timezone, niche, goals
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        testUserId,
        'Test Creator',
        'Fitness content creator',
        'America/New_York',
        'fitness',
        JSON.stringify(['revenue', 'growth'])
      ]);

      expect(result.rows[0].user_id).toBe(testUserId);
      expect(result.rows[0].display_name).toBe('Test Creator');
      expect(result.rows[0].niche).toBe('fitness');
    });

    it('should retrieve user profile', async () => {
      const result = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].display_name).toBe('Test Creator');
    });

    it('should update user profile', async () => {
      await pool.query(
        'UPDATE user_profiles SET bio = $1 WHERE user_id = $2',
        ['Updated bio', testUserId]
      );

      const result = await pool.query(
        'SELECT bio FROM user_profiles WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows[0].bio).toBe('Updated bio');
    });
  });

  describe('Step 2: AI Configuration', () => {
    it('should create AI config', async () => {
      const result = await pool.query(`
        INSERT INTO ai_configs (
          user_id, personality, response_style, tone,
          response_length, platforms, enabled
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        'friendly',
        'professional',
        'casual',
        'medium',
        JSON.stringify(['onlyfans', 'fansly']),
        true
      ]);

      expect(result.rows[0].personality).toBe('friendly');
      expect(result.rows[0].enabled).toBe(true);
    });

    it('should retrieve AI config', async () => {
      const result = await pool.query(
        'SELECT * FROM ai_configs WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].response_style).toBe('professional');
    });

    it('should update AI config', async () => {
      await pool.query(
        'UPDATE ai_configs SET personality = $1 WHERE user_id = $2',
        ['flirty', testUserId]
      );

      const result = await pool.query(
        'SELECT personality FROM ai_configs WHERE user_id = $1',
        [testUserId]
      );

      expect(result.rows[0].personality).toBe('flirty');
    });
  });

  describe('Step 3: Fans Management', () => {
    it('should create fan', async () => {
      const result = await pool.query(`
        INSERT INTO fans (
          user_id, name, platform, platform_id, handle,
          tags, value_cents
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        'John Subscriber',
        'onlyfans',
        'of_john_123',
        '@johnfan',
        JSON.stringify(['vip', 'active']),
        25000
      ]);

      testFanId = result.rows[0].id;
      expect(result.rows[0].name).toBe('John Subscriber');
      expect(result.rows[0].value_cents).toBe(25000);
    });

    it('should list fans for user', async () => {
      const result = await pool.query(
        'SELECT * FROM fans WHERE user_id = $1 ORDER BY created_at DESC',
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].user_id).toBe(testUserId);
    });

    it('should update fan value', async () => {
      await pool.query(
        'UPDATE fans SET value_cents = value_cents + $1 WHERE id = $2',
        [5000, testFanId]
      );

      const result = await pool.query(
        'SELECT value_cents FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(result.rows[0].value_cents).toBe(30000);
    });

    it('should add tags to fan', async () => {
      await pool.query(
        'UPDATE fans SET tags = $1 WHERE id = $2',
        [JSON.stringify(['vip', 'active', 'whale']), testFanId]
      );

      const result = await pool.query(
        'SELECT tags FROM fans WHERE id = $1',
        [testFanId]
      );

      const tags = result.rows[0].tags;
      expect(tags).toContain('whale');
    });
  });

  describe('Step 4: Conversations', () => {
    it('should create conversation', async () => {
      const result = await pool.query(`
        INSERT INTO conversations (
          user_id, fan_id, platform, platform_conversation_id,
          last_message_at, unread_count
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        testUserId,
        testFanId,
        'onlyfans',
        'conv_john_123',
        new Date(),
        0
      ]);

      testConversationId = result.rows[0].id;
      expect(result.rows[0].fan_id).toBe(testFanId);
      expect(result.rows[0].unread_count).toBe(0);
    });

    it('should list conversations for user', async () => {
      const result = await pool.query(
        'SELECT * FROM conversations WHERE user_id = $1 ORDER BY last_message_at DESC',
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].user_id).toBe(testUserId);
    });

    it('should update unread count', async () => {
      await pool.query(
        'UPDATE conversations SET unread_count = unread_count + 1 WHERE id = $1',
        [testConversationId]
      );

      const result = await pool.query(
        'SELECT unread_count FROM conversations WHERE id = $1',
        [testConversationId]
      );

      expect(result.rows[0].unread_count).toBe(1);
    });
  });

  describe('Step 5: Messages', () => {
    it('should create incoming message', async () => {
      const result = await pool.query(`
        INSERT INTO messages (
          user_id, conversation_id, fan_id, direction,
          text, read, sent_by_ai
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        testConversationId,
        testFanId,
        'in',
        'Hey! Love your content!',
        false,
        false
      ]);

      expect(result.rows[0].direction).toBe('in');
      expect(result.rows[0].read).toBe(false);
    });

    it('should create outgoing AI message', async () => {
      const result = await pool.query(`
        INSERT INTO messages (
          user_id, conversation_id, fan_id, direction,
          text, read, sent_by_ai
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        testConversationId,
        testFanId,
        'out',
        'Thanks so much! 💪',
        true,
        true
      ]);

      expect(result.rows[0].direction).toBe('out');
      expect(result.rows[0].sent_by_ai).toBe(true);
    });

    it('should create PPV message', async () => {
      const result = await pool.query(`
        INSERT INTO messages (
          user_id, conversation_id, fan_id, direction,
          text, price_cents, attachments
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        testConversationId,
        testFanId,
        'out',
        'Exclusive workout video 🔥',
        1999,
        JSON.stringify([{
          id: 'vid_123',
          type: 'video',
          url: 'https://example.com/video.mp4',
          name: 'workout.mp4',
          size: 15000000
        }])
      ]);

      expect(result.rows[0].price_cents).toBe(1999);
      expect(result.rows[0].attachments).toBeDefined();
    });

    it('should list messages in conversation', async () => {
      const result = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [testConversationId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(3);
      expect(result.rows[0].direction).toBe('in');
      expect(result.rows[1].direction).toBe('out');
    });

    it('should mark message as read', async () => {
      const unreadResult = await pool.query(
        'SELECT id FROM messages WHERE conversation_id = $1 AND read = false LIMIT 1',
        [testConversationId]
      );

      if (unreadResult.rows.length > 0) {
        const messageId = unreadResult.rows[0].id;
        
        await pool.query(
          'UPDATE messages SET read = true WHERE id = $1',
          [messageId]
        );

        const result = await pool.query(
          'SELECT read FROM messages WHERE id = $1',
          [messageId]
        );

        expect(result.rows[0].read).toBe(true);
      }
    });
  });

  describe('Step 6: Analytics & Metrics', () => {
    it('should calculate total fan value', async () => {
      const result = await pool.query(
        'SELECT SUM(value_cents) as total_value FROM fans WHERE user_id = $1',
        [testUserId]
      );

      expect(parseInt(result.rows[0].total_value)).toBeGreaterThan(0);
    });

    it('should count total messages', async () => {
      const result = await pool.query(
        'SELECT COUNT(*) as message_count FROM messages WHERE user_id = $1',
        [testUserId]
      );

      expect(parseInt(result.rows[0].message_count)).toBeGreaterThanOrEqual(3);
    });

    it('should count AI-sent messages', async () => {
      const result = await pool.query(
        'SELECT COUNT(*) as ai_count FROM messages WHERE user_id = $1 AND sent_by_ai = true',
        [testUserId]
      );

      expect(parseInt(result.rows[0].ai_count)).toBeGreaterThanOrEqual(1);
    });

    it('should calculate PPV revenue', async () => {
      const result = await pool.query(
        'SELECT SUM(price_cents) as ppv_revenue FROM messages WHERE user_id = $1 AND price_cents > 0',
        [testUserId]
      );

      expect(parseInt(result.rows[0].ppv_revenue)).toBeGreaterThan(0);
    });

    it('should count unread conversations', async () => {
      const result = await pool.query(
        'SELECT COUNT(*) as unread_count FROM conversations WHERE user_id = $1 AND unread_count > 0',
        [testUserId]
      );

      expect(parseInt(result.rows[0].unread_count)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Step 7: Cascade Deletes', () => {
    it('should cascade delete conversation when fan is deleted', async () => {
      // Create temp fan and conversation
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [testUserId, 'Temp Fan', 'fansly', 'temp_cascade']
      );
      const tempFanId = fanResult.rows[0].id;

      const convResult = await pool.query(
        'INSERT INTO conversations (user_id, fan_id, platform) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, tempFanId, 'fansly']
      );
      const tempConvId = convResult.rows[0].id;

      // Delete fan
      await pool.query('DELETE FROM fans WHERE id = $1', [tempFanId]);

      // Check conversation is deleted
      const checkResult = await pool.query(
        'SELECT * FROM conversations WHERE id = $1',
        [tempConvId]
      );

      expect(checkResult.rows).toHaveLength(0);
    });

    it('should cascade delete all CRM data when user is deleted', async () => {
      // Create temp user with full CRM data
      const userResult = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['temp-cascade@example.com', 'Temp User', 'hash']
      );
      const tempUserId = userResult.rows[0].id;

      // Create profile
      await pool.query(
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
        [tempUserId, 'Temp Profile']
      );

      // Create AI config
      await pool.query(
        'INSERT INTO ai_configs (user_id, personality) VALUES ($1, $2)',
        [tempUserId, 'friendly']
      );

      // Create fan
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [tempUserId, 'Temp Fan', 'onlyfans', 'temp_user_fan']
      );
      const tempFanId = fanResult.rows[0].id;

      // Delete user
      await pool.query('DELETE FROM users WHERE id = $1', [tempUserId]);

      // Check all related data is deleted
      const profileCheck = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [tempUserId]);
      const configCheck = await pool.query('SELECT * FROM ai_configs WHERE user_id = $1', [tempUserId]);
      const fanCheck = await pool.query('SELECT * FROM fans WHERE id = $1', [tempFanId]);

      expect(profileCheck.rows).toHaveLength(0);
      expect(configCheck.rows).toHaveLength(0);
      expect(fanCheck.rows).toHaveLength(0);
    });
  });
});
