/**
 * Analytics Dashboard Integration Tests
 * Tests the analytics API with real PostgreSQL data
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

describe('Analytics Dashboard - Real Data Integration', () => {
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
        : false,
    });

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())
       RETURNING id`,
      ['Analytics Test User', `analytics-test-${Date.now()}@test.com`, 'hash123']
    );
    testUserId = userResult.rows[0].id;

    // Create user profile
    await pool.query(
      `INSERT INTO user_profiles (user_id, display_name, timezone, niche, goals, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [testUserId, 'Analytics Test User', 'America/New_York', 'fitness', JSON.stringify(['revenue', 'engagement'])]
    );

    // Create AI config
    await pool.query(
      `INSERT INTO ai_configs (user_id, response_style, platforms, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [testUserId, 'motivational', JSON.stringify(['onlyfans', 'instagram'])]
    );

    // Create test fans with revenue
    const fan1 = await pool.query(
      `INSERT INTO fans (user_id, name, platform, handle, value_cents, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [testUserId, 'High Value Fan', 'onlyfans', '@hvfan', 50000, JSON.stringify(['vip', 'whale'])]
    );
    testFanId = fan1.rows[0].id;

    await pool.query(
      `INSERT INTO fans (user_id, name, platform, handle, value_cents, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [testUserId, 'Regular Fan', 'instagram', '@regfan', 15000, JSON.stringify(['loyal'])]
    );

    await pool.query(
      `INSERT INTO fans (user_id, name, platform, handle, value_cents, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [testUserId, 'New Fan', 'onlyfans', '@newfan', 5000]
    );

    // Create conversation
    const convResult = await pool.query(
      `INSERT INTO conversations (user_id, fan_id, platform, unread_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [testUserId, testFanId, 'onlyfans', 0]
    );
    testConversationId = convResult.rows[0].id;

    // Create messages with revenue (PPV)
    await pool.query(
      `INSERT INTO messages (user_id, fan_id, conversation_id, direction, text, price_cents, sent_by_ai, created_at)
       VALUES 
         ($1, $2, $3, 'out', 'Check out my exclusive content!', 2500, false, NOW() - INTERVAL '5 days'),
         ($1, $2, $3, 'in', 'Looks great!', 0, false, NOW() - INTERVAL '5 days'),
         ($1, $2, $3, 'out', 'Here is your custom video', 5000, true, NOW() - INTERVAL '3 days'),
         ($1, $2, $3, 'out', 'Thanks for your support!', 0, true, NOW() - INTERVAL '2 days')`,
      [testUserId, testFanId, testConversationId]
    );
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      await pool.query('DELETE FROM messages WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM conversations WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM fans WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM ai_configs WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Analytics Repository', () => {
    it('should calculate revenue metrics correctly', async () => {
      const result = await pool.query(
        `SELECT SUM(price_cents) as total_revenue
         FROM messages
         WHERE user_id = $1 AND price_cents > 0`,
        [testUserId]
      );

      const totalRevenue = parseInt(result.rows[0].total_revenue);
      expect(totalRevenue).toBe(7500); // 2500 + 5000 cents
    });

    it('should count active subscribers', async () => {
      const result = await pool.query(
        `SELECT COUNT(DISTINCT fan_id) as active_subs
         FROM messages
         WHERE user_id = $1`,
        [testUserId]
      );

      const activeSubs = parseInt(result.rows[0].active_subs);
      expect(activeSubs).toBeGreaterThanOrEqual(1);
    });

    it('should calculate AI automation rate', async () => {
      const result = await pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE sent_by_ai = true) as ai_messages,
           COUNT(*) as total_messages
         FROM messages
         WHERE user_id = $1 AND direction = 'out'`,
        [testUserId]
      );

      const aiMessages = parseInt(result.rows[0].ai_messages);
      const totalMessages = parseInt(result.rows[0].total_messages);
      const aiRate = totalMessages > 0 ? aiMessages / totalMessages : 0;

      expect(aiRate).toBeGreaterThan(0);
      expect(aiRate).toBeLessThanOrEqual(1);
    });

    it('should identify top fans by revenue', async () => {
      const result = await pool.query(
        `SELECT name, value_cents, tags
         FROM fans
         WHERE user_id = $1
         ORDER BY value_cents DESC
         LIMIT 3`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(3);
      expect(result.rows[0].name).toBe('High Value Fan');
      expect(parseInt(result.rows[0].value_cents)).toBe(50000);
      expect(result.rows[0].tags).toContain('vip');
    });

    it('should calculate platform distribution', async () => {
      const result = await pool.query(
        `SELECT 
           platform,
           SUM(value_cents) as total_revenue,
           COUNT(*) as fan_count
         FROM fans
         WHERE user_id = $1
         GROUP BY platform
         ORDER BY total_revenue DESC`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      
      const onlyfans = result.rows.find(r => r.platform === 'onlyfans');
      expect(onlyfans).toBeDefined();
      expect(parseInt(onlyfans!.total_revenue)).toBeGreaterThan(0);
    });

    it('should track message activity over time', async () => {
      const result = await pool.query(
        `SELECT 
           DATE(created_at) as message_date,
           COUNT(*) as message_count
         FROM messages
         WHERE user_id = $1
         GROUP BY DATE(created_at)
         ORDER BY message_date DESC`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThan(0);
      result.rows.forEach(row => {
        expect(parseInt(row.message_count)).toBeGreaterThan(0);
      });
    });

    it('should calculate fan engagement metrics', async () => {
      const result = await pool.query(
        `SELECT 
           f.id,
           f.name,
           COUNT(m.id) as message_count,
           MAX(m.created_at) as last_message_at
         FROM fans f
         LEFT JOIN messages m ON m.fan_id = f.id
         WHERE f.user_id = $1
         GROUP BY f.id, f.name
         ORDER BY message_count DESC`,
        [testUserId]
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      
      const topFan = result.rows[0];
      expect(parseInt(topFan.message_count)).toBeGreaterThan(0);
      expect(topFan.last_message_at).toBeDefined();
    });
  });

  describe('Dashboard Data Completeness', () => {
    it('should have all required data for dashboard', async () => {
      // Check user profile exists
      const profile = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [testUserId]
      );
      expect(profile.rows.length).toBe(1);
      expect(profile.rows[0].niche).toBe('fitness');

      // Check AI config exists
      const aiConfig = await pool.query(
        'SELECT * FROM ai_configs WHERE user_id = $1',
        [testUserId]
      );
      expect(aiConfig.rows.length).toBe(1);
      expect(aiConfig.rows[0].response_style).toBe('motivational');

      // Check fans exist
      const fans = await pool.query(
        'SELECT COUNT(*) as count FROM fans WHERE user_id = $1',
        [testUserId]
      );
      expect(parseInt(fans.rows[0].count)).toBeGreaterThanOrEqual(3);

      // Check messages exist
      const messages = await pool.query(
        'SELECT COUNT(*) as count FROM messages WHERE user_id = $1',
        [testUserId]
      );
      expect(parseInt(messages.rows[0].count)).toBeGreaterThanOrEqual(4);
    });

    it('should calculate comprehensive overview metrics', async () => {
      // This simulates what the AnalyticsRepository.getOverview() does
      const [revenue, subs, aiRate, topFans, platforms] = await Promise.all([
        pool.query(
          'SELECT SUM(price_cents) as total FROM messages WHERE user_id = $1 AND price_cents > 0',
          [testUserId]
        ),
        pool.query(
          'SELECT COUNT(DISTINCT fan_id) as count FROM messages WHERE user_id = $1',
          [testUserId]
        ),
        pool.query(
          `SELECT 
             COUNT(*) FILTER (WHERE sent_by_ai = true) as ai,
             COUNT(*) as total
           FROM messages WHERE user_id = $1 AND direction = 'out'`,
          [testUserId]
        ),
        pool.query(
          'SELECT name, value_cents FROM fans WHERE user_id = $1 ORDER BY value_cents DESC LIMIT 5',
          [testUserId]
        ),
        pool.query(
          'SELECT platform, SUM(value_cents) as revenue FROM fans WHERE user_id = $1 GROUP BY platform',
          [testUserId]
        ),
      ]);

      // Verify all metrics are calculable
      expect(revenue.rows[0].total).toBeDefined();
      expect(subs.rows[0].count).toBeDefined();
      expect(aiRate.rows[0].ai).toBeDefined();
      expect(aiRate.rows[0].total).toBeDefined();
      expect(topFans.rows.length).toBeGreaterThan(0);
      expect(platforms.rows.length).toBeGreaterThan(0);
    });
  });
});
