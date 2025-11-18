/**
 * Reddit OAuth Adapter
 * 
 * Wraps the existing Reddit OAuth service for the integrations system
 */

import { redditOAuthOptimized } from '../../redditOAuth-optimized';
import type { OAuthResult, TokenResponse, AccountInfo } from '../types';

export class RedditAdapter {
  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(redirectUri: string, state: string): Promise<OAuthResult> {
    const result = await redditOAuthOptimized.getAuthorizationUrl();
    
    return {
      authUrl: result.url,
      state: result.state,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const tokens = await redditOAuthOptimized.exchangeCodeForTokens(code);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const tokens = await redditOAuthOptimized.refreshAccessToken(refreshToken);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope,
    };
  }

  /**
   * Get account information
   */
  async getUserProfile(accessToken: string): Promise<AccountInfo> {
    const userInfo = await redditOAuthOptimized.getUserInfo(accessToken);
    
    return {
      providerAccountId: userInfo.id,
      username: userInfo.name,
      displayName: userInfo.name,
      profilePictureUrl: userInfo.icon_img,
      metadata: {
        created_utc: userInfo.created_utc,
        link_karma: userInfo.link_karma,
        comment_karma: userInfo.comment_karma,
      },
    };
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessToken: string): Promise<void> {
    // Reddit doesn't have a revoke endpoint
    // Token will expire naturally
  }
}
