/**
 * AI Optimize Sales API Route - Sales Message Optimization
 * 
 * POST /api/ai/optimize-sales
 * 
 * Handles sales message optimization with AI-powered conversion tactics.
 * Includes automatic retry logic, structured error handling, and performance monitoring.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * @endpoint POST /api/ai/optimize-sales
 * @authentication Required (NextAuth session via withAuth middleware)
 * @rateLimit Plan-based rate limiting (Starter: 100/day, Pro: 500/day, Enterprise: unlimited)
 * 
 * @requestBody
 * {
 *   fanId: string,
 *   context: {
 *     currentMessage?: string,
 *     fanProfile?: object,
 *     purchaseHistory?: object,
 *     engagementLevel?: 'low' | 'medium' | 'high',
 *     contentType?: string,
 *     pricePoint?: number
 *   }
 * }
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     message: string,
 *     tactics: string[],
 *     suggestedPrice?: number,
 *     confidence: number,
 *     expectedConversionRate: number,
 *     alternativeMessages: string[],
 *     agentsInvolved: string[],
 *     usage: object
 *   },
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     duration: number,
 *     version: string
 *   }
 * }
 * 
 * @responseBody Error (400/401/429/500/503)
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     retryable: boolean
 *   },
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     duration: number
 *   }
 * }
 * 
 * @example
 * POST /api/ai/optimize-sales
 * {
 *   "fanId": "fan_123",
 *   "context": {
 *     "currentMessage": "Check out my new content!",
 *     "engagementLevel": "high",
 *     "pricePoint": 25
 *   }
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Hey! I just posted exclusive content you'll love 💕 Only $25 - limited time!",
 *     "tactics": ["urgency", "personalization", "value_proposition"],
 *     "confidence": 0.87,
 *     "expectedConversionRate": 0.34,
 *     "alternativeMessages": ["..."],
 *     "agentsInvolved": ["sales"],
 *     "usage": { "tokensInput": 150, "tokensOutput": 80 }
 *   },
 *   "meta": {
 *     "timestamp": "2024-11-22T10:30:00.000Z",
 *     "requestId": "req_abc123",
 *     "duration": 1250,
 *     "version": "1.0"
 *   }
 * }
 * 
 * @see app/api/ai/optimize-sales/README.md
 * @see tests/integration/api/ai-routes.integration.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types/responses';
import { ApiErrorCode } from '@/lib/api/types/errors';
import { checkCreatorRateLimit, RateLimitError } from '@/lib/ai/rate-limit';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { getUserAIPlanFromSubscription } from '@/lib/ai/plan';
import { createLogger } from '@/lib/utils/logger';
import { z } from 'zod';

// Force Node.js runtime (required for AI operations)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('ai-optimize-sales');

// ============================================================================
// Configuration
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds for AI operations

// ============================================================================
// Types
// ============================================================================

/**
 * Request validation schema
 */
const OptimizeSalesRequestSchema = z.object({
  fanId: z.string().min(1, 'Fan ID is required'),
  context: z.object({
    currentMessage: z.string().optional(),
    fanProfile: z.any().optional(),
    purchaseHistory: z.any().optional(),
    engagementLevel: z.enum(['low', 'medium', 'high']).optional(),
    contentType: z.string().optional(),
    pricePoint: z.number().positive('Price must be positive').optional(),
  }),
});

type OptimizeSalesRequest = z.infer<typeof OptimizeSalesRequestSchema>;

/**
 * Success response data structure
 */
interface OptimizeSalesData {
  message: string;
  tactics: string[];
  suggestedPrice?: number;
  confidence: number;
  expectedConversionRate: number;
  alternativeMessages: string[];
  agentsInvolved: string[];
  usage: {
    tokensInput: number;
    tokensOutput: number;
    costUsd: number;
  };
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second for AI operations
  maxDelay: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'COORDINATOR_TIMEOUT',
    'AI_SERVICE_UNAVAILABLE',
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
  if (error.code && networkErrors.includes(error.code)) {
    return true;
  }

  // AI service errors
  if (error.message) {
    const retryableMessages = [
      'timeout',
      'unavailable',
      'overloaded',
      'rate limit',
      'service temporarily unavailable',
    ];
    const message = error.message.toLowerCase();
    return retryableMessages.some((msg) => message.includes(msg));
  }

  return false;
}

/**
 * Retry operation with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = isRetryableError(error);

    if (!retryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying AI operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
      errorCode: error.code,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST /api/ai/optimize-sales
 * 
 * Optimize sales message with AI-powered conversion tactics
 * 
 * Requirements:
 * - 12.1: Validate authentication (handled by withAuth middleware)
 * - 12.2: Check rate limit based on user plan
 * - 12.3: Call coordinator.route with optimize_sales type
 * - 12.4: Return optimized message with tactics
 * - 12.5: Handle errors with appropriate HTTP codes
 */
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    logger.info('Sales optimization request received', {
      correlationId,
      userId: req.user.id,
    });

    // 1. Parse and validate request body with timeout protection
    let body: any;
    try {
      body = await Promise.race([
        req.json(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
        ),
      ]);
    } catch (parseError: any) {
      if (parseError.message === 'Request timeout') {
        logger.error('Request body parsing timeout', parseError, { correlationId });

        return Response.json(
          createErrorResponse(
            'Request timed out. Please try again.',
            ApiErrorCode.TIMEOUT_ERROR,
            {
              correlationId,
              startTime,
              retryable: true,
            }
          ),
          {
            status: 504,
            headers: {
              'X-Correlation-Id': correlationId,
              'Retry-After': '5',
            },
          }
        );
      }

      logger.warn('Invalid request body', {
        correlationId,
        error: parseError.message,
      });

      return Response.json(
        createErrorResponse(
          'Invalid request body',
          ApiErrorCode.VALIDATION_ERROR,
          {
            correlationId,
            startTime,
            retryable: false,
          }
        ),
        { 
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    // 2. Validate request schema
    const validation = OptimizeSalesRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Request validation failed', {
        correlationId,
        errors: validation.error.issues,
      });

      return Response.json(
        createErrorResponse(
          validation.error.issues[0].message,
          ApiErrorCode.VALIDATION_ERROR,
          {
            correlationId,
            startTime,
            retryable: false,
            metadata: { errors: validation.error.issues },
          }
        ),
        { 
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    const { fanId, context } = validation.data;
    const creatorId = parseInt(req.user.id);

    // Validate creatorId
    if (isNaN(creatorId) || creatorId <= 0) {
      logger.warn('Invalid creator ID', {
        correlationId,
        userId: req.user.id,
      });

      return Response.json(
        createErrorResponse(
          'Invalid user ID',
          ApiErrorCode.VALIDATION_ERROR,
          {
            correlationId,
            startTime,
            retryable: false,
          }
        ),
        { 
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    logger.info('Request validated', {
      correlationId,
      creatorId,
      fanId,
      hasCurrentMessage: !!context.currentMessage,
      engagementLevel: context.engagementLevel,
    });

    // 3. Requirement 12.2: Check rate limit with retry logic
    let userPlan: 'starter' | 'pro' | 'business' | undefined;
    try {
      userPlan = await retryWithBackoff(
        async () => {
          return await getUserAIPlanFromSubscription(creatorId);
        },
        correlationId
      );

      logger.info('User plan retrieved', {
        correlationId,
        creatorId,
        plan: userPlan,
      });
    } catch (planError: any) {
      logger.error('Failed to retrieve user plan', planError, {
        correlationId,
        creatorId,
      });

      return Response.json(
        createErrorResponse(
          'Service temporarily unavailable. Please try again.',
          ApiErrorCode.INTERNAL_ERROR,
          {
            correlationId,
            startTime,
            retryable: true,
          }
        ),
        {
          status: 503,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '60',
          },
        }
      );
    }
    
    try {
      await checkCreatorRateLimit(creatorId, userPlan);
      
      logger.info('Rate limit check passed', {
        correlationId,
        creatorId,
        plan: userPlan,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn('Rate limit exceeded', {
          correlationId,
          creatorId,
          plan: userPlan,
          limit: error.limit,
          remaining: error.remaining,
          retryAfter: error.retryAfter,
        });

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
                plan: userPlan,
              },
            }
          ),
          {
            status: 429,
            headers: {
              'Retry-After': error.retryAfter.toString(),
              'X-RateLimit-Limit': error.limit.toString(),
              'X-RateLimit-Remaining': error.remaining.toString(),
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
      throw error;
    }

    // 4. Requirement 12.3: Call coordinator.route with optimize_sales type (with retry)
    let result;
    try {
      logger.info('Initializing AI coordinator', {
        correlationId,
        creatorId,
        fanId,
      });

      result = await retryWithBackoff(
        async () => {
          const coordinator = new AITeamCoordinator();
          await coordinator.initialize();

          logger.info('Routing to sales agent', {
            correlationId,
            creatorId,
            fanId,
          });

          return await coordinator.route({
            type: 'optimize_sales',
            creatorId,
            fanId,
            context,
          });
        },
        correlationId
      );
    } catch (coordinatorError: any) {
      logger.error('AI coordinator error', coordinatorError, {
        correlationId,
        creatorId,
        fanId,
        duration: Date.now() - startTime,
      });

      return Response.json(
        createErrorResponse(
          'AI service temporarily unavailable. Please try again.',
          ApiErrorCode.INTERNAL_ERROR,
          {
            correlationId,
            startTime,
            retryable: true,
          }
        ),
        {
          status: 503,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '60',
          },
        }
      );
    }

    // Check if coordinator returned an error
    if (!result.success) {
      logger.error('Coordinator returned error', new Error(result.error || 'Unknown error'), {
        correlationId,
        creatorId,
        fanId,
        error: result.error,
        duration: Date.now() - startTime,
      });

      return Response.json(
        createErrorResponse(
          result.error || 'Failed to optimize sales message',
          ApiErrorCode.INTERNAL_ERROR,
          {
            correlationId,
            startTime,
            retryable: true,
          }
        ),
        { 
          status: 500,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '10',
          },
        }
      );
    }

    // 5. Requirement 12.4: Return optimized message with tactics
    const duration = Date.now() - startTime;

    // Normalize usage data (coordinator returns totalInputTokens/totalOutputTokens)
    const normalizedUsage = result.usage ? {
      tokensInput: (result.usage as any).totalInputTokens || (result.usage as any).tokensInput || 0,
      tokensOutput: (result.usage as any).totalOutputTokens || (result.usage as any).tokensOutput || 0,
      costUsd: (result.usage as any).totalCostUsd || (result.usage as any).costUsd || 0,
    } : { tokensInput: 0, tokensOutput: 0, costUsd: 0 };

    logger.info('Sales optimization successful', {
      correlationId,
      creatorId,
      fanId,
      duration,
      confidence: result.data.confidence,
      agentsInvolved: result.agentsInvolved,
      tokensUsed: normalizedUsage.tokensInput + normalizedUsage.tokensOutput,
    });

    const responseData: OptimizeSalesData = {
      message: result.data.message,
      tactics: result.data.tactics || [],
      suggestedPrice: result.data.suggestedPrice,
      confidence: result.data.confidence || 0,
      expectedConversionRate: result.data.expectedConversionRate || 0,
      alternativeMessages: result.data.alternativeMessages || [],
      agentsInvolved: result.agentsInvolved || [],
      usage: normalizedUsage,
    };

    return Response.json(
      createSuccessResponse(
        responseData,
        {
          correlationId,
          startTime,
          version: '1.0',
        }
      ),
      { 
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Requirement 12.5: Handle errors with appropriate HTTP codes
    logger.error('Unexpected error in sales optimization', error, {
      correlationId,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    // Check for quota exceeded error
    if (error instanceof Error && (error as any).code === 'QUOTA_EXCEEDED') {
      const details = (error as any).details;
      
      logger.warn('Quota exceeded', {
        correlationId,
        details,
      });

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
        { 
          status: 429,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
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
      { 
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '10',
        },
      }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 * 
 * Returns allowed methods and caching headers for CORS preflight requests.
 * This is required for cross-origin requests from web browsers.
 * 
 * @returns Empty response with Allow and Cache-Control headers
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
