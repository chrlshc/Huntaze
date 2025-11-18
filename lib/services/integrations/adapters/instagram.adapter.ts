/**
 * Instagram OAuth Adapter
 * 
 * Wraps the existing Instagram OAuth service for the integrations system
 */

import { instagramOAuthOptimized } from '../../instagramOAuth-optimized';
import type { OAuthResult, TokenResponse, AccountInfo } from '../types';

export class InstagramAdapter {
  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(redirectUri: string, state: string): Promise<OAuthResult> {
    const result = await instagramOAuthOptimized.getAuthorizationUrl();
    
    return {
      authUrl: result.url,
      state: result.state,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // Get short-lived token
    const shortLived = await instagramOAuthOptimized.exchangeCodeForTokens(code);
    
    // Exchange for long-lived token
    const longLived = await instagramOAuthOptimized.getLongLivedToken(shortLived.access_token);
    
    return {
      accessToken: longLived.access_token,
      refreshToken: undefined, // Instagram doesn't provide refresh tokens
      expiresIn: longLived.expires_in,
      tokenType: longLived.token_type,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    // Instagram uses token refresh, not refresh tokens
    const refreshed = await instagramOAuthOptimized.refreshLongLivedToken(refreshToken);
    
    return {
      accessToken: refreshed.access_token,
      refreshToken: undefined,
      expiresIn: refreshed.expires_in,
      tokenType: refreshed.token_type,
    };
  }

  /**
   * Get account information
   */
  async getUserProfile(accessToken: string): Promise<AccountInfo> {
    const accountInfo = await instagramOAuthOptimized.getAccountInfo(accessToken);
    
    // Find first Instagram Business account
    const igPage = accountInfo.pages.find(page => page.instagram_business_account);
    
    if (!igPage || !igPage.instagram_business_account) {
      throw new Error('No Instagram Business account found');
    }
    
    const igBusinessId = igPage.instagram_business_account.id;
    const details = await instagramOAuthOptimized.getInstagramAccountDetails(
      igBusinessId,
      accessToken
    );
    
    return {
      providerAccountId: igBusinessId,
      username: details.username,
      displayName: details.name,
      profilePictureUrl: details.profile_picture_url,
      metadata: {
        ig_business_id: igBusinessId,
        followers_count: details.followers_count,
        follows_count: details.follows_count,
        media_count: details.media_count,
      },
    };
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessToken: string): Promise<void> {
    await instagramOAuthOptimized.revokeAccess(accessToken);
  }
}
