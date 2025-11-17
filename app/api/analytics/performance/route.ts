/**
 * Analytics Performance Metrics API
 * 
 * POST /api/analytics/performance
 * 
 * Receives and processes performance metrics from the client.
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit 100 requests per minute per user
 * 
 * @requestBody
 * {
 *   metrics: Record<string, MetricSummary>,
 *   timestamp?: string (ISO 8601)
 * }
 * 
 * @responseBody
 * Success: { success: true, correlationId: string, duration: number }
 * Error: { success: false, error: string, correlationId: string, retryable: boolean }
 * 
 * @example
 * POST /api/analytics/performance
 * {
 *   "metrics": {
 *     "pageLoad": { "avg": 1200, "min": 800, "max": 2000, "count": 50 },
 *     "apiCall": { "avg": 300, "min": 100, "max": 800, "count": 120 }
 *   },
 *   "timestamp": "2024-01-16T10:00:00Z"
 * }
 * 
 * @see docs/api/analytics-performance.md
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

import { requireAuth } from '@/lib/auth/api-protection';
import { publishModuleEvent } from '@/lib/integration/module-event-bus';
import { structuredLogger } from '@/lib/monitoring/structured-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Metric summary statistics
 */
interface MetricSummary {
  avg: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Performance metrics request
 */
interface PerformanceMetricsRequest {
  metrics: Record<string, MetricSummary>;
  timestamp?: string;
}

/**
 * Performance metrics response (success)
 */
interface PerformanceMetricsSuccessResponse {
  success: true;
  correlationId: string;
  duration: number;
}

/**
 * Performance metrics response (error)
 */
interface PerformanceMetricsErrorResponse {
  success: false;
  error: string;
  correlationId: string;
  retryable: boolean;
  statusCode: number;
}

/**
 * Performance metrics response (union)
 */
type PerformanceMetricsResponse = 
  | PerformanceMetricsSuccessResponse 
  | PerformanceMetricsErrorResponse;

// ============================================================================
// Validation Schemas
// ============================================================================

const metricSummarySchema = z.object({
  avg: z.number().min(0).max(1000000),
  min: z.number().min(0).max(1000000),
  max: z.number().min(0).max(1000000),
  count: z.number().int().min(1).max(1000000),
}).refine(
  (data) => data.min <= data.avg && data.avg <= data.max,
  { message: 'min <= avg <= max constraint violated' }
);

const bodySchema = z.object({
  metrics: z.record(z.string(), metricSummarySchema)
    .refine(
      (metrics) => Object.keys(metrics).length > 0,
      { message: 'At least one metric is required' }
    )
    .refine(
      (metrics) => Object.keys(metrics).length <= 50,
      { message: 'Maximum 50 metrics allowed' }
    ),
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// Error Types
// ============================================================================

enum PerformanceErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  PUBLISH_ERROR = 'PUBLISH_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

class PerformanceError extends Error {
  constructor(
    public type: PerformanceErrorType,
    public message: string,
    public statusCode: number,
    public retryable: boolean,
    public correlationId: string
  ) {
    super(message);
    this.name = 'PerformanceError';
  }
}

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
  ],
};

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
    const isRetryable = RETRY_CONFIG.retryableErrors.some(
      (code) => error.code === code || error.message?.includes(code)
    );

    if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    structuredLogger.warn('analytics.performance.retry', {
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
// Main Handler
// ============================================================================

/**
 * POST /api/analytics/performance
 * 
 * Receives and processes performance metrics from authenticated users.
 */
export async function POST(req: NextRequest): Promise<NextResponse<PerformanceMetricsResponse>> {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  try {
    // 1. Authentication (with error boundary)
    structuredLogger.info('analytics.performance.started', {
      correlationId,
      url: req.url,
      method: req.method,
    });

    const authResult = await requireAuth(req);
    if (authResult instanceof Response) {
      structuredLogger.warn('analytics.performance.unauthorized', {
        correlationId,
        duration: Date.now() - startTime,
      });
      
      return NextResponse.json<PerformanceMetricsErrorResponse>(
        {
          success: false,
          error: 'Authentication required',
          correlationId,
          retryable: false,
          statusCode: 401,
        },
        { 
          status: 401,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    const userId = authResult.user.id;

    // 2. Parse and validate request body (with error boundary)
    let json: any;
    try {
      json = await req.json();
    } catch (parseError: any) {
      throw new PerformanceError(
        PerformanceErrorType.VALIDATION_ERROR,
        'Invalid JSON in request body',
        400,
        false,
        correlationId
      );
    }

    let validatedData: PerformanceMetricsRequest;
    try {
      validatedData = bodySchema.parse(json);
    } catch (validationError: any) {
      const errorMessage = validationError.errors?.[0]?.message || 'Validation failed';
      throw new PerformanceError(
        PerformanceErrorType.VALIDATION_ERROR,
        errorMessage,
        400,
        false,
        correlationId
      );
    }

    const { metrics, timestamp } = validatedData;

    // 3. Publish event with retry logic
    try {
      await retryWithBackoff(
        async () => {
          await publishModuleEvent({
            source: 'analytics',
            type: 'PerformanceMetrics',
            payload: {
              metrics,
              timestamp: timestamp ?? new Date().toISOString(),
              userId,
              correlationId,
            },
          });
        },
        correlationId
      );
    } catch (publishError: any) {
      throw new PerformanceError(
        PerformanceErrorType.PUBLISH_ERROR,
        'Failed to publish metrics after retries',
        503,
        true,
        correlationId
      );
    }

    // 4. Success response
    const duration = Date.now() - startTime;

    structuredLogger.info('analytics.performance.success', {
      correlationId,
      userId,
      metricCount: Object.keys(metrics).length,
      duration,
    });

    return NextResponse.json<PerformanceMetricsSuccessResponse>(
      {
        success: true,
        correlationId,
        duration,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle PerformanceError
    if (error instanceof PerformanceError) {
      structuredLogger.error('analytics.performance.error', {
        correlationId,
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        retryable: error.retryable,
        duration,
      });

      return NextResponse.json<PerformanceMetricsErrorResponse>(
        {
          success: false,
          error: error.message,
          correlationId,
          retryable: error.retryable,
          statusCode: error.statusCode,
        },
        {
          status: error.statusCode,
          headers: {
            'X-Correlation-Id': correlationId,
            ...(error.retryable && { 'Retry-After': '60' }),
          },
        }
      );
    }

    // Handle unexpected errors
    structuredLogger.error('analytics.performance.unexpected', {
      correlationId,
      error: error?.message,
      stack: error?.stack,
      duration,
    });

    return NextResponse.json<PerformanceMetricsErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        correlationId,
        retryable: true,
        statusCode: 500,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '60',
        },
      }
    );
  }
}
