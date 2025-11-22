/**
 * AI Chat API Route - Fan Message Response Generation
 * 
 * Handles fan message processing with AI-powered response generation
 * with comprehensive error handling, retry logic, and performance monitoring.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * @endpoint POST /api/ai/chat
 * @authentication Required (NextAuth session)
 * @rateLimit Plan-based (50-500 requests/hour)
 * 
 * @see app/api/ai/chat/README.md
 * @see tests/integration/api/ai-routes.integration.test.ts
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/types/responses';
import { ApiErrorCode } from '@/lib/api/types/errors';
import { checkCreatorRateLimit, RateLimitError } from '@/lib/ai/rate-limit';
import { AITeamCoordinator } from '@/lib/ai/coordinator';
import { createLogger } from '@/lib/utils/logger';
import { getUserAIPlanFromSubscription } from '@/lib/ai/plan';
import { z } from 'zod';

// Force Node.js runtime (required for AI operations)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('ai-chat-api');

// ============================================================================
// Configuration
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const MAX_MESSAGE_LENGTH = 5000; // Maximum message length
const MAX_RETRIES = 3; // Maximum retry attempts for transient failures

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Request validation schema with comprehensive validation rules
 */
const ChatRequestSchema = z.object({
  fanId: z.string()
    .min(1, 'Fan ID is required')
    .max(255, 'Fan ID too long'),
  message: z.string()
    .min(1, 'Message is required')
    .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters`),
  context: z.record(z.any()).optional(),
});

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: MAX_RETRIES,
  initialDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffFactor: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SERVICE_UNAVAILABLE',
    'GEMINI_UNAVAILABLE',
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Network errors
  const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
  if (error.code && networkErrors.includes(error.code)) {
    return true;
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

    logger.warn('Retrying AI chat operation', {
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
 * POST /api/ai/chat
 * 
 * Generate AI-powered response to fan message with multi-agent collaboration
 * 
 * Requirements:
 * - 12.1: Validate authentication (via withAuth middleware)
 * - 12.2: Check rate limit (plan-based)
 * - 12.3: Call coordinator.route with fan_message type
 * - 12.4: Format response with usage metadata
 * - 12.5: Handle errors with appropriate HTTP codes
 * 
 * @param req - Authenticated request with user session
 * @returns Response with AI-generated message and metadata
 */
export const POST = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    const startTime = Date.now();
    const correlationId = crypto.randomUUID();

    try {
      logger.info('AI chat request received', {
        correlationId,
        userId: req.user.id,
        userAgent: req.headers.get('user-agent'),
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
      const validation = ChatRequestSchema.safeParse(body);

      if (!validation.success) {
        logger.warn('Request validation failed', {
          correlationId,
          errors: validation.error.errors,
        });

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
          { 
            status: 400,
            headers: { 'X-Correlation-Id': correlationId },
          }
        );
      }

      const { fanId, message, context } = validation.data;
      const creatorId = parseInt(req.user.id);

      logger.info('Request validated', {
        correlationId,
        creatorId,
        fanId,
        messageLength: message.length,
        hasContext: !!context,
      });

      // 3. Requirement 12.2: Check rate limit with retry logic
      // Get user's AI plan
      const userPlan = await getUserAIPlanFromSubscription(creatorId);
      
      try {
        await retryWithBackoff(
          async () => {
            await checkCreatorRateLimit(creatorId, userPlan);
          },
          correlationId
        );
      } catch (error) {
        if (error instanceof RateLimitError) {
          logger.warn('Rate limit exceeded', {
            correlationId,
            creatorId,
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
                },
              }
            ),
            {
              status: 429,
              headers: {
                'X-Correlation-Id': correlationId,
                'Retry-After': error.retryAfter.toString(),
                'X-RateLimit-Limit': error.limit.toString(),
                'X-RateLimit-Remaining': error.remaining.toString(),
              },
            }
          );
        }
        throw error;
      }

      // 4. Requirement 12.3: Call coordinator.route with fan_message type (with retry)
      logger.info('Initializing AI coordinator', { correlationId });

      let result;
      try {
        result = await retryWithBackoff(
          async () => {
            const coordinator = new AITeamCoordinator();
            await coordinator.initialize();

            return await coordinator.route({
              type: 'fan_message',
              creatorId,
              fanId,
              message,
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
            'Failed to generate AI response. Please try again.',
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

      // 5. Check if coordinator returned an error
      if (!result.success) {
        logger.error('Coordinator returned error', new Error(result.error || 'Unknown error'), {
          correlationId,
          creatorId,
          error: result.error,
        });

        return Response.json(
          createErrorResponse(
            result.error || 'Failed to generate response',
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

      // 6. Requirement 12.4: Format response with usage metadata
      const duration = Date.now() - startTime;

      logger.info('AI chat response generated successfully', {
        correlationId,
        creatorId,
        fanId,
        duration,
        confidence: result.data.confidence,
        agentsInvolved: result.agentsInvolved,
        totalCost: result.usage.totalCostUsd,
      });

      return Response.json(
        createSuccessResponse(
          {
            response: result.data.response,
            confidence: result.data.confidence,
            suggestedUpsell: result.data.suggestedUpsell,
            salesTactics: result.data.salesTactics,
            suggestedPrice: result.data.suggestedPrice,
            agentsInvolved: result.agentsInvolved,
            usage: result.usage,
          },
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

      // 7. Requirement 12.5: Handle errors with appropriate HTTP codes
      logger.error('Unexpected AI chat error', error, {
        correlationId,
        userId: req.user.id,
        duration,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      });

      // Check for quota exceeded error
      if (error.code === 'QUOTA_EXCEEDED') {
        const details = error.details || {};
        
        logger.warn('Quota exceeded', {
          correlationId,
          userId: req.user.id,
          ...details,
        });

        return Response.json(
          createErrorResponse(
            error.message || 'Monthly quota exceeded. Please upgrade your plan.',
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

      // Check for timeout errors
      if (error.message === 'Request timeout' || error.code === 'TIMEOUT_ERROR') {
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

      // Generic error response
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
  }),
  { limit: 100, windowMs: 60000 } // 100 requests per minute (will be overridden by plan-based rate limit)
);

/**
 * OPTIONS handler for CORS preflight
 * 
 * Returns allowed methods and caching headers for CORS preflight requests.
 * This is required for cross-origin requests from web browsers.
 * 
 * @returns Empty response with Allow and Cache-Control headers
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
