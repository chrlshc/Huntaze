/**
 * Instagram OAuth Callback Endpoint
 * 
 * Handles Facebook OAuth callback for Instagram Business/Creator accounts
 * - Validates state (CSRF protection)
 * - Exchanges code for tokens
 * - Converts to long-lived token (60 days)
 * - Validates Instagram Business account
 * - Stores in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { instagramOAuth } from '@/lib/services/instagramOAuth';
import { tokenManager } from '@/lib/services/tokenManager';
import { oauthAccountsRepository } from '@/lib/db/repositories/oauthAccountsRepository';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  try {
    // Handle OAuth errors (user denied, etc.)
    if (error) {
      const errorUrl = new URL('/platforms/connect/instagram', request.url);
      errorUrl.searchParams.set('error', error);
      errorUrl.searchParams.set('message', errorDescription || 'Authorization failed');
      return NextResponse.redirect(errorUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      const errorUrl = new URL('/platforms/connect/instagram', request.url);
      errorUrl.searchParams.set('error', 'invalid_request');
      errorUrl.searchParams.set('message', 'Missing code or state parameter');
      return NextResponse.redirect(errorUrl);
    }

    // Validate state (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('instagram_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      const errorUrl = new URL('/platforms/connect/instagram', request.url);
      errorUrl.searchParams.set('error', 'invalid_state');
      errorUrl.searchParams.set('message', 'State validation failed. Please try again.');
      return NextResponse.redirect(errorUrl);
    }

    // Clear state cookie
    cookieStore.delete('instagram_oauth_state');

    // Exchange code for short-lived token
    const shortLivedTokens = await instagramOAuth.exchangeCodeForTokens(code);

    // Convert to long-lived token (60 days)
    const longLivedToken = await instagramOAuth.getLongLivedToken(shortLivedTokens.access_token);

    // Get account info (user ID and pages with Instagram accounts)
    const accountInfo = await instagramOAuth.getAccountInfo(longLivedToken.access_token);

    // Validate that user has at least one Instagram Business account
    if (!instagramOAuth.hasInstagramBusinessAccount(accountInfo.pages)) {
      const errorUrl = new URL('/platforms/connect/instagram', request.url);
      errorUrl.searchParams.set('error', 'no_business_account');
      errorUrl.searchParams.set(
        'message',
        'No Instagram Business or Creator account found. Please convert your Instagram account to a Business or Creator account and link it to a Facebook Page.'
      );
      return NextResponse.redirect(errorUrl);
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

    // TODO: Get user ID from session/JWT
    // For now, using a placeholder - this should come from authenticated user
    const userId = 1; // Replace with actual user ID from session

    // Calculate expiry date (60 days from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + longLivedToken.expires_in);

    // Store tokens in database
    await tokenManager.storeTokens({
      userId,
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
    const successUrl = new URL('/platforms/connect/instagram', request.url);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('username', igBusinessAccount.username);
    
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    
    const errorUrl = new URL('/platforms/connect/instagram', request.url);
    errorUrl.searchParams.set('error', 'callback_failed');
    errorUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Failed to complete authorization'
    );
    
    return NextResponse.redirect(errorUrl);
  }
}
