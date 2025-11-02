/**
 * Analytics Snapshot Worker
 * 
 * Collects daily snapshots of analytics data from all platforms:
 * - TikTok: followers, engagement, posts
 * - Instagram: followers, engagement, posts
 * - Reddit: karma, engagement, posts
 * 
 * Runs daily to capture metrics for trend analysis
 */

import { analyticsSnapshotsRepository } from '../db/repositories/analyticsSnapshotsRepository';
import { oauthAccountsRepository } from '../db/repositories/oauthAccountsRepository';
import { tiktokPostsRepository } from '../db/repositories/tiktokPostsRepository';
import { redditPostsRepository } from '../db/repositories/redditPostsRepository';
import { getPool } from '../db';

interface PlatformMetrics {
  followers: number;
  engagement: number;
  posts: number;
  reach?: number;
  impressions?: number;
}

/**
 * Analytics Snapshot Worker
 */
export class AnalyticsSnapshotWorker {
  /**
   * Run snapshot collection for all users
   */
  async run(): Promise<void> {
    console.log('[AnalyticsSnapshotWorker] Starting snapshot collection...');

    try {
      // Get all users with OAuth accounts
      const users = await this.getAllUsersWithAccounts();

      console.log(`[AnalyticsSnapshotWorker] Found ${users.length} users with connected accounts`);

      for (const userId of users) {
        await this.collectUserSnapshots(userId);
      }

      console.log('[AnalyticsSnapshotWorker] Snapshot collection complete');
    } catch (error) {
      console.error('[AnalyticsSnapshotWorker] Error:', error);
      throw error;
    }
  }

  /**
   * Collect snapshots for a specific user
   */
  async collectUserSnapshots(userId: number): Promise<void> {
    console.log(`[AnalyticsSnapshotWorker] Collecting snapshots for user ${userId}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get user's OAuth accounts
      const accounts = await oauthAccountsRepository.findByUser(userId);

      for (const account of accounts) {
        let metrics: PlatformMetrics | null = null;

        switch (account.provider) {
          case 'tiktok':
            metrics = await this.collectTikTokMetrics(userId, account.id);
            break;
          case 'instagram':
            metrics = await this.collectInstagramMetrics(userId, account.id);
            break;
          case 'reddit':
            metrics = await this.collectRedditMetrics(userId, account.id);
            break;
          default:
            console.log(`[AnalyticsSnapshotWorker] Unknown provider: ${account.provider}`);
            continue;
        }

        if (metrics) {
          await analyticsSnapshotsRepository.create({
            userId,
            platform: account.provider as any,
            snapshotDate: today,
            followers: metrics.followers,
            engagement: metrics.engagement,
            posts: metrics.posts,
            reach: metrics.reach,
            impressions: metrics.impressions,
            metadata: account.metadata,
          });

          console.log(`[AnalyticsSnapshotWorker] Created snapshot for ${account.provider}`);
        }
      }
    } catch (error) {
      console.error(`[AnalyticsSnapshotWorker] Error collecting for user ${userId}:`, error);
    }
  }

  /**
   * Collect TikTok metrics
   */
  private async collectTikTokMetrics(userId: number, accountId: number): Promise<PlatformMetrics | null> {
    try {
      // Get TikTok posts statistics
      const stats = await tiktokPostsRepository.getStatistics(userId);
      
      // Get all posts for engagement calculation
      const posts = await tiktokPostsRepository.findByUser(userId, 1000);
      
      // Calculate total engagement from metadata
      let totalEngagement = 0;
      let totalReach = 0;
      
      for (const post of posts) {
        if (post.metadata) {
          totalEngagement += (post.metadata.likes || 0) + 
                           (post.metadata.comments || 0) + 
                           (post.metadata.shares || 0);
          totalReach += post.metadata.views || 0;
        }
      }

      // Get follower count from account metadata
      const account = await oauthAccountsRepository.findById(accountId);
      const followers = account?.metadata?.follower_count || 0;

      return {
        followers,
        engagement: totalEngagement,
        posts: stats.complete,
        reach: totalReach,
        impressions: totalReach, // TikTok uses views as impressions
      };
    } catch (error) {
      console.error('[AnalyticsSnapshotWorker] Error collecting TikTok metrics:', error);
      return null;
    }
  }

  /**
   * Collect Instagram metrics
   */
  private async collectInstagramMetrics(userId: number, accountId: number): Promise<PlatformMetrics | null> {
    try {
      // Get Instagram account metadata
      const account = await oauthAccountsRepository.findById(accountId);
      
      if (!account?.metadata) {
        return null;
      }

      // Instagram metrics from account metadata
      const followers = account.metadata.followers_count || 0;
      const mediaCount = account.metadata.media_count || 0;
      
      // Calculate engagement from recent posts (stored in metadata)
      const engagement = account.metadata.total_engagement || 0;
      const reach = account.metadata.total_reach || 0;
      const impressions = account.metadata.total_impressions || 0;

      return {
        followers,
        engagement,
        posts: mediaCount,
        reach,
        impressions,
      };
    } catch (error) {
      console.error('[AnalyticsSnapshotWorker] Error collecting Instagram metrics:', error);
      return null;
    }
  }

  /**
   * Collect Reddit metrics
   */
  private async collectRedditMetrics(userId: number, accountId: number): Promise<PlatformMetrics | null> {
    try {
      // Get Reddit posts statistics
      const stats = await redditPostsRepository.getStatistics(userId);
      
      // Get account metadata for karma
      const account = await oauthAccountsRepository.findById(accountId);
      const karma = account?.metadata?.total_karma || stats.totalScore;

      return {
        followers: karma, // Reddit uses karma as "followers"
        engagement: stats.totalScore + stats.totalComments,
        posts: stats.totalPosts,
        reach: stats.totalScore, // Use score as reach proxy
        impressions: stats.totalScore, // Use score as impressions proxy
      };
    } catch (error) {
      console.error('[AnalyticsSnapshotWorker] Error collecting Reddit metrics:', error);
      return null;
    }
  }

  /**
   * Get all users with OAuth accounts
   */
  private async getAllUsersWithAccounts(): Promise<number[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT DISTINCT user_id
       FROM oauth_accounts
       ORDER BY user_id`
    );

    return result.rows.map(row => row.user_id);
  }
}

// Export singleton instance
export const analyticsSnapshotWorker = new AnalyticsSnapshotWorker();
