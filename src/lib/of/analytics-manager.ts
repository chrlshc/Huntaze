// OnlyFans Analytics Manager
// Provides detailed analytics and insights like Infloww

import type { FanAnalytics, OfConversation } from '@/lib/types/onlyfans';

// Mock data storage (replace with database)
const fanData = new Map<string, OfConversation[]>();
const revenueData = new Map<string, Array<{
  date: Date;
  type: 'subscription' | 'tip' | 'ppv';
  amount: number;
  fanId: string;
}>>();

export class AnalyticsManager {
  // Get comprehensive fan analytics
  async getFanAnalytics(
    userId: string,
    period: '24h' | '7d' | '30d' | 'all' = '30d'
  ): Promise<FanAnalytics> {
    const fans = fanData.get(userId) || [];
    const revenues = revenueData.get(userId) || [];
    
    // Calculate date cutoff
    const now = new Date();
    const cutoffDate = this.getCutoffDate(period, now);
    
    // Filter data by period
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
      conversionRates: this.calculateConversionRates(fans, periodRevenues)
    };
    
    // Calculate average spend
    const uniqueFanIds = new Set(periodRevenues.map(r => r.fanId));
    metrics.averageSpendPerFan = uniqueFanIds.size > 0 
      ? metrics.revenue.total / uniqueFanIds.size 
      : 0;
    
    return {
      userId,
      period,
      metrics
    };
  }

  // Get fan segments with counts
  async getFanSegments(userId: string): Promise<Array<{
    segment: string;
    count: number;
    percentage: number;
    avgSpend: number;
  }>> {
    const fans = fanData.get(userId) || [];
    const totalFans = fans.length || 1;

    const segments = [
      {
        segment: 'Whales ($500+)',
        fans: fans.filter(f => f.totalSpent >= 500)
      },
      {
        segment: 'Big Spenders ($100-$499)',
        fans: fans.filter(f => f.totalSpent >= 100 && f.totalSpent < 500)
      },
      {
        segment: 'Regular Spenders ($20-$99)',
        fans: fans.filter(f => f.totalSpent >= 20 && f.totalSpent < 100)
      },
      {
        segment: 'Low Spenders ($1-$19)',
        fans: fans.filter(f => f.totalSpent >= 1 && f.totalSpent < 20)
      },
      {
        segment: 'Non-Spenders ($0)',
        fans: fans.filter(f => f.totalSpent === 0)
      },
      {
        segment: 'Active (7d)',
        fans: fans.filter(f => {
          const daysSinceActive = (new Date().getTime() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceActive <= 7;
        })
      },
      {
        segment: 'Silent (7-30d)',
        fans: fans.filter(f => {
          const daysSinceActive = (new Date().getTime() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceActive > 7 && daysSinceActive <= 30;
        })
      },
      {
        segment: 'Inactive (30d+)',
        fans: fans.filter(f => {
          const daysSinceActive = (new Date().getTime() - f.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceActive > 30;
        })
      }
    ];

    return segments.map(seg => ({
      segment: seg.segment,
      count: seg.fans.length,
      percentage: (seg.fans.length / totalFans) * 100,
      avgSpend: seg.fans.length > 0 
        ? seg.fans.reduce((sum, f) => sum + f.totalSpent, 0) / seg.fans.length
        : 0
    }));
  }

  // Get engagement metrics
  async getEngagementMetrics(userId: string, period: '7d' | '30d' = '30d'): Promise<{
    messagesPerDay: number;
    avgResponseTime: number;
    peakHours: Array<{ hour: number; messageCount: number }>;
    mostActiveDays: Array<{ day: string; messageCount: number }>;
  }> {
    // Mock implementation
    const peakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      messageCount: Math.floor(Math.random() * 50) + 10
    })).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDays = days.map(day => ({
      day,
      messageCount: Math.floor(Math.random() * 200) + 50
    })).sort((a, b) => b.messageCount - a.messageCount).slice(0, 3);

    return {
      messagesPerDay: 45,
      avgResponseTime: 12, // minutes
      peakHours,
      mostActiveDays
    };
  }

  // Get revenue trends
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
    const revenues = revenueData.get(userId) || [];
    const cutoffDate = this.getCutoffDate(period, new Date());
    const periodRevenues = revenues.filter(r => r.date >= cutoffDate);

    // Group by day
    const dailyMap = new Map<string, { revenue: number; breakdown: Record<string, number> }>();
    
    periodRevenues.forEach(rev => {
      const dateKey = rev.date.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { revenue: 0, breakdown: {} };
      
      existing.revenue += rev.amount;
      existing.breakdown[rev.type] = (existing.breakdown[rev.type] || 0) + rev.amount;
      
      dailyMap.set(dateKey, existing);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate weekly trends
    const weekly = this.calculateWeeklyTrends(daily);

    // Simple projections based on recent trends
    const recentDailyAvg = daily.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7;
    const projections = {
      nextWeek: recentDailyAvg * 7,
      nextMonth: recentDailyAvg * 30
    };

    return { daily, weekly, projections };
  }

  // Helper methods
  private getCutoffDate(period: string, now: Date): Date {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysAgo = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 0;
    return daysAgo === 0 ? new Date(0) : new Date(now.getTime() - daysAgo * msPerDay);
  }

  private countNewFans(fans: OfConversation[], cutoffDate: Date): number {
    return fans.filter(f => f.createdAt >= cutoffDate && f.isSubscribed).length;
  }

  private countExpiredFans(fans: OfConversation[], cutoffDate: Date): number {
    return fans.filter(f => 
      f.subscriptionExpiry && 
      f.subscriptionExpiry >= cutoffDate && 
      f.subscriptionExpiry <= new Date() &&
      !f.isSubscribed
    ).length;
  }

  private countActiveConversations(fans: OfConversation[], cutoffDate: Date): number {
    return fans.filter(f => f.lastMessageAt >= cutoffDate).length;
  }

  private calculateRevenue(revenues: Array<{ type: string; amount: number }>): {
    subscriptions: number;
    tips: number;
    ppv: number;
    total: number;
  } {
    const breakdown = {
      subscriptions: 0,
      tips: 0,
      ppv: 0,
      total: 0
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

  private getTopSpenders(fans: OfConversation[], limit: number): Array<{
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
        lastPurchase: f.lastPurchaseAt || f.createdAt
      }));
  }

  private calculateConversionRates(
    fans: OfConversation[],
    revenues: Array<{ fanId: string; type: string }>
  ): {
    freeToSaid: number;
    subscriberToPurchaser: number;
    ppvOpenRate: number;
  } {
    const freeFans = fans.filter(f => (f.subscriptionPrice || 0) === 0);
    const paidFans = fans.filter(f => (f.subscriptionPrice || 0) > 0);
    const purchaserIds = new Set(revenues.map(r => r.fanId));
    const ppvPurchaserIds = new Set(revenues.filter(r => r.type === 'ppv').map(r => r.fanId));

    return {
      freeToSaid: freeFans.length > 0 ? (paidFans.length / (freeFans.length + paidFans.length)) * 100 : 0,
      subscriberToPurchaser: paidFans.length > 0 
        ? (paidFans.filter(f => purchaserIds.has(f.platformUserId)).length / paidFans.length) * 100 
        : 0,
      ppvOpenRate: 25 // Mock - would be calculated from actual PPV campaign stats
    };
  }

  private calculateWeeklyTrends(
    daily: Array<{ date: string; revenue: number }>
  ): Array<{ week: string; revenue: number; growth: number }> {
    // Group by week
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

    // Calculate growth rates
    return weeks.map((week, index) => {
      const previousWeek = weeks[index - 1];
      const growth = previousWeek 
        ? ((week.revenue - previousWeek.revenue) / previousWeek.revenue) * 100
        : 0;
      
      return { ...week, growth };
    });
  }
}

// Export singleton
export const analyticsManager = new AnalyticsManager();

// Mock data seeder for testing
export function seedMockAnalytics(userId: string): void {
  // Create mock fans
  const mockFans: OfConversation[] = Array.from({ length: 250 }, (_, i) => {
    const totalSpent = Math.random() < 0.1 ? Math.floor(Math.random() * 1000) + 500 : // 10% whales
                       Math.random() < 0.3 ? Math.floor(Math.random() * 400) + 100 : // 20% big spenders
                       Math.random() < 0.6 ? Math.floor(Math.random() * 80) + 20 :   // 30% regular
                       Math.random() < 0.8 ? Math.floor(Math.random() * 19) + 1 :    // 20% low
                       0; // 20% non-spenders

    const daysAgo = Math.floor(Math.random() * 180);
    const lastMessageDaysAgo = Math.floor(Math.random() * 60);
    
    return {
      id: `conv_${i}`,
      userId,
      platformUserId: `of_user_${i}`,
      username: `fan_${i}`,
      displayName: `Fan ${i}`,
      avatarUrl: `https://via.placeholder.com/50`,
      isSubscribed: Math.random() < 0.7,
      subscriptionPrice: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 30) + 5,
      subscriptionExpiry: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
      totalSpent,
      totalTips: Math.floor(totalSpent * 0.3),
      totalPPVPurchases: Math.floor(totalSpent * 0.7),
      lastPurchaseAt: totalSpent > 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      lastMessageAt: new Date(Date.now() - lastMessageDaysAgo * 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(Date.now() - lastMessageDaysAgo * 24 * 60 * 60 * 1000),
      unreadCount: Math.floor(Math.random() * 5),
      tags: totalSpent > 500 ? ['VIP', 'whale'] : totalSpent > 100 ? ['big_spender'] : [],
      customLabels: [],
      welcomeMessageSent: true,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };
  });

  fanData.set(userId, mockFans);

  // Create mock revenue data
  const mockRevenues = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dailyTransactions = Math.floor(Math.random() * 20) + 5;
    
    for (let j = 0; j < dailyTransactions; j++) {
      const fanIndex = Math.floor(Math.random() * mockFans.length);
      const fan = mockFans[fanIndex];
      
      if (fan.totalSpent > 0) {
        const type: 'subscription' | 'tip' | 'ppv' = Math.random() < 0.1 ? 'subscription' :
                     Math.random() < 0.4 ? 'tip' : 'ppv';
        
        const amount = type === 'subscription' ? fan.subscriptionPrice || 10 :
                       type === 'tip' ? Math.floor(Math.random() * 50) + 5 :
                       Math.floor(Math.random() * 100) + 20;
        
        mockRevenues.push({
          date,
          type,
          amount,
          fanId: fan.platformUserId
        });
      }
    }
  }

  revenueData.set(userId, mockRevenues);
}
