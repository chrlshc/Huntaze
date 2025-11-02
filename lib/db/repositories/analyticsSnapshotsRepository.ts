/**
 * Analytics Snapshots Repository
 * 
 * Manages daily analytics snapshots:
 * - Create/update snapshots
 * - Query snapshots by time range
 * - Aggregate metrics across platforms
 */

import { getPool } from '../index';

export interface AnalyticsSnapshot {
  id: number;
  userId: number;
  platform: 'tiktok' | 'instagram' | 'reddit';
  snapshotDate: Date;
  followers: number;
  engagement: number;
  posts: number;
  reach: number;
  impressions: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateSnapshotParams {
  userId: number;
  platform: 'tiktok' | 'instagram' | 'reddit';
  snapshotDate: Date;
  followers: number;
  engagement: number;
  posts: number;
  reach?: number;
  impressions?: number;
  metadata?: Record<string, any>;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Analytics Snapshots Repository
 */
export class AnalyticsSnapshotsRepository {
  /**
   * Create or update analytics snapshot
   * Uses upsert on (user_id, platform, snapshot_date)
   * 
   * @param params - Snapshot parameters
   * @returns Created/updated snapshot
   */
  async create(params: CreateSnapshotParams): Promise<AnalyticsSnapshot> {
    const {
      userId,
      platform,
      snapshotDate,
      followers,
      engagement,
      posts,
      reach = 0,
      impressions = 0,
      metadata,
    } = params;

    const pool = getPool();

    const result = await pool.query(
      `INSERT INTO analytics_snapshots (
        user_id,
        platform,
        snapshot_date,
        followers,
        engagement,
        posts,
        reach,
        impressions,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (user_id, platform, snapshot_date)
      DO UPDATE SET
        followers = EXCLUDED.followers,
        engagement = EXCLUDED.engagement,
        posts = EXCLUDED.posts,
        reach = EXCLUDED.reach,
        impressions = EXCLUDED.impressions,
        metadata = EXCLUDED.metadata
      RETURNING 
        id, user_id, platform, snapshot_date, followers, engagement, posts,
        reach, impressions, metadata, created_at`,
      [
        userId,
        platform,
        snapshotDate,
        followers,
        engagement,
        posts,
        reach,
        impressions,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return this.mapRowToSnapshot(result.rows[0]);
  }

  /**
   * Find snapshots by user and time range
   * 
   * @param userId - User ID
   * @param timeRange - Time range
   * @param platform - Optional platform filter
   * @returns List of snapshots
   */
  async findByUserAndTimeRange(
    userId: number,
    timeRange: TimeRange,
    platform?: string
  ): Promise<AnalyticsSnapshot[]> {
    const pool = getPool();

    let query = `
      SELECT 
        id, user_id, platform, snapshot_date, followers, engagement, posts,
        reach, impressions, metadata, created_at
      FROM analytics_snapshots
      WHERE user_id = $1
        AND snapshot_date >= $2
        AND snapshot_date <= $3
    `;

    const params: any[] = [userId, timeRange.startDate, timeRange.endDate];

    if (platform) {
      query += ` AND platform = $4`;
      params.push(platform);
    }

    query += ` ORDER BY snapshot_date DESC, platform ASC`;

    const result = await pool.query(query, params);

    return result.rows.map(row => this.mapRowToSnapshot(row));
  }

  /**
   * Get latest snapshot for user and platform
   * 
   * @param userId - User ID
   * @param platform - Platform
   * @returns Latest snapshot or null
   */
  async getLatest(userId: number, platform: string): Promise<AnalyticsSnapshot | null> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        id, user_id, platform, snapshot_date, followers, engagement, posts,
        reach, impressions, metadata, created_at
       FROM analytics_snapshots
       WHERE user_id = $1 AND platform = $2
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [userId, platform]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSnapshot(result.rows[0]);
  }

  /**
   * Get aggregated metrics across all platforms for a time range
   * 
   * @param userId - User ID
   * @param timeRange - Time range
   * @returns Aggregated metrics
   */
  async getAggregatedMetrics(
    userId: number,
    timeRange: TimeRange
  ): Promise<{
    totalFollowers: number;
    totalEngagement: number;
    totalPosts: number;
    totalReach: number;
    totalImpressions: number;
  }> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(followers), 0) as total_followers,
        COALESCE(SUM(engagement), 0) as total_engagement,
        COALESCE(SUM(posts), 0) as total_posts,
        COALESCE(SUM(reach), 0) as total_reach,
        COALESCE(SUM(impressions), 0) as total_impressions
       FROM analytics_snapshots
       WHERE user_id = $1
         AND snapshot_date >= $2
         AND snapshot_date <= $3`,
      [userId, timeRange.startDate, timeRange.endDate]
    );

    const row = result.rows[0];

    return {
      totalFollowers: parseInt(row.total_followers),
      totalEngagement: parseInt(row.total_engagement),
      totalPosts: parseInt(row.total_posts),
      totalReach: parseInt(row.total_reach),
      totalImpressions: parseInt(row.total_impressions),
    };
  }

  /**
   * Get platform breakdown for a time range
   * 
   * @param userId - User ID
   * @param timeRange - Time range
   * @returns Platform breakdown
   */
  async getPlatformBreakdown(
    userId: number,
    timeRange: TimeRange
  ): Promise<Array<{
    platform: string;
    followers: number;
    engagement: number;
    posts: number;
    reach: number;
    impressions: number;
  }>> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
        platform,
        COALESCE(SUM(followers), 0) as followers,
        COALESCE(SUM(engagement), 0) as engagement,
        COALESCE(SUM(posts), 0) as posts,
        COALESCE(SUM(reach), 0) as reach,
        COALESCE(SUM(impressions), 0) as impressions
       FROM analytics_snapshots
       WHERE user_id = $1
         AND snapshot_date >= $2
         AND snapshot_date <= $3
       GROUP BY platform
       ORDER BY platform`,
      [userId, timeRange.startDate, timeRange.endDate]
    );

    return result.rows.map(row => ({
      platform: row.platform,
      followers: parseInt(row.followers),
      engagement: parseInt(row.engagement),
      posts: parseInt(row.posts),
      reach: parseInt(row.reach),
      impressions: parseInt(row.impressions),
    }));
  }

  /**
   * Delete old snapshots (for data retention)
   * 
   * @param olderThan - Date threshold
   * @returns Number of deleted snapshots
   */
  async deleteOlderThan(olderThan: Date): Promise<number> {
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM analytics_snapshots WHERE snapshot_date < $1`,
      [olderThan]
    );

    return result.rowCount ?? 0;
  }

  /**
   * Map database row to AnalyticsSnapshot object
   */
  private mapRowToSnapshot(row: any): AnalyticsSnapshot {
    return {
      id: row.id,
      userId: row.user_id,
      platform: row.platform,
      snapshotDate: new Date(row.snapshot_date),
      followers: row.followers,
      engagement: row.engagement,
      posts: row.posts,
      reach: row.reach,
      impressions: row.impressions,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }
}

// Export singleton instance
export const analyticsSnapshotsRepository = new AnalyticsSnapshotsRepository();
