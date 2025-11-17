/**
 * GET /api/onlyfans/stats
 * 
 * Retrieves OnlyFans-specific statistics and metrics
 * Includes fan counts, revenue data, retention rates, and top content
 */

import { NextRequest } from 'next/server';
import { withOnboarding } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { onlyFansService } from '@/lib/api/services/onlyfans.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { getCached } from '@/lib/api/utils/cache';

export const GET = withRateLimit(withOnboarding(async (req) => {
  try {
    // Get user ID from authenticated request
    const userId = parseInt(req.user.id);

    // Fetch stats with caching (10 minute TTL)
    const stats = await getCached(
      `onlyfans:stats:${userId}`,
      async () => await onlyFansService.getStats(userId),
      { ttl: 600, namespace: 'onlyfans' }
    );

    return Response.json(successResponse(stats));
  } catch (error: any) {
    console.error('[OnlyFans Stats API] Error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch OnlyFans statistics'),
      { status: 500 }
    );
  }
}));
