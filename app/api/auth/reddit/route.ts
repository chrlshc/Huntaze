/**
 * Reddit OAuth Init Endpoint
 * 
 * Initiates Reddit OAuth flow by redirecting to Reddit authorization page
 * 
 * @route GET /api/auth/reddit
 */

import { NextRequest, NextResponse } from 'next/server';
import { redditOAuth } from '@/lib/services/redditOAuth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Generate authorization URL with state for CSRF protection
    const { url, state } = redditOAuth.getAuthorizationUrl();

    // Store state in cookie for validation in callback
    cookies().set('reddit_oauth_state', state, {
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
