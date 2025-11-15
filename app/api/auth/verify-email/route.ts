/**
 * Auth API - Email Verification
 * 
 * GET /api/auth/verify-email?token=xxx
 * 
 * Verifies user email address using verification token
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/services/email/ses';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const result = await query(
      `SELECT id, email, name, email_verified, email_verification_expires 
       FROM users 
       WHERE email_verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.redirect(
        new URL('/auth?verified=already', request.url)
      );
    }

    // Check if token expired
    if (new Date() > new Date(user.email_verification_expires)) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Verify email
    await query(
      `UPDATE users 
       SET email_verified = NOW(), 
           email_verification_token = NULL, 
           email_verification_expires = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    console.log('[Auth] Email verified:', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((error) => {
      console.error('[Auth] Failed to send welcome email:', error);
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth?verified=success', request.url)
    );
  } catch (error) {
    console.error('[Auth] Email verification error:', error);
    
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
