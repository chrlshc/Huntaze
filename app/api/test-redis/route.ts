/**
 * ElastiCache Redis Test API
 * 
 * GET /api/test-redis
 * 
 * Tests ElastiCache Redis connectivity with comprehensive diagnostics.
 * Includes automatic retry logic, structured error handling, and performance monitoring.
 * 
 * @endpoint GET /api/test-redis
 * @authentication Not required (diagnostic endpoint)
 * @rateLimit Standard rate limiting applies
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   connection: {
 *     host: string,
 *     port: string,
 *     redisVersion: string
 *   },
 *   tests: {
 *     ping: { result: string, duration: string },
 *     set: { key: string, duration: string },
 *     get: { value: string, duration: string },
 *     delete: { duration: string }
 *   },
 *   performance: {
 *     totalDuration: string
 *   },
 *   meta: {
 *     timestamp: string,
 *     correlationId: string
 *   }
 * }
 * 
 * @responseBody Error (500/503)
 * {
 *   success: false,
 *   error: string,
 *   errorType: string,
 *   connection: {
 *     host: string,
 *     port: string
 *   },
 *   troubleshooting: {
 *     possibleCauses: string[],
 *     nextSteps: string[]
 *   },
 *   meta: {
 *     timestamp: string,
 *     correlationId: string,
 *     retryable: boolean
 *   }
 * }
 * 
 * Requirements: ElastiCache connectivity validation
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { createLogger } from '@/lib/utils/logger';

// Force Node.js runtime (required for Redis)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('redis-test-api');

// ============================================================================
// Types
// ============================================================================

/**
 * Redis test result structure
 */
interface RedisTestResult {
  result?: string;
  value?: string;
  key?: string;
  duration: string;
}

/**
 * Success response structure
 */
interface RedisTestSuccessResponse {
  success: true;
  connection: {
    host: string;
    port: string;
    redisVersion: string;
  };
  tests: {
    ping: RedisTestResult;
    set: RedisTestResult;
    get: RedisTestResult;
    delete: RedisTestResult;
  };
  performance: {
    totalDuration: string;
  };
  meta: {
    timestamp: string;
    correlationId: string;
  };
}

/**
 * Error response structure
 */
interface RedisTestErrorResponse {
  success: false;
  error: string;
  errorType: string;
  connection: {
    host: string;
    port: string;
  };
  troubleshooting: {
    possibleCauses: string[];
    nextSteps: string[];
  };
  meta: {
    timestamp: string;
    correlationId: string;
    retryable: boolean;
  };
}

/**
 * Response type (union)
 */
type RedisTestResponse = RedisTestSuccessResponse | RedisTestErrorResponse;

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
    'ECONNRESET',
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Redis connection errors
  if (error.message?.includes('Connection is closed') || 
      error.message?.includes('connect ETIMEDOUT')) {
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

    logger.warn('Retrying Redis operation', {
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
 * GET /api/test-redis
 * Test ElastiCache Redis connectivity
 */
export async function GET(request: NextRequest): Promise<NextResponse<RedisTestResponse>> {
  const correlationId = `redis-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();
  let redis: Redis | null = null;

  try {
    logger.info('Redis connectivity test started', { correlationId });

    // 1. Validate environment variables
    if (!process.env.ELASTICACHE_REDIS_HOST) {
      logger.error('Missing ELASTICACHE_REDIS_HOST environment variable', {
        correlationId,
      });

      return NextResponse.json<RedisTestErrorResponse>(
        {
          success: false,
          error: 'ELASTICACHE_REDIS_HOST environment variable not set',
          errorType: 'CONFIGURATION_ERROR',
          connection: {
            host: 'NOT_SET',
            port: process.env.ELASTICACHE_REDIS_PORT || '6379',
          },
          troubleshooting: {
            possibleCauses: [
              'Environment variable not configured in Amplify',
              'Missing .env file in local development',
            ],
            nextSteps: [
              'Set ELASTICACHE_REDIS_HOST in Amplify environment variables',
              'Verify .env file contains ELASTICACHE_REDIS_HOST',
              'Check deployment configuration',
            ],
          },
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            retryable: false,
          },
        },
        { 
          status: 500,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // 2. Create Redis connection with retry logic
    const host = process.env.ELASTICACHE_REDIS_HOST;
    const port = parseInt(process.env.ELASTICACHE_REDIS_PORT || '6379');

    logger.info('Creating Redis connection', {
      correlationId,
      host,
      port,
    });

    redis = await retryWithBackoff(
      async () => {
        const client = new Redis({
          host,
          port,
          connectTimeout: 5000,
          commandTimeout: 5000,
          retryStrategy: (times) => {
            if (times > 3) {
              return null; // Stop retrying
            }
            return Math.min(times * 50, 2000);
          },
          lazyConnect: false, // Connect immediately
        });

        // Wait for connection to be ready
        await new Promise<void>((resolve, reject) => {
          client.once('ready', () => resolve());
          client.once('error', (err) => reject(err));
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });

        return client;
      },
      correlationId
    );

    logger.info('Redis connection established', { correlationId });

    // 3. Test 1: PING with retry
    logger.debug('Running PING test', { correlationId });
    const pingStart = Date.now();
    const pong = await retryWithBackoff(
      async () => await redis!.ping(),
      correlationId
    );
    const pingDuration = Date.now() - pingStart;

    logger.info('PING test completed', {
      correlationId,
      result: pong,
      duration: pingDuration,
    });

    // 4. Test 2: SET with retry
    const testKey = `test:connection:${Date.now()}`;
    logger.debug('Running SET test', { correlationId, key: testKey });
    
    const setStart = Date.now();
    await retryWithBackoff(
      async () => await redis!.set(testKey, 'success', 'EX', 60),
      correlationId
    );
    const setDuration = Date.now() - setStart;

    logger.info('SET test completed', {
      correlationId,
      key: testKey,
      duration: setDuration,
    });

    // 5. Test 3: GET with retry
    logger.debug('Running GET test', { correlationId, key: testKey });
    
    const getStart = Date.now();
    const value = await retryWithBackoff(
      async () => await redis!.get(testKey),
      correlationId
    );
    const getDuration = Date.now() - getStart;

    logger.info('GET test completed', {
      correlationId,
      value,
      duration: getDuration,
    });

    // 6. Test 4: DELETE with retry
    logger.debug('Running DELETE test', { correlationId, key: testKey });
    
    const delStart = Date.now();
    await retryWithBackoff(
      async () => await redis!.del(testKey),
      correlationId
    );
    const delDuration = Date.now() - delStart;

    logger.info('DELETE test completed', {
      correlationId,
      duration: delDuration,
    });

    // 7. Get Redis info
    logger.debug('Fetching Redis server info', { correlationId });
    
    const info = await retryWithBackoff(
      async () => await redis!.info('server'),
      correlationId
    );
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';

    logger.info('Redis server info retrieved', {
      correlationId,
      redisVersion,
    });

    // 8. Cleanup connection
    try {
      await redis.quit();
      logger.info('Redis connection closed gracefully', { correlationId });
    } catch (quitError) {
      logger.warn('Error closing Redis connection', {
        correlationId,
        error: quitError instanceof Error ? quitError.message : 'Unknown error',
      });
    }

    const totalDuration = Date.now() - startTime;

    logger.info('Redis connectivity test completed successfully', {
      correlationId,
      totalDuration,
      host,
      port,
      redisVersion,
    });

    return NextResponse.json<RedisTestSuccessResponse>(
      {
        success: true,
        connection: {
          host,
          port: port.toString(),
          redisVersion,
        },
        tests: {
          ping: {
            result: pong,
            duration: `${pingDuration}ms`,
          },
          set: {
            key: testKey,
            duration: `${setDuration}ms`,
          },
          get: {
            value: value || '',
            duration: `${getDuration}ms`,
          },
          delete: {
            duration: `${delDuration}ms`,
          },
        },
        performance: {
          totalDuration: `${totalDuration}ms`,
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlationId,
        },
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': totalDuration.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Cleanup on error
    if (redis) {
      try {
        await redis.quit();
        logger.info('Redis connection closed after error', { correlationId });
      } catch (quitError) {
        logger.error('Error during Redis cleanup', quitError as Error, {
          correlationId,
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    const errorCode = error.code;
    const retryable = isRetryableError(error);

    logger.error('Redis connectivity test failed', error, {
      correlationId,
      duration,
      errorName,
      errorCode,
      retryable,
      host: process.env.ELASTICACHE_REDIS_HOST,
      port: process.env.ELASTICACHE_REDIS_PORT,
    });

    // Determine appropriate status code
    const statusCode = retryable ? 503 : 500;

    return NextResponse.json<RedisTestErrorResponse>(
      {
        success: false,
        error: errorMessage,
        errorType: errorName,
        connection: {
          host: process.env.ELASTICACHE_REDIS_HOST || 'NOT_SET',
          port: process.env.ELASTICACHE_REDIS_PORT || '6379',
        },
        troubleshooting: {
          possibleCauses: [
            'Security Group does not allow traffic from Amplify',
            'VPC access not configured in Amplify',
            'ElastiCache cluster is not available',
            'Network connectivity issues',
            'Redis authentication required but not provided',
            'Connection timeout due to network latency',
          ],
          nextSteps: [
            'Check Security Group rules (allow port 6379 from Amplify)',
            'Verify VPC configuration in Amplify console',
            'Check ElastiCache cluster status in AWS console',
            'Review CloudWatch logs for connection errors',
            'Verify ELASTICACHE_REDIS_HOST is correct',
            'Test connectivity from EC2 instance in same VPC',
          ],
        },
        meta: {
          timestamp: new Date().toISOString(),
          correlationId,
          retryable,
        },
      },
      {
        status: statusCode,
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
          ...(retryable && { 'Retry-After': '60' }),
        },
      }
    );
  }
}

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
        'Allow': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
