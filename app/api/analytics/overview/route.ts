import { withOnboarding } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { analyticsService } from '@/lib/api/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { getCached } from '@/lib/api/utils/cache';

/**
 * GET /api/analytics/overview
 * 
 * Returns analytics overview with key metrics:
 * - ARPU (Average Revenue Per User)
 * - LTV (Lifetime Value)
 * - Churn Rate
 * - Active Subscribers
 * - Total Revenue
 * - Month over Month Growth
 * 
 * Cached for 5 minutes to optimize performance
 */
export const GET = withRateLimit(withOnboarding(async (req) => {
  try {
    const userId = parseInt(req.user.id);
    const cacheKey = `analytics:overview:${userId}`;

    // Get overview with caching (5 min TTL)
    const metrics = await getCached(
      cacheKey,
      () => analyticsService.getOverview(userId),
      { ttl: 300 } // 5 minutes
    );

    return Response.json(successResponse(metrics));
  } catch (error: any) {
    console.error('Analytics overview error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch analytics overview'),
      { status: 500 }
    );
  }
}));
