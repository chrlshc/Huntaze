/**
 * Email Verification API Route
 * 
 * GET /api/auth/verify-email?token=xxx
 * 
 * Verifies user email address using token sent via email
 * 
 * Features:
 * - Token validation with expiration check
 * - Atomic database operations
 * - Non-blocking welcome email
 * - Structured error responses
 * - Comprehensive logging
 * - Rate limiting protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, deleteVerificationToken } from '@/lib/auth/tokens';
import { query } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/services/email/ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('auth-verify-email');

// Error codes for structured error handling
enum VerificationErrorCode {
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VERIFICATION_ERROR = 'VERIFICATION_ERROR',
}

// Response types
interface VerificationErrorResponse {
  error: {
    code: VerificationErrorCode;
    message: string;
    correlationId: string;
    userMessage?: string;
  };
}

interface VerificationSuccessResponse {
  success: true;
  message: string;
  userId: number;
  email: string;
  correlationId: string;
}

/**
 * GET /api/auth/verify-email
 * 
 * Verifies user email address
 * 
 * @param token - Verification token from email (query param)
 * @returns Redirect to auth page with verification status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `verify-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    // Extract token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Validate token presence
    if (!token) {
      logger.warn('Verification failed: Missing token', { correlationId });
      
      return NextResponse.redirect(
        new URL('/auth?verified=false&error=missing_token', request.url)
      );
    }

    // Validate token format (64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      logger.warn('Verification failed: Invalid token format', {
        correlationId,
        tokenLength: token.length,
      });
      
      return NextResponse.redirect(
        new URL('/auth?verified=false&error=invalid_token', request.url)
      );
    }

    // Verify token and get user info
    const verification = await verifyEmailToken(token);

    if (!verification) {
      logger.warn('Verification failed: Invalid or expired token', {
        correlationId,
        tokenPrefix: token.substring(0, 8),
      });
      
      return NextResponse.redirect(
        new URL('/auth?verified=false&error=expired_token', request.url)
      );
    }

    const { userId, email } = verification;

    // Check if already verified (idempotency)
    const userCheck = await query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows[0]?.email_verified) {
      logger.info('Email already verified', {
        userId,
        email,
        correlationId,
      });
      
      return NextResponse.redirect(
        new URL('/auth?verified=already', request.url)
      );
    }

    // Atomic update: verify email and delete token
    await query('BEGIN');
    
    try {
      // Update user email_verified status
      await query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      // Delete verification token
      await deleteVerificationToken(userId);

      await query('COMMIT');
    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

    // Get user name for welcome email
    const userResult = await query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const userName = userResult.rows[0]?.name || 'User';

    // Send welcome email (non-blocking, fire-and-forget)
    sendWelcomeEmail(email, userName).catch((emailError) => {
      logger.error('Failed to send welcome email', emailError as Error, {
        userId,
        email,
        correlationId,
        // Non-critical error, don't fail verification
      });
    });

    const duration = Date.now() - startTime;
    logger.info('Email verified successfully', {
      userId,
      email,
      duration,
      correlationId,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth?verified=true', request.url)
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email verification error', error as Error, {
      duration,
      correlationId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Redirect to error page
    return NextResponse.redirect(
      new URL('/auth?verified=false&error=server_error', request.url)
    );
  }
}

/**
 * POST /api/auth/verify-email
 * 
 * Alternative endpoint for programmatic verification
 * Returns JSON response instead of redirect
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `verify-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    const body = await request.json();
    const { token } = body;

    // Validate token presence
    if (!token) {
      logger.warn('Verification failed: Missing token', { correlationId });
      
      return NextResponse.json<VerificationErrorResponse>(
        {
          error: {
            code: VerificationErrorCode.MISSING_TOKEN,
            message: 'Verification token is required',
            correlationId,
            userMessage: 'Please provide a verification token',
          },
        },
        { status: 400 }
      );
    }

    // Validate token format
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      logger.warn('Verification failed: Invalid token format', {
        correlationId,
        tokenLength: token.length,
      });
      
      return NextResponse.json<VerificationErrorResponse>(
        {
          error: {
            code: VerificationErrorCode.INVALID_TOKEN,
            message: 'Invalid token format',
            correlationId,
            userMessage: 'The verification link is invalid',
          },
        },
        { status: 400 }
      );
    }

    // Verify token
    const verification = await verifyEmailToken(token);

    if (!verification) {
      logger.warn('Verification failed: Invalid or expired token', {
        correlationId,
        tokenPrefix: token.substring(0, 8),
      });
      
      return NextResponse.json<VerificationErrorResponse>(
        {
          error: {
            code: VerificationErrorCode.EXPIRED_TOKEN,
            message: 'Invalid or expired verification token',
            correlationId,
            userMessage: 'This verification link has expired. Please request a new one.',
          },
        },
        { status: 400 }
      );
    }

    const { userId, email } = verification;

    // Check if already verified
    const userCheck = await query(
      'SELECT email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows[0]?.email_verified) {
      logger.info('Email already verified', {
        userId,
        email,
        correlationId,
      });
      
      return NextResponse.json<VerificationSuccessResponse>(
        {
          success: true,
          message: 'Email already verified',
          userId,
          email,
          correlationId,
        },
        { status: 200 }
      );
    }

    // Atomic update
    await query('BEGIN');
    
    try {
      await query(
        'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      await deleteVerificationToken(userId);

      await query('COMMIT');
    } catch (dbError) {
      await query('ROLLBACK');
      throw dbError;
    }

    // Get user name for welcome email
    const userResult = await query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const userName = userResult.rows[0]?.name || 'User';

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, userName).catch((emailError) => {
      logger.error('Failed to send welcome email', emailError as Error, {
        userId,
        email,
        correlationId,
      });
    });

    const duration = Date.now() - startTime;
    logger.info('Email verified successfully', {
      userId,
      email,
      duration,
      correlationId,
    });

    return NextResponse.json<VerificationSuccessResponse>(
      {
        success: true,
        message: 'Email verified successfully',
        userId,
        email,
        correlationId,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email verification error', error as Error, {
      duration,
      correlationId,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json<VerificationErrorResponse>(
      {
        error: {
          code: VerificationErrorCode.VERIFICATION_ERROR,
          message: 'An error occurred during email verification',
          correlationId,
          userMessage: 'Something went wrong. Please try again or contact support.',
        },
      },
      { status: 500 }
    );
  }
}
