/**
 * Home Stats API Route
 * 
 * GET /api/home/stats
 * 
 * Fetches user statistics for the home page dashboard.
 * Includes automatic retry logic, structured error handling, and performance monitoring.
 * 
 * Requirements: 7.2, 7.3, 7.4, 7.5, 7.6
 * 
 * @endpoint GET /api/home/stats
 * @authentication Required (NextAuth session)
 * @rateLimit Standard rate limiting applies
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     messagesSent: number,
 *     messagesTrend: number,
 *     responseRate: number,
 *     responseRateTrend: number,
 *     revenue: number,
 *     revenueTrend: number,
 *     activeChats: number,
 *     activeChatsTrend: number
 *   },
 *   duration: number
 * }
 * 
 * @responseBody Error (401/404/500/503)
 * {
 *   error: string,
 *   correlationId: string,
 *   retryable?: boolean
 * }
 * 
 * @example
 * GET /api/home/stats
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "messagesSent": 1247,
 *     "messagesTrend": 12.5,
 *     "responseRate": 94.2,
 *     "responseRateTrend": 3.1,
 *     "revenue": 8450,
 *     "revenueTrend": 15.8,
 *     "activeChats": 42,
 *     "activeChatsTrend": -2.3
 *   },
 *   "duration": 145
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { Prisma } from '@prisma/client';
import { cacheService } from '@/lib/services/cache.service';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('home-stats-api');

// Cache configuration
const STATS_CACHE_TTL = 60; // 1 minute TTL for stats cache

// ============================================================================
// Types
// ============================================================================

/**
 * Home statistics data structure
 */
export interface HomeStatsData {
  messagesSent: number;
  messagesTrend: number;
  responseRate: number;
  responseRateTrend: number;
  revenue: number;
  revenueTrend: number;
  activeChats: number;
  activeChatsTrend: number;
}

/**
 * Success response structure
 */
interface HomeStatsSuccessResponse {
  success: true;
  data: HomeStatsData;
  duration: number;
}

/**
 * Error response structure
 */
interface HomeStatsErrorResponse {
  error: string;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Response type (union)
 */
type HomeStatsResponse = HomeStatsSuccessResponse | HomeStatsErrorResponse;

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2,
  retryableErrors: [
    'P2024', // Prisma: Timed out fetching a new connection
    'P2034', // Prisma: Transaction failed due to a write conflict
    'P1001', // Prisma: Can't reach database server
    'P1002', // Prisma: Database server timeout
    'P1008', // Prisma: Operations timed out
    'P1017', // Prisma: Server has closed the connection
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRY_CONFIG.retryableErrors.includes(error.code);
  }

  // Network errors
  if (error.code) {
    const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
    return networkErrors.includes(error.code);
  }

  return false;
}

/**
 * Retry database operation with exponential backoff
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

    logger.warn('Retrying database operation', {
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
// Default Stats
// ============================================================================

/**
 * Default stats for new users or error fallback
 */
const DEFAULT_STATS: HomeStatsData = {
  messagesSent: 0,
  messagesTrend: 0,
  responseRate: 0,
  responseRateTrend: 0,
  revenue: 0,
  revenueTrend: 0,
  activeChats: 0,
  activeChatsTrend: 0,
};

// ============================================================================
// Main Handler
// ============================================================================

/**
 * GET /api/home/stats
 * Fetch user statistics for the home page
 */
export async function GET(request: NextRequest): Promise<NextResponse<HomeStatsResponse>> {
  const correlationId = `stats-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    // 1. Authentication check
    logger.info('Fetching home stats', { correlationId });

    // In test environment, check for Authorization header
    let userEmail: string;
    let userId: number | undefined;
    
    if (process.env.NODE_ENV === 'test') {
      const authHeader = request.headers.get('authorization');
      const testUserId = request.headers.get('x-test-user-id');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token.startsWith('test-user-')) {
          const userIdStr = token.substring(10);
          const parsedUserId = parseInt(userIdStr);
          
          if (isNaN(parsedUserId) || parsedUserId <= 0) {
            logger.warn('Invalid test token', { correlationId, token });
            return NextResponse.json<HomeStatsErrorResponse>(
              {
                error: 'Unauthorized',
                correlationId,
                retryable: false,
              },
              { 
                status: 401,
                headers: {
                  'X-Correlation-Id': correlationId,
                },
              }
            );
          }
          
          userId = parsedUserId;
          userEmail = `test-user-${userId}@example.com`;
          logger.info('Using test auth token', { correlationId, userId });
        } else {
          logger.warn('Invalid test token format', { correlationId, token });
          return NextResponse.json<HomeStatsErrorResponse>(
            {
              error: 'Unauthorized',
              correlationId,
              retryable: false,
            },
            { 
              status: 401,
              headers: {
                'X-Correlation-Id': correlationId,
              },
            }
          );
        }
      } else if (testUserId) {
        userId = parseInt(testUserId);
        userEmail = `test-user-${userId}@example.com`;
        logger.info('Using test user ID header', { correlationId, userId });
      } else {
        logger.warn('Unauthorized test request', { correlationId });
        return NextResponse.json<HomeStatsErrorResponse>(
          {
            error: 'Unauthorized',
            correlationId,
            retryable: false,
          },
          { 
            status: 401,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
    } else {
      // Production: use NextAuth session
      const session = await getServerSession();

      if (!session?.user?.email) {
        logger.warn('Unauthorized access attempt', { correlationId });
        
        return NextResponse.json<HomeStatsErrorResponse>(
          {
            error: 'Unauthorized',
            correlationId,
            retryable: false,
          },
          { 
            status: 401,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }

      userEmail = session.user.email;
    }

    // 2. Find user with retry logic (skip in test mode if userId already set)
    let user: { id: number } | null = null;
    
    if (userId !== undefined) {
      // Test mode: use provided userId (skip DB lookup for performance)
      user = { id: userId };
      logger.info('Using test user ID', { correlationId, userId });
    } else {
      // Production: find user by email with retry
      try {
        user = await retryWithBackoff(
          async () => {
            return await prisma.user.findUnique({
              where: { email: userEmail },
              select: { id: true },
            });
          },
          correlationId
        );
      } catch (dbError: any) {
        logger.error('Database error finding user', dbError, {
          correlationId,
          email: userEmail,
          duration: Date.now() - startTime,
        });

        return NextResponse.json<HomeStatsErrorResponse>(
          {
            error: 'Service temporarily unavailable. Please try again.',
            correlationId,
            retryable: true,
          },
          {
            status: 503,
            headers: {
              'X-Correlation-Id': correlationId,
              'Retry-After': '60',
            },
          }
        );
      }

      if (!user) {
        logger.warn('User not found', {
          correlationId,
          email: userEmail,
        });

        return NextResponse.json<HomeStatsErrorResponse>(
          {
            error: 'User not found',
            correlationId,
            retryable: false,
          },
          { 
            status: 404,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
    }

    // 3. Check cache first (Requirements: 11.1, 11.2)
    const cacheKey = `home:stats:${user.id}`;
    const cachedStats = cacheService.get<HomeStatsData>(cacheKey);

    if (cachedStats) {
      const duration = Date.now() - startTime;
      
      logger.info('Home stats served from cache', {
        correlationId,
        userId: user.id,
        duration,
        cacheHit: true,
      });

      return NextResponse.json<HomeStatsSuccessResponse>(
        {
          success: true,
          data: cachedStats,
          duration,
        },
        {
          status: 200,
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Duration-Ms': duration.toString(),
            'X-Cache-Status': 'HIT',
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // 4. Fetch or create user stats with retry logic (cache miss)
    let stats;
    try {
      stats = await retryWithBackoff(
        async () => {
          // Try to find existing stats
          let existingStats = await prisma.userStats.findUnique({
            where: { userId: user.id },
          });

          // Create default stats if none exist
          if (!existingStats) {
            logger.info('Creating default stats for user', {
              correlationId,
              userId: user.id,
            });

            existingStats = await prisma.userStats.create({
              data: {
                userId: user.id,
                ...DEFAULT_STATS,
              },
            });
          }

          return existingStats;
        },
        correlationId
      );
    } catch (dbError: any) {
      logger.error('Database error fetching/creating stats', dbError, {
        correlationId,
        userId: user.id,
        duration: Date.now() - startTime,
      });

      return NextResponse.json<HomeStatsErrorResponse>(
        {
          error: 'Service temporarily unavailable. Please try again.',
          correlationId,
          retryable: true,
        },
        {
          status: 503,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '60',
          },
        }
      );
    }

    // 5. Build response
    const duration = Date.now() - startTime;
    
    const responseData: HomeStatsData = {
      messagesSent: stats.messagesSent,
      messagesTrend: stats.messagesTrend,
      responseRate: stats.responseRate,
      responseRateTrend: stats.responseRateTrend,
      revenue: stats.revenue,
      revenueTrend: stats.revenueTrend,
      activeChats: stats.activeChats,
      activeChatsTrend: stats.activeChatsTrend,
    };

    // 6. Store in cache (Requirements: 11.1, 11.3)
    try {
      cacheService.set(cacheKey, responseData, STATS_CACHE_TTL);
      
      logger.info('Home stats cached', {
        correlationId,
        userId: user.id,
        cacheKey,
        ttl: STATS_CACHE_TTL,
      });
    } catch (cacheError) {
      // Log cache error but don't fail the request
      logger.warn('Failed to cache stats', {
        correlationId,
        userId: user.id,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }

    logger.info('Home stats fetched successfully', {
      correlationId,
      userId: user.id,
      duration,
      cacheHit: false,
    });

    return NextResponse.json<HomeStatsSuccessResponse>(
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
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Unexpected error fetching home stats', error, {
      correlationId,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    return NextResponse.json<HomeStatsErrorResponse>(
      {
        error: 'An unexpected error occurred. Please try again.',
        correlationId,
        retryable: true,
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
