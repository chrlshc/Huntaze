/**
 * Monitoring Metrics API
 * 
 * GET /api/monitoring/metrics
 * 
 * Exposes current monitoring metrics and alarm status for operational visibility.
 * Includes automatic retry logic, structured error handling, and performance monitoring.
 * 
 * @endpoint GET /api/monitoring/metrics
 * @authentication Optional (public endpoint for monitoring dashboards)
 * @rateLimit Standard rate limiting applies
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     metrics: {
 *       requests: { total: number, averageLatency: number, errorRate: number },
 *       connections: { active: number },
 *       cache: { hits: number, misses: number },
 *       database: { queries: number, averageLatency: number, successRate: number }
 *     },
 *     alarms: Array<{
 *       name: string,
 *       state: string,
 *       reason: string,
 *       updatedAt: Date
 *     }>,
 *     timestamp: string
 *   },
 *   duration: number
 * }
 * 
 * @responseBody Error (500/503)
 * {
 *   success: false,
 *   error: string,
 *   correlationId: string,
 *   retryable: boolean
 * }
 * 
 * @example
 * GET /api/monitoring/metrics
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "metrics": {
 *       "requests": { "total": 1247, "averageLatency": 145, "errorRate": 0.5 },
 *       "connections": { "active": 42 },
 *       "cache": { "hits": 850, "misses": 150 },
 *       "database": { "queries": 320, "averageLatency": 25, "successRate": 99.8 }
 *     },
 *     "alarms": [],
 *     "timestamp": "2024-11-19T10:30:00.000Z"
 *   },
 *   "duration": 45
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudWatchService } from '@/lib/monitoring/cloudwatch.service';
import { goldenSignals } from '@/lib/monitoring/telemetry';
import { createLogger } from '@/lib/utils/logger';
import { cacheService } from '@/lib/services/cache.service';
import type {
  MetricsSummary,
  AlarmInfo,
  MetricsSuccessResponse,
  MetricsErrorResponse,
  MetricsResponse,
} from './types';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('monitoring-metrics-api');

// Cache configuration
const METRICS_CACHE_TTL = 30; // 30 seconds TTL for metrics cache

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'NetworkingError',
    'ServiceUnavailable',
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

  // AWS SDK errors
  if (error.name && RETRY_CONFIG.retryableErrors.includes(error.name)) {
    return true;
  }

  // HTTP 5xx errors
  if (error.statusCode && error.statusCode >= 500) {
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

    logger.warn('Retrying CloudWatch operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
      errorCode: error.code || error.name,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * GET /api/monitoring/metrics
 * Fetch current monitoring metrics and alarm status
 */
export async function GET(request: NextRequest): Promise<NextResponse<MetricsResponse>> {
  const correlationId = `metrics-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    logger.info('Fetching monitoring metrics', { correlationId });

    // 1. Check cache first (Requirements: 11.1, 11.2)
    const cacheKey = 'monitoring:metrics:summary';
    const cachedMetrics = cacheService.get<MetricsSuccessResponse['data']>(cacheKey);

    if (cachedMetrics) {
      const duration = Date.now() - startTime;
      
      logger.info('Monitoring metrics served from cache', {
        correlationId,
        duration,
        cacheHit: true,
      });

      return NextResponse.json<MetricsSuccessResponse>(
        {
          success: true,
          data: cachedMetrics,
          duration,
        },
        {
          status: 200,
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Duration-Ms': duration.toString(),
            'X-Cache-Status': 'HIT',
            'Cache-Control': 'private, max-age=30',
          },
        }
      );
    }

    // 2. Get metrics summary (in-memory, fast)
    const metricsSummary = goldenSignals.getMetricsSummary();
    
    // 3. Get alarm status with retry logic (cache miss)
    let alarms: AlarmInfo[] = [];
    try {
      const cloudWatchAlarms = await retryWithBackoff(
        async () => {
          return await cloudWatchService.getAlarmStatus();
        },
        correlationId
      );

      alarms = cloudWatchAlarms.map(alarm => ({
        name: alarm.AlarmName || 'unknown',
        state: alarm.StateValue || 'UNKNOWN',
        reason: alarm.StateReason || 'No reason provided',
        updatedAt: alarm.StateUpdatedTimestamp || new Date(),
      }));
    } catch (cloudWatchError: any) {
      // Log error but don't fail the request - alarms are optional
      logger.warn('Failed to fetch CloudWatch alarms', {
        correlationId,
        error: cloudWatchError.message,
        errorCode: cloudWatchError.code || cloudWatchError.name,
      });
      
      // Return empty alarms array on error
      alarms = [];
    }

    // 4. Build response
    const duration = Date.now() - startTime;
    
    const responseData = {
      metrics: metricsSummary,
      alarms,
      timestamp: new Date().toISOString(),
    };

    // 5. Store in cache (Requirements: 11.1, 11.3)
    try {
      cacheService.set(cacheKey, responseData, METRICS_CACHE_TTL);
      
      logger.info('Monitoring metrics cached', {
        correlationId,
        cacheKey,
        ttl: METRICS_CACHE_TTL,
      });
    } catch (cacheError) {
      // Log cache error but don't fail the request
      logger.warn('Failed to cache metrics', {
        correlationId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }

    logger.info('Monitoring metrics fetched successfully', {
      correlationId,
      duration,
      alarmsCount: alarms.length,
      cacheHit: false,
    });

    return NextResponse.json<MetricsSuccessResponse>(
      {
        success: true,
        data: responseData,
        duration,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
          'X-Cache-Status': 'MISS',
          'Cache-Control': 'private, max-age=30',
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Unexpected error fetching monitoring metrics', error, {
      correlationId,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    const retryable = isRetryableError(error);

    return NextResponse.json<MetricsErrorResponse>(
      {
        success: false,
        error: 'Failed to retrieve monitoring metrics. Please try again.',
        correlationId,
        retryable,
      },
      {
        status: retryable ? 503 : 500,
        headers: {
          'X-Correlation-Id': correlationId,
          ...(retryable && { 'Retry-After': '60' }),
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Allow': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
