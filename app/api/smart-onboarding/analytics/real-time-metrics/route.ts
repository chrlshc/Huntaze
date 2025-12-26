import { NextResponse } from 'next/server';
import { assertMockEnabled } from '@/lib/config/mock-data';
// Facade-free minimal implementation (no heavy imports)

export async function GET() {
  const mockDisabled = assertMockEnabled('/api/smart-onboarding/analytics/real-time-metrics');
  if (mockDisabled) return mockDisabled;

  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    // Fetch current and previous metrics for comparison
    const [currentMetrics, previousMetrics] = await Promise.all([
      fetchMetricsForPeriod(fiveMinutesAgo, now),
      fetchMetricsForPeriod(tenMinutesAgo, fiveMinutesAgo)
    ]);

    const metrics = [
      {
        id: 'active_users',
        name: 'Active Users',
        value: currentMetrics.activeUsers,
        previousValue: previousMetrics.activeUsers,
        unit: 'users',
        threshold: { good: 50, warning: 20 },
        trend: getTrend(currentMetrics.activeUsers, previousMetrics.activeUsers),
        changePercent: getChangePercent(currentMetrics.activeUsers, previousMetrics.activeUsers)
      },
      {
        id: 'completion_rate',
        name: 'Completion Rate',
        value: currentMetrics.completionRate,
        previousValue: previousMetrics.completionRate,
        unit: '%',
        threshold: { good: 80, warning: 60 },
        trend: getTrend(currentMetrics.completionRate, previousMetrics.completionRate),
        changePercent: getChangePercent(currentMetrics.completionRate, previousMetrics.completionRate)
      },
      {
        id: 'engagement_score',
        name: 'Engagement Score',
        value: currentMetrics.engagementScore,
        previousValue: previousMetrics.engagementScore,
        unit: '%',
        threshold: { good: 75, warning: 50 },
        trend: getTrend(currentMetrics.engagementScore, previousMetrics.engagementScore),
        changePercent: getChangePercent(currentMetrics.engagementScore, previousMetrics.engagementScore)
      },
      {
        id: 'average_response_time',
        name: 'Avg Response Time',
        value: currentMetrics.averageResponseTime,
        previousValue: previousMetrics.averageResponseTime,
        unit: 'ms',
        threshold: { good: 200, warning: 500 },
        trend: getTrend(previousMetrics.averageResponseTime, currentMetrics.averageResponseTime), // Inverted for response time
        changePercent: getChangePercent(currentMetrics.averageResponseTime, previousMetrics.averageResponseTime)
      },
      {
        id: 'intervention_rate',
        name: 'Intervention Rate',
        value: currentMetrics.interventionRate,
        previousValue: previousMetrics.interventionRate,
        unit: '%',
        threshold: { good: 15, warning: 30 }, // Lower is better for interventions
        trend: getTrend(previousMetrics.interventionRate, currentMetrics.interventionRate), // Inverted
        changePercent: getChangePercent(currentMetrics.interventionRate, previousMetrics.interventionRate)
      },
      {
        id: 'success_prediction',
        name: 'Success Prediction',
        value: currentMetrics.successPrediction,
        previousValue: previousMetrics.successPrediction,
        unit: '%',
        threshold: { good: 80, warning: 60 },
        trend: getTrend(currentMetrics.successPrediction, previousMetrics.successPrediction),
        changePercent: getChangePercent(currentMetrics.successPrediction, previousMetrics.successPrediction)
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: currentMetrics.errorRate,
        previousValue: previousMetrics.errorRate,
        unit: '%',
        threshold: { good: 1, warning: 5 }, // Lower is better
        trend: getTrend(previousMetrics.errorRate, currentMetrics.errorRate), // Inverted
        changePercent: getChangePercent(currentMetrics.errorRate, previousMetrics.errorRate)
      },
      {
        id: 'session_duration',
        name: 'Avg Session Duration',
        value: currentMetrics.sessionDuration,
        previousValue: previousMetrics.sessionDuration,
        unit: 's',
        threshold: { good: 300, warning: 120 },
        trend: getTrend(currentMetrics.sessionDuration, previousMetrics.sessionDuration),
        changePercent: getChangePercent(currentMetrics.sessionDuration, previousMetrics.sessionDuration)
      }
    ];

    return NextResponse.json({
      metrics,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Real-time metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time metrics' },
      { status: 500 }
    );
  }
}

async function fetchMetricsForPeriod(startTime: Date, endTime: Date) {
  try {
    // Methods not implemented yet - returning mock data
    const activeUsers = { count: 0 };
    const completionStats = { completed: 0, total: 0, rate: 0 };
    const engagementStats = { avgTimeOnStep: 0, interactions: 0 };
    const performanceStats = { avgLoadTime: 0 };
    const errorStats = { count: 0, rate: 0 };
    
    // const [
    //   activeUsers,
    //   completionStats,
    //   engagementStats,
    //   performanceStats,
    //   errorStats
    // ] = await Promise.all([
    //   behavioralAnalyticsService.getActiveUsers(startTime),
    //   behavioralAnalyticsService.getCompletionStats(startTime, endTime),
    //   behavioralAnalyticsService.getEngagementStats(startTime, endTime),
    //   behavioralAnalyticsService.getPerformanceStats(startTime, endTime),
    //   behavioralAnalyticsService.getErrorStats(startTime, endTime)
    // ]);

    return {
      activeUsers: activeUsers.count || 0,
      completionRate: completionStats.rate || 0,
      engagementScore: (engagementStats as any).averageEngagement || 0,
      averageResponseTime: (performanceStats as any).averageResponseTime || 0,
      interventionRate: (engagementStats as any).interventionRate || 0,
      successPrediction: (engagementStats as any).averageSuccessPrediction || 0,
      errorRate: errorStats.rate || 0,
      sessionDuration: (engagementStats as any).averageSessionDuration || 0
    };
  } catch (error) {
    console.error('Error fetching metrics for period:', error);
    return {
      activeUsers: 0,
      completionRate: 0,
      engagementScore: 0,
      averageResponseTime: 0,
      interventionRate: 0,
      successPrediction: 0,
      errorRate: 0,
      sessionDuration: 0
    };
  }
}

function getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const changePercent = Math.abs(getChangePercent(current, previous));
  
  if (changePercent < 1) return 'stable';
  return current > previous ? 'up' : 'down';
}

function getChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
