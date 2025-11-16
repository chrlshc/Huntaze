/**
 * Content Performance API
 * 
 * GET /api/analytics/content
 * Returns ranked content performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsAggregationService } from '@/lib/services/metricsAggregationService';
import { auth } from '@/lib/auth/config';;

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/content
 * 
 * Query params:
 * - platform: 'tiktok' | 'instagram' | 'reddit' (optional)
 * - limit: number (default: 10)
 * - sortBy: 'engagement' | 'engagementRate' | 'date' (default: 'engagement')
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
    const platform = searchParams.get('platform') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = (searchParams.get('sortBy') || 'engagement') as any;

    // Get content performance
    const content = await metricsAggregationService.getContentPerformance(userId, {
      platform,
      limit,
      sortBy,
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error: any) {
    console.error('[API] Content analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch content analytics',
      },
      { status: 500 }
    );
  }
}
