/**
 * Metrics Aggregation Service
 * 
 * Aggregates and analyzes metrics across all social platforms
 */

import { analyticsSnapshotsRepository, TimeRange } from '../db/repositories/analyticsSnapshotsRepository';
import { tiktokPostsRepository } from '../db/repositories/tiktokPostsRepository';
import { redditPostsRepository } from '../db/repositories/redditPostsRepository';
import { oauthAccountsRepository } from '../db/repositories/oauthAccountsRepository';

export interface UnifiedMetrics {
  totalFollowers: number;
  totalEngagement: number;
  totalPosts: number;
  averageEngagementRate: number;
  platformBreakdown: {
    [platform: string]: {
      followers: number;
      engagement: number;
      posts: number;
      engagementRate: number;
    };
  };
  timeRange: TimeRange;
}

export interface PlatformMetrics {
  platform: string;
  followers: number;
  followersGrowth: number;
  engagement: number;
  engagementRate: number;
  posts: number;
  avgPostPerformance: number;
  topPost?: PostSummary;
  timeRange: TimeRange;
}

export interface PostSummary {
  postId: string;
  platform: string;
  title: string;
  engagement: number;
  publishedAt: Date;
}

export interface ContentPerformance {
  postId: string;
  platform: string;
  title: string;
  thumbnail?: string;
  publishedAt: Date;
  engagement: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
}

export interface AudienceInsights {
  totalAudience: number;
  audienceGrowth: number;
  mostActiveTime?: string;
  platformDistribution: {
    [platform: string]: number;
  };
  timeRange: TimeRange;
}

/**
 * Metrics Aggregation Service
 */
export class MetricsAggregationService {
  /**
   * Get unified metrics across all platforms
   */
  async getUnifiedMetrics(userId: number, timeRange: TimeRange): Promise<UnifiedMetrics> {
    // Get aggregated metrics
    const aggregated = await analyticsSnapshotsRepository.getAggregatedMetrics(userId, timeRange);
    
    // Get platform breakdown
    const breakdown = await analyticsSnapshotsRepository.getPlatformBreakdown(userId, timeRange);

    // Calculate engagement rate
    const avgEngagementRate = aggregated.totalFollowers > 0
      ? (aggregated.totalEngagement / aggregated.totalFollowers) * 100
      : 0;

    // Build platform breakdown object
    const platformBreakdown: any = {};
    for (const platform of breakdown) {
      const engagementRate = platform.followers > 0
        ? (platform.engagement / platform.followers) * 100
        : 0;

      platformBreakdown[platform.platform] = {
        followers: platform.followers,
        engagement: platform.engagement,
        posts: platform.posts,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
      };
    }

    return {
      totalFollowers: aggregated.totalFollowers,
      totalEngagement: aggregated.totalEngagement,
      totalPosts: aggregated.totalPosts,
      averageEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
      platformBreakdown,
      timeRange,
    };
  }

  /**
   * Get platform-specific metrics
   */
  async getPlatformMetrics(
    userId: number,
    platform: string,
    timeRange: TimeRange
  ): Promise<PlatformMetrics> {
    // Get snapshots for this platform
    const snapshots = await analyticsSnapshotsRepository.findByUserAndTimeRange(
      userId,
      timeRange,
      platform
    );

    if (snapshots.length === 0) {
      return {
        platform,
        followers: 0,
        followersGrowth: 0,
        engagement: 0,
        engagementRate: 0,
        posts: 0,
        avgPostPerformance: 0,
        timeRange,
      };
    }

    // Calculate totals
    const latest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];

    const followers = latest.followers;
    const followersGrowth = oldest.followers > 0
      ? ((followers - oldest.followers) / oldest.followers) * 100
      : 0;

    const totalEngagement = snapshots.reduce((sum, s) => sum + s.engagement, 0);
    const totalPosts = snapshots.reduce((sum, s) => sum + s.posts, 0);

    const engagementRate = followers > 0
      ? (totalEngagement / followers) * 100
      : 0;

    const avgPostPerformance = totalPosts > 0
      ? totalEngagement / totalPosts
      : 0;

    // Get top post
    const topPost = await this.getTopPost(userId, platform);

    return {
      platform,
      followers,
      followersGrowth: parseFloat(followersGrowth.toFixed(2)),
      engagement: totalEngagement,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      posts: totalPosts,
      avgPostPerformance: parseFloat(avgPostPerformance.toFixed(2)),
      topPost,
      timeRange,
    };
  }

  /**
   * Get content performance metrics
   */
  async getContentPerformance(
    userId: number,
    options: {
      platform?: string;
      limit?: number;
      sortBy?: 'engagement' | 'engagementRate' | 'date';
    } = {}
  ): Promise<ContentPerformance[]> {
    const { platform, limit = 10, sortBy = 'engagement' } = options;

    const content: ContentPerformance[] = [];

    // Get TikTok posts
    if (!platform || platform === 'tiktok') {
      const tiktokPosts = await tiktokPostsRepository.findByUser(userId, 100);
      
      for (const post of tiktokPosts) {
        if (post.status === 'PUBLISH_COMPLETE' && post.metadata) {
          const likes = post.metadata.likes || 0;
          const comments = post.metadata.comments || 0;
          const shares = post.metadata.shares || 0;
          const views = post.metadata.views || 0;
          const engagement = likes + comments + shares;
          const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

          content.push({
            postId: post.publishId,
            platform: 'tiktok',
            title: post.title,
            thumbnail: post.metadata.thumbnail_url,
            publishedAt: post.createdAt,
            engagement,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
            likes,
            comments,
            shares,
            reach: views,
            impressions: views,
          });
        }
      }
    }

    // Get Reddit posts
    if (!platform || platform === 'reddit') {
      const redditPosts = await redditPostsRepository.findByUser(userId, 100);
      
      for (const post of redditPosts) {
        const engagement = post.score + post.numComments;
        const engagementRate = post.score > 0 ? (engagement / post.score) * 100 : 0;

        content.push({
          postId: post.postId,
          platform: 'reddit',
          title: post.title,
          publishedAt: post.createdAt,
          engagement,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          likes: post.score,
          comments: post.numComments,
          shares: 0,
          reach: post.score,
        });
      }
    }

    // Sort content
    content.sort((a, b) => {
      switch (sortBy) {
        case 'engagementRate':
          return b.engagementRate - a.engagementRate;
        case 'date':
          return b.publishedAt.getTime() - a.publishedAt.getTime();
        case 'engagement':
        default:
          return b.engagement - a.engagement;
      }
    });

    return content.slice(0, limit);
  }

  /**
   * Get audience insights
   */
  async getAudienceInsights(userId: number, timeRange: TimeRange): Promise<AudienceInsights> {
    // Get latest snapshots for each platform
    const platforms = ['tiktok', 'instagram', 'reddit'];
    let totalAudience = 0;
    const platformDistribution: any = {};

    for (const platform of platforms) {
      const latest = await analyticsSnapshotsRepository.getLatest(userId, platform);
      if (latest) {
        totalAudience += latest.followers;
        platformDistribution[platform] = latest.followers;
      }
    }

    // Calculate growth
    const startDate = new Date(timeRange.startDate);
    startDate.setDate(startDate.getDate() - 30); // Compare to 30 days before
    const previousRange: TimeRange = {
      startDate,
      endDate: timeRange.startDate,
    };

    const previousMetrics = await analyticsSnapshotsRepository.getAggregatedMetrics(
      userId,
      previousRange
    );

    const audienceGrowth = previousMetrics.totalFollowers > 0
      ? ((totalAudience - previousMetrics.totalFollowers) / previousMetrics.totalFollowers) * 100
      : 0;

    return {
      totalAudience,
      audienceGrowth: parseFloat(audienceGrowth.toFixed(2)),
      platformDistribution,
      timeRange,
    };
  }

  /**
   * Get top post for a platform
   */
  private async getTopPost(userId: number, platform: string): Promise<PostSummary | undefined> {
    if (platform === 'tiktok') {
      const posts = await tiktokPostsRepository.findByUser(userId, 100);
      const completedPosts = posts.filter(p => p.status === 'PUBLISH_COMPLETE' && p.metadata);
      
      if (completedPosts.length === 0) return undefined;

      const topPost = completedPosts.reduce((max, post) => {
        const engagement = (post.metadata?.likes || 0) + 
                         (post.metadata?.comments || 0) + 
                         (post.metadata?.shares || 0);
        const maxEngagement = (max.metadata?.likes || 0) + 
                            (max.metadata?.comments || 0) + 
                            (max.metadata?.shares || 0);
        return engagement > maxEngagement ? post : max;
      });

      const engagement = (topPost.metadata?.likes || 0) + 
                       (topPost.metadata?.comments || 0) + 
                       (topPost.metadata?.shares || 0);

      return {
        postId: topPost.publishId,
        platform: 'tiktok',
        title: topPost.title,
        engagement,
        publishedAt: topPost.createdAt,
      };
    }

    if (platform === 'reddit') {
      const posts = await redditPostsRepository.findByUser(userId, 100);
      
      if (posts.length === 0) return undefined;

      const topPost = posts.reduce((max, post) => {
        const engagement = post.score + post.numComments;
        const maxEngagement = max.score + max.numComments;
        return engagement > maxEngagement ? post : max;
      });

      return {
        postId: topPost.postId,
        platform: 'reddit',
        title: topPost.title,
        engagement: topPost.score + topPost.numComments,
        publishedAt: topPost.createdAt,
      };
    }

    return undefined;
  }
}

// Export singleton instance
export const metricsAggregationService = new MetricsAggregationService();
