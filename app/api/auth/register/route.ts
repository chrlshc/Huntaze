/**
 * Auth API - User Registration
 * 
 * POST /api/auth/register
 * 
 * Handles user registration with:
 * - Input validation (email format, password strength)
 * - Error handling with retry logic
 * - Rate limiting protection
 * - Structured logging with correlation IDs
 * - User-friendly error messages
 * - Database transaction safety
 * 
 * @see docs/api/auth-register.md
 * @see lib/services/auth/register.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { registrationService } from '@/lib/services/auth/register';
import { authLogger } from '@/lib/services/auth/logger';
import type { RegisterRequest, RegisterResponse, AuthError } from '@/lib/services/auth/types';

// Force Node.js runtime (required for database connections)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Register a new user
 * 
 * @param request - Next.js request object
 * @returns JSON response with user data or error
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/auth/register
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe" // optional
 * }
 * 
 * // Success Response (201)
 * {
 *   "success": true,
 *   "user": {
 *     "id": "123",
 *     "email": "john@example.com",
 *     "name": "John Doe"
 *   },
 *   "message": "Account created successfully"
 * }
 * 
 * // Error Response (400/409/500)
 * {
 *   "error": "User-friendly error message",
 *   "type": "USER_EXISTS",
 *   "correlationId": "auth-1234567890-abc123",
 *   "retryable": false
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  const correlationId = authLogger.generateCorrelationId();
  const startTime = Date.now();

  try {
    // Parse request body with timeout protection
    const body = await Promise.race([
      request.json(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
      ),
    ]);

    // Validate required fields
    if (!body || typeof body !== 'object') {
      authLogger.warn('Registration request - Invalid body', {
        correlationId,
        bodyType: typeof body,
      });

      return NextResponse.json(
        {
          error: 'Invalid request body',
          type: 'VALIDATION_ERROR',
          correlationId,
          retryable: false,
        },
        { status: 400 }
      );
    }

    const data: RegisterRequest = {
      email: body.email,
      password: body.password,
      name: body.name,
    };

    // Log request (without sensitive data)
    authLogger.info('Registration request received', {
      correlationId,
      email: data.email,
      hasName: !!data.name,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
    });

    // Register user with timeout protection
    const result: RegisterResponse = await Promise.race([
      registrationService.register(data),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout')), REQUEST_TIMEOUT_MS)
      ),
    ]);

    const duration = Date.now() - startTime;
    authLogger.info('Registration request completed', {
      correlationId,
      userId: result.user.id,
      duration,
      success: true,
    });

    // Return success response with security headers
    return NextResponse.json(result, {
      status: 201,
      headers: {
        'X-Correlation-Id': correlationId,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle timeout errors
    if (error.message === 'Request timeout' || error.message === 'Registration timeout') {
      authLogger.error('Registration request timeout', error, {
        correlationId,
        duration,
        timeout: REQUEST_TIMEOUT_MS,
      });

      return NextResponse.json(
        {
          error: 'Request timed out. Please try again.',
          type: 'TIMEOUT_ERROR',
          correlationId,
          retryable: true,
        },
        {
          status: 504,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '5',
          },
        }
      );
    }

    // Handle structured errors from registration service
    if (error.type) {
      const authError = error as AuthError;
      
      authLogger.warn('Registration request failed', {
        correlationId,
        type: authError.type,
        statusCode: authError.statusCode,
        duration,
        retryable: authError.retryable,
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
    authLogger.error('Registration request error', error, {
      correlationId,
      duration,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        type: 'INTERNAL_ERROR',
        correlationId,
        retryable: true,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '10',
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
