/**
 * Audience Insights API
 * 
 * GET /api/analytics/audience
 * Returns audience insights and demographics
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsAggregationService } from '@/lib/services/metricsAggregationService';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/audience
 * 
 * Query params:
 * - timeRange: '7d' | '30d' | '90d' (default: '30d')
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const timeRangeParam = searchParams.get('timeRange') || '30d';

    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRangeParam) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const timeRange = { startDate, endDate };

    // Get audience insights
    const insights = await metricsAggregationService.getAudienceInsights(userId, timeRange);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error('[API] Audience analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch audience insights',
      },
      { status: 500 }
    );
  }
}
