/**
 * AI Quota Status API Route
 * 
 * GET /api/ai/quota
 * 
 * Returns the current AI usage quota for the authenticated user
 * Requirements: 4.1, 4.3
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types/responses';
import { ApiErrorCode } from '@/lib/api/types/errors';
import { getRemainingQuota } from '@/lib/ai/quota';
import { getUserAIPlanFromSubscription } from '@/lib/ai/plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/quota
 * 
 * Get current AI quota status for authenticated user
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    const creatorId = parseInt(req.user.id);

    // Get user's plan
    const userPlan = await getUserAIPlanFromSubscription(creatorId);

    // Get quota information
    const quotaInfo = await getRemainingQuota(creatorId, userPlan);

    return Response.json(
      createSuccessResponse(
        {
          ...quotaInfo,
          plan: userPlan,
        },
        {
          correlationId,
          startTime,
          version: '1.0',
        }
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error('[AI Quota API Error]', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return Response.json(
      createErrorResponse(
        'An error occurred while fetching quota information',
        ApiErrorCode.INTERNAL_ERROR,
        {
          correlationId,
          startTime,
          retryable: true,
        }
      ),
      { status: 500 }
    );
  }
});
