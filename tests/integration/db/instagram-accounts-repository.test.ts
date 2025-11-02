/**
 * Integration Tests - Instagram Accounts Repository
 * 
 * Integration tests for InstagramAccountsRepository with real database
 * 
 * Coverage:
 * - Real database operations
 * - Constraint validation
 * - Upsert behavior
 * - Foreign key relationships
 * - Transaction handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getPool } from '../../../lib/db';
import { InstagramAccountsRepository } from '../../../lib/db/repositories/instagramAccountsRepository';
import type { Pool } from 'pg';

describe('Instagram Accounts Repository - Integration', () => {
  let pool: Pool;
  let repository: InstagramAccountsRepository;
  let testUserId: number;
  let testOauthAccountId: number;

  beforeAll(async () => {
    pool = getPool();
    repository = new InstagramAccountsRepository();

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, name, password_hash, email_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['test-ig-accounts@example.com', 'Test User', 'hash', true]
    );
    testUserId = userResult.rows[0].id;

    // Create test oauth account
    const oauthResult = await pool.query(
      `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [testUserId, 'instagram', 'ig_user_123', 'access_token', 'refresh_token']
    );
    testOauthAccountId = oauthResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM instagram_accounts WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM oauth_accounts WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(async () => {
    // Clean up instagram accounts before each test
    await pool.query('DELETE FROM instagram_accounts WHERE user_id = $1', [testUserId]);
  });

  describe('create() - Real Database', () => {
    it('should create Instagram account in database', async () => {
      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_integration_1',
        pageId: 'page_integration_1',
        username: 'integration_test_user',
        accessLevel: 'MANAGE',
        metadata: { followers: 1000 },
      };

      const result = await repository.create(accountData);

      expect(result).toBeDefined();
      expect(result.id).toBeGreaterThan(0);
      expect(result.user_id).toBe(testUserId);
      expect(result.oauth_account_id).toBe(testOauthAccountId);
      expect(result.ig_business_id).toBe('ig_business_integration_1');
      expect(result.page_id).toBe('page_integration_1');
      expect(result.username).toBe('integration_test_user');
      expect(result.access_level).toBe('MANAGE');
      expect(result.metadata).toEqual({ followers: 1000 });
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify in database
      const dbResult = await pool.query(
        'SELECT * FROM instagram_accounts WHERE id = $1',
        [result.id]
      );
      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].username).toBe('integration_test_user');
    });

    it('should handle upsert on conflict (update existing)', async () => {
      const initialData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_upsert',
        pageId: 'page_initial',
        username: 'initial_username',
        accessLevel: 'VIEW',
        metadata: { followers: 500 },
      };

      // Create initial account
      const initial = await repository.create(initialData);
      expect(initial.username).toBe('initial_username');
      expect(initial.page_id).toBe('page_initial');

      // Update with same user_id and ig_business_id
      const updatedData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_upsert', // Same business ID
        pageId: 'page_updated',
        username: 'updated_username',
        accessLevel: 'MANAGE',
        metadata: { followers: 2000 },
      };

      const updated = await repository.create(updatedData);

      // Should have same ID (updated, not created new)
      expect(updated.id).toBe(initial.id);
      expect(updated.username).toBe('updated_username');
      expect(updated.page_id).toBe('page_updated');
      expect(updated.access_level).toBe('MANAGE');
      expect(updated.metadata).toEqual({ followers: 2000 });

      // Verify only one record exists
      const dbResult = await pool.query(
        'SELECT * FROM instagram_accounts WHERE user_id = $1 AND ig_business_id = $2',
        [testUserId, 'ig_business_upsert']
      );
      expect(dbResult.rows).toHaveLength(1);
    });

    it('should enforce foreign key constraint on user_id', async () => {
      const invalidData = {
        userId: 999999, // Non-existent user
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_invalid',
        pageId: 'page_invalid',
        username: 'invalid_user',
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should enforce foreign key constraint on oauth_account_id', async () => {
      const invalidData = {
        userId: testUserId,
        oauthAccountId: 999999, // Non-existent oauth account
        igBusinessId: 'ig_business_invalid',
        pageId: 'page_invalid',
        username: 'invalid_oauth',
      };

      await expect(repository.create(invalidData)).rejects.toThrow();
    });

    it('should store metadata as JSONB', async () => {
      const complexMetadata = {
        followers: 5000,
        following: 200,
        posts: 150,
        verified: true,
        bio: 'Test bio with émojis 🎉',
        profile_pic_url: 'https://example.com/pic.jpg',
        nested: {
          data: {
            value: 'test',
          },
        },
      };

      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_jsonb',
        pageId: 'page_jsonb',
        username: 'jsonb_test',
        metadata: complexMetadata,
      };

      const result = await repository.create(accountData);

      expect(result.metadata).toEqual(complexMetadata);

      // Verify JSONB storage in database
      const dbResult = await pool.query(
        'SELECT metadata FROM instagram_accounts WHERE id = $1',
        [result.id]
      );
      expect(dbResult.rows[0].metadata).toEqual(complexMetadata);
    });

    it('should handle null metadata', async () => {
      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_null_meta',
        pageId: 'page_null_meta',
        username: 'null_meta_user',
      };

      const result = await repository.create(accountData);

      expect(result.metadata).toBeNull();

      // Verify in database
      const dbResult = await pool.query(
        'SELECT metadata FROM instagram_accounts WHERE id = $1',
        [result.id]
      );
      expect(dbResult.rows[0].metadata).toBeNull();
    });

    it('should set timestamps correctly', async () => {
      const beforeCreate = new Date();

      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_timestamps',
        pageId: 'page_timestamps',
        username: 'timestamp_user',
      };

      const result = await repository.create(accountData);

      const afterCreate = new Date();

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should update updated_at on upsert', async () => {
      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_update_time',
        pageId: 'page_update_time',
        username: 'update_time_user',
      };

      // Create initial
      const initial = await repository.create(accountData);
      const initialUpdatedAt = initial.updated_at;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update
      const updated = await repository.create({
        ...accountData,
        username: 'updated_time_user',
      });

      expect(updated.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('findByUser() - Real Database', () => {
    it('should find all accounts for a user', async () => {
      // Create multiple accounts
      const account1 = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_find_1',
        pageId: 'page_find_1',
        username: 'find_user_1',
      });

      const account2 = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_find_2',
        pageId: 'page_find_2',
        username: 'find_user_2',
      });

      const results = await repository.findByUser(testUserId);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.id)).toContain(account1.id);
      expect(results.map(r => r.id)).toContain(account2.id);
      expect(results.map(r => r.username)).toContain('find_user_1');
      expect(results.map(r => r.username)).toContain('find_user_2');
    });

    it('should return empty array for user with no accounts', async () => {
      // Create another user without accounts
      const userResult = await pool.query(
        `INSERT INTO users (email, name, password_hash, email_verified)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['no-accounts@example.com', 'No Accounts User', 'hash', true]
      );
      const noAccountsUserId = userResult.rows[0].id;

      try {
        const results = await repository.findByUser(noAccountsUserId);
        expect(results).toEqual([]);
        expect(results).toHaveLength(0);
      } finally {
        await pool.query('DELETE FROM users WHERE id = $1', [noAccountsUserId]);
      }
    });

    it('should return accounts with all fields populated', async () => {
      const accountData = {
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_full_fields',
        pageId: 'page_full_fields',
        username: 'full_fields_user',
        accessLevel: 'MANAGE',
        metadata: { followers: 3000, verified: true },
      };

      await repository.create(accountData);

      const results = await repository.findByUser(testUserId);

      expect(results.length).toBeGreaterThan(0);
      const account = results.find(r => r.username === 'full_fields_user');
      expect(account).toBeDefined();
      expect(account!.id).toBeGreaterThan(0);
      expect(account!.user_id).toBe(testUserId);
      expect(account!.oauth_account_id).toBe(testOauthAccountId);
      expect(account!.ig_business_id).toBe('ig_business_full_fields');
      expect(account!.page_id).toBe('page_full_fields');
      expect(account!.username).toBe('full_fields_user');
      expect(account!.access_level).toBe('MANAGE');
      expect(account!.metadata).toEqual({ followers: 3000, verified: true });
      expect(account!.created_at).toBeInstanceOf(Date);
      expect(account!.updated_at).toBeInstanceOf(Date);
    });

    it('should preserve metadata structure', async () => {
      const complexMetadata = {
        followers: 10000,
        following: 500,
        posts: 200,
        verified: true,
        bio: 'Complex bio',
        nested: {
          level1: {
            level2: {
              value: 'deep',
            },
          },
        },
      };

      await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_complex_meta',
        pageId: 'page_complex_meta',
        username: 'complex_meta_user',
        metadata: complexMetadata,
      });

      const results = await repository.findByUser(testUserId);
      const account = results.find(r => r.username === 'complex_meta_user');

      expect(account!.metadata).toEqual(complexMetadata);
      expect(account!.metadata.nested.level1.level2.value).toBe('deep');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should support complete Instagram connection flow', async () => {
      // Step 1: User connects Instagram account
      const connectedAccount = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_flow',
        pageId: 'page_flow',
        username: 'flow_user',
        accessLevel: 'MANAGE',
        metadata: {
          followers: 1000,
          connected_at: new Date().toISOString(),
        },
      });

      expect(connectedAccount.id).toBeGreaterThan(0);

      // Step 2: Fetch user's accounts
      const accounts = await repository.findByUser(testUserId);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts.some(a => a.id === connectedAccount.id)).toBe(true);

      // Step 3: Update account metadata (e.g., after fetching new data)
      const updatedAccount = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_flow',
        pageId: 'page_flow',
        username: 'flow_user',
        accessLevel: 'MANAGE',
        metadata: {
          followers: 1500, // Updated
          last_sync: new Date().toISOString(),
        },
      });

      expect(updatedAccount.id).toBe(connectedAccount.id);
      expect(updatedAccount.metadata.followers).toBe(1500);

      // Step 4: Verify final state
      const finalAccounts = await repository.findByUser(testUserId);
      const finalAccount = finalAccounts.find(a => a.id === connectedAccount.id);
      expect(finalAccount!.metadata.followers).toBe(1500);
    });

    it('should handle multiple Instagram accounts per user', async () => {
      // User connects multiple Instagram business accounts
      const account1 = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_multi_1',
        pageId: 'page_multi_1',
        username: 'multi_account_1',
        accessLevel: 'MANAGE',
      });

      const account2 = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_multi_2',
        pageId: 'page_multi_2',
        username: 'multi_account_2',
        accessLevel: 'VIEW',
      });

      const account3 = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_multi_3',
        pageId: 'page_multi_3',
        username: 'multi_account_3',
        accessLevel: 'EDIT',
      });

      const allAccounts = await repository.findByUser(testUserId);

      expect(allAccounts.length).toBeGreaterThanOrEqual(3);
      expect(allAccounts.map(a => a.id)).toContain(account1.id);
      expect(allAccounts.map(a => a.id)).toContain(account2.id);
      expect(allAccounts.map(a => a.id)).toContain(account3.id);
    });

    it('should handle account reconnection (token refresh)', async () => {
      // Initial connection
      const initial = await repository.create({
        userId: testUserId,
        oauthAccountId: testOauthAccountId,
        igBusinessId: 'ig_business_reconnect',
        pageId: 'page_reconnect',
        username: 'reconnect_user',
        metadata: { token_version: 1 },
      });

      // Simulate token refresh - create new oauth account
      const newOauthResult = await pool.query(
        `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [testUserId, 'instagram', 'ig_user_reconnect', 'new_access_token', 'new_refresh_token']
      );
      const newOauthAccountId = newOauthResult.rows[0].id;

      // Update Instagram account with new oauth account
      const reconnected = await repository.create({
        userId: testUserId,
        oauthAccountId: newOauthAccountId,
        igBusinessId: 'ig_business_reconnect',
        pageId: 'page_reconnect',
        username: 'reconnect_user',
        metadata: { token_version: 2 },
      });

      expect(reconnected.id).toBe(initial.id);
      expect(reconnected.oauth_account_id).toBe(newOauthAccountId);
      expect(reconnected.metadata.token_version).toBe(2);

      // Clean up
      await pool.query('DELETE FROM oauth_accounts WHERE id = $1', [newOauthAccountId]);
    });
  });

  describe('Performance', () => {
    it('should handle bulk account creation efficiently', async () => {
      const startTime = Date.now();
      const accountCount = 10;

      for (let i = 0; i < accountCount; i++) {
        await repository.create({
          userId: testUserId,
          oauthAccountId: testOauthAccountId,
          igBusinessId: `ig_business_bulk_${i}`,
          pageId: `page_bulk_${i}`,
          username: `bulk_user_${i}`,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 5 seconds for 10 accounts)
      expect(duration).toBeLessThan(5000);

      // Verify all accounts were created
      const results = await repository.findByUser(testUserId);
      expect(results.length).toBeGreaterThanOrEqual(accountCount);
    });
  });
});
