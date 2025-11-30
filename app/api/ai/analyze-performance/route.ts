/**
 * AI Analyze Performance API Route - Performance Analysis
 * 
 * Handles performance analysis with AI-powered insights and recommendations
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
const AnalyzePerformanceRequestSchema = z.object({
  metrics: z.object({
    platforms: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    timeframe: z.string().optional(),
    engagementData: z.any().optional(),
    revenueData: z.any().optional(),
    audienceData: z.any().optional(),
  }),
});

/**
 * POST /api/ai/analyze-performance
 * 
 * Analyze performance metrics with AI-powered insights
 * 
 * Requirements:
 * - 12.1: Validate authentication
 * - 12.2: Check rate limit
 * - 12.3: Call coordinator.route with analyze_performance type
 * - 12.4: Return insights and recommendations
 * - 12.5: Handle errors with appropriate HTTP codes
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = AnalyzePerformanceRequestSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        createErrorResponse(
          validation.error.issues[0].message,
          ApiErrorCode.VALIDATION_ERROR,
          {
            correlationId,
            startTime,
            metadata: { errors: validation.error.issues },
          }
        ),
        { status: 400 }
      );
    }

    const { metrics } = validation.data;
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

    // Requirement 12.3: Call coordinator.route with analyze_performance type
    const coordinator = new AITeamCoordinator();
    await coordinator.initialize();

    const result = await coordinator.route({
      type: 'analyze_performance',
      creatorId,
      metrics,
    });

    // Check if coordinator returned an error
    if (!result.success) {
      return Response.json(
        createErrorResponse(
          result.error || 'Failed to analyze performance',
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

    // Requirement 12.4: Return insights and recommendations
    return Response.json(
      createSuccessResponse(
        {
          insights: result.data.insights,
          recommendations: result.data.recommendations,
          patterns: result.data.patterns,
          predictions: result.data.predictions,
          confidence: result.data.confidence,
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
    console.error('[AI Analyze Performance API Error]', {
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
