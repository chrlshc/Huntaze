/**
 * CSRF Token API
 * 
 * GET /api/csrf/token
 * 
 * Returns a new CSRF token for the current session.
 * This token should be included in all POST/PUT/DELETE/PATCH requests.
 * 
 * Requirements: 16.5
 * 
 * @authentication Required - Uses NextAuth session
 * @rateLimit None (read-only endpoint)
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     token: string,
 *     expiresIn: number
 *   },
 *   meta: {
 *     timestamp: string,
 *     requestId: string,
 *     duration: number
 *   }
 * }
 * 
 * @responseBody Error (401/500)
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
 * GET /api/csrf/token
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "1234567890:abc123...:def456...",
 *     "expiresIn": 3600000
 *   },
 *   "meta": {
 *     "timestamp": "2024-11-19T10:30:00.000Z",
 *     "requestId": "req_1234567890_abc123",
 *     "duration": 45
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/middleware/csrf';
import { createLogger } from '@/lib/utils/logger';
import { successResponse, errorResponse, unauthorized, internalServerError } from '@/lib/api/utils/response';
import crypto from 'crypto';

const logger = createLogger('csrf-token-api');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// Types
// ============================================================================

/**
 * CSRF token response data
 */
interface CsrfTokenData {
  token: string;
  expiresIn: number;
}

// ============================================================================
// Constants
// ============================================================================

const CSRF_TOKEN_EXPIRY_MS = 3600000; // 1 hour in milliseconds

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
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
  
  // Session retrieval errors (transient)
  if (error.message?.includes('session') || error.message?.includes('JWT')) {
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

    logger.warn('Retrying CSRF token generation', {
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
 * GET /api/csrf/token
 * 
 * Generate and return a new CSRF token for the current session
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = `csrf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const startTime = Date.now();

  try {
    logger.info('CSRF token request received', {
      correlationId,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });

    // 1. Check authentication (optional - CSRF tokens can be generated for unauthenticated users)
    let session;
    try {
      session = await retryWithBackoff(
        async () => {
          // Use getSessionFromRequest to support test mode
          const { getSessionFromRequest } = await import('@/lib/auth/session');
          return await getSessionFromRequest(request);
        },
        correlationId
      );
    } catch (sessionError: any) {
      // Session retrieval failed, but we can still generate a CSRF token for public pages
      logger.warn('Session retrieval failed, generating token for unauthenticated user', {
        correlationId,
        error: sessionError.message,
      });
      session = null;
    }
    
    // CSRF tokens are needed for both authenticated and unauthenticated users
    // (e.g., signup, login forms need CSRF protection too)
    logger.info('Generating CSRF token', {
      correlationId,
      authenticated: !!session?.user?.id,
      userId: session?.user?.id || 'anonymous',
    });
    
    // 2. Generate new CSRF token
    let token: string;
    try {
      token = generateCsrfToken();
    } catch (tokenError: any) {
      logger.error('CSRF token generation failed', tokenError, {
        correlationId,
        userId: session?.user?.id || 'anonymous',
        duration: Date.now() - startTime,
      });

      return NextResponse.json(
        errorResponse(
          'INTERNAL_ERROR',
          'Failed to generate CSRF token. Please try again.',
          undefined,
          { correlationId, startTime }
        ),
        { status: 500 }
      );
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('CSRF token generated successfully', {
      correlationId,
      userId: session?.user?.id || 'anonymous',
      tokenLength: token.length,
      duration,
    });
    
    // 3. Create response with standardized format
    const responseData: CsrfTokenData = {
      token,
      expiresIn: CSRF_TOKEN_EXPIRY_MS,
    };

    const apiResponse = successResponse(responseData, {
      correlationId,
      startTime,
    });
    
    // 4. Create NextResponse and set token in cookie
    const response = NextResponse.json(apiResponse, {
      status: 200,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-Duration-Ms': duration.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
    
    // Set token in cookie for automatic inclusion in requests
    return setCsrfTokenCookie(response);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('Unexpected error generating CSRF token', error, {
      correlationId,
      duration,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred. Please try again.',
        undefined,
        { correlationId, startTime }
      ),
      { status: 500 }
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
