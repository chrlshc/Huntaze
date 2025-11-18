/**
 * GET /api/onlyfans/fans
 * 
 * Retrieves paginated list of OnlyFans fans/subscribers
 * Includes subscription details, spending history, and engagement metrics
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { onlyFansService } from '@/lib/api/services/onlyfans.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { getCached } from '@/lib/api/utils/cache';

export const GET = withRateLimit(withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return Response.json(
        errorResponse('VALIDATION_ERROR', 'Limit must be between 1 and 100'),
        { status: 400 }
      );
    }

    if (offset < 0) {
      return Response.json(
        errorResponse('VALIDATION_ERROR', 'Offset must be non-negative'),
        { status: 400 }
      );
    }

    // Get user ID from authenticated request
    const userId = parseInt(req.user.id);

    // Fetch fans with caching (10 minute TTL)
    const result = await getCached(
      `onlyfans:fans:${userId}:${limit}:${offset}`,
      async () => await onlyFansService.getFans(userId, { limit, offset }),
      { ttl: 600, namespace: 'onlyfans' }
    );

    return Response.json(successResponse(result));
  } catch (error: any) {
    console.error('[OnlyFans Fans API] Error:', error);
    return Response.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch OnlyFans fans'),
      { status: 500 }
    );
  }
}));
