/**
 * TikTok OAuth Adapter
 * 
 * Wraps the existing TikTok OAuth service for the integrations system
 */

import { tiktokOAuthOptimized } from '../../tiktokOAuth-optimized';
import type { OAuthResult, TokenResponse, AccountInfo } from '../types';

export class TikTokAdapter {
  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(redirectUri: string, state: string): Promise<OAuthResult> {
    const result = await tiktokOAuthOptimized.getAuthorizationUrl();
    
    return {
      authUrl: result.url,
      state: result.state,
      codeVerifier: result.codeVerifier,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const tokens = await tiktokOAuthOptimized.exchangeCodeForTokens(code);
    
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
    const tokens = await tiktokOAuthOptimized.refreshAccessToken(refreshToken);
    
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
    const userInfo = await tiktokOAuthOptimized.getUserInfo(accessToken);
    
    return {
      providerAccountId: userInfo.open_id,
      username: userInfo.display_name,
      displayName: userInfo.display_name,
      profilePictureUrl: userInfo.avatar_url,
      metadata: {
        open_id: userInfo.open_id,
        union_id: userInfo.union_id,
      },
    };
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessToken: string): Promise<void> {
    // TikTok doesn't have a revoke endpoint in their current API
    // Token will expire naturally
  }
}
