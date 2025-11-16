/**
 * Platform Analytics API
 * 
 * GET /api/analytics/platform/[platform]
 * Returns platform-specific metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsAggregationService } from '@/lib/services/metricsAggregationService';
import { auth } from '@/lib/auth/config';;

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/platform/[platform]
 * 
 * Params:
 * - platform: 'tiktok' | 'instagram' | 'reddit'
 * 
 * Query params:
 * - timeRange: '7d' | '30d' | '90d' | 'all' (default: '30d')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Validate platform
    if (!['tiktok', 'instagram', 'reddit'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

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
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case '30d':
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const timeRange = { startDate, endDate };

    // Get platform metrics
    const metrics = await metricsAggregationService.getPlatformMetrics(
      userId,
      platform,
      timeRange
    );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[API] Platform analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch platform analytics',
      },
      { status: 500 }
    );
  }
}
