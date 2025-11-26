/**
 * Debug Email Endpoint
 * Test email sending without going through full signup flow
 * 
 * Usage:
 * curl -X POST https://staging.huntaze.com/api/debug/email \
 *   -H "Content-Type: application/json" \
 *   -d '{"to":"your@email.com"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/lib/auth/magic-link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "to" email address' },
        { status: 400 }
      );
    }

    // Generate a test magic link
    const testUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/email?token=test-token-123&email=${encodeURIComponent(to)}`;

    // Send the email
    await sendMagicLinkEmail({
      email: to,
      url: testUrl,
      token: 'test-token-123',
    });

    return NextResponse.json({
      success: true,
      provider: 'ses',
      message: 'Test email sent successfully',
      to,
      config: {
        region: process.env.AWS_SES_REGION || process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
        from: process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@huntaze.com',
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    return NextResponse.json(
      {
        success: false,
        provider: 'ses',
        error: errorMessage,
        errorName,
        config: {
          region: process.env.AWS_SES_REGION || process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
          from: process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@huntaze.com',
          hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
          hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
        },
        hints: getErrorHints(errorMessage),
      },
      { status: 500 }
    );
  }
}

function getErrorHints(errorMessage: string): string[] {
  const hints: string[] = [];

  if (errorMessage.includes('not verified')) {
    hints.push('Email address not verified in AWS SES');
    hints.push('Go to: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities');
    hints.push('In sandbox mode, both sender AND recipient must be verified');
  }

  if (errorMessage.includes('credentials') || errorMessage.includes('Could not load credentials')) {
    hints.push('AWS credentials not found or invalid');
    hints.push('Check: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN');
  }

  if (errorMessage.includes('Access Denied') || errorMessage.includes('not authorized')) {
    hints.push('IAM permissions issue');
    hints.push('Ensure IAM policy allows: ses:SendEmail, ses:SendRawEmail');
    hints.push('Check the policy is for the correct region (us-east-1)');
  }

  if (errorMessage.includes('MessageRejected')) {
    hints.push('SES rejected the message');
    hints.push('Common causes: unverified email, sandbox restrictions, invalid format');
  }

  if (hints.length === 0) {
    hints.push('Check CloudWatch logs for detailed error information');
    hints.push('Verify all environment variables are set correctly');
  }

  return hints;
}

// Allow GET for quick browser testing
export async function GET() {
  return NextResponse.json({
    message: 'Email debug endpoint',
    usage: 'POST with {"to": "email@example.com"}',
    example: 'curl -X POST /api/debug/email -H "Content-Type: application/json" -d \'{"to":"test@example.com"}\'',
    config: {
      region: process.env.AWS_SES_REGION || process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
      from: process.env.AWS_SES_FROM_EMAIL || process.env.SES_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@huntaze.com',
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
      nextauthUrl: process.env.NEXTAUTH_URL || 'not set',
    },
  });
}
