/**
 * OnlyFans Service
 * Handles OnlyFans-specific data operations including fans, stats, and content
 */

import { prisma } from '@/lib/prisma';
import type { Subscription, Transaction, Content } from '@prisma/client';

/**
 * Fan data structure from OnlyFans
 */
export interface OnlyFansFan {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  subscriptionTier?: string;
  subscriptionAmount: number;
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscribedAt: Date;
  expiresAt?: Date;
  totalSpent: number;
  messageCount: number;
  lastMessageAt?: Date;
}

/**
 * OnlyFans-specific statistics
 */
export interface OnlyFansStats {
  totalFans: number;
  activeFans: number;
  newFansThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageSubscriptionPrice: number;
  retentionRate: number;
  topEarningContent: Array<{
    id: string;
    title: string;
    revenue: number;
    views: number;
  }>;
}

/**
 * OnlyFans content item
 */
export interface OnlyFansContent {
  id: string;
  title: string;
  type: 'image' | 'video' | 'text';
  status: 'draft' | 'scheduled' | 'published';
  publishedAt?: Date;
  views: number;
  likes: number;
  comments: number;
  revenue: number;
  thumbnailUrl?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * OnlyFans Service Class
 * Provides methods to interact with OnlyFans data
 */
export class OnlyFansService {
  /**
   * Get list of OnlyFans fans/subscribers
   * 
   * @param userId - User ID
   * @param params - Pagination parameters
   * @returns Paginated list of fans
   */
  async getFans(
    userId: number,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<OnlyFansFan>> {
    const { limit = 50, offset = 0 } = params;

    try {
      // Query subscriptions from database
      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where: {
            userId,
            platform: 'onlyfans',
          },
          take: limit,
          skip: offset,
          orderBy: { startedAt: 'desc' },
        }),
        prisma.subscription.count({
          where: {
            userId,
            platform: 'onlyfans',
          },
        }),
      ]);

      // Get transaction data for each fan to calculate total spent and message count
      const fanIds = subscriptions.map((sub: Subscription) => sub.fanId);
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          platform: 'onlyfans',
        },
      });

      // Transform subscriptions to fan objects
      const fans: OnlyFansFan[] = subscriptions.map((sub: Subscription) => {
        // Calculate total spent by this fan
        const totalSpent = transactions
          .filter((t: Transaction) => t.type === 'subscription' || t.type === 'tip' || t.type === 'ppv')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        // Count messages from this fan
        const messageCount = transactions
          .filter((t: Transaction) => t.type === 'message')
          .length;

        // Find last message date
        const messageTransactions = transactions
          .filter((t: Transaction) => t.type === 'message')
          .sort((a: Transaction, b: Transaction) => b.createdAt.getTime() - a.createdAt.getTime());
        
        const lastMessageAt = messageTransactions.length > 0 
          ? messageTransactions[0].createdAt 
          : undefined;

        return {
          id: sub.fanId,
          name: `Fan ${sub.fanId.substring(0, 8)}`, // Placeholder - would come from external API
          username: `@fan_${sub.fanId.substring(0, 8)}`, // Placeholder
          subscriptionTier: sub.tier || undefined,
          subscriptionAmount: sub.amount,
          subscriptionStatus: sub.status as 'active' | 'cancelled' | 'expired',
          subscribedAt: sub.startedAt,
          expiresAt: sub.endsAt || undefined,
          totalSpent,
          messageCount,
          lastMessageAt,
        };
      });

      return {
        items: fans,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + fans.length < total,
        },
      };
    } catch (error) {
      console.error('[OnlyFansService] Error fetching fans:', error);
      throw new Error('Failed to fetch OnlyFans fans');
    }
  }

  /**
   * Get OnlyFans-specific statistics
   * 
   * @param userId - User ID
   * @returns OnlyFans statistics
   */
  async getStats(userId: number): Promise<OnlyFansStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get subscription counts
      const [totalFans, activeFans, newFansThisMonth] = await Promise.all([
        prisma.subscription.count({
          where: {
            userId,
            platform: 'onlyfans',
          },
        }),
        prisma.subscription.count({
          where: {
            userId,
            platform: 'onlyfans',
            status: 'active',
          },
        }),
        prisma.subscription.count({
          where: {
            userId,
            platform: 'onlyfans',
            startedAt: {
              gte: startOfMonth,
            },
          },
        }),
      ]);

      // Get revenue data
      const [totalRevenueResult, monthRevenueResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            platform: 'onlyfans',
            status: 'completed',
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            platform: 'onlyfans',
            status: 'completed',
            createdAt: {
              gte: startOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const totalRevenue = totalRevenueResult._sum.amount || 0;
      const revenueThisMonth = monthRevenueResult._sum.amount || 0;

      // Calculate average subscription price
      const subscriptionResult = await prisma.subscription.aggregate({
        where: {
          userId,
          platform: 'onlyfans',
          status: 'active',
        },
        _avg: {
          amount: true,
        },
      });

      const averageSubscriptionPrice = subscriptionResult._avg.amount || 0;

      // Calculate retention rate (active vs total)
      const retentionRate = totalFans > 0 ? (activeFans / totalFans) * 100 : 0;

      // Get top earning content
      const topContent = await prisma.content.findMany({
        where: {
          userId,
          platform: 'onlyfans',
          status: 'published',
        },
        take: 5,
        orderBy: {
          publishedAt: 'desc',
        },
      });

      const topEarningContent = topContent.map((content: Content) => ({
        id: content.id,
        title: content.title,
        revenue: 0, // Would be calculated from transactions in a real implementation
        views: 0, // Would come from external API
      }));

      return {
        totalFans,
        activeFans,
        newFansThisMonth,
        totalRevenue,
        revenueThisMonth,
        averageSubscriptionPrice,
        retentionRate,
        topEarningContent,
      };
    } catch (error) {
      console.error('[OnlyFansService] Error fetching stats:', error);
      throw new Error('Failed to fetch OnlyFans statistics');
    }
  }

  /**
   * Get OnlyFans content
   * 
   * @param userId - User ID
   * @param params - Pagination parameters
   * @returns Paginated list of OnlyFans content
   */
  async getContent(
    userId: number,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<OnlyFansContent>> {
    const { limit = 50, offset = 0 } = params;

    try {
      // Query content from database
      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where: {
            userId,
            platform: 'onlyfans',
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.content.count({
          where: {
            userId,
            platform: 'onlyfans',
          },
        }),
      ]);

      // Transform to OnlyFans content format
      const items: OnlyFansContent[] = content.map((item: Content) => ({
        id: item.id,
        title: item.title,
        type: item.type as 'image' | 'video' | 'text',
        status: item.status as 'draft' | 'scheduled' | 'published',
        publishedAt: item.publishedAt || undefined,
        views: 0, // Would come from external API or metadata
        likes: 0, // Would come from external API or metadata
        comments: 0, // Would come from external API or metadata
        revenue: 0, // Would be calculated from transactions
        thumbnailUrl: item.mediaIds.length > 0 ? item.mediaIds[0] : undefined,
      }));

      return {
        items,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        },
      };
    } catch (error) {
      console.error('[OnlyFansService] Error fetching content:', error);
      throw new Error('Failed to fetch OnlyFans content');
    }
  }

  /**
   * Sync data from external OnlyFans API
   * This is a placeholder for future external API integration
   * 
   * @param userId - User ID
   * @param accessToken - OnlyFans API access token
   */
  async syncFromExternalAPI(userId: number, accessToken: string): Promise<void> {
    // TODO: Implement external OnlyFans API integration
    // This would:
    // 1. Fetch fans/subscribers from OnlyFans API
    // 2. Fetch transactions and revenue data
    // 3. Fetch content and engagement metrics
    // 4. Update local database with fresh data
    
    console.log('[OnlyFansService] External API sync not yet implemented');
    throw new Error('External OnlyFans API sync not yet implemented');
  }
}

// Export singleton instance
export const onlyFansService = new OnlyFansService();
