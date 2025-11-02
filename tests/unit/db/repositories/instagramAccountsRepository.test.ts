/**
 * Unit Tests - Instagram Accounts Repository
 * 
 * Tests for InstagramAccountsRepository
 * 
 * Coverage:
 * - Create Instagram account
 * - Upsert behavior (conflict handling)
 * - Find accounts by user
 * - Error handling
 * - Data validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock pg Pool
const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
};

// Mock getPool before importing repository
vi.mock('../../../../lib/db/index', () => ({
  getPool: () => mockPool,
}));

describe('InstagramAccountsRepository', () => {
  let InstagramAccountsRepository: any;
  let repository: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Dynamically import after mocks are set up
    const module = await import('../../../../lib/db/repositories/instagramAccountsRepository');
    InstagramAccountsRepository = module.InstagramAccountsRepository;
    repository = new InstagramAccountsRepository();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create()', () => {
    const validAccountData = {
      userId: 1,
      oauthAccountId: 100,
      igBusinessId: 'ig_business_123',
      pageId: 'page_456',
      username: 'test_user',
      accessLevel: 'MANAGE',
      metadata: { followers: 1000 },
    };

    it('should create a new Instagram account', async () => {
      const expectedAccount = {
        id: 1,
        user_id: 1,
        oauth_account_id: 100,
        ig_business_id: 'ig_business_123',
        page_id: 'page_456',
        username: 'test_user',
        access_level: 'MANAGE',
        metadata: { followers: 1000 },
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedAccount],
      });

      const result = await repository.create(validAccountData);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO instagram_accounts'),
        [
          validAccountData.userId,
          validAccountData.oauthAccountId,
          validAccountData.igBusinessId,
          validAccountData.pageId,
          validAccountData.username,
          validAccountData.accessLevel,
          JSON.stringify(validAccountData.metadata),
        ]
      );
      expect(result).toEqual(expectedAccount);
    });

    it('should handle upsert on conflict', async () => {
      const updatedAccount = {
        id: 1,
        user_id: 1,
        oauth_account_id: 101,
        ig_business_id: 'ig_business_123',
        page_id: 'page_789',
        username: 'updated_user',
        access_level: 'VIEW',
        metadata: { followers: 2000 },
        created_at: new Date('2024-01-01'),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [updatedAccount],
      });

      const result = await repository.create({
        ...validAccountData,
        oauthAccountId: 101,
        pageId: 'page_789',
        username: 'updated_user',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (user_id, ig_business_id) DO UPDATE SET'),
        expect.any(Array)
      );
      expect(result).toEqual(updatedAccount);
    });

    it('should serialize metadata as JSON', async () => {
      const dataWithMetadata = {
        ...validAccountData,
        metadata: {
          followers: 5000,
          verified: true,
        },
      };

      mockQuery.mockResolvedValue({
        rows: [{ id: 1 }],
      });

      await repository.create(dataWithMetadata);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          JSON.stringify(dataWithMetadata.metadata),
        ])
      );
    });

    it('should handle null metadata', async () => {
      const dataWithoutMetadata = {
        userId: 1,
        oauthAccountId: 100,
        igBusinessId: 'ig_business_123',
        pageId: 'page_456',
        username: 'test_user',
      };

      mockQuery.mockResolvedValue({
        rows: [{ id: 1, metadata: null }],
      });

      await repository.create(dataWithoutMetadata);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null])
      );
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.create(validAccountData)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('findByUser()', () => {
    it('should find all Instagram accounts for a user', async () => {
      const userId = 1;
      const expectedAccounts = [
        {
          id: 1,
          user_id: 1,
          oauth_account_id: 100,
          ig_business_id: 'ig_business_123',
          page_id: 'page_456',
          username: 'account_1',
          access_level: 'MANAGE',
          metadata: { followers: 1000 },
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          user_id: 1,
          oauth_account_id: 101,
          ig_business_id: 'ig_business_789',
          page_id: 'page_012',
          username: 'account_2',
          access_level: 'VIEW',
          metadata: { followers: 2000 },
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedAccounts,
      });

      const result = await repository.findByUser(userId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM instagram_accounts WHERE user_id = $1',
        [userId]
      );
      expect(result).toEqual(expectedAccounts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when user has no accounts', async () => {
      const userId = 999;

      mockQuery.mockResolvedValue({
        rows: [],
      });

      const result = await repository.findByUser(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValue(new Error('Database query failed'));

      await expect(repository.findByUser(1)).rejects.toThrow(
        'Database query failed'
      );
    });

    it('should preserve metadata structure', async () => {
      const userId = 1;
      const accountsWithMetadata = [
        {
          id: 1,
          user_id: 1,
          oauth_account_id: 100,
          ig_business_id: 'ig_business_123',
          page_id: 'page_456',
          username: 'account_1',
          access_level: 'MANAGE',
          metadata: {
            followers: 5000,
            verified: true,
          },
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: accountsWithMetadata,
      });

      const result = await repository.findByUser(userId);

      expect(result[0].metadata).toEqual({
        followers: 5000,
        verified: true,
      });
    });
  });
});
