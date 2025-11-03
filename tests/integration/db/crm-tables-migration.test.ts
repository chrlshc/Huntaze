/**
 * Integration Tests - CRM Tables Migration
 * 
 * Tests to validate the CRM tables migration (2024-10-31)
 * 
 * Coverage:
 * - All 9 CRM tables creation
 * - Foreign key constraints
 * - Indexes creation
 * - Triggers for updated_at
 * - Data insertion and relationships
 * - Cascade deletes
 * - JSONB columns
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('CRM Tables Migration - Integration Tests', () => {
  let pool: Pool;
  let testUserId: number;

  beforeAll(async () => {
    // Connect to test database
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined,
    });

    // Create a test user for foreign key relationships
    const userResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, email_verified) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['crm-test@example.com', 'CRM Test User', 'hashed_password', true]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Table Creation', () => {
    it('should have user_profiles table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have ai_configs table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_configs'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have fans table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fans'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have conversations table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have messages table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have campaigns table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have platform_connections table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'platform_connections'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have quick_replies table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quick_replies'
      `);
      
      expect(result.rows).toHaveLength(1);
    });

    it('should have analytics_events table', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_events'
      `);
      
      expect(result.rows).toHaveLength(1);
    });
  });

  describe('User Profiles Table', () => {
    it('should insert user profile with JSONB fields', async () => {
      const result = await pool.query(`
        INSERT INTO user_profiles (user_id, display_name, niche, goals, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        testUserId,
        'Test Creator',
        'fitness',
        JSON.stringify(['revenue', 'growth']),
        JSON.stringify({ premium: true })
      ]);

      expect(result.rows[0].user_id).toBe(testUserId);
      expect(result.rows[0].display_name).toBe('Test Creator');
      expect(result.rows[0].niche).toBe('fitness');
      expect(result.rows[0].created_at).toBeDefined();
    });

    it('should have foreign key to users table', async () => {
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
        WHERE tc.table_name = 'user_profiles'
        AND tc.constraint_type = 'FOREIGN KEY'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('users');
      expect(result.rows[0].foreign_column_name).toBe('id');
    });

    it('should cascade delete when user is deleted', async () => {
      // Create temporary user
      const userResult = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['temp-user@example.com', 'Temp User', 'hash']
      );
      const tempUserId = userResult.rows[0].id;

      // Create profile
      await pool.query(
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
        [tempUserId, 'Temp Profile']
      );

      // Delete user
      await pool.query('DELETE FROM users WHERE id = $1', [tempUserId]);

      // Check profile is deleted
      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [tempUserId]
      );

      expect(profileResult.rows).toHaveLength(0);
    });
  });

  describe('AI Configs Table', () => {
    it('should insert AI configuration', async () => {
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
        'balanced',
        'medium',
        JSON.stringify(['onlyfans', 'fansly']),
        true
      ]);

      expect(result.rows[0].user_id).toBe(testUserId);
      expect(result.rows[0].personality).toBe('friendly');
      expect(result.rows[0].enabled).toBe(true);
    });

    it('should have default enabled value', async () => {
      // Create temporary user
      const userResult = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['ai-test@example.com', 'AI Test', 'hash']
      );
      const tempUserId = userResult.rows[0].id;

      const result = await pool.query(
        'INSERT INTO ai_configs (user_id, personality) VALUES ($1, $2) RETURNING enabled',
        [tempUserId, 'friendly']
      );

      expect(result.rows[0].enabled).toBe(true);

      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [tempUserId]);
    });
  });

  describe('Fans Table', () => {
    let testFanId: number;

    it('should insert fan with all fields', async () => {
      const result = await pool.query(`
        INSERT INTO fans (
          user_id, name, platform, platform_id, handle,
          tags, value_cents, last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        testUserId,
        'John Doe',
        'onlyfans',
        'of_12345',
        '@johndoe',
        JSON.stringify(['vip', 'whale']),
        50000,
        new Date()
      ]);

      testFanId = result.rows[0].id;
      expect(result.rows[0].name).toBe('John Doe');
      expect(result.rows[0].platform).toBe('onlyfans');
      expect(result.rows[0].value_cents).toBe(50000);
    });

    it('should enforce unique constraint on user_id, platform, platform_id', async () => {
      await expect(
        pool.query(`
          INSERT INTO fans (user_id, name, platform, platform_id)
          VALUES ($1, $2, $3, $4)
        `, [testUserId, 'Duplicate', 'onlyfans', 'of_12345'])
      ).rejects.toThrow();
    });

    it('should have default value_cents of 0', async () => {
      const result = await pool.query(`
        INSERT INTO fans (user_id, name, platform, platform_id)
        VALUES ($1, $2, $3, $4)
        RETURNING value_cents
      `, [testUserId, 'New Fan', 'fansly', 'fs_999']);

      expect(result.rows[0].value_cents).toBe(0);
    });
  });

  describe('Conversations Table', () => {
    let testFanId: number;
    let testConversationId: number;

    beforeAll(async () => {
      // Create a fan for conversation tests
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [testUserId, 'Conv Test Fan', 'onlyfans', 'conv_fan_123']
      );
      testFanId = fanResult.rows[0].id;
    });

    it('should insert conversation', async () => {
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
        'conv_123',
        new Date(),
        5
      ]);

      testConversationId = result.rows[0].id;
      expect(result.rows[0].fan_id).toBe(testFanId);
      expect(result.rows[0].unread_count).toBe(5);
      expect(result.rows[0].archived).toBe(false);
    });

    it('should enforce unique constraint on user_id, fan_id, platform', async () => {
      await expect(
        pool.query(`
          INSERT INTO conversations (user_id, fan_id, platform)
          VALUES ($1, $2, $3)
        `, [testUserId, testFanId, 'onlyfans'])
      ).rejects.toThrow();
    });

    it('should cascade delete when fan is deleted', async () => {
      // Create temp fan and conversation
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [testUserId, 'Temp Fan', 'fansly', 'temp_fan']
      );
      const tempFanId = fanResult.rows[0].id;

      await pool.query(
        'INSERT INTO conversations (user_id, fan_id, platform) VALUES ($1, $2, $3)',
        [testUserId, tempFanId, 'fansly']
      );

      // Delete fan
      await pool.query('DELETE FROM fans WHERE id = $1', [tempFanId]);

      // Check conversation is deleted
      const convResult = await pool.query(
        'SELECT * FROM conversations WHERE fan_id = $1',
        [tempFanId]
      );

      expect(convResult.rows).toHaveLength(0);
    });
  });

  describe('Messages Table', () => {
    let testFanId: number;
    let testConversationId: number;

    beforeAll(async () => {
      // Create fan and conversation for message tests
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [testUserId, 'Msg Test Fan', 'onlyfans', 'msg_fan_123']
      );
      testFanId = fanResult.rows[0].id;

      const convResult = await pool.query(
        'INSERT INTO conversations (user_id, fan_id, platform) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, testFanId, 'onlyfans']
      );
      testConversationId = convResult.rows[0].id;
    });

    it('should insert incoming message', async () => {
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
        'Hello!',
        false,
        false
      ]);

      expect(result.rows[0].direction).toBe('in');
      expect(result.rows[0].text).toBe('Hello!');
      expect(result.rows[0].read).toBe(false);
      expect(result.rows[0].sent_by_ai).toBe(false);
    });

    it('should insert outgoing message with AI flag', async () => {
      const result = await pool.query(`
        INSERT INTO messages (
          user_id, conversation_id, fan_id, direction,
          text, sent_by_ai
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        testUserId,
        testConversationId,
        testFanId,
        'out',
        'Thanks for your message!',
        true
      ]);

      expect(result.rows[0].direction).toBe('out');
      expect(result.rows[0].sent_by_ai).toBe(true);
    });

    it('should store PPV message with price', async () => {
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
        'Exclusive content',
        1999,
        JSON.stringify([{ id: 'img1', type: 'image', url: 'https://example.com/img.jpg' }])
      ]);

      expect(result.rows[0].price_cents).toBe(1999);
      expect(result.rows[0].attachments).toBeDefined();
    });

    it('should cascade delete when conversation is deleted', async () => {
      // Create temp conversation and message
      const fanResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [testUserId, 'Temp Msg Fan', 'fansly', 'temp_msg_fan']
      );
      const tempFanId = fanResult.rows[0].id;

      const convResult = await pool.query(
        'INSERT INTO conversations (user_id, fan_id, platform) VALUES ($1, $2, $3) RETURNING id',
        [testUserId, tempFanId, 'fansly']
      );
      const tempConvId = convResult.rows[0].id;

      await pool.query(
        'INSERT INTO messages (user_id, conversation_id, fan_id, direction, text) VALUES ($1, $2, $3, $4, $5)',
        [testUserId, tempConvId, tempFanId, 'in', 'Test']
      );

      // Delete conversation
      await pool.query('DELETE FROM conversations WHERE id = $1', [tempConvId]);

      // Check message is deleted
      const msgResult = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1',
        [tempConvId]
      );

      expect(msgResult.rows).toHaveLength(0);

      // Cleanup
      await pool.query('DELETE FROM fans WHERE id = $1', [tempFanId]);
    });
  });

  describe('Campaigns Table', () => {
    it('should insert campaign with all fields', async () => {
      const result = await pool.query(`
        INSERT INTO campaigns (
          user_id, name, type, status, template,
          target_audience, metrics
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        'Welcome Campaign',
        'welcome',
        'active',
        JSON.stringify({ message: 'Welcome!' }),
        JSON.stringify({ tags: ['new'] }),
        JSON.stringify({ sent: 0, delivered: 0 })
      ]);

      expect(result.rows[0].name).toBe('Welcome Campaign');
      expect(result.rows[0].type).toBe('welcome');
      expect(result.rows[0].status).toBe('active');
    });

    it('should have default status of draft', async () => {
      const result = await pool.query(`
        INSERT INTO campaigns (user_id, name, type)
        VALUES ($1, $2, $3)
        RETURNING status
      `, [testUserId, 'Draft Campaign', 'custom']);

      expect(result.rows[0].status).toBe('draft');
    });
  });

  describe('Platform Connections Table', () => {
    it('should insert platform connection', async () => {
      const result = await pool.query(`
        INSERT INTO platform_connections (
          user_id, platform, access_token, refresh_token,
          platform_user_id, platform_username, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        testUserId,
        'onlyfans',
        'access_token_123',
        'refresh_token_456',
        'of_user_789',
        'creator123',
        'active'
      ]);

      expect(result.rows[0].platform).toBe('onlyfans');
      expect(result.rows[0].status).toBe('active');
    });

    it('should enforce unique constraint on user_id and platform', async () => {
      await expect(
        pool.query(`
          INSERT INTO platform_connections (user_id, platform)
          VALUES ($1, $2)
        `, [testUserId, 'onlyfans'])
      ).rejects.toThrow();
    });

    it('should have default status of active', async () => {
      const result = await pool.query(`
        INSERT INTO platform_connections (user_id, platform)
        VALUES ($1, $2)
        RETURNING status
      `, [testUserId, 'tiktok']);

      expect(result.rows[0].status).toBe('active');
    });
  });

  describe('Quick Replies Table', () => {
    it('should insert quick reply template', async () => {
      const result = await pool.query(`
        INSERT INTO quick_replies (user_id, template, category, usage_count)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        testUserId,
        'Thanks for your message! 😊',
        'greeting',
        10
      ]);

      expect(result.rows[0].template).toBe('Thanks for your message! 😊');
      expect(result.rows[0].category).toBe('greeting');
      expect(result.rows[0].usage_count).toBe(10);
    });

    it('should have default usage_count of 0', async () => {
      const result = await pool.query(`
        INSERT INTO quick_replies (user_id, template, category)
        VALUES ($1, $2, $3)
        RETURNING usage_count
      `, [testUserId, 'New template', 'custom']);

      expect(result.rows[0].usage_count).toBe(0);
    });
  });

  describe('Analytics Events Table', () => {
    it('should insert analytics event', async () => {
      const result = await pool.query(`
        INSERT INTO analytics_events (user_id, event_type, event_data)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [
        testUserId,
        'message_sent',
        JSON.stringify({ platform: 'onlyfans', count: 1 })
      ]);

      expect(result.rows[0].event_type).toBe('message_sent');
      expect(result.rows[0].event_data).toBeDefined();
    });

    it('should allow null user_id for system events', async () => {
      const result = await pool.query(`
        INSERT INTO analytics_events (event_type, event_data)
        VALUES ($1, $2)
        RETURNING *
      `, ['system_startup', JSON.stringify({ version: '1.0' })]);

      expect(result.rows[0].user_id).toBeNull();
      expect(result.rows[0].event_type).toBe('system_startup');
    });
  });

  describe('Indexes', () => {
    it('should have index on user_profiles.user_id', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname = 'idx_user_profiles_user_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on fans.user_id', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'fans' 
        AND indexname = 'idx_fans_user_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have index on messages.conversation_id', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'messages' 
        AND indexname = 'idx_messages_conversation_id'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should have partial index on conversations.unread_count', async () => {
      const result = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'conversations' 
        AND indexname = 'idx_conversations_unread'
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexdef).toContain('WHERE');
    });
  });

  describe('Triggers', () => {
    it('should auto-update updated_at on user_profiles', async () => {
      // Delete existing profile if any
      await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [testUserId]);
      
      // Insert profile
      const insertResult = await pool.query(
        'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2) RETURNING created_at, updated_at',
        [testUserId, 'Trigger Test']
      );

      const originalUpdatedAt = insertResult.rows[0].updated_at;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update profile
      await pool.query(
        'UPDATE user_profiles SET display_name = $1 WHERE user_id = $2',
        ['Updated Name', testUserId]
      );

      // Check updated_at changed
      const selectResult = await pool.query(
        'SELECT updated_at FROM user_profiles WHERE user_id = $1',
        [testUserId]
      );

      const newUpdatedAt = selectResult.rows[0].updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    it('should auto-update updated_at on fans', async () => {
      // Insert fan
      const insertResult = await pool.query(
        'INSERT INTO fans (user_id, name, platform, platform_id) VALUES ($1, $2, $3, $4) RETURNING id, updated_at',
        [testUserId, 'Trigger Fan', 'onlyfans', 'trigger_fan']
      );

      const fanId = insertResult.rows[0].id;
      const originalUpdatedAt = insertResult.rows[0].updated_at;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update fan
      await pool.query(
        'UPDATE fans SET name = $1 WHERE id = $2',
        ['Updated Fan Name', fanId]
      );

      // Check updated_at changed
      const selectResult = await pool.query(
        'SELECT updated_at FROM fans WHERE id = $1',
        [fanId]
      );

      const newUpdatedAt = selectResult.rows[0].updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  describe('Table Comments', () => {
    it('should have comment on user_profiles table', async () => {
      const result = await pool.query(`
        SELECT obj_description('user_profiles'::regclass) as comment
      `);

      expect(result.rows[0].comment).toContain('Extended user profile data');
    });

    it('should have comment on fans table', async () => {
      const result = await pool.query(`
        SELECT obj_description('fans'::regclass) as comment
      `);

      expect(result.rows[0].comment).toContain('Fans/subscribers');
    });

    it('should have comment on messages table', async () => {
      const result = await pool.query(`
        SELECT obj_description('messages'::regclass) as comment
      `);

      expect(result.rows[0].comment).toContain('Individual messages');
    });
  });
});
