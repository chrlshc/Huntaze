/**
 * Reddit OAuth Callback Endpoint
 * 
 * Handles Reddit OAuth callback for content publishing
 * - Requires user authentication
 * - Validates state using secure database storage (CSRF protection)
 * - Exchanges code for tokens using tokenManager
 * - Comprehensive error handling
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserFromRequest';
import { tokenManager } from '@/lib/services/tokenManager';
import { oauthStateManager } from '@/lib/oauth/stateManager';
import { handleCallbackError, createSuccessRedirect } from '@/lib/oauth/errorHandler';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  try {
    // Handle OAuth errors (user denied, etc.)
    if (error) {
      return handleCallbackError(error, request, 'reddit', errorDescription || undefined);
    }

    // Validate required parameters
    if (!code || !state) {
      return handleCallbackError('missing_code', request, 'reddit');
    }

    // Require user authentication
    const user = await requireAuth(request);

    // Validate state using database (CSRF protection)
    const isValidState = await oauthStateManager.validateAndConsumeState(
      state,
      user.id,
      'reddit'
    );
    
    if (!isValidState) {
      return handleCallbackError('invalid_state', request, 'reddit');
    }

    // Lazy import to avoid build-time instantiation
    const { RedditOAuthService } = await import('@/lib/services/redditOAuth');
    const redditOAuth = new RedditOAuthService();

    // Exchange code for tokens
    const tokens = await redditOAuth.exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await redditOAuth.getUserInfo(tokens.access_token);

    // Calculate expiry date (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    // Store tokens using tokenManager (encrypted)
    await tokenManager.storeTokens({
      userId: user.id,
      provider: 'reddit',
      openId: userInfo.id,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        metadata: {
          username: userInfo.name,
          icon_img: userInfo.icon_img,
          link_karma: userInfo.link_karma,
          comment_karma: userInfo.comment_karma,
          created_utc: userInfo.created_utc,
        },
      },
    });

    // Redirect to success page
    return createSuccessRedirect(request, 'reddit', userInfo.name);
  } catch (error) {
    console.error('Reddit OAuth callback error:', error);
    return handleCallbackError('callback_failed', request, 'reddit', 
      error instanceof Error ? error.message : undefined);
  }
}
