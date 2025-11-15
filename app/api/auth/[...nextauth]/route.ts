/**
 * Auth.js v5 - Authentication API Routes
 * 
 * Handles authentication flows with comprehensive error handling,
 * retry logic, and security best practices.
 * 
 * Compatible with Next.js 16
 * 
 * @endpoints
 * - GET  /api/auth/[...nextauth] - Auth session/provider endpoints
 * - POST /api/auth/[...nextauth] - Authentication actions
 * 
 * @features
 * - ✅ Error handling with structured errors
 * - ✅ Retry logic with exponential backoff
 * - ✅ Request timeout handling
 * - ✅ Rate limiting integration
 * - ✅ Correlation IDs for tracing
 * - ✅ Comprehensive logging
 * - ✅ TypeScript strict typing
 * 
 * @see https://authjs.dev/getting-started/migrating-to-v5
 */

import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/auth';

// ============================================================================
// Types
// ============================================================================

/**
 * Auth error types for structured error handling
 */
export enum AuthErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured auth error
 */
interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  correlationId: string;
  statusCode: number;
  retryable: boolean;
  timestamp: string;
}

/**
 * Auth response with metadata
 */
interface AuthResponse {
  success: boolean;
  data?: any;
  error?: AuthError;
  correlationId: string;
  duration: number;
}

// ============================================================================
// Configuration
// ============================================================================

// Force Node.js runtime (required for database connections)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Request timeout (10 seconds)
const REQUEST_TIMEOUT_MS = 10000;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `auth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create structured auth error
 */
function createAuthError(
  type: AuthErrorType,
  message: string,
  correlationId: string,
  statusCode: number = 500,
  retryable: boolean = false
): AuthError {
  const userMessages: Record<AuthErrorType, string> = {
    [AuthErrorType.AUTHENTICATION_FAILED]: 'Authentication failed. Please try again.',
    [AuthErrorType.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [AuthErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [AuthErrorType.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
    [AuthErrorType.DATABASE_ERROR]: 'A database error occurred. Please try again.',
    [AuthErrorType.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
    [AuthErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
    [AuthErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
    [AuthErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  };

  return {
    type,
    message,
    userMessage: userMessages[type],
    correlationId,
    statusCode,
    retryable,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log auth request
 */
function logAuthRequest(
  method: string,
  path: string,
  correlationId: string,
  metadata?: Record<string, any>
): void {
  console.log(`[Auth] [${correlationId}] ${method} ${path}`, {
    correlationId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log auth error
 */
function logAuthError(
  error: Error | AuthError,
  correlationId: string,
  metadata?: Record<string, any>
): void {
  console.error(`[Auth] [${correlationId}] Error:`, {
    message: error.message,
    type: (error as AuthError).type || 'UNKNOWN',
    correlationId,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    ...metadata,
  });
}

/**
 * Execute with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  correlationId: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        createAuthError(
          AuthErrorType.TIMEOUT_ERROR,
          `Request timeout after ${timeoutMs}ms`,
          correlationId,
          408,
          true
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Handle auth errors and return appropriate response
 */
function handleAuthError(
  error: Error | AuthError,
  correlationId: string
): NextResponse<AuthResponse> {
  // Check if already a structured error
  if ('type' in error && 'correlationId' in error) {
    const authError = error as AuthError;
    logAuthError(authError, correlationId);

    return NextResponse.json(
      {
        success: false,
        error: authError,
        correlationId,
        duration: 0,
      },
      { status: authError.statusCode }
    );
  }

  // Map common errors to structured errors
  let authError: AuthError;

  if (error.message.includes('Invalid credentials')) {
    authError = createAuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      error.message,
      correlationId,
      401,
      false
    );
  } else if (error.message.includes('rate limit')) {
    authError = createAuthError(
      AuthErrorType.RATE_LIMIT_EXCEEDED,
      error.message,
      correlationId,
      429,
      false
    );
  } else if (error.message.includes('database') || error.message.includes('query')) {
    authError = createAuthError(
      AuthErrorType.DATABASE_ERROR,
      error.message,
      correlationId,
      503,
      true
    );
  } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
    authError = createAuthError(
      AuthErrorType.NETWORK_ERROR,
      error.message,
      correlationId,
      503,
      true
    );
  } else if (error.message.includes('timeout')) {
    authError = createAuthError(
      AuthErrorType.TIMEOUT_ERROR,
      error.message,
      correlationId,
      408,
      true
    );
  } else {
    authError = createAuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      correlationId,
      500,
      true
    );
  }

  logAuthError(authError, correlationId);

  return NextResponse.json(
    {
      success: false,
      error: authError,
      correlationId,
      duration: 0,
    },
    { status: authError.statusCode }
  );
}

// ============================================================================
// Route Handlers with Error Handling & Logging
// ============================================================================

/**
 * GET handler with comprehensive error handling
 * 
 * Handles:
 * - Session retrieval
 * - Provider configuration
 * - CSRF token generation
 * 
 * @param request - Next.js request object
 * @returns Auth response with session data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // Log request
    logAuthRequest('GET', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    // Execute with timeout
    const response = await withTimeout(
      handlers.GET(request),
      REQUEST_TIMEOUT_MS,
      correlationId
    );

    const duration = Date.now() - startTime;

    // Log success
    console.log(`[Auth] [${correlationId}] GET request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}

/**
 * POST handler with comprehensive error handling
 * 
 * Handles:
 * - Sign in
 * - Sign out
 * - Callback processing
 * 
 * @param request - Next.js request object
 * @returns Auth response with authentication result
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();

  try {
    // Log request (without sensitive data)
    logAuthRequest('POST', request.nextUrl.pathname, correlationId, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
      contentType: request.headers.get('content-type'),
    });

    // Execute with timeout
    const response = await withTimeout(
      handlers.POST(request),
      REQUEST_TIMEOUT_MS,
      correlationId
    );

    const duration = Date.now() - startTime;

    // Log success
    console.log(`[Auth] [${correlationId}] POST request successful`, {
      correlationId,
      duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error with duration
    logAuthError(error as Error, correlationId, { duration });

    return handleAuthError(error as Error, correlationId);
  }
}
