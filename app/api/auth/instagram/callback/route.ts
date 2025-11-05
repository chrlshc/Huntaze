/**
 * Instagram OAuth Callback Endpoint
 * 
 * Handles Facebook OAuth callback for Instagram Business/Creator accounts
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
      return handleCallbackError(error, request, 'instagram', errorDescription || undefined);
    }

    // Validate required parameters
    if (!code || !state) {
      return handleCallbackError('missing_code', request, 'instagram');
    }

    // Require user authentication
    const user = await requireAuth(request);

    // Validate state using database (CSRF protection)
    const isValidState = await oauthStateManager.validateAndConsumeState(
      state,
      user.id,
      'instagram'
    );
    
    if (!isValidState) {
      return handleCallbackError('invalid_state', request, 'instagram');
    }

    // Lazy import to avoid build-time instantiation
    const { InstagramOAuthService } = await import('@/lib/services/instagramOAuth');
    const instagramOAuth = new InstagramOAuthService();

    // Exchange code for short-lived token
    const shortLivedTokens = await instagramOAuth.exchangeCodeForTokens(code);

    // Convert to long-lived token (60 days)
    const longLivedToken = await instagramOAuth.getLongLivedToken(shortLivedTokens.access_token);

    // Get account info (user ID and pages with Instagram accounts)
    const accountInfo = await instagramOAuth.getAccountInfo(longLivedToken.access_token);

    // Validate that user has at least one Instagram Business account
    if (!instagramOAuth.hasInstagramBusinessAccount(accountInfo.pages)) {
      return handleCallbackError('no_business_account', request, 'instagram');
    }

    // Get the first page with Instagram Business account
    const pageWithInstagram = accountInfo.pages.find(page => page.instagram_business_account);
    
    if (!pageWithInstagram || !pageWithInstagram.instagram_business_account) {
      throw new Error('No Instagram Business account found');
    }

    const igBusinessAccount = pageWithInstagram.instagram_business_account;

    // Get Instagram account details
    const igDetails = await instagramOAuth.getInstagramAccountDetails(
      igBusinessAccount.id,
      longLivedToken.access_token
    );

    // Calculate expiry date (60 days from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expires_in);

    // Store tokens using tokenManager (encrypted)
    await tokenManager.storeTokens({
      userId: user.id,
      provider: 'instagram',
      openId: accountInfo.user_id,
      tokens: {
        accessToken: longLivedToken.access_token,
        refreshToken: undefined, // Instagram uses token refresh, not refresh tokens
        expiresAt,
        scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list',
        metadata: {
          page_id: pageWithInstagram.id,
          page_name: pageWithInstagram.name,
          ig_business_id: igBusinessAccount.id,
          ig_username: igBusinessAccount.username,
          ig_name: igDetails.name,
          ig_profile_picture_url: igDetails.profile_picture_url,
          ig_followers_count: igDetails.followers_count,
          ig_follows_count: igDetails.follows_count,
          ig_media_count: igDetails.media_count,
        },
      },
    });

    // Redirect to success page
    return createSuccessRedirect(request, 'instagram', igBusinessAccount.username);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return handleCallbackError('callback_failed', request, 'instagram', 
      error instanceof Error ? error.message : undefined);
  }
}
