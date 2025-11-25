/**
 * Email Signup API Route
 * Handles email-first signup with magic link
 * 
 * Requirements:
 * - 2.1: Email-only initial signup
 * - 2.2: Send verification email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { validateEmail } from '@/lib/validation/signup';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendMagicLinkEmail } from '@/lib/auth/magic-link';
import { validateCsrfToken } from '@/lib/middleware/csrf';

const logger = createLogger('signup-email');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate CSRF token
    const csrfValidation = await validateCsrfToken(request);
    if (!csrfValidation.valid) {
      logger.warn('CSRF validation failed for signup', {
        error: csrfValidation.error,
        errorCode: csrfValidation.errorCode,
      });
      
      return NextResponse.json(
        { 
          error: csrfValidation.userMessage || csrfValidation.error || 'CSRF validation failed',
          errorCode: csrfValidation.errorCode,
          shouldRefresh: csrfValidation.shouldRefresh,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    const validation = validateEmail(email);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error || 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id, email_verified FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    let userId: number;

    if (existingUser.rows.length > 0) {
      // User exists - send magic link for login
      userId = existingUser.rows[0].id;
      logger.info('Existing user requesting magic link', {
        userId,
        email,
      });
    } else {
      // Create new user
      const result = await query(
        `INSERT INTO users (email, email_verified, signup_method, created_at, updated_at)
         VALUES ($1, false, 'email', NOW(), NOW())
         RETURNING id`,
        [email]
      );
      
      userId = result.rows[0].id;
      
      logger.info('New user created via email signup', {
        userId,
        email,
      });
    }

    // Generate verification token (24-hour expiry)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await query(
      `INSERT INTO nextauth_verification_tokens (identifier, token, expires)
       VALUES ($1, $2, $3)
       ON CONFLICT (identifier, token) 
       DO UPDATE SET expires = $3`,
      [email, token, expiresAt]
    );

    // Generate magic link URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLinkUrl = `${baseUrl}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send magic link email
    await sendMagicLinkEmail({
      email,
      url: magicLinkUrl,
      token,
    });

    const duration = Date.now() - startTime;
    logger.info('Magic link sent successfully', {
      email,
      userId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email signup error', error as Error, {
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
