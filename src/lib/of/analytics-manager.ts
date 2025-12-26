/**
 * OnlyFans Analytics Manager
 * Provides detailed analytics and insights from real database data
 * 
 * Replaces mock data with Prisma queries to subscriptions/transactions tables
 */

import { prisma } from '@/lib/prisma';
import type { FanAnalytics } from '@/lib/types/onlyfans';

// Types for internal use
interface FanData {
  id: string;
  platformUserId: string;
  username: string;
  displayName: string;
  isSubscribed: boolean;
  subscriptionPrice: number;
  subscriptionExpiry: Date | null;
  totalSpent: number;
  totalTips: number;
  totalPPVPurchases: number;
  lastPurchaseAt: Date | null;
  lastMessageAt: Date;
  createdAt: Date;
  tags: string[];
}

interface RevenueRecord {
  date: Date;
  type: 'subscription' | 'tip' | 'ppv';
  amount: number;
  fanId: string;
}

export class AnalyticsManager {
  /**
   * Get comprehensive fan analytics from database
   */
  async getFanAnalytics(
    userId: string,
    period: '24h' | '7d' | '30d' | 'all' = '30d'
  ): Promise<FanAnalytics> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return this.emptyAnalytics(userId, period);
    }

    const now = new Date();
    const cutoffDate = this.getCutoffDate(period, now);

    try {
      // Fetch subscriptions from database
      const subscriptions = await prisma.subscriptions.findMany({
        where: {
          user_id: userIdNum,
          platform: 'onlyfans',
        },
        orderBy: { started_at: 'desc' },
      });

      // Fetch transactions from database
      const transactions = await prisma.transactions.findMany({
        where: {
          user_id: userIdNum,
          platform: 'onlyfans',
          status: 'completed',
        },
        orderBy: { created_at: 'desc' },
      });

      // Transform to internal format
      const fans = this.transformSubscriptionsToFans(subscriptions, transactions);
      const revenues = this.transformTransactionsToRevenues(transactions);

      // Filter by period
      const periodRevenues = period === 'all'
        ? revenues
        : revenues.filter(r => r.date >= cutoffDate);

      // Calculate metrics
      const metrics = {
        totalFans: fans.filter(f => f.isSubscribed).length,
        newFans: this.countNewFans(fans, cutoffDate),
        expiredFans: this.countExpiredFans(fans, cutoffDate),
        activeConversations: this.countActiveConversations(fans, cutoffDate),
        revenue: this.calculateRevenue(periodRevenues),
        averageSpendPerFan: 0,
        topSpenders: this.getTopSpenders(fans, 10),
        conversionRates: this.calculateConversionRates(fans, periodRevenues),
      };

      // Calculate average spend
      const uniqueFanIds = new Set(periodRevenues.map(r => r.fanId));
      metrics.averageSpendPerFan = uniqueFanIds.size > 0
        ? metrics.revenue.total / uniqueFanIds.size
        : 0;

      return {
        userId,
        period,
        metrics,
      };
    } catch (error) {
      console.error('[AnalyticsManager] Error fetching analytics:', error);
      return this.emptyAnalytics(userId, period);
    }
  }

  /**
   * Get fan segments with counts from database
   */
  async getFanSegments(userId: string): Promise<Array<{
    segment: string;
    count: number;
    percentage: number;
    avgSpend: number;
  }>> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return this.emptySegments();
    }

    try {
      const subscriptions = await prisma.subscriptions.findMany({
        where: {
          user_id: userIdNum,
          platform: 'onlyfans',
        },
      });

      const transactions = await prisma.transactions.findMany({
        where: {
          user_id: userIdNum,
          platform: 'onlyfans',
          status: 'completed',
        },
      });

      const fans = this.transformSubscriptionsToFans(subscriptions, transactions);
      const totalFans = fans.length || 1;

      const segments = [
        {
          segment: 'Whales ($500+)',
          fans: fans.filter(f => f.totalSpent >= 500),
        },
        {
          segment: 'Big Spenders ($100-$499)',
          fans: fans.filter(f => f.totalSpent >= 100 && f.totalSpent < 500),
        },
        {
          segment: 'Regular Spenders ($20-$99)',
          fans: fans.filter(f => f.totalSpent >= 20 && f.totalSpent < 100),
        },
        {
          segment: 'Low Spenders ($1-$19)',
          fans: fans.filter(f => f.totalSpent >= 1 && f.totalSpent < 20),
        },
        {
          segment: 'Non-Spenders ($0)',
          fans: fans.filter(f => f.totalSpent === 0),
        },
        {
          segment: 'Active (7d)',
          fans: fans.filter(f => {
            const daysSinceActive = (Date.now() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceActive <= 7;
          }),
        },
        {
          segment: 'Silent (7-30d)',
          fans: fans.filter(f => {
            const daysSinceActive = (Date.now() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceActive > 7 && daysSinceActive <= 30;
          }),
        },
        {
          segment: 'Inactive (30d+)',
          fans: fans.filter(f => {
            const daysSinceActive = (Date.now() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceActive > 30;
          }),
        },
      ];

      return segments.map(seg => ({
        segment: seg.segment,
        count: seg.fans.length,
        percentage: (seg.fans.length / totalFans) * 100,
        avgSpend: seg.fans.length > 0
          ? seg.fans.reduce((sum, f) => sum + f.totalSpent, 0) / seg.fans.length
          : 0,
      }));
    } catch (error) {
      console.error('[AnalyticsManager] Error fetching segments:', error);
      return this.emptySegments();
    }
  }

  /**
   * Get engagement metrics from database
   */
  async getEngagementMetrics(userId: string, period: '7d' | '30d' = '30d'): Promise<{
    messagesPerDay: number;
    avgResponseTime: number;
    peakHours: Array<{ hour: number; messageCount: number }>;
    mostActiveDays: Array<{ day: string; messageCount: number }>;
  }> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return this.emptyEngagementMetrics();
    }

    try {
      // Get user stats if available
      const userStats = await prisma.user_stats.findUnique({
        where: { user_id: userIdNum },
      });

      const daysInPeriod = period === '7d' ? 7 : 30;
      const messagesPerDay = userStats
        ? Math.round(userStats.messages_sent / daysInPeriod)
        : 0;

      // For peak hours and active days, we'd need message timestamps
      // For now, return calculated data based on available stats
      return {
        messagesPerDay,
        avgResponseTime: userStats?.response_rate ? Math.round(100 / userStats.response_rate) : 0,
        peakHours: [], // Would need message timestamps to calculate
        mostActiveDays: [], // Would need message timestamps to calculate
      };
    } catch (error) {
      console.error('[AnalyticsManager] Error fetching engagement metrics:', error);
      return this.emptyEngagementMetrics();
    }
  }

  /**
   * Get revenue trends from database
   */
  async getRevenueTrends(
    userId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    daily: Array<{ date: string; revenue: number; breakdown: Record<string, number> }>;
    weekly: Array<{ week: string; revenue: number; growth: number }>;
    projections: {
      nextWeek: number;
      nextMonth: number;
    };
  }> {
    const userIdNum = parseInt(userId, 10);
    if (!Number.isFinite(userIdNum)) {
      return this.emptyRevenueTrends();
    }

    try {
      const cutoffDate = this.getCutoffDate(period, new Date());

      const transactions = await prisma.transactions.findMany({
        where: {
          user_id: userIdNum,
          platform: 'onlyfans',
          status: 'completed',
          created_at: { gte: cutoffDate },
        },
        orderBy: { created_at: 'asc' },
      });

      // Group by day
      const dailyMap = new Map<string, { revenue: number; breakdown: Record<string, number> }>();

      transactions.forEach(tx => {
        const dateKey = tx.created_at.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { revenue: 0, breakdown: {} };

        existing.revenue += tx.amount;
        const txType = tx.type || 'other';
        existing.breakdown[txType] = (existing.breakdown[txType] || 0) + tx.amount;

        dailyMap.set(dateKey, existing);
      });

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate weekly trends
      const weekly = this.calculateWeeklyTrends(daily);

      // Simple projections based on recent trends
      const recentDailyAvg = daily.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / Math.max(daily.slice(-7).length, 1);
      const projections = {
        nextWeek: recentDailyAvg * 7,
        nextMonth: recentDailyAvg * 30,
      };

      return { daily, weekly, projections };
    } catch (error) {
      console.error('[AnalyticsManager] Error fetching revenue trends:', error);
      return this.emptyRevenueTrends();
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private transformSubscriptionsToFans(
    subscriptions: any[],
    transactions: any[]
  ): FanData[] {
    // Group transactions by fan
    const fanTransactions = new Map<string, any[]>();
    transactions.forEach(tx => {
      const fanId = tx.id.split('_')[0] || tx.id; // Extract fan ID if encoded
      const existing = fanTransactions.get(fanId) || [];
      existing.push(tx);
      fanTransactions.set(fanId, existing);
    });

    return subscriptions.map(sub => {
      const fanTxs = fanTransactions.get(sub.fan_id) || [];
      const totalSpent = fanTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const tips = fanTxs.filter(tx => tx.type === 'tip').reduce((sum, tx) => sum + tx.amount, 0);
      const ppv = fanTxs.filter(tx => tx.type === 'ppv').reduce((sum, tx) => sum + tx.amount, 0);
      const lastTx = fanTxs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];

      return {
        id: sub.id,
        platformUserId: sub.fan_id,
        username: `fan_${sub.fan_id.substring(0, 8)}`,
        displayName: `Fan ${sub.fan_id.substring(0, 8)}`,
        isSubscribed: sub.status === 'active',
        subscriptionPrice: sub.amount,
        subscriptionExpiry: sub.ends_at,
        totalSpent,
        totalTips: tips,
        totalPPVPurchases: ppv,
        lastPurchaseAt: lastTx?.created_at || null,
        lastMessageAt: sub.updated_at || sub.started_at,
        createdAt: sub.started_at,
        tags: totalSpent >= 500 ? ['VIP', 'whale'] : totalSpent >= 100 ? ['big_spender'] : [],
      };
    });
  }

  private transformTransactionsToRevenues(transactions: any[]): RevenueRecord[] {
    return transactions.map(tx => ({
      date: tx.created_at,
      type: (tx.type as 'subscription' | 'tip' | 'ppv') || 'subscription',
      amount: tx.amount,
      fanId: tx.id.split('_')[0] || tx.id,
    }));
  }

  private getCutoffDate(period: string, now: Date): Date {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysAgo = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 0;
    return daysAgo === 0 ? new Date(0) : new Date(now.getTime() - daysAgo * msPerDay);
  }

  private countNewFans(fans: FanData[], cutoffDate: Date): number {
    return fans.filter(f => f.createdAt >= cutoffDate && f.isSubscribed).length;
  }

  private countExpiredFans(fans: FanData[], cutoffDate: Date): number {
    return fans.filter(f =>
      f.subscriptionExpiry &&
      f.subscriptionExpiry >= cutoffDate &&
      f.subscriptionExpiry <= new Date() &&
      !f.isSubscribed
    ).length;
  }

  private countActiveConversations(fans: FanData[], cutoffDate: Date): number {
    return fans.filter(f => f.lastMessageAt >= cutoffDate).length;
  }

  private calculateRevenue(revenues: RevenueRecord[]): {
    subscriptions: number;
    tips: number;
    ppv: number;
    total: number;
  } {
    const breakdown = {
      subscriptions: 0,
      tips: 0,
      ppv: 0,
      total: 0,
    };

    revenues.forEach(rev => {
      breakdown.total += rev.amount;
      switch (rev.type) {
        case 'subscription':
          breakdown.subscriptions += rev.amount;
          break;
        case 'tip':
          breakdown.tips += rev.amount;
          break;
        case 'ppv':
          breakdown.ppv += rev.amount;
          break;
      }
    });

    return breakdown;
  }

  private getTopSpenders(fans: FanData[], limit: number): Array<{
    username: string;
    totalSpent: number;
    lastPurchase: Date;
  }> {
    return fans
      .filter(f => f.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)
      .map(f => ({
        username: f.username,
        totalSpent: f.totalSpent,
        lastPurchase: f.lastPurchaseAt || f.createdAt,
      }));
  }

  private calculateConversionRates(
    fans: FanData[],
    revenues: RevenueRecord[]
  ): {
    freeToSaid: number;
    subscriberToPurchaser: number;
    ppvOpenRate: number;
  } {
    const freeFans = fans.filter(f => f.subscriptionPrice === 0);
    const paidFans = fans.filter(f => f.subscriptionPrice > 0);
    const purchaserIds = new Set(revenues.map(r => r.fanId));
    const ppvPurchaserIds = new Set(revenues.filter(r => r.type === 'ppv').map(r => r.fanId));

    return {
      freeToSaid: freeFans.length > 0 ? (paidFans.length / (freeFans.length + paidFans.length)) * 100 : 0,
      subscriberToPurchaser: paidFans.length > 0
        ? (paidFans.filter(f => purchaserIds.has(f.platformUserId)).length / paidFans.length) * 100
        : 0,
      ppvOpenRate: paidFans.length > 0
        ? (ppvPurchaserIds.size / paidFans.length) * 100
        : 0,
    };
  }

  private calculateWeeklyTrends(
    daily: Array<{ date: string; revenue: number }>
  ): Array<{ week: string; revenue: number; growth: number }> {
    const weeklyMap = new Map<string, number>();

    daily.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + day.revenue);
    });

    const weeks = Array.from(weeklyMap.entries())
      .map(([week, revenue]) => ({ week, revenue }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return weeks.map((week, index) => {
      const previousWeek = weeks[index - 1];
      const growth = previousWeek
        ? ((week.revenue - previousWeek.revenue) / previousWeek.revenue) * 100
        : 0;

      return { ...week, growth };
    });
  }

  // Empty state helpers
  private emptyAnalytics(userId: string, period: string): FanAnalytics {
    return {
      userId,
      period,
      metrics: {
        totalFans: 0,
        newFans: 0,
        expiredFans: 0,
        activeConversations: 0,
        revenue: { subscriptions: 0, tips: 0, ppv: 0, total: 0 },
        averageSpendPerFan: 0,
        topSpenders: [],
        conversionRates: { freeToSaid: 0, subscriberToPurchaser: 0, ppvOpenRate: 0 },
      },
    };
  }

  private emptySegments() {
    return [
      { segment: 'Whales ($500+)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Big Spenders ($100-$499)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Regular Spenders ($20-$99)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Low Spenders ($1-$19)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Non-Spenders ($0)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Active (7d)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Silent (7-30d)', count: 0, percentage: 0, avgSpend: 0 },
      { segment: 'Inactive (30d+)', count: 0, percentage: 0, avgSpend: 0 },
    ];
  }

  private emptyEngagementMetrics() {
    return {
      messagesPerDay: 0,
      avgResponseTime: 0,
      peakHours: [],
      mostActiveDays: [],
    };
  }

  private emptyRevenueTrends() {
    return {
      daily: [],
      weekly: [],
      projections: { nextWeek: 0, nextMonth: 0 },
    };
  }
}

// Export singleton
export const analyticsManager = new AnalyticsManager();
