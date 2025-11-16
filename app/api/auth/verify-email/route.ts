/**
 * Email Verification API Route
 * 
 * Verifies user email address using token sent via email
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, deleteVerificationToken } from '@/lib/auth/tokens';
import { query } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/services/email/ses';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('auth-verify-email');

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `verify-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      logger.warn('Verification failed: Missing token', { correlationId });
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_TOKEN',
            message: 'Verification token is required',
            correlationId,
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
        token: token.substring(0, 8) + '...',
      });
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
            correlationId,
          },
        },
        { status: 400 }
      );
    }

    const { userId, email } = verification;

    // Update user email_verified status
    await query(
      'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // Delete verification token
    await deleteVerificationToken(userId);

    // Get user name for welcome email
    const userResult = await query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const userName = userResult.rows[0]?.name || 'User';

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, userName).catch((error) => {
      logger.error('Failed to send welcome email', error as Error, {
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

    // Redirect to success page or login
    return NextResponse.redirect(
      new URL('/auth?verified=true', request.url)
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email verification error', error as Error, {
      duration,
      correlationId,
    });

    return NextResponse.json(
      {
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'An error occurred during email verification',
          correlationId,
        },
      },
      { status: 500 }
    );
  }
}
