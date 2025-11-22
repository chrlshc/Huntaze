/**
 * AI Test API Route
 * 
 * POST /api/ai/test
 * 
 * Test endpoint for AI text generation with automatic billing and rate limiting.
 * Includes retry logic, structured error handling, and comprehensive logging.
 * 
 * Requirements: AI System Integration
 * 
 * @endpoint POST /api/ai/test
 * @authentication Required (via creatorId)
 * @rateLimit 100 requests per hour per creator
 * 
 * @requestBody
 * {
 *   creatorId: string,
 *   prompt: string,
 *   temperature?: number,
 *   maxOutputTokens?: number
 * }
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     text: string,
 *     usage: {
 *       model: string,
 *       inputTokens: number,
 *       outputTokens: number,
 *       totalTokens: number,
 *       costUsd: number
 *     }
 *   },
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     duration: number
 *   }
 * }
 * 
 * @responseBody Error (400/429/500/503)
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
 * POST /api/ai/test
 * {
 *   "creatorId": "creator_123",
 *   "prompt": "Write a friendly greeting message"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "text": "Hello! How can I help you today?",
 *     "usage": {
 *       "model": "gemini-1.5-flash",
 *       "inputTokens": 8,
 *       "outputTokens": 12,
 *       "totalTokens": 20,
 *       "costUsd": 0.000015
 *     }
 *   },
 *   "meta": {
 *     "timestamp": "2024-11-21T10:30:00.000Z",
 *     "requestId": "ai-test-1234567890-abc123",
 *     "duration": 1245
 *   }
 * }
 * 
 * @see lib/ai/gemini-billing.service.ts
 * @see lib/ai/rate-limit.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithBilling } from '@/lib/ai/gemini-billing.service';
import { checkCreatorRateLimit } from '@/lib/ai/rate-limit';
import { createLogger } from '@/lib/utils/logger';
import { successResponse, errorResponse, badRequest, internalServerError } from '@/lib/api/utils/response';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('ai-test-api');

// Configuration
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 512;
const MAX_PROMPT_LENGTH = 10000;

// ============================================================================
// Types
// ============================================================================

/**
 * Request body structure
 */
interface AITestRequestBody {
  creatorId: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Usage information
 */
interface UsageInfo {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

/**
 * Success response data
 */
interface AITestSuccessData {
  text: string;
  usage: UsageInfo;
}

/**
 * Error types
 */
export enum AITestErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'ECONNRESET',
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // API errors (5xx)
  if (error.status && error.status >= 500) {
    return true;
  }
  
  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
    return true;
  }
  
  return false;
}

/**
 * Retry with exponential backoff
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

    logger.warn('Retrying AI generation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate request body
 */
function validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!body.creatorId || typeof body.creatorId !== 'string') {
    return { valid: false, error: 'creatorId is required and must be a string' };
  }

  if (body.creatorId.trim().length === 0) {
    return { valid: false, error: 'creatorId cannot be empty' };
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return { valid: false, error: 'prompt is required and must be a string' };
  }

  if (body.prompt.trim().length === 0) {
    return { valid: false, error: 'prompt cannot be empty' };
  }

  if (body.prompt.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` };
  }

  if (body.temperature !== undefined) {
    if (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2) {
      return { valid: false, error: 'temperature must be a number between 0 and 2' };
    }
  }

  if (body.maxOutputTokens !== undefined) {
    if (typeof body.maxOutputTokens !== 'number' || body.maxOutputTokens < 1 || body.maxOutputTokens > 8192) {
      return { valid: false, error: 'maxOutputTokens must be a number between 1 and 8192' };
    }
  }

  return { valid: true };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST /api/ai/test
 * Test AI text generation with billing
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `ai-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    logger.info('AI test request received', { correlationId });

    // 1. Parse request body with timeout protection
    let body: any;
    try {
      body = await Promise.race([
        request.json(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
        ),
      ]);
    } catch (parseError: any) {
      if (parseError.message === 'Request timeout') {
        logger.error('Request body parsing timeout', parseError, { correlationId });

        return NextResponse.json(
          errorResponse(
            AITestErrorType.TIMEOUT_ERROR,
            'Request timed out. Please try again.',
            true,
            { correlationId, startTime }
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

      return NextResponse.json(
        errorResponse(
          AITestErrorType.VALIDATION_ERROR,
          'Invalid request body',
          false,
          { correlationId, startTime }
        ),
        {
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    // 2. Validate request body
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      logger.warn('Request validation failed', {
        correlationId,
        error: validation.error,
      });

      return NextResponse.json(
        errorResponse(
          AITestErrorType.VALIDATION_ERROR,
          validation.error!,
          false,
          { correlationId, startTime }
        ),
        {
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    const data: AITestRequestBody = {
      creatorId: body.creatorId.trim(),
      prompt: body.prompt.trim(),
      temperature: body.temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: body.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    };

    logger.info('Processing AI test request', {
      correlationId,
      creatorId: data.creatorId,
      promptLength: data.prompt.length,
      temperature: data.temperature,
      maxOutputTokens: data.maxOutputTokens,
    });

    // 3. Check rate limit
    try {
      await checkCreatorRateLimit(data.creatorId);
    } catch (rateLimitError: any) {
      logger.warn('Rate limit exceeded', {
        correlationId,
        creatorId: data.creatorId,
        error: rateLimitError.message,
      });

      return NextResponse.json(
        errorResponse(
          AITestErrorType.RATE_LIMIT_ERROR,
          'Rate limit exceeded. Please try again later.',
          true,
          { correlationId, startTime }
        ),
        {
          status: 429,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '3600', // 1 hour
          },
        }
      );
    }

    // 4. Generate text with automatic billing (with retry)
    let result;
    try {
      result = await retryWithBackoff(
        async () => {
          return await generateTextWithBilling({
            prompt: data.prompt,
            metadata: {
              creatorId: data.creatorId,
              feature: 'test_api',
              agentId: 'test_agent',
            },
            temperature: data.temperature,
            maxOutputTokens: data.maxOutputTokens,
          });
        },
        correlationId
      );
    } catch (aiError: any) {
      logger.error('AI generation failed', aiError, {
        correlationId,
        creatorId: data.creatorId,
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        errorResponse(
          AITestErrorType.AI_SERVICE_ERROR,
          'AI service temporarily unavailable. Please try again.',
          isRetryableError(aiError),
          { correlationId, startTime }
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

    // 5. Build success response
    const duration = Date.now() - startTime;

    const responseData: AITestSuccessData = {
      text: result.text,
      usage: {
        model: result.usage.model,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.inputTokens + result.usage.outputTokens,
        costUsd: result.usage.costUsd,
      },
    };

    logger.info('AI test completed successfully', {
      correlationId,
      creatorId: data.creatorId,
      duration,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      costUsd: result.usage.costUsd,
    });

    return NextResponse.json(
      successResponse(responseData, { correlationId, startTime }),
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle timeout errors
    if (error.message === 'Request timeout') {
      logger.error('Request timeout', error, {
        correlationId,
        duration,
      });

      return NextResponse.json(
        errorResponse(
          AITestErrorType.TIMEOUT_ERROR,
          'Request timed out. Please try again.',
          true,
          { correlationId, startTime }
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

    // Handle unexpected errors
    logger.error('Unexpected error in AI test', error, {
      correlationId,
      duration,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json(
      errorResponse(
        AITestErrorType.INTERNAL_ERROR,
        'An unexpected error occurred. Please try again.',
        true,
        { correlationId, startTime }
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
}

/**
 * OPTIONS handler for CORS preflight
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
