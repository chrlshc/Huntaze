import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { analyticsService } from '@/lib/api/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api/utils/response';
import { getCached } from '@/lib/api/utils/cache';
import { ApiError, ErrorCodes, HttpStatusCodes, isRetryableError } from '@/lib/api/utils/errors';
import { createLogger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const logger = createLogger('analytics-overview');

// ============================================================================
// Types
// ============================================================================

/**
 * Analytics overview metrics response
 */
export interface AnalyticsOverviewMetrics {
  arpu: number;
  ltv: number;
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  monthOverMonthGrowth: number;
  timestamp: string;
}

/**
 * Analytics metrics from service
 */
interface AnalyticsMetrics {
  arpu: number;
  ltv: number;
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  monthOverMonthGrowth: number;
}

/**
 * Analytics overview success response
 */
export interface AnalyticsOverviewResponse {
  success: true;
  data: AnalyticsOverviewMetrics;
  cached: boolean;
  correlationId: string;
}

/**
 * Analytics overview error response
 */
export interface AnalyticsOverviewErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
    retryable: boolean;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CACHE_TTL = 300; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = 
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network');

    if (!isRetryable || attempt >= MAX_RETRIES) {
      throw error;
    }

    const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
    
    logger.warn('Retrying analytics overview request', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Request Handler
// ============================================================================

/**
 * GET /api/analytics/overview
 * 
 * Returns analytics overview with key metrics for authenticated users.
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit 60 requests per minute per user
 * 
 * @returns {AnalyticsOverviewResponse} Analytics metrics with caching info
 * 
 * @example
 * GET /api/analytics/overview
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "arpu": 45.50,
 *     "ltv": 450.00,
 *     "churnRate": 5.2,
 *     "activeSubscribers": 1250,
 *     "totalRevenue": 56875.00,
 *     "monthOverMonthGrowth": 12.5,
 *     "timestamp": "2025-11-18T10:00:00Z"
 *   },
 *   "cached": true,
 *   "correlationId": "abc-123-def"
 * }
 * 
 * @see docs/api/analytics-overview.md
 */
const analyticsOverviewHandler = async (req: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  let isCached = false;

  try {
    // Access user from authenticated request
    const user = (req as any).user;
    if (!user || !user.id) {
      throw new ApiError(
        ErrorCodes.UNAUTHORIZED,
        'User not authenticated',
        HttpStatusCodes.UNAUTHORIZED
      );
    }

    // Validate user ID
    const userId = parseInt(user.id);
    if (isNaN(userId)) {
      logger.warn('Invalid user ID in analytics overview request', {
        correlationId,
        userId: user.id,
      });
      
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid user ID',
        HttpStatusCodes.BAD_REQUEST,
        { userId: user.id }
      );
    }

    logger.info('Analytics overview request started', {
      correlationId,
      userId,
      email: user.email,
    });

    const cacheKey = `analytics:overview:${userId}`;

    // Get overview with caching and retry logic
    const metrics = await retryWithBackoff(
      async () => {
        const result = await getCached(
          cacheKey,
          () => analyticsService.getOverview(userId),
          { ttl: CACHE_TTL }
        );
        
        // Check if result came from cache
        isCached = (result as any).cached ?? false;
        
        return (result as any).data ?? result;
      },
      correlationId
    ) as AnalyticsMetrics;

    // Validate response data
    if (!metrics || typeof metrics !== 'object') {
      throw new ApiError(
        ErrorCodes.INTERNAL_ERROR,
        'Invalid analytics data received',
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }

    const duration = Date.now() - startTime;

    logger.info('Analytics overview request completed', {
      correlationId,
      userId,
      cached: isCached,
      duration,
    });

    const response: AnalyticsOverviewResponse = {
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString(),
      },
      cached: isCached,
      correlationId,
    };

    return NextResponse.json(response, {
      status: HttpStatusCodes.OK,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-Cache-Status': isCached ? 'HIT' : 'MISS',
        'X-Duration-Ms': duration.toString(),
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle ApiError
    if (error instanceof ApiError) {
      logger.error('Analytics overview API error', error, {
        correlationId,
        code: error.code,
        statusCode: error.statusCode,
        duration,
      });

      const retryable = isRetryableError(error);
      
      const errorResp: AnalyticsOverviewErrorResponse = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          correlationId,
          retryable,
        },
      };

      return NextResponse.json(errorResp, {
        status: error.statusCode,
        headers: {
          'X-Correlation-Id': correlationId,
          ...(retryable && { 'Retry-After': '60' }),
        },
      });
    }

    // Handle unexpected errors
    logger.error('Analytics overview unexpected error', error, {
      correlationId,
      errorMessage: error?.message,
      errorStack: error?.stack,
      duration,
    });

    const errorResp: AnalyticsOverviewErrorResponse = {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Failed to fetch analytics overview',
        correlationId,
        retryable: true,
      },
    };

    return NextResponse.json(errorResp, {
      status: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      headers: {
        'X-Correlation-Id': correlationId,
        'Retry-After': '60',
      },
    });
  }
};

/**
 * Export GET handler with middleware composition
 * Applies rate limiting (60 req/min) and authentication
 * Requirements: 1.5, 2.3
 */
export const GET = withRateLimit(
  withAuth(analyticsOverviewHandler),
  {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
  }
);
