/**
 * Automation Analytics API Route
 * 
 * GET /api/automations/analytics - Get analytics summary
 * 
 * Requirements: 9.1, 9.3, 9.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAutomationAnalyticsService } from '@/lib/automations/automation-analytics.service';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const automationId = searchParams.get('automationId');
    const type = searchParams.get('type') || 'summary'; // summary, metrics, trends, compare
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Default time range: last 30 days
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr 
      ? new Date(startDateStr) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const timeRange = { startDate, endDate };
    const analyticsService = getAutomationAnalyticsService();

    switch (type) {
      case 'metrics': {
        const metrics = automationId
          ? await analyticsService.getExecutionMetrics(automationId)
          : await analyticsService.getUserExecutionMetrics(userId);
        
        return NextResponse.json({ metrics });
      }

      case 'trends': {
        const trends = await analyticsService.getTrends(
          userId,
          timeRange,
          automationId || undefined
        );
        
        return NextResponse.json({ trends });
      }

      case 'compare': {
        const automationIds = searchParams.get('automationIds')?.split(',');
        const comparisons = await analyticsService.compareAutomations(
          userId,
          automationIds
        );
        
        return NextResponse.json({ comparisons });
      }

      case 'triggers': {
        const triggerBreakdown = await analyticsService.getTriggerBreakdown(
          userId,
          timeRange
        );
        
        return NextResponse.json({ triggerBreakdown });
      }

      case 'summary':
      default: {
        const summary = await analyticsService.getAnalyticsSummary(
          userId,
          timeRange
        );
        
        return NextResponse.json(summary);
      }
    }
  } catch (error) {
    console.error('[AutomationAnalytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
