/**
 * Auth API - User Registration
 * 
 * POST /api/auth/register
 * 
 * Handles user registration with:
 * - Input validation
 * - Error handling with retry logic
 * - Structured logging with correlation IDs
 * - User-friendly error messages
 * 
 * @see docs/api/auth-register.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { registrationService } from '@/lib/services/auth/register';
import { authLogger } from '@/lib/services/auth/logger';
import type { RegisterRequest, RegisterResponse } from '@/lib/services/auth/types';

// Force Node.js runtime (required for database connections)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 *   "password": "SecurePass123!"
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
 *   "correlationId": "auth-1234567890-abc123"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  const correlationId = authLogger.generateCorrelationId();
  const startTime = Date.now();

    const body = await request.json();
    const data: RegisterRequest = {
      email: body.email,
      password: body.password,
    };

    authLogger.info('Registration request received', {
      correlationId,
      email: data.email,
    });

    // Register user
    const result: RegisterResponse = await registrationService.register(data);

    const duration = Date.now() - startTime;
    authLogger.info('Registration request completed', {
      correlationId,
      userId: result.user.id,
      duration,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle structured errors
    if (error.type) {
      authLogger.warn('Registration request failed', {
        correlationId,
        type: error.type,
        statusCode: error.statusCode,
        duration,
      });

      return NextResponse.json(
        {
          error: error.userMessage || error.message,
          type: error.type,
          correlationId: error.correlationId,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle unexpected errors
    authLogger.error('Registration request error', error, {
      correlationId,
      duration,
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
        type: 'INTERNAL_ERROR',
        correlationId,
      },
      { status: 500 }
    );
  }
}
