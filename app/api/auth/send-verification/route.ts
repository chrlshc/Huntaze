/**
 * Send Verification Email API Route
 * 
 * POST /api/auth/send-verification
 * 
 * Sends a verification email to a newly registered user
 * 
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/services/email-verification.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.email || !body.verificationToken) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, verificationToken' },
        { status: 400 }
      );
    }

    // Send verification email
    await sendVerificationEmail({
      email: body.email,
      verificationToken: body.verificationToken,
      userId: body.userId
    });

    return NextResponse.json(
      { success: true, message: 'Verification email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Send Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
