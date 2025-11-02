/**
 * Reddit OAuth Callback Endpoint
 * 
 * Handles Reddit OAuth callback, exchanges code for tokens, and stores in database
 * 
 * @route GET /api/auth/reddit/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { oauthAccountsRepository } from '@/lib/db/repositories/oauthAccountsRepository';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial or errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || error;
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/platforms/connect/reddit?error=${encodeURIComponent(errorDescription)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/platforms/connect/reddit?error=missing_parameters`
      );
    }

    // Validate state (CSRF protection)
    const storedState = cookies().get('reddit_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/platforms/connect/reddit?error=invalid_state`
      );
    }

    // Clear state cookie
    cookies().delete('reddit_oauth_state');

    // Lazy import to avoid build-time instantiation
    const { redditOAuth } = await import('@/lib/services/redditOAuth');

    // Exchange code for tokens
    const tokens = await redditOAuth.exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await redditOAuth.getUserInfo(tokens.access_token);

    // TODO: Get actual user ID from session/JWT
    // For now, using a placeholder
    const userId = 1;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store in database (create does upsert automatically)
    await oauthAccountsRepository.create({
      userId,
      provider: 'reddit',
      openId: userInfo.id,
      scope: tokens.scope,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      metadata: {
        username: userInfo.name,
        icon_img: userInfo.icon_img,
        link_karma: userInfo.link_karma,
        comment_karma: userInfo.comment_karma,
        created_utc: userInfo.created_utc,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/platforms/connect/reddit?success=true&username=${encodeURIComponent(userInfo.name)}`
    );
  } catch (error) {
    console.error('Reddit OAuth callback error:', error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/platforms/connect/reddit?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'oauth_failed'
      )}`
    );
  }
}
