/**
 * OnlyFans OAuth Adapter
 * 
 * OnlyFans uses cookie-based authentication, not OAuth
 * This adapter provides a consistent interface for the integrations system
 */

import type { OAuthResult, TokenResponse, AccountInfo } from '../types';

export class OnlyFansAdapter {
  /**
   * Get "OAuth" authorization URL
   * For OnlyFans, this redirects to a custom cookie ingestion page
   */
  async getAuthUrl(redirectUri: string, state: string): Promise<OAuthResult> {
    // OnlyFans uses cookie-based auth, so we redirect to our cookie ingestion page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const authUrl = `${baseUrl}/of/connect?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    return {
      authUrl,
      state,
    };
  }

  /**
   * Exchange "code" for tokens
   * For OnlyFans, the "code" is actually the session cookie
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    // The "code" is the OnlyFans session cookie
    // We store it as the access token
    return {
      accessToken: code,
      refreshToken: undefined,
      expiresIn: 30 * 24 * 60 * 60, // 30 days (approximate)
      tokenType: 'cookie',
    };
  }

  /**
   * Refresh access token
   * OnlyFans cookies don't have a refresh mechanism
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    throw new Error('OnlyFans does not support token refresh. User must reconnect.');
  }

  /**
   * Get account information
   */
  async getUserProfile(accessToken: string): Promise<AccountInfo> {
    // Call OnlyFans API to get user info
    const response = await fetch('https://onlyfans.com/api2/v2/users/me', {
      headers: {
        'Cookie': `sess=${accessToken}`,
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch OnlyFans user profile');
    }
    
    const data = await response.json();
    
    return {
      providerAccountId: data.id.toString(),
      username: data.username,
      displayName: data.name,
      profilePictureUrl: data.avatar,
      metadata: {
        account_id: data.id,
        username: data.username,
        display_name: data.name,
        avatar_url: data.avatar,
      },
    };
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessToken: string): Promise<void> {
    // OnlyFans doesn't have a revoke endpoint
    // Cookie will expire naturally
  }
}
