/**
 * Unit Tests - Analytics Snapshots Repository
 * 
 * Tests for the analytics snapshots database repository
 * Based on: .kiro/specs/advanced-analytics/tasks.md (Task 2.1)
 * 
 * Coverage:
 * - Create/update snapshots (upsert)
 * - Query by user and time range
 * - Get latest snapshot
 * - Aggregate metrics
 * - Platform breakdown
 * - Data retention
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database pool BEFORE importing repository
const mockQuery = vi.fn();
vi.mock('../../../../lib/db', () => ({
  getPool: vi.fn(() => ({
    query: mockQuery,
  })),
}));

// Import repository AFTER mock
import { AnalyticsSnapshotsRepository } from '../../../../lib/db/repositories/analyticsSnapshotsRepository';

describe('AnalyticsSnapshotsRepository', () => {
  let repository: AnalyticsSnapshotsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AnalyticsSnapshotsRepository();
  });

  describe('create()', () => {
    it('should create a new snapshot', async () => {
      const params = {
        userId: 1,
        platform: 'tiktok' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 1000,
        engagement: 5000,
        posts: 50,
        reach: 10000,
        impressions: 15000,
        metadata: { custom: 'data' },
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-31',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 10000,
            impressions: 15000,
            metadata: { custom: 'data' },
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      const result = await repository.create(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO analytics_snapshots'),
        expect.arrayContaining([
          1,
          'tiktok',
          params.snapshotDate,
          1000,
          5000,
          50,
          10000,
          15000,
          JSON.stringify({ custom: 'data' }),
        ])
      );

      expect(result).toEqual({
        id: 1,
        userId: 1,
        platform: 'tiktok',
        snapshotDate: expect.any(Date),
        followers: 1000,
        engagement: 5000,
        posts: 50,
        reach: 10000,
        impressions: 15000,
        metadata: { custom: 'data' },
        createdAt: expect.any(Date),
      });
    });

    it('should upsert on conflict', async () => {
      const params = {
        userId: 1,
        platform: 'instagram' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 2000,
        engagement: 8000,
        posts: 75,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            user_id: 1,
            platform: 'instagram',
            snapshot_date: '2025-10-31',
            followers: 2000,
            engagement: 8000,
            posts: 75,
            reach: 0,
            impressions: 0,
            metadata: null,
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      await repository.create(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (user_id, platform, snapshot_date)'),
        expect.any(Array)
      );
    });

    it('should handle optional fields', async () => {
      const params = {
        userId: 1,
        platform: 'reddit' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 500,
        engagement: 2000,
        posts: 25,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            user_id: 1,
            platform: 'reddit',
            snapshot_date: '2025-10-31',
            followers: 500,
            engagement: 2000,
            posts: 25,
            reach: 0,
            impressions: 0,
            metadata: null,
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      const result = await repository.create(params);

      expect(result.reach).toBe(0);
      expect(result.impressions).toBe(0);
      expect(result.metadata).toBeNull();
    });

    it('should handle null metadata', async () => {
      const params = {
        userId: 1,
        platform: 'tiktok' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 1000,
        engagement: 5000,
        posts: 50,
        metadata: undefined,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-31',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 0,
            impressions: 0,
            metadata: null,
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      await repository.create(params);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null])
      );
    });
  });

  describe('findByUserAndTimeRange()', () => {
    it('should find snapshots by user and time range', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-15',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 10000,
            impressions: 15000,
            metadata: null,
            created_at: '2025-10-15T00:00:00Z',
          },
          {
            id: 2,
            user_id: 1,
            platform: 'instagram',
            snapshot_date: '2025-10-20',
            followers: 2000,
            engagement: 8000,
            posts: 75,
            reach: 20000,
            impressions: 30000,
            metadata: null,
            created_at: '2025-10-20T00:00:00Z',
          },
        ],
      });

      const results = await repository.findByUserAndTimeRange(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [userId, timeRange.startDate, timeRange.endDate]
      );

      expect(results).toHaveLength(2);
      expect(results[0].platform).toBe('tiktok');
      expect(results[1].platform).toBe('instagram');
    });

    it('should filter by platform when provided', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };
      const platform = 'tiktok';

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-15',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 10000,
            impressions: 15000,
            metadata: null,
            created_at: '2025-10-15T00:00:00Z',
          },
        ],
      });

      const results = await repository.findByUserAndTimeRange(userId, timeRange, platform);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND platform = $4'),
        [userId, timeRange.startDate, timeRange.endDate, platform]
      );

      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe('tiktok');
    });

    it('should return empty array when no snapshots found', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await repository.findByUserAndTimeRange(userId, timeRange);

      expect(results).toEqual([]);
    });

    it('should order by snapshot_date DESC and platform ASC', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.findByUserAndTimeRange(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY snapshot_date DESC, platform ASC'),
        expect.any(Array)
      );
    });
  });

  describe('getLatest()', () => {
    it('should get latest snapshot for user and platform', async () => {
      const userId = 1;
      const platform = 'tiktok';

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-31',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 10000,
            impressions: 15000,
            metadata: null,
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      const result = await repository.getLatest(userId, platform);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY snapshot_date DESC'),
        [userId, platform]
      );

      expect(result).not.toBeNull();
      expect(result?.platform).toBe('tiktok');
      expect(result?.followers).toBe(1000);
    });

    it('should return null when no snapshot found', async () => {
      const userId = 1;
      const platform = 'instagram';

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getLatest(userId, platform);

      expect(result).toBeNull();
    });

    it('should limit to 1 result', async () => {
      const userId = 1;
      const platform = 'reddit';

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.getLatest(userId, platform);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
        expect.any(Array)
      );
    });
  });

  describe('getAggregatedMetrics()', () => {
    it('should aggregate metrics across all platforms', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_followers: '5000',
            total_engagement: '20000',
            total_posts: '150',
            total_reach: '50000',
            total_impressions: '75000',
          },
        ],
      });

      const result = await repository.getAggregatedMetrics(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SUM(followers)'),
        [userId, timeRange.startDate, timeRange.endDate]
      );

      expect(result).toEqual({
        totalFollowers: 5000,
        totalEngagement: 20000,
        totalPosts: 150,
        totalReach: 50000,
        totalImpressions: 75000,
      });
    });

    it('should parse string values to integers', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_followers: '1234',
            total_engagement: '5678',
            total_posts: '90',
            total_reach: '12345',
            total_impressions: '67890',
          },
        ],
      });

      const result = await repository.getAggregatedMetrics(userId, timeRange);

      expect(typeof result.totalFollowers).toBe('number');
      expect(typeof result.totalEngagement).toBe('number');
      expect(typeof result.totalPosts).toBe('number');
      expect(typeof result.totalReach).toBe('number');
      expect(typeof result.totalImpressions).toBe('number');
    });

    it('should handle zero values', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_followers: '0',
            total_engagement: '0',
            total_posts: '0',
            total_reach: '0',
            total_impressions: '0',
          },
        ],
      });

      const result = await repository.getAggregatedMetrics(userId, timeRange);

      expect(result.totalFollowers).toBe(0);
      expect(result.totalEngagement).toBe(0);
      expect(result.totalPosts).toBe(0);
    });

    it('should use COALESCE for null values', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_followers: '0',
            total_engagement: '0',
            total_posts: '0',
            total_reach: '0',
            total_impressions: '0',
          },
        ],
      });

      await repository.getAggregatedMetrics(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(SUM(followers), 0)'),
        expect.any(Array)
      );
    });
  });

  describe('getPlatformBreakdown()', () => {
    it('should get platform breakdown', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            platform: 'tiktok',
            followers: '1000',
            engagement: '5000',
            posts: '50',
            reach: '10000',
            impressions: '15000',
          },
          {
            platform: 'instagram',
            followers: '2000',
            engagement: '8000',
            posts: '75',
            reach: '20000',
            impressions: '30000',
          },
          {
            platform: 'reddit',
            followers: '500',
            engagement: '2000',
            posts: '25',
            reach: '5000',
            impressions: '7500',
          },
        ],
      });

      const result = await repository.getPlatformBreakdown(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY platform'),
        [userId, timeRange.startDate, timeRange.endDate]
      );

      expect(result).toHaveLength(3);
      expect(result[0].platform).toBe('tiktok');
      expect(result[1].platform).toBe('instagram');
      expect(result[2].platform).toBe('reddit');
    });

    it('should parse numeric values correctly', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            platform: 'tiktok',
            followers: '1234',
            engagement: '5678',
            posts: '90',
            reach: '12345',
            impressions: '67890',
          },
        ],
      });

      const result = await repository.getPlatformBreakdown(userId, timeRange);

      expect(result[0].followers).toBe(1234);
      expect(result[0].engagement).toBe(5678);
      expect(result[0].posts).toBe(90);
      expect(result[0].reach).toBe(12345);
      expect(result[0].impressions).toBe(67890);
    });

    it('should order by platform', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.getPlatformBreakdown(userId, timeRange);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY platform'),
        expect.any(Array)
      );
    });

    it('should return empty array when no data', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getPlatformBreakdown(userId, timeRange);

      expect(result).toEqual([]);
    });
  });

  describe('deleteOlderThan()', () => {
    it('should delete old snapshots', async () => {
      const olderThan = new Date('2024-01-01');

      mockQuery.mockResolvedValueOnce({ rowCount: 150 });

      const result = await repository.deleteOlderThan(olderThan);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM analytics_snapshots WHERE snapshot_date < $1',
        [olderThan]
      );

      expect(result).toBe(150);
    });

    it('should return 0 when no rows deleted', async () => {
      const olderThan = new Date('2024-01-01');

      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await repository.deleteOlderThan(olderThan);

      expect(result).toBe(0);
    });

    it('should handle null rowCount', async () => {
      const olderThan = new Date('2024-01-01');

      mockQuery.mockResolvedValueOnce({ rowCount: null });

      const result = await repository.deleteOlderThan(olderThan);

      expect(result).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors', async () => {
      const params = {
        userId: 1,
        platform: 'tiktok' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 1000,
        engagement: 5000,
        posts: 50,
      };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.create(params)).rejects.toThrow('Database error');
    });

    it('should handle malformed date strings', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: 'invalid-date',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 10000,
            impressions: 15000,
            metadata: null,
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      const results = await repository.findByUserAndTimeRange(userId, timeRange);

      expect(results[0].snapshotDate).toBeInstanceOf(Date);
    });

    it('should handle large numeric values', async () => {
      const userId = 1;
      const timeRange = {
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-31'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_followers: '999999999',
            total_engagement: '888888888',
            total_posts: '777777',
            total_reach: '666666666',
            total_impressions: '555555555',
          },
        ],
      });

      const result = await repository.getAggregatedMetrics(userId, timeRange);

      expect(result.totalFollowers).toBe(999999999);
      expect(result.totalEngagement).toBe(888888888);
    });

    it('should handle JSON metadata parsing', async () => {
      const params = {
        userId: 1,
        platform: 'tiktok' as const,
        snapshotDate: new Date('2025-10-31'),
        followers: 1000,
        engagement: 5000,
        posts: 50,
        metadata: { nested: { data: 'value' } },
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            platform: 'tiktok',
            snapshot_date: '2025-10-31',
            followers: 1000,
            engagement: 5000,
            posts: 50,
            reach: 0,
            impressions: 0,
            metadata: { nested: { data: 'value' } },
            created_at: '2025-10-31T00:00:00Z',
          },
        ],
      });

      const result = await repository.create(params);

      expect(result.metadata).toEqual({ nested: { data: 'value' } });
    });
  });
});
