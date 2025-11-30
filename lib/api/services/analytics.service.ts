import { prisma } from '@/lib/prisma';

export interface AnalyticsMetrics {
  arpu: number; // Average Revenue Per User
  ltv: number; // Lifetime Value
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  momGrowth: number; // Month over Month growth
}

export interface TrendData {
  date: string;
  value: number;
}

export class AnalyticsService {
  /**
   * Get analytics overview with key metrics
   */
  async getOverview(userId: number): Promise<AnalyticsMetrics> {
    // Get current month data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get revenue data
    const [currentRevenue, lastMonthRevenue, subscribers] = await Promise.all([
      this.getRevenueForPeriod(userId, startOfMonth, now),
      this.getRevenueForPeriod(userId, startOfLastMonth, endOfLastMonth),
      this.getActiveSubscribers(userId),
    ]);

    // Calculate metrics
    const arpu = subscribers > 0 ? currentRevenue / subscribers : 0;
    const ltv = arpu * 12; // Simplified: assume 12 month average lifetime
    const churnRate = await this.calculateChurnRate(userId);
    const momGrowth =
      lastMonthRevenue > 0
        ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return {
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      activeSubscribers: subscribers,
      totalRevenue: Math.round(currentRevenue * 100) / 100,
      momGrowth: Math.round(momGrowth * 100) / 100,
    };
  }

  /**
   * Get trend data for a specific metric over time
   */
  async getTrends(
    userId: number,
    metric: string,
    period: 'day' | 'week' | 'month' = 'day',
    days: number = 30
  ): Promise<TrendData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (metric) {
      case 'revenue':
        return this.getRevenueTrends(userId, startDate, endDate, period);
      case 'subscribers':
        return this.getSubscriberTrends(userId, startDate, endDate, period);
      case 'arpu':
        return this.getArpuTrends(userId, startDate, endDate, period);
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }

  /**
   * Get revenue for a specific period
   */
  private async getRevenueForPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum?.amount || 0;
  }

  /**
   * Get active subscribers count
   */
  private async getActiveSubscribers(userId: number): Promise<number> {
    return prisma.subscriptions.count({
      where: {
        user_id: userId,
        status: 'active',
      },
    });
  }

  /**
   * Calculate churn rate for current month
   */
  private async calculateChurnRate(userId: number): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [startCount, churnedCount] = await Promise.all([
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          created_at: { lt: startOfMonth },
        },
      }),
      prisma.subscriptions.count({
        where: {
          user_id: userId,
          status: 'cancelled',
          updated_at: { gte: startOfMonth },
        },
      }),
    ]);

    return startCount > 0 ? (churnedCount / startCount) * 100 : 0;
  }

  /**
   * Get revenue trends over time
   */
  private async getRevenueTrends(
    userId: number,
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendData[]> {
    const transactions = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        status: 'completed',
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return this.aggregateByPeriod(
      transactions,
      period,
      (items: Array<{ amount: number; created_at: Date }>) =>
        items.reduce((sum, item) => sum + item.amount, 0)
    );
  }

  /**
   * Get subscriber trends over time
   */
  private async getSubscriberTrends(
    userId: number,
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendData[]> {
    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        user_id: userId,
        started_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        started_at: true,
      },
      orderBy: {
        started_at: 'asc',
      },
    });

    return this.aggregateByPeriod(
      subscriptions.map((s: { started_at: Date }) => ({ created_at: s.started_at })),
      period,
      (items) => items.length
    );
  }

  /**
   * Get ARPU trends over time
   */
  private async getArpuTrends(
    userId: number,
    startDate: Date,
    endDate: Date,
    period: 'day' | 'week' | 'month'
  ): Promise<TrendData[]> {
    const [revenueTrends, subscriberTrends] = await Promise.all([
      this.getRevenueTrends(userId, startDate, endDate, period),
      this.getSubscriberTrends(userId, startDate, endDate, period),
    ]);

    // Calculate ARPU for each period
    return revenueTrends.map((revenue, index) => {
      const subscribers = subscriberTrends[index]?.value || 0;
      const arpu = subscribers > 0 ? revenue.value / subscribers : 0;
      return {
        date: revenue.date,
        value: Math.round(arpu * 100) / 100,
      };
    });
  }

  /**
   * Aggregate data by period (day, week, month)
   */
  private aggregateByPeriod<T extends { created_at: Date }>(
    items: T[],
    period: 'day' | 'week' | 'month',
    aggregator: (items: T[]) => number
  ): TrendData[] {
    const grouped = new Map<string, T[]>();

    items.forEach((item) => {
      const key = this.getPeriodKey(item.created_at, period);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    return Array.from(grouped.entries())
      .map(([date, items]) => ({
        date,
        value: aggregator(items),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get period key for grouping
   */
  private getPeriodKey(date: Date, period: 'day' | 'week' | 'month'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekYear = weekStart.getFullYear();
        const weekMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
        const weekDay = String(weekStart.getDate()).padStart(2, '0');
        return `${weekYear}-${weekMonth}-${weekDay}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }
}

export const analyticsService = new AnalyticsService();
