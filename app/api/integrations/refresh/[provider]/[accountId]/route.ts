/**
 * POST /api/integrations/refresh/:provider/:accountId
 * 
 * Manually refresh an OAuth token for a connected integration.
 * Implements retry logic, structured error handling, and cache invalidation.
 * 
 * Requirements: 2.4, 8.1, 8.2, 8.3, 11.5, 16.5
 * 
 * @endpoint POST /api/integrations/refresh/:provider/:accountId
 * @authentication Required (NextAuth session via withAuth middleware)
 * @rateLimit 20 requests per minute per user
 * @csrf Required (X-CSRF-Token header)
 * 
 * @param provider - Platform provider (instagram, tiktok, reddit, onlyfans)
 * @param accountId - Provider-specific account ID
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     message: string,
 *     provider: string,
 *     accountId: string,
 *     expiresAt: string | null
 *   },
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     duration: number
 *   }
 * }
 * 
 * @responseBody Error (400/401/403/404/422/500/503)
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
 * POST /api/integrations/refresh/instagram/123456789
 * Headers: {
 *   "X-CSRF-Token": "token_here",
 *   "Cookie": "session_cookie"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Successfully refreshed instagram token",
 *     "provider": "instagram",
 *     "accountId": "123456789",
 *     "expiresAt": "2025-12-31T23:59:59.000Z"
 *   },
 *   "meta": {
 *     "timestamp": "2024-11-20T10:30:00.000Z",
 *     "requestId": "refresh-1234567890-abc123",
 *     "duration": 245
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
import { successResponse } from '@/lib/api/utils/response';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import { validateCsrfToken } from '@/lib/middleware/csrf';
import { cacheService } from '@/lib/services/cache.service';
import { createLogger } from '@/lib/utils/logger';
import type { Provider } from '@/lib/services/integrations/types';
import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const logger = createLogger('integrations-refresh-api');

// ============================================================================
// Constants & Configuration
// ============================================================================

const VALID_PROVIDERS: Provider[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];

/**
 * Retry configuration for transient failures
 */
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
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
  ],
};

// ============================================================================
// Types
// ============================================================================

/**
 * Refresh success response data
 */
interface RefreshSuccessData {
  message: string;
  provider: Provider;
  accountId: string;
  expiresAt: string | null;
}

/**
 * Custom error types for better error handling
 */
enum RefreshErrorType {
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  INVALID_ACCOUNT_ID = 'INVALID_ACCOUNT_ID',
  INVALID_USER_ID = 'INVALID_USER_ID',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CSRF_ERROR = 'CSRF_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured error class
 */
class RefreshError extends Error {
  constructor(
    public type: RefreshErrorType,
    message: string,
    public correlationId: string,
    public retryable: boolean = false,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'RefreshError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `refresh-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Extract client IP address for audit logging
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRY_CONFIG.retryableErrors.includes(error.code);
  }

  // Network errors
  if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }

  // Service-specific retryable errors
  if (error.retryable === true) {
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
  attempt: number = 1
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

    logger.warn('Retrying token refresh operation', {
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
 * POST /api/integrations/refresh/:provider/:accountId
 * 
 * Refresh OAuth token for a connected integration with retry logic,
 * structured error handling, and cache invalidation.
 */
export const POST = withRateLimit(
  withAuth(async (
    req: AuthenticatedRequest,
    { params }: { params: { provider: string; accountId: string } }
  ) => {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      logger.info('Token refresh request received', {
        correlationId,
        provider: params.provider,
        accountId: params.accountId,
        userId: req.user.id,
      });

      // 1. Validate CSRF token (Requirements: 16.5)
      const csrfValidation = await validateCsrfToken(req);
      if (!csrfValidation.valid) {
        logger.warn('CSRF validation failed for token refresh', {
          correlationId,
          error: csrfValidation.error,
          errorCode: csrfValidation.errorCode,
          provider: params.provider,
          accountId: params.accountId,
          userId: req.user.id,
        });
        
        throw new RefreshError(
          RefreshErrorType.CSRF_ERROR,
          csrfValidation.error || 'CSRF validation failed',
          correlationId,
          false,
          403,
          { errorCode: csrfValidation.errorCode }
        );
      }
      
      const provider = params.provider as Provider;
      const accountId = params.accountId;
      
      // 2. Validate provider
      if (!VALID_PROVIDERS.includes(provider)) {
        logger.warn('Invalid provider specified', {
          correlationId,
          provider,
          validProviders: VALID_PROVIDERS,
        });
        
        throw new RefreshError(
          RefreshErrorType.INVALID_PROVIDER,
          `Invalid provider: ${provider}. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
          correlationId,
          false,
          400,
          { validProviders: VALID_PROVIDERS }
        );
      }

      // 3. Validate accountId (sanitize to prevent injection)
      if (!accountId || accountId.trim() === '') {
        logger.warn('Missing or empty account ID', {
          correlationId,
          provider,
        });
        
        throw new RefreshError(
          RefreshErrorType.INVALID_ACCOUNT_ID,
          'Account ID is required',
          correlationId,
          false,
          400
        );
      }

      // 4. Validate user ID
      const userId = parseInt(req.user.id);
      
      if (isNaN(userId) || userId <= 0) {
        logger.warn('Invalid user ID', {
          correlationId,
          userId: req.user.id,
        });
        
        throw new RefreshError(
          RefreshErrorType.INVALID_USER_ID,
          'Invalid user ID',
          correlationId,
          false,
          400
        );
      }

      // 5. Verify user owns this integration with retry logic
      let account;
      try {
        account = await retryWithBackoff(
          async () => {
            return await prisma.oAuthAccount.findFirst({
              where: {
                userId,
                provider,
                providerAccountId: accountId,
              },
            });
          },
          correlationId
        );
      } catch (dbError: any) {
        logger.error('Database error verifying integration ownership', dbError, {
          correlationId,
          userId,
          provider,
          accountId,
          duration: Date.now() - startTime,
        });

        throw new RefreshError(
          RefreshErrorType.DATABASE_ERROR,
          'Service temporarily unavailable. Please try again.',
          correlationId,
          true,
          503,
          { originalError: dbError.message }
        );
      }

      if (!account) {
        logger.warn('Integration not found for user', {
          correlationId,
          userId,
          provider,
          accountId,
        });
        
        throw new RefreshError(
          RefreshErrorType.ACCOUNT_NOT_FOUND,
          `Integration for ${provider} not found`,
          correlationId,
          false,
          404
        );
      }

      // 6. Refresh token with retry logic
      // Note: integrationsService.refreshToken already has built-in retry logic
      // We wrap it in our own retry for additional resilience against transient failures
      let refreshedIntegration;
      try {
        refreshedIntegration = await retryWithBackoff(
          async () => {
            return await integrationsService.refreshToken(
              provider,
              accountId,
              {
                maxRetries: 3,
                initialDelay: 1000,
                maxDelay: 10000,
              }
            );
          },
          correlationId
        );
      } catch (refreshError: any) {
        logger.error('Token refresh failed', refreshError, {
          correlationId,
          userId,
          provider,
          accountId,
          duration: Date.now() - startTime,
          errorCode: refreshError.code,
        });

        // Handle specific refresh errors
        if (refreshError.code === 'NO_REFRESH_TOKEN') {
          throw new RefreshError(
            RefreshErrorType.NO_REFRESH_TOKEN,
            'This integration does not support token refresh',
            correlationId,
            false,
            400,
            { provider }
          );
        }

        if (refreshError.code === 'TOKEN_REFRESH_ERROR') {
          throw new RefreshError(
            RefreshErrorType.TOKEN_REFRESH_FAILED,
            'Failed to refresh token. Please reconnect your account.',
            correlationId,
            false,
            422,
            { provider }
          );
        }

        // Generic refresh error
        throw new RefreshError(
          RefreshErrorType.TOKEN_REFRESH_FAILED,
          refreshError.message || 'Failed to refresh token',
          correlationId,
          isRetryableError(refreshError),
          500,
          { originalError: refreshError.message }
        );
      }

      // 8. Get updated account to return new expiry with retry logic
      let updatedAccount;
      try {
        updatedAccount = await retryWithBackoff(
          async () => {
            return await prisma.oAuthAccount.findFirst({
              where: {
                userId,
                provider,
                providerAccountId: accountId,
              },
            });
          },
          correlationId
        );
      } catch (dbError: any) {
        logger.error('Database error fetching updated account', dbError, {
          correlationId,
          userId,
          provider,
          accountId,
        });

        // Token was refreshed successfully, but we couldn't fetch the updated data
        // Return success without expiry date
        updatedAccount = null;
      }

      // 9. Invalidate integration status cache (Requirements: 11.5, 12.3)
      try {
        const cacheKey = `integrations:status:${userId}`;
        cacheService.invalidate(cacheKey);
        
        logger.info('Integration cache invalidated after token refresh', {
          correlationId,
          userId,
          provider,
          accountId,
          cacheKey,
        });
      } catch (cacheError) {
        // Log cache error but don't fail the request
        logger.warn('Failed to invalidate integration cache', {
          correlationId,
          userId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        });
      }

      const duration = Date.now() - startTime;

      // 10. Build success response
      const responseData: RefreshSuccessData = {
        message: `Successfully refreshed ${provider} token`,
        provider,
        accountId,
        expiresAt: updatedAccount?.expiresAt?.toISOString() || null,
      };

      logger.info('Token refresh completed successfully', {
        correlationId,
        userId,
        provider,
        accountId,
        duration,
        expiresAt: responseData.expiresAt,
      });

      return NextResponse.json(
        successResponse(responseData, { correlationId, startTime }),
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

      // Handle RefreshError instances
      if (error instanceof RefreshError) {
        logger.error('Token refresh failed with known error', error, {
          correlationId: error.correlationId,
          errorType: error.type,
          retryable: error.retryable,
          duration,
          metadata: error.metadata,
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.type,
              message: error.message,
              retryable: error.retryable,
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: error.correlationId,
              duration,
            },
          },
          {
            status: error.statusCode,
            headers: {
              'X-Correlation-Id': error.correlationId,
              ...(error.retryable && { 'Retry-After': '60' }),
            },
          }
        );
      }

      // Handle unexpected errors
      logger.error('Unexpected error during token refresh', error, {
        correlationId,
        duration,
        errorMessage: error.message,
        errorStack: error.stack,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: RefreshErrorType.INTERNAL_ERROR,
            message: 'An unexpected error occurred. Please try again.',
            retryable: true,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: correlationId,
            duration,
          },
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
  }),
  { limit: 20, windowMs: 60000 } // 20 requests per minute
);
