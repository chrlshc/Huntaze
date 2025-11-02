/**
 * Trend Analysis Service
 * 
 * Analyzes trends and patterns in analytics data
 */

import { analyticsSnapshotsRepository, TimeRange } from '../db/repositories/analyticsSnapshotsRepository';

export type MetricType = 'followers' | 'engagement' | 'posts' | 'reach' | 'impressions';

export interface TimeSeriesData {
  metric: MetricType;
  dataPoints: Array<{
    date: Date;
    value: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface GrowthRates {
  followers: {
    weekOverWeek: number;
    monthOverMonth: number;
  };
  engagement: {
    weekOverWeek: number;
    monthOverMonth: number;
  };
  posts: {
    weekOverWeek: number;
    monthOverMonth: number;
  };
}

export interface TrendInsights {
  summary: string;
  significantChanges: Array<{
    metric: string;
    change: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface PostingTimeInsights {
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  engagementByDayOfWeek: Record<string, number>;
  engagementByHour: Record<number, number>;
}

/**
 * Trend Analysis Service
 */
export class TrendAnalysisService {
  /**
   * Get time series data for a metric
   */
  async getTimeSeries(
    userId: number,
    metric: MetricType,
    timeRange: TimeRange
  ): Promise<TimeSeriesData> {
    const snapshots = await analyticsSnapshotsRepository.findByUserAndTimeRange(
      userId,
      timeRange
    );

    // Group by date and sum across platforms
    const dataByDate = new Map<string, number>();

    for (const snapshot of snapshots) {
      const dateKey = snapshot.snapshotDate.toISOString().split('T')[0];
      const value = this.getMetricValue(snapshot, metric);
      
      dataByDate.set(dateKey, (dataByDate.get(dateKey) || 0) + value);
    }

    // Convert to array and sort by date
    const dataPoints = Array.from(dataByDate.entries())
      .map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate trend
    const { trend, changePercentage } = this.calculateTrend(dataPoints);

    return {
      metric,
      dataPoints,
      trend,
      changePercentage,
    };
  }

  /**
   * Calculate growth rates
   */
  async getGrowthRates(userId: number, timeRange: TimeRange): Promise<GrowthRates> {
    const now = timeRange.endDate;
    
    // Week over week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeek = await analyticsSnapshotsRepository.getAggregatedMetrics(userId, {
      startDate: oneWeekAgo,
      endDate: now,
    });

    const lastWeek = await analyticsSnapshotsRepository.getAggregatedMetrics(userId, {
      startDate: twoWeeksAgo,
      endDate: oneWeekAgo,
    });

    // Month over month
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const thisMonth = await analyticsSnapshotsRepository.getAggregatedMetrics(userId, {
      startDate: oneMonthAgo,
      endDate: now,
    });

    const lastMonth = await analyticsSnapshotsRepository.getAggregatedMetrics(userId, {
      startDate: twoMonthsAgo,
      endDate: oneMonthAgo,
    });

    return {
      followers: {
        weekOverWeek: this.calculatePercentageChange(lastWeek.totalFollowers, thisWeek.totalFollowers),
        monthOverMonth: this.calculatePercentageChange(lastMonth.totalFollowers, thisMonth.totalFollowers),
      },
      engagement: {
        weekOverWeek: this.calculatePercentageChange(lastWeek.totalEngagement, thisWeek.totalEngagement),
        monthOverMonth: this.calculatePercentageChange(lastMonth.totalEngagement, thisMonth.totalEngagement),
      },
      posts: {
        weekOverWeek: this.calculatePercentageChange(lastWeek.totalPosts, thisWeek.totalPosts),
        monthOverMonth: this.calculatePercentageChange(lastMonth.totalPosts, thisMonth.totalPosts),
      },
    };
  }

  /**
   * Analyze trends and generate insights
   */
  async analyzeTrends(userId: number, timeRange: TimeRange): Promise<TrendInsights> {
    const growthRates = await this.getGrowthRates(userId, timeRange);
    
    const significantChanges: Array<{
      metric: string;
      change: number;
      description: string;
    }> = [];

    const recommendations: string[] = [];

    // Analyze followers
    if (Math.abs(growthRates.followers.weekOverWeek) > 10) {
      significantChanges.push({
        metric: 'Followers',
        change: growthRates.followers.weekOverWeek,
        description: `Followers ${growthRates.followers.weekOverWeek > 0 ? 'increased' : 'decreased'} by ${Math.abs(growthRates.followers.weekOverWeek).toFixed(1)}% this week`,
      });

      if (growthRates.followers.weekOverWeek < -10) {
        recommendations.push('Consider reviewing your content strategy to regain followers');
      }
    }

    // Analyze engagement
    if (Math.abs(growthRates.engagement.weekOverWeek) > 15) {
      significantChanges.push({
        metric: 'Engagement',
        change: growthRates.engagement.weekOverWeek,
        description: `Engagement ${growthRates.engagement.weekOverWeek > 0 ? 'increased' : 'decreased'} by ${Math.abs(growthRates.engagement.weekOverWeek).toFixed(1)}% this week`,
      });

      if (growthRates.engagement.weekOverWeek > 15) {
        recommendations.push('Great engagement! Keep posting similar content');
      } else if (growthRates.engagement.weekOverWeek < -15) {
        recommendations.push('Try posting at different times or experimenting with new content formats');
      }
    }

    // Analyze posting frequency
    if (growthRates.posts.weekOverWeek < -20) {
      recommendations.push('Your posting frequency has decreased. Try to maintain a consistent schedule');
    } else if (growthRates.posts.weekOverWeek > 50) {
      recommendations.push('You\'re posting more frequently. Monitor if this improves engagement');
    }

    // Generate summary
    const summary = this.generateSummary(growthRates, significantChanges);

    return {
      summary,
      significantChanges,
      recommendations,
    };
  }

  /**
   * Get best posting times (placeholder - would need post-level timestamps)
   */
  async getBestPostingTimes(userId: number): Promise<PostingTimeInsights> {
    // This would require analyzing post timestamps and their engagement
    // For now, return placeholder data
    return {
      bestDayOfWeek: 'Tuesday',
      bestTimeOfDay: '14:00',
      engagementByDayOfWeek: {
        Monday: 100,
        Tuesday: 150,
        Wednesday: 120,
        Thursday: 130,
        Friday: 110,
        Saturday: 90,
        Sunday: 80,
      },
      engagementByHour: {
        0: 20, 6: 30, 12: 80, 14: 100, 18: 90, 20: 70,
      },
    };
  }

  /**
   * Get metric value from snapshot
   */
  private getMetricValue(snapshot: any, metric: MetricType): number {
    switch (metric) {
      case 'followers':
        return snapshot.followers;
      case 'engagement':
        return snapshot.engagement;
      case 'posts':
        return snapshot.posts;
      case 'reach':
        return snapshot.reach || 0;
      case 'impressions':
        return snapshot.impressions || 0;
      default:
        return 0;
    }
  }

  /**
   * Calculate trend from data points
   */
  private calculateTrend(dataPoints: Array<{ date: Date; value: number }>): {
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
  } {
    if (dataPoints.length < 2) {
      return { trend: 'stable', changePercentage: 0 };
    }

    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;

    const changePercentage = this.calculatePercentageChange(first, last);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (changePercentage > 5) {
      trend = 'up';
    } else if (changePercentage < -5) {
      trend = 'down';
    }

    return { trend, changePercentage };
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }

    return parseFloat((((newValue - oldValue) / oldValue) * 100).toFixed(2));
  }

  /**
   * Generate summary text
   */
  private generateSummary(growthRates: GrowthRates, significantChanges: any[]): string {
    if (significantChanges.length === 0) {
      return 'Your metrics are stable this week with no significant changes';
    }

    const parts: string[] = [];

    if (growthRates.followers.weekOverWeek > 0) {
      parts.push(`gained ${growthRates.followers.weekOverWeek.toFixed(1)}% more followers`);
    } else if (growthRates.followers.weekOverWeek < 0) {
      parts.push(`lost ${Math.abs(growthRates.followers.weekOverWeek).toFixed(1)}% followers`);
    }

    if (growthRates.engagement.weekOverWeek > 0) {
      parts.push(`engagement increased by ${growthRates.engagement.weekOverWeek.toFixed(1)}%`);
    } else if (growthRates.engagement.weekOverWeek < 0) {
      parts.push(`engagement decreased by ${Math.abs(growthRates.engagement.weekOverWeek).toFixed(1)}%`);
    }

    if (parts.length === 0) {
      return 'Your metrics are stable this week';
    }

    return `This week, you ${parts.join(' and ')}`;
  }
}

// Export singleton instance
export const trendAnalysisService = new TrendAnalysisService();
