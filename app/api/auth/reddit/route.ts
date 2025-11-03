/**
 * Reddit OAuth Init Endpoint
 * 
 * Initiates Reddit OAuth flow by redirecting to Reddit authorization page
 * 
 * @route GET /api/auth/reddit
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Check OAuth credentials at runtime
    if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET || !process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI) {
      console.warn('Reddit OAuth credentials not configured');
      return NextResponse.json(
        {
          error: {
            code: 'OAUTH_NOT_CONFIGURED',
            message: 'Reddit OAuth is not configured. Please contact support.',
          },
        },
        { status: 500 }
      );
    }

    // Lazy import to avoid build-time instantiation
    const { redditOAuth } = await import('@/lib/services/redditOAuth');
    
    // Generate authorization URL with state for CSRF protection
    const { url, state } = redditOAuth.getAuthorizationUrl();

    // Store state in cookie for validation in callback
    const cookieStore = await cookies();
    cookieStore.set('reddit_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Redirect to Reddit authorization page
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Reddit OAuth init error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'OAUTH_INIT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to initialize OAuth',
        },
      },
      { status: 500 }
    );
  }
}
