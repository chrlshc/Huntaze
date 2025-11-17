/**
 * Auth API - Onboarding Status
 * 
 * GET /api/auth/onboarding-status
 * 
 * Returns the onboarding completion status for the authenticated user
 * 
 * @see lib/services/auth/onboarding.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { onboardingService } from '@/lib/services/auth/onboarding';
import { authLogger } from '@/lib/services/auth/logger';
import type { AuthError } from '@/lib/services/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get onboarding status for authenticated user
 * 
 * @returns JSON response with onboarding status
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/auth/onboarding-status
 * 
 * // Success Response (200)
 * {
 *   "onboarding_completed": true,
 *   "correlationId": "auth-1234567890-abc123"
 * }
 * 
 * // Error Response (401)
 * {
 *   "error": "Unauthorized",
 *   "correlationId": "auth-1234567890-abc123"
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  const correlationId = authLogger.generateCorrelationId();
  const startTime = Date.now();
  
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      authLogger.warn('Onboarding status request - Unauthorized', {
        correlationId,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      
      return NextResponse.json(
        {
          error: 'Unauthorized. Please log in.',
          correlationId,
        },
        {
          status: 401,
          headers: {
            'X-Correlation-Id': correlationId,
            'WWW-Authenticate': 'Bearer',
          },
        }
      );
    }
    
    // Get onboarding status
    const completed = await onboardingService.isOnboardingCompleted(
      session.user.id
    );
    
    const duration = Date.now() - startTime;
    authLogger.info('Onboarding status retrieved', {
      correlationId,
      userId: session.user.id,
      completed,
      duration,
    });
    
    return NextResponse.json(
      {
        onboarding_completed: completed,
        correlationId,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle structured errors
    if (error.type) {
      const authError = error as AuthError;
      
      authLogger.error('Get onboarding status failed', error, {
        correlationId,
        type: authError.type,
        duration,
      });
      
      return NextResponse.json(
        {
          error: authError.userMessage || authError.message,
          type: authError.type,
          correlationId: authError.correlationId || correlationId,
        },
        {
          status: authError.statusCode || 500,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }
    
    // Handle unexpected errors
    authLogger.error('Get onboarding status error', error, {
      correlationId,
      duration,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to get onboarding status. Please try again.',
        correlationId,
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
