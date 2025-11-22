/**
 * Email Verification API Route
 * 
 * POST /api/auth/verify-email
 * 
 * Verifies a user's email address using the verification token
 * - Validates token and userId
 * - Checks token expiration (24 hours)
 * - Updates emailVerified status
 * 
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.token || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: token, userId' },
        { status: 400 }
      );
    }

    const { token, userId } = body;

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        email_verification_token: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Check token expiration (24 hours)
    if (user.email_verification_expires) {
      const now = new Date();
      if (now > user.email_verification_expires) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 410 }
        );
      }
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        email_verification_token: null,
        email_verification_expires: null,
      },
    });

    console.log('[Email Verification] User verified:', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      { success: true, message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
