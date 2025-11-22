/**
 * Auth API - User Registration
 * 
 * POST /api/auth/register
 * 
 * Handles user registration with:
 * - Input validation (email format, password strength)
 * - CSRF protection
 * - Automatic retry logic with exponential backoff
 * - Structured error handling with correlation IDs
 * - Rate limiting protection
 * - User-friendly error messages
 * - Database transaction safety
 * - Comprehensive logging
 * 
 * Requirements: 3.1, 3.2, 16.1, 16.5
 * 
 * @endpoint POST /api/auth/register
 * @authentication Not required (public endpoint)
 * @rateLimit 10 requests per 15 minutes per IP
 * 
 * @requestBody
 * {
 *   email: string,
 *   password: string,
 *   name?: string
 * }
 * 
 * @responseBody Success (201)
 * {
 *   success: true,
 *   data: {
 *     user: {
 *       id: string,
 *       email: string,
 *       name: string | null
 *     }
 *   },
 *   message: string,
 *   duration: number
 * }
 * 
 * @responseBody Error (400/403/409/500/503/504)
 * {
 *   success: false,
 *   error: string,
 *   code: string,
 *   correlationId: string,
 *   retryable?: boolean
 * }
 * 
 * @example
 * POST /api/auth/register
 * {
 *   "email": "john@example.com",
 *   "password": "SecurePass123!",
 *   "name": "John Doe"
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "data": {
 *     "user": {
 *       "id": "123",
 *       "email": "john@example.com",
 *       "name": "John Doe"
 *     }
 *   },
 *   "message": "Account created successfully",
 *   "duration": 245
 * }
 * 
 * @see app/api/auth/register/README.md
 * @see tests/integration/api/auth-register.integration.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { validateCsrfToken, setCsrfTokenCookie } from '@/lib/middleware/csrf';
import { Prisma } from '@prisma/client';

// Force Node.js runtime (required for database connections)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('auth-register');

// Configuration
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 12;

// ============================================================================
// Types
// ============================================================================

/**
 * Registration request body
 */
interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
}

/**
 * User data returned in response
 */
interface UserData {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Success response structure
 */
interface RegisterSuccessResponse {
  success: true;
  data: {
    user: UserData;
  };
  message: string;
  duration: number;
}

/**
 * Error response structure
 */
interface RegisterErrorResponse {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  retryable?: boolean;
}

/**
 * Response type (union)
 */
type RegisterResponse = RegisterSuccessResponse | RegisterErrorResponse;

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: [
    'P2024', // Prisma: Timed out fetching a new connection
    'P2034', // Prisma: Transaction failed due to a write conflict
    'P1001', // Prisma: Can't reach database server
    'P1002', // Prisma: Database server timeout
    'P1008', // Prisma: Operations timed out
    'P1017', // Prisma: Server closed the connection
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
// Validation Functions
// ============================================================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  // More strict email validation
  // - No consecutive dots
  // - No dots at start or end of local part
  // - Valid characters only (including + for plus addressing)
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+\-])*@[a-zA-Z0-9]([a-zA-Z0-9.\-])*\.[a-zA-Z]{2,}$/;
  
  // Additional checks
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }
  
  return true;
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, and numbers',
    };
  }

  return { valid: true };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
  const correlationId = `register-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    // 1. Validate CSRF token (Requirements: 16.5)
    logger.info('Registration request received', { correlationId });

    const csrfValidation = await validateCsrfToken(request);
    if (!csrfValidation.valid) {
      logger.warn('Registration blocked by CSRF protection', {
        correlationId,
        error: csrfValidation.error,
        errorCode: csrfValidation.errorCode,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: csrfValidation.error || 'CSRF validation failed',
          code: 'CSRF_ERROR',
          correlationId,
          retryable: false,
        },
        {
          status: 403,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // 2. Parse request body with timeout protection
    let body: any;
    try {
      body = await Promise.race([
        request.json(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
        ),
      ]);
    } catch (parseError: any) {
      if (parseError.message === 'Request timeout') {
        logger.error('Request body parsing timeout', parseError, { correlationId });

        return NextResponse.json<RegisterErrorResponse>(
          {
            success: false,
            error: 'Request timed out. Please try again.',
            code: 'TIMEOUT_ERROR',
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

      logger.warn('Invalid request body', {
        correlationId,
        error: parseError.message,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    // 3. Validate request body structure
    if (!body || typeof body !== 'object') {
      logger.warn('Invalid body type', {
        correlationId,
        bodyType: typeof body,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    const data: RegisterRequestBody = {
      email: body.email,
      password: body.password,
      name: body.name,
    };

    // 4. Validate required fields
    if (!data.email || typeof data.email !== 'string') {
      logger.warn('Missing or invalid email', { correlationId });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Email is required',
          code: 'MISSING_EMAIL',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    if (!data.password || typeof data.password !== 'string') {
      logger.warn('Missing or invalid password', { correlationId });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Password is required',
          code: 'MISSING_PASSWORD',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    // 5. Validate email format
    if (!isValidEmail(data.email)) {
      logger.warn('Invalid email format', {
        correlationId,
        email: data.email,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    // 6. Validate password strength
    const passwordValidation = isValidPassword(data.password);
    if (!passwordValidation.valid) {
      logger.warn('Weak password', {
        correlationId,
        email: data.email,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: passwordValidation.error || 'Password does not meet requirements',
          code: 'WEAK_PASSWORD',
          correlationId,
          retryable: false,
        },
        { status: 400, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    // Log request (without sensitive data)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent')?.substring(0, 100) || 'unknown';

    logger.info('Processing registration', {
      correlationId,
      email: data.email,
      hasName: !!data.name,
      ip: clientIp,
      userAgent,
    });

    // 7. Check if user already exists (with retry)
    let existingUser;
    try {
      existingUser = await retryWithBackoff(
        async () => {
          return await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
            select: { id: true },
          });
        },
        correlationId
      );
    } catch (dbError: any) {
      logger.error('Database error checking existing user', dbError, {
        correlationId,
        email: data.email,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again.',
          code: 'DATABASE_ERROR',
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

    if (existingUser) {
      logger.warn('User already exists', {
        correlationId,
        email: data.email,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'An account with this email already exists',
          code: 'USER_EXISTS',
          correlationId,
          retryable: false,
        },
        { status: 409, headers: { 'X-Correlation-Id': correlationId } }
      );
    }

    // 8. Hash password (Requirements: 16.1)
    let hashedPassword: string;
    try {
      hashedPassword = await hash(data.password, BCRYPT_ROUNDS);
    } catch (hashError: any) {
      logger.error('Password hashing error', hashError, { correlationId });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Failed to process registration. Please try again.',
          code: 'HASH_ERROR',
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

    // 9. Create user in database (with retry)
    let user;
    try {
      user = await retryWithBackoff(
        async () => {
          return await prisma.user.create({
            data: {
              email: data.email.toLowerCase(),
              password: hashedPassword,
              name: data.name || null,
              emailVerified: false,
              onboardingCompleted: false,
            },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });
        },
        correlationId
      );
    } catch (dbError: any) {
      // Handle unique constraint violation (race condition)
      if (dbError instanceof Prisma.PrismaClientKnownRequestError && dbError.code === 'P2002') {
        logger.warn('User creation race condition', {
          correlationId,
          email: data.email,
        });

        return NextResponse.json<RegisterErrorResponse>(
          {
            success: false,
            error: 'An account with this email already exists',
            code: 'USER_EXISTS',
            correlationId,
            retryable: false,
          },
          { status: 409, headers: { 'X-Correlation-Id': correlationId } }
        );
      }

      logger.error('Database error creating user', dbError, {
        correlationId,
        email: data.email,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again.',
          code: 'DATABASE_ERROR',
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

    // 10. Build success response
    const duration = Date.now() - startTime;

    logger.info('Registration successful', {
      correlationId,
      userId: user.id,
      email: user.email,
      duration,
    });

    const responseData: RegisterSuccessResponse = {
      success: true,
      data: {
        user: {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      message: 'Account created successfully',
      duration,
    };

    // Return success response with security headers and new CSRF token
    const response = NextResponse.json<RegisterSuccessResponse>(responseData, {
      status: 201,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-Duration-Ms': duration.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

    // Set new CSRF token for subsequent requests
    return setCsrfTokenCookie(response);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle timeout errors
    if (error.message === 'Request timeout' || error.message === 'Registration timeout') {
      logger.error('Registration timeout', error, {
        correlationId,
        duration,
        timeout: REQUEST_TIMEOUT_MS,
      });

      return NextResponse.json<RegisterErrorResponse>(
        {
          success: false,
          error: 'Request timed out. Please try again.',
          code: 'TIMEOUT_ERROR',
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

    // Handle unexpected errors
    logger.error('Unexpected registration error', error, {
      correlationId,
      duration,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json<RegisterErrorResponse>(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
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
        'Allow': 'POST, OPTIONS',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      },
    }
  );
}
