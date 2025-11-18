import { withAuth } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { analyticsService } from '@/lib/api/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { getCached } from '@/lib/api/utils/cache';

/**
 * GET /api/analytics/trends
 * 
 * Returns time-series trend data for analytics metrics
 * 
 * Query Parameters:
 * - metric: 'revenue' | 'subscribers' | 'arpu' (required)
 * - period: 'day' | 'week' | 'month' (default: 'day')
 * - days: number of days to look back (default: 30)
 * 
 * Example: /api/analytics/trends?metric=revenue&period=day&days=30
 * 
 * Cached for 5 minutes to optimize performance
 */
export const GET = withRateLimit(withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(req.user.id);

    // Parse query parameters
    const metric = searchParams.get('metric');
    const period = (searchParams.get('period') || 'day') as 'day' | 'week' | 'month';
    const days = parseInt(searchParams.get('days') || '30');

    // Validate required parameters
    if (!metric) {
      return Response.json(
        errorResponse('VALIDATION_ERROR', 'Missing required parameter: metric'),
        { status: 400 }
      );
    }

    // Validate metric
    const validMetrics = ['revenue', 'subscribers', 'arpu'];
    if (!validMetrics.includes(metric)) {
      return Response.json(
        errorResponse(
          'VALIDATION_ERROR',
          `Invalid metric. Must be one of: ${validMetrics.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods = ['day', 'week', 'month'];
    if (!validPeriods.includes(period)) {
      return Response.json(
        errorResponse(
          'VALIDATION_ERROR',
          `Invalid period. Must be one of: ${validPeriods.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Validate days
    if (isNaN(days) || days < 1 || days > 365) {
      return Response.json(
        errorResponse('VALIDATION_ERROR', 'Days must be between 1 and 365'),
        { status: 400 }
      );
    }

    const cacheKey = `analytics:trends:${userId}:${metric}:${period}:${days}`;

    // Get trends with caching (5 min TTL)
    const trends = await getCached(
      cacheKey,
      () => analyticsService.getTrends(userId, metric, period, days),
      { ttl: 300 } // 5 minutes
    );

    return Response.json(successResponse(trends));
  } catch (error: any) {
    console.error('Analytics trends error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch analytics trends'),
      { status: 500 }
    );
  }
}));
