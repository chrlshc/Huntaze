import { NextRequest, NextResponse } from 'next/server';
import { InterventionEffectivenessTrackerImpl } from '@/lib/smart-onboarding/services/interventionEffectivenessTracker';
import { logger } from '@/lib/utils/logger';
import { redisClient } from '@/lib/smart-onboarding/config/redis';

// Initialize service
const effectivenessTracker = new InterventionEffectivenessTrackerImpl();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate time range
    const timeRanges = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000
    };

    const timeWindow = timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['24h'];
    const startTime = new Date(Date.now() - timeWindow);
    const endTime = new Date();

    // Get dashboard data
    const dashboardData = await generateDashboardData(startTime, endTime);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Intervention dashboard API error:', error as any);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateDashboardData(startTime: Date, endTime: Date) {
  try {
    // Get real-time metrics
    const realTimeMetrics = await getRealTimeMetrics();

    // Generate effectiveness report
    const effectivenessReport = await effectivenessTracker.generateEffectivenessReport(
      { start: startTime, end: endTime }
    );

    // Get analytics
    const analytics = await effectivenessTracker.analyzeInterventionPatterns(
      undefined,
      endTime.getTime() - startTime.getTime()
    );

    // Get optimization suggestions
    const suggestions = await effectivenessTracker.getOptimizationSuggestions();

    // Get performance trends
    const trends = await getPerformanceTrends(startTime, endTime);

    return {
      timeRange: {
        start: startTime,
        end: endTime
      },
      realTimeMetrics,
      summary: {
        totalInterventions: analytics.totalInterventions,
        successRate: analytics.successRate,
        averageEffectiveness: analytics.averageEffectiveness,
        averageResolutionTime: analytics.averageResolutionTime,
        userSatisfactionScore: analytics.userSatisfactionScore,
        escalationRate: analytics.escalationRate
      },
      performanceIndicators: analytics.performanceIndicators,
      interventionTypes: effectivenessReport.interventionTypes,
      trends,
      topSuggestions: suggestions.slice(0, 5), // Top 5 suggestions
      alerts: await generateAlerts(analytics),
      lastUpdated: new Date()
    };
  } catch (error) {
    logger.error('Failed to generate dashboard data:', error);
    throw error;
  }
}

async function getRealTimeMetrics() {
  try {
    const cached = await redisClient.get('realtime_intervention_metrics');
    
    if (cached) {
      const metrics = JSON.parse(cached);
      return {
        totalInterventions: metrics.totalInterventions || 0,
        successRate: metrics.successfulInterventions / (metrics.totalInterventions || 1),
        averageEffectiveness: metrics.totalEffectiveness / (metrics.totalInterventions || 1),
        averageResolutionTime: metrics.totalResolutionTime / (metrics.totalInterventions || 1),
        averageUserSatisfaction: metrics.totalSatisfaction / (metrics.totalInterventions || 1),
        escalationRate: metrics.escalations / (metrics.totalInterventions || 1),
        lastUpdated: metrics.lastUpdated
      };
    }

    return {
      totalInterventions: 0,
      successRate: 0,
      averageEffectiveness: 0,
      averageResolutionTime: 0,
      averageUserSatisfaction: 0,
      escalationRate: 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    logger.error('Failed to get real-time metrics:', error);
    return null;
  }
}

async function getPerformanceTrends(startTime: Date, endTime: Date) {
  try {
    const trends = {
      effectiveness: [],
      successRate: [],
      resolutionTime: [],
      userSatisfaction: []
    };

    // Generate hourly data points for the time range
    const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / 3600000);
    const hoursToShow = Math.min(hours, 24); // Limit to 24 hours for readability

    for (let i = 0; i < hoursToShow; i++) {
      const hourStart = new Date(endTime.getTime() - (i + 1) * 3600000);
      const hourEnd = new Date(endTime.getTime() - i * 3600000);
      
      // Get metrics for this hour (this would typically query a database)
      const hourlyMetrics = await getHourlyMetrics(hourStart, hourEnd);
      
      trends.effectiveness.unshift({
        timestamp: hourStart,
        value: hourlyMetrics.averageEffectiveness || 0
      });
      
      trends.successRate.unshift({
        timestamp: hourStart,
        value: hourlyMetrics.successRate || 0
      });
      
      trends.resolutionTime.unshift({
        timestamp: hourStart,
        value: hourlyMetrics.averageResolutionTime || 0
      });
      
      trends.userSatisfaction.unshift({
        timestamp: hourStart,
        value: hourlyMetrics.averageUserSatisfaction || 0
      });
    }

    return trends;
  } catch (error) {
    logger.error('Failed to get performance trends:', error);
    return {
      effectiveness: [],
      successRate: [],
      resolutionTime: [],
      userSatisfaction: []
    };
  }
}

async function getHourlyMetrics(startTime: Date, endTime: Date) {
  try {
    const hourKey = `metrics_hourly:${startTime.getFullYear()}-${startTime.getMonth()}-${startTime.getDate()}-${startTime.getHours()}`;
    const cached = await redisClient.get(hourKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Return default values if no data
    return {
      totalInterventions: 0,
      successRate: 0,
      averageEffectiveness: 0,
      averageResolutionTime: 0,
      averageUserSatisfaction: 0,
      escalationRate: 0
    };
  } catch (error) {
    logger.error('Failed to get hourly metrics:', error);
    return {};
  }
}

async function generateAlerts(analytics: any) {
  const alerts = [];

  // Success rate alert
  if (analytics.successRate < 0.7) {
    alerts.push({
      id: `alert_success_rate_${Date.now()}`,
      type: 'warning',
      severity: analytics.successRate < 0.5 ? 'high' : 'medium',
      title: 'Low Success Rate',
      message: `Intervention success rate is ${(analytics.successRate * 100).toFixed(1)}%, below the target of 70%`,
      recommendation: 'Review intervention strategies and timing',
      createdAt: new Date()
    });
  }

  // Effectiveness alert
  if (analytics.averageEffectiveness < 60) {
    alerts.push({
      id: `alert_effectiveness_${Date.now()}`,
      type: 'warning',
      severity: analytics.averageEffectiveness < 40 ? 'high' : 'medium',
      title: 'Low Effectiveness Score',
      message: `Average effectiveness is ${analytics.averageEffectiveness.toFixed(1)}, below the target of 60`,
      recommendation: 'Optimize intervention content and personalization',
      createdAt: new Date()
    });
  }

  // Escalation rate alert
  if (analytics.escalationRate > 0.2) {
    alerts.push({
      id: `alert_escalation_${Date.now()}`,
      type: 'error',
      severity: 'high',
      title: 'High Escalation Rate',
      message: `Escalation rate is ${(analytics.escalationRate * 100).toFixed(1)}%, above the target of 20%`,
      recommendation: 'Implement more proactive assistance mechanisms',
      createdAt: new Date()
    });
  }

  // Resolution time alert
  if (analytics.averageResolutionTime > 300000) { // 5 minutes
    alerts.push({
      id: `alert_resolution_time_${Date.now()}`,
      type: 'warning',
      severity: 'medium',
      title: 'Slow Resolution Time',
      message: `Average resolution time is ${(analytics.averageResolutionTime / 1000).toFixed(1)} seconds, above the target of 5 minutes`,
      recommendation: 'Optimize intervention timing and reduce complexity',
      createdAt: new Date()
    });
  }

  // User satisfaction alert
  if (analytics.userSatisfactionScore < 7) {
    alerts.push({
      id: `alert_satisfaction_${Date.now()}`,
      type: 'warning',
      severity: analytics.userSatisfactionScore < 5 ? 'high' : 'medium',
      title: 'Low User Satisfaction',
      message: `User satisfaction score is ${analytics.userSatisfactionScore.toFixed(1)}/10, below the target of 7`,
      recommendation: 'Improve intervention quality and user experience',
      createdAt: new Date()
    });
  }

  return alerts;
}