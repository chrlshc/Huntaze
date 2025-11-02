import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyEmailToken, deleteVerificationToken } from '@/lib/auth/tokens';
import { sendWelcomeEmail } from '@/lib/email/ses';

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

    // Verify the token
    const verification = await verifyEmailToken(token);

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const { userId, email } = verification;

    // Update user's email_verified status
    await query(
      'UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );

    // Delete the verification token
    await deleteVerificationToken(userId);

    // Get user details for welcome email
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      
      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.name);
        console.log('Welcome email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Continue anyway - email is verified
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
