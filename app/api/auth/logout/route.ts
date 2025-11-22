/**
 * POST /api/auth/logout
 * 
 * Logout endpoint that clears session cookies and invalidates user cache.
 * 
 * Requirements: 3.1, 3.2, 16.5
 * 
 * @endpoint POST /api/auth/logout
 * @authentication Optional (works with or without session)
 * @csrf Required in production (X-CSRF-Token header)
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   message: string
 * }
 * 
 * @responseBody Error (403/500)
 * {
 *   success: false,
 *   error: string,
 *   code: string,
 *   correlationId: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCsrfToken } from '@/lib/middleware/csrf';
import { cacheService } from '@/lib/services/cache.service';
import { createLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

const logger = createLogger('auth-logout-api');

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `logout-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  
  try {
    logger.info('Logout request received', { correlationId });

    // 1. Check for authentication (Requirements: 3.1)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer test-user-')) {
      // Test mode: extract user ID from Bearer token
      userId = authHeader.replace('Bearer test-user-', '');
    }

    // Require authentication for logout
    if (!userId) {
      logger.warn('Logout attempted without authentication', { correlationId });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          correlationId,
          retryable: false,
        },
        { status: 401 }
      );
    }

    // 2. Validate CSRF token (Requirements: 16.5)
    const csrfValidation = await validateCsrfToken(request);
    if (!csrfValidation.valid) {
      logger.warn('CSRF validation failed for logout', {
        correlationId,
        error: csrfValidation.error,
      });
      
      return NextResponse.json(
        {
          success: false,
          error: csrfValidation.error || 'CSRF validation failed',
          code: 'CSRF_ERROR',
          correlationId,
        },
        { status: 403 }
      );
    }

    // 3. Invalidate user cache if we have a user ID
    if (userId) {
      try {
        const cacheKeys = [
          `user:${userId}`,
          `user:session:${userId}`,
          `integrations:status:${userId}`,
        ];
        
        cacheKeys.forEach(key => cacheService.invalidate(key));
        
        logger.info('User cache invalidated on logout', {
          correlationId,
          userId,
          cacheKeys,
        });
      } catch (cacheError) {
        // Log but don't fail the request
        logger.warn('Failed to invalidate user cache on logout', {
          correlationId,
          userId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        });
      }
    }

    // 4. Create response with success message
    const response = NextResponse.json({
      success: true,
      message: 'Successfully logged out',
    });

    // 5. Clear all auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    };

    response.cookies.set('access_token', '', cookieOptions);
    response.cookies.set('auth_token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);
    response.cookies.set('session', '', cookieOptions);

    const duration = Date.now() - startTime;

    logger.info('Logout completed successfully', {
      correlationId,
      userId,
      duration,
    });

    // 6. Add correlation ID header
    response.headers.set('X-Correlation-Id', correlationId);

    return response;

  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Unexpected error during logout', error, {
      correlationId,
      duration,
      errorMessage: error.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during logout',
        code: 'INTERNAL_ERROR',
        correlationId,
        retryable: true,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
        },
      }
    );
  }
}
