/**
 * Analytics Repository
 * Provides aggregated metrics and insights from CRM data
 */

import { Pool } from 'pg';

export interface AnalyticsMetrics {
  revenueMonthly: number;
  activeSubscribers: number;
  avgResponseSeconds: number;
  aiAutomationRate: number;
  change: {
    revenue: number;
    subscribers: number;
    response: number;
    automation: number;
  };
}

export interface TopFan {
  name: string;
  username: string;
  revenue: number;
  messages: number;
  lastActive: string;
  badge: string;
  trend: number;
}

export interface PlatformDistribution {
  platform: string;
  share: number;
  revenue: number;
}

export interface RevenueSeries {
  labels: string[];
  values: number[];
}

export interface FanGrowth {
  labels: string[];
  newFans: number[];
  activeFans: number[];
}

export interface OverviewData {
  metrics: AnalyticsMetrics;
  topFans: TopFan[];
  platformDistribution: PlatformDistribution[];
  revenueSeries: RevenueSeries;
  fanGrowth: FanGrowth;
}

export class AnalyticsRepository {
  constructor(private pool: Pool) {}

  /**
   * Get comprehensive overview analytics for a user
   */
  async getOverview(userId: number): Promise<OverviewData> {
    const [metrics, topFans, platformDist, revenueSeries, fanGrowth] = await Promise.all([
      this.getMetrics(userId),
      this.getTopFans(userId),
      this.getPlatformDistribution(userId),
      this.getRevenueSeries(userId),
      this.getFanGrowth(userId),
    ]);

    return {
      metrics,
      topFans,
      platformDistribution: platformDist,
      revenueSeries,
      fanGrowth,
    };
  }

  /**
   * Get key metrics with month-over-month changes
   */
  private async getMetrics(userId: number): Promise<AnalyticsMetrics> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Revenue this month and last month
    const revenueQuery = `
      SELECT 
        SUM(CASE WHEN created_at >= $2 THEN COALESCE(price_cents, 0) ELSE 0 END) as current_revenue,
        SUM(CASE WHEN created_at >= $3 AND created_at < $2 THEN COALESCE(price_cents, 0) ELSE 0 END) as last_revenue
      FROM messages
      WHERE user_id = $1 AND price_cents > 0
    `;
    const revenueResult = await this.pool.query(revenueQuery, [userId, firstDayThisMonth, firstDayLastMonth]);
    const currentRevenue = parseInt(revenueResult.rows[0]?.current_revenue || '0');
    const lastRevenue = parseInt(revenueResult.rows[0]?.last_revenue || '0');
    const revenueChange = lastRevenue > 0 ? (currentRevenue - lastRevenue) / lastRevenue : 0;

    // Active subscribers (fans with messages in last 30 days)
    const subscribersQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN created_at >= $2 THEN fan_id END) as current_subs,
        COUNT(DISTINCT CASE WHEN created_at >= $3 AND created_at < $2 THEN fan_id END) as last_subs
      FROM messages
      WHERE user_id = $1
    `;
    const subsResult = await this.pool.query(subscribersQuery, [userId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)]);
    const currentSubs = parseInt(subsResult.rows[0]?.current_subs || '0');
    const lastSubs = parseInt(subsResult.rows[0]?.last_subs || '0');
    const subsChange = lastSubs > 0 ? (currentSubs - lastSubs) / lastSubs : 0;

    // AI automation rate (percentage of messages sent by AI)
    const aiRateQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE sent_by_ai = true) as ai_messages,
        COUNT(*) as total_messages
      FROM messages
      WHERE user_id = $1 AND direction = 'out' AND created_at >= $2
    `;
    const aiRateResult = await this.pool.query(aiRateQuery, [userId, firstDayThisMonth]);
    const aiMessages = parseInt(aiRateResult.rows[0]?.ai_messages || '0');
    const totalMessages = parseInt(aiRateResult.rows[0]?.total_messages || '0');
    const aiAutomationRate = totalMessages > 0 ? aiMessages / totalMessages : 0;

    return {
      revenueMonthly: Math.round(currentRevenue / 100), // Convert cents to dollars
      activeSubscribers: currentSubs,
      avgResponseSeconds: 72, // TODO: Calculate from message timestamps
      aiAutomationRate,
      change: {
        revenue: revenueChange,
        subscribers: subsChange,
        response: -0.15, // TODO: Calculate actual change
        automation: 0.05, // TODO: Calculate actual change
      },
    };
  }

  /**
   * Get top fans by revenue
   */
  private async getTopFans(userId: number, limit: number = 5): Promise<TopFan[]> {
    const query = `
      SELECT 
        f.id,
        f.name,
        f.handle as username,
        f.value_cents as revenue,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at,
        f.tags
      FROM fans f
      LEFT JOIN messages m ON m.fan_id = f.id AND m.user_id = $1
      WHERE f.user_id = $1
      GROUP BY f.id
      ORDER BY f.value_cents DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);

    return result.rows.map(row => {
      const lastMessageAt = row.last_message_at ? new Date(row.last_message_at) : null;
      const minutesAgo = lastMessageAt 
        ? Math.floor((Date.now() - lastMessageAt.getTime()) / 60000)
        : null;

      let lastActive = 'Never';
      if (minutesAgo !== null) {
        if (minutesAgo < 60) lastActive = `${minutesAgo}m`;
        else if (minutesAgo < 1440) lastActive = `${Math.floor(minutesAgo / 60)}h`;
        else lastActive = `${Math.floor(minutesAgo / 1440)}d`;
      }

      const tags = row.tags || [];
      const badge = tags.includes('vip') ? 'vip' : tags.includes('whale') ? 'whale' : 'loyal';

      return {
        name: row.name,
        username: row.username || '@fan',
        revenue: Math.round(row.revenue / 100), // Convert cents to dollars
        messages: parseInt(row.message_count),
        lastActive,
        badge,
        trend: 0.15, // TODO: Calculate actual trend
      };
    });
  }

  /**
   * Get revenue distribution by platform
   */
  private async getPlatformDistribution(userId: number): Promise<PlatformDistribution[]> {
    const query = `
      SELECT 
        f.platform,
        SUM(f.value_cents) as total_revenue
      FROM fans f
      WHERE f.user_id = $1
      GROUP BY f.platform
      ORDER BY total_revenue DESC
    `;

    const result = await this.pool.query(query, [userId]);
    const totalRevenue = result.rows.reduce((sum, row) => sum + parseInt(row.total_revenue || '0'), 0);

    return result.rows.map(row => {
      const revenue = parseInt(row.total_revenue || '0');
      return {
        platform: row.platform,
        share: totalRevenue > 0 ? revenue / totalRevenue : 0,
        revenue: Math.round(revenue / 100), // Convert cents to dollars
      };
    });
  }

  /**
   * Get revenue series for the last 6 months
   */
  private async getRevenueSeries(userId: number): Promise<RevenueSeries> {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(COALESCE(price_cents, 0)) as revenue
      FROM messages
      WHERE user_id = $1 
        AND price_cents > 0
        AND created_at >= $2
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    const result = await this.pool.query(query, [userId, months[0]]);
    
    const revenueMap = new Map(
      result.rows.map(row => [
        new Date(row.month).toISOString().slice(0, 7),
        Math.round(parseInt(row.revenue || '0') / 100)
      ])
    );

    const labels = months.map(d => d.toLocaleDateString('en-US', { month: 'short' }));
    const values = months.map(d => revenueMap.get(d.toISOString().slice(0, 7)) || 0);

    return { labels, values };
  }

  /**
   * Get fan growth for the last 4 weeks
   */
  private async getFanGrowth(userId: number): Promise<FanGrowth> {
    const weeks: Array<{ start: Date; end: Date }> = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weeks.push({ start: weekStart, end: weekEnd });
    }

    const query = `
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(DISTINCT id) as new_fans,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN id END) as active_fans
      FROM fans
      WHERE user_id = $1 AND created_at >= $2
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week ASC
    `;

    const result = await this.pool.query(query, [userId, weeks[0].start]);

    const labels = weeks.map((_, i) => `Week ${i + 1}`);
    const newFans = weeks.map(() => 0);
    const activeFans = weeks.map(() => 0);

    result.rows.forEach(row => {
      const weekDate = new Date(row.week);
      const weekIndex = weeks.findIndex(w => 
        weekDate >= w.start && weekDate < w.end
      );
      if (weekIndex >= 0) {
        newFans[weekIndex] = parseInt(row.new_fans || '0');
        activeFans[weekIndex] = parseInt(row.active_fans || '0');
      }
    });

    return { labels, newFans, activeFans };
  }
}
