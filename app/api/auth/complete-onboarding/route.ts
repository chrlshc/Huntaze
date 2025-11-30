/**
 * Auth API - Complete Onboarding
 * 
 * POST /api/auth/complete-onboarding
 * 
 * Marks the authenticated user's onboarding as completed
 * 
 * @see lib/services/auth/onboarding.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { onboardingService } from '@/lib/services/auth/onboarding';
import { authLogger } from '@/lib/services/auth/logger';
import type { AuthError } from '@/lib/services/auth/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Mark onboarding as completed for authenticated user
 * 
 * @returns JSON response with success status
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/auth/complete-onboarding
 * 
 * // Success Response (200)
 * {
 *   "success": true,
 *   "message": "Onboarding completed successfully",
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
export async function POST(request: NextRequest) {
  const correlationId = authLogger.generateCorrelationId();
  const startTime = Date.now();
  
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      authLogger.warn('Complete onboarding request - Unauthorized', {
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
    
    // Complete onboarding
    await onboardingService.completeOnboarding(session.user.id);
    
    const duration = Date.now() - startTime;
    authLogger.info('Onboarding completed via API', {
      correlationId,
      userId: session.user.id,
      duration,
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Onboarding completed successfully',
        correlationId,
      },
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle structured errors
    if (error.type) {
      const authError = error as AuthError;
      
      authLogger.error('Complete onboarding failed', error, {
        correlationId,
        type: authError.type,
        duration,
      });
      
      return NextResponse.json(
        {
          error: authError.userMessage || authError.message,
          type: authError.type,
          correlationId: authError.correlationId || correlationId,
          retryable: authError.retryable || false,
        },
        {
          status: authError.statusCode || 500,
          headers: {
            'X-Correlation-Id': correlationId,
            ...(authError.retryable && { 'Retry-After': '5' }),
          },
        }
      );
    }
    
    // Handle unexpected errors
    authLogger.error('Complete onboarding error', error, {
      correlationId,
      duration,
    });
    
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding. Please try again.',
        correlationId,
        retryable: true,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '5',
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
        'Allow': 'POST, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
