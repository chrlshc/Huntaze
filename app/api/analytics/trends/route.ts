/**
 * Trends API
 * 
 * GET /api/analytics/trends
 * Returns trend analysis and insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { trendAnalysisService } from '@/lib/services/trendAnalysisService';
import { auth } from '@/lib/auth/config';;

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/trends
 * 
 * Query params:
 * - metric: 'followers' | 'engagement' | 'posts' (optional, for time series)
 * - timeRange: '7d' | '30d' | '90d' (default: '30d')
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') as any;
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

    // Get trend data
    const [growthRates, insights] = await Promise.all([
      trendAnalysisService.getGrowthRates(userId, timeRange),
      trendAnalysisService.analyzeTrends(userId, timeRange),
    ]);

    // Get time series if metric specified
    let timeSeries = null;
    if (metric) {
      timeSeries = await trendAnalysisService.getTimeSeries(userId, metric, timeRange);
    }

    return NextResponse.json({
      success: true,
      data: {
        growthRates,
        insights,
        timeSeries,
      },
    });
  } catch (error: any) {
    console.error('[API] Trends analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trends',
      },
      { status: 500 }
    );
  }
}
