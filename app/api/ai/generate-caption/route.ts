/**
 * AI Generate Caption API Route - Content Caption Generation
 * 
 * Handles caption and hashtag generation for social media content
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types/responses';
import { ApiErrorCode } from '@/lib/api/types/errors';
import { checkCreatorRateLimit, RateLimitError } from '@/lib/ai/rate-limit';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { getUserAIPlanFromSubscription } from '@/lib/ai/plan';
import { z } from 'zod';

/**
 * Request validation schema
 */
const GenerateCaptionRequestSchema = z.object({
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'onlyfans', 'facebook']),
  contentInfo: z.object({
    type: z.string().optional(),
    description: z.string().optional(),
    mood: z.string().optional(),
    targetAudience: z.string().optional(),
    analyticsInsights: z.any().optional(),
  }),
});

/**
 * POST /api/ai/generate-caption
 * 
 * Generate AI-powered caption and hashtags for content
 * 
 * Requirements:
 * - 12.1: Validate authentication
 * - 12.2: Check rate limit
 * - 12.3: Call coordinator.route with generate_caption type
 * - 12.4: Return caption with hashtags
 * - 12.5: Handle errors with appropriate HTTP codes
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = GenerateCaptionRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        createErrorResponse(
          validation.error.errors[0].message,
          ApiErrorCode.VALIDATION_ERROR,
          {
            correlationId,
            startTime,
            metadata: { errors: validation.error.errors },
          }
        ),
        { status: 400 }
      );
    }

    const { platform, contentInfo } = validation.data;
    const creatorId = parseInt(req.user.id);

    // Requirement 12.2: Check rate limit
    const userPlan = await getUserAIPlanFromSubscription(creatorId);
    
    try {
      await checkCreatorRateLimit(creatorId, userPlan);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          createErrorResponse(
            'Rate limit exceeded. Please try again later.',
            ApiErrorCode.RATE_LIMIT_EXCEEDED,
            {
              correlationId,
              startTime,
              retryable: true,
              metadata: {
                retryAfter: error.retryAfter,
                limit: error.limit,
                remaining: error.remaining,
              },
            }
          ),
          {
            status: 429,
            headers: {
              'Retry-After': error.retryAfter.toString(),
              'X-RateLimit-Limit': error.limit.toString(),
              'X-RateLimit-Remaining': error.remaining.toString(),
            },
          }
        );
      }
      throw error;
    }

    // Requirement 12.3: Call coordinator.route with generate_caption type
    const coordinator = new AITeamCoordinator();
    await coordinator.initialize();

    const result = await coordinator.route({
      type: 'generate_caption',
      creatorId,
      platform,
      contentInfo,
    });

    // Check if coordinator returned an error
    if (!result.success) {
      return Response.json(
        createErrorResponse(
          result.error || 'Failed to generate caption',
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

    // Requirement 12.4: Return caption with hashtags
    return Response.json(
      createSuccessResponse(
        {
          caption: result.data.caption,
          hashtags: result.data.hashtags,
          confidence: result.data.confidence,
          performanceInsights: result.data.performanceInsights,
          agentsInvolved: result.agentsInvolved,
          usage: result.usage,
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
    // Requirement 12.5: Handle errors with appropriate HTTP codes
    console.error('[AI Generate Caption API Error]', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check for quota exceeded error
    if (error instanceof Error && (error as any).code === 'QUOTA_EXCEEDED') {
      const details = (error as any).details;
      return Response.json(
        createErrorResponse(
          error.message,
          ApiErrorCode.RATE_LIMIT_EXCEEDED,
          {
            correlationId,
            startTime,
            retryable: false,
            metadata: details,
          }
        ),
        { status: 429 }
      );
    }

    return Response.json(
      createErrorResponse(
        'An error occurred while processing your request',
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
