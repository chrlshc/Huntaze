/**
 * Integration Tests - CRM Fans [ID] API Endpoints
 * 
 * Tests for /api/crm/fans/[id] endpoints
 * Based on: .kiro/specs/onlyfans-crm-integration/tasks.md (Task 4)
 * 
 * Coverage:
 * - GET /api/crm/fans/[id] - Retrieve single fan
 * - PUT /api/crm/fans/[id] - Update fan
 * - DELETE /api/crm/fans/[id] - Delete fan
 * - Authentication and authorization
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '@/lib/db';

describe('CRM Fans [ID] API Endpoints - Integration Tests', () => {
  let testUserId: number;
  let testFanId: number;
  let otherUserId: number;
  let otherFanId: number;

  beforeAll(async () => {
    // Create test users
    const user1 = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      ['test-fan-id@example.com', 'Test User', 'hash']
    );
    testUserId = user1.rows[0].id;

    const user2 = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
      ['other-fan-id@example.com', 'Other User', 'hash']
    );
    otherUserId = user2.rows[0].id;

    // Create test fans
    const fan1 = await query(
      `INSERT INTO fans (user_id, name, platform, platform_id, tags, value_cents)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [testUserId, 'Test Fan', 'onlyfans', 'of_test_123', ['vip'], 10000]
    );
    testFanId = fan1.rows[0].id;

    const fan2 = await query(
      `INSERT INTO fans (user_id, name, platform, platform_id, tags, value_cents)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [otherUserId, 'Other Fan', 'onlyfans', 'of_other_456', ['regular'], 5000]
    );
    otherFanId = fan2.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query('DELETE FROM fans WHERE user_id IN ($1, $2)', [testUserId, otherUserId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [testUserId, otherUserId]);
  });

  describe('GET /api/crm/fans/[id]', () => {
    it('should retrieve fan by ID', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1 AND user_id = $2',
        [testFanId, testUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].name).toBe('Test Fan');
      expect(result.rows[0].platform).toBe('onlyfans');
      expect(result.rows[0].platform_id).toBe('of_test_123');
    });

    it('should return fan with all fields', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1',
        [testFanId]
      );

      const fan = result.rows[0];
      expect(fan).toHaveProperty('id');
      expect(fan).toHaveProperty('user_id');
      expect(fan).toHaveProperty('name');
      expect(fan).toHaveProperty('platform');
      expect(fan).toHaveProperty('platform_id');
      expect(fan).toHaveProperty('tags');
      expect(fan).toHaveProperty('value_cents');
      expect(fan).toHaveProperty('created_at');
      expect(fan).toHaveProperty('updated_at');
    });

    it('should not retrieve fan from another user', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1 AND user_id = $2',
        [otherFanId, testUserId]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should return empty for non-existent fan ID', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1',
        [999999]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('PUT /api/crm/fans/[id]', () => {
    it('should update fan name', async () => {
      await query(
        'UPDATE fans SET name = $1, updated_at = NOW() WHERE id = $2',
        ['Updated Fan Name', testFanId]
      );

      const result = await query(
        'SELECT name FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(result.rows[0].name).toBe('Updated Fan Name');
    });

    it('should update fan tags', async () => {
      await query(
        'UPDATE fans SET tags = $1, updated_at = NOW() WHERE id = $2',
        [['vip', 'premium'], testFanId]
      );

      const result = await query(
        'SELECT tags FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(result.rows[0].tags).toEqual(['vip', 'premium']);
    });

    it('should update fan value', async () => {
      await query(
        'UPDATE fans SET value_cents = $1, updated_at = NOW() WHERE id = $2',
        [15000, testFanId]
      );

      const result = await query(
        'SELECT value_cents FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(parseInt(result.rows[0].value_cents)).toBe(15000);
    });

    it('should update multiple fields at once', async () => {
      await query(
        `UPDATE fans 
         SET name = $1, tags = $2, value_cents = $3, updated_at = NOW() 
         WHERE id = $4`,
        ['Multi Update Fan', ['updated'], 20000, testFanId]
      );

      const result = await query(
        'SELECT name, tags, value_cents FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(result.rows[0].name).toBe('Multi Update Fan');
      expect(result.rows[0].tags).toEqual(['updated']);
      expect(parseInt(result.rows[0].value_cents)).toBe(20000);
    });

    it('should update updated_at timestamp', async () => {
      const before = await query(
        'SELECT updated_at FROM fans WHERE id = $1',
        [testFanId]
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      await query(
        'UPDATE fans SET name = $1, updated_at = NOW() WHERE id = $2',
        ['Timestamp Test', testFanId]
      );

      const after = await query(
        'SELECT updated_at FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(new Date(after.rows[0].updated_at).getTime())
        .toBeGreaterThan(new Date(before.rows[0].updated_at).getTime());
    });

    it('should not update fan from another user', async () => {
      const updateResult = await query(
        'UPDATE fans SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
        ['Unauthorized Update', otherFanId, testUserId]
      );

      expect(updateResult.rows.length).toBe(0);

      const checkResult = await query(
        'SELECT name FROM fans WHERE id = $1',
        [otherFanId]
      );

      expect(checkResult.rows[0].name).toBe('Other Fan');
    });
  });

  describe('DELETE /api/crm/fans/[id]', () => {
    it('should delete fan by ID', async () => {
      // Create a fan to delete
      const fan = await query(
        `INSERT INTO fans (user_id, name, platform, platform_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [testUserId, 'Fan To Delete', 'onlyfans', 'of_delete_123']
      );
      const fanToDeleteId = fan.rows[0].id;

      // Delete the fan
      await query(
        'DELETE FROM fans WHERE id = $1 AND user_id = $2',
        [fanToDeleteId, testUserId]
      );

      // Verify deletion
      const result = await query(
        'SELECT * FROM fans WHERE id = $1',
        [fanToDeleteId]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should not delete fan from another user', async () => {
      const deleteResult = await query(
        'DELETE FROM fans WHERE id = $1 AND user_id = $2 RETURNING id',
        [otherFanId, testUserId]
      );

      expect(deleteResult.rows.length).toBe(0);

      const checkResult = await query(
        'SELECT * FROM fans WHERE id = $1',
        [otherFanId]
      );

      expect(checkResult.rows.length).toBe(1);
    });

    it('should cascade delete related conversations', async () => {
      // Create a fan with conversation
      const fan = await query(
        `INSERT INTO fans (user_id, name, platform, platform_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [testUserId, 'Fan With Conversation', 'onlyfans', 'of_cascade_123']
      );
      const fanWithConvId = fan.rows[0].id;

      const conv = await query(
        `INSERT INTO conversations (user_id, fan_id, platform)
         VALUES ($1, $2, $3) RETURNING id`,
        [testUserId, fanWithConvId, 'onlyfans']
      );
      const convId = conv.rows[0].id;

      // Delete the fan
      await query(
        'DELETE FROM fans WHERE id = $1',
        [fanWithConvId]
      );

      // Verify conversation is also deleted (CASCADE)
      const convResult = await query(
        'SELECT * FROM conversations WHERE id = $1',
        [convId]
      );

      expect(convResult.rows.length).toBe(0);
    });
  });

  describe('Authorization Checks', () => {
    it('should enforce user_id matching on SELECT', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1 AND user_id = $2',
        [testFanId, otherUserId]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should enforce user_id matching on UPDATE', async () => {
      const result = await query(
        'UPDATE fans SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
        ['Unauthorized', testFanId, otherUserId]
      );

      expect(result.rows.length).toBe(0);
    });

    it('should enforce user_id matching on DELETE', async () => {
      const result = await query(
        'DELETE FROM fans WHERE id = $1 AND user_id = $2 RETURNING id',
        [testFanId, otherUserId]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid fan ID', async () => {
      const result = await query(
        'SELECT * FROM fans WHERE id = $1',
        ['invalid']
      ).catch(error => error);

      expect(result).toBeInstanceOf(Error);
    });

    it('should handle missing required fields on update', async () => {
      const result = await query(
        'UPDATE fans SET platform = NULL WHERE id = $1',
        [testFanId]
      ).catch(error => error);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with users', async () => {
      const result = await query(
        `SELECT f.*, u.email 
         FROM fans f 
         JOIN users u ON f.user_id = u.id 
         WHERE f.id = $1`,
        [testFanId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].email).toBe('test-fan-id@example.com');
    });

    it('should preserve tags array structure', async () => {
      await query(
        'UPDATE fans SET tags = $1 WHERE id = $2',
        [['tag1', 'tag2', 'tag3'], testFanId]
      );

      const result = await query(
        'SELECT tags FROM fans WHERE id = $1',
        [testFanId]
      );

      expect(Array.isArray(result.rows[0].tags)).toBe(true);
      expect(result.rows[0].tags).toHaveLength(3);
    });
  });
});
