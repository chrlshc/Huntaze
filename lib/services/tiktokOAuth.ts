/**
 * TikTok OAuth Service
 * 
 * Implements TikTok OAuth 2.0 flow
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 */

import crypto from 'crypto';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

// Default scopes for TikTok integration
const DEFAULT_SCOPES = ['user.info.basic', 'video.upload', 'video.list'];

export interface TikTokAuthUrl {
  url: string;
  state: string;
}

export interface TikTokTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Seconds (typically 86400 = 24h)
  refresh_expires_in: number; // Seconds (typically 31536000 = 365d)
  open_id: string;
  scope: string;
  token_type: string;
}

export interface TikTokRefreshResponse {
  access_token: string;
  refresh_token?: string; // May rotate
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

/**
 * TikTok OAuth Service
 */
export class TikTokOAuthService {
  private clientKey: string | null = null;
  private clientSecret: string | null = null;
  private redirectUri: string | null = null;

  constructor() {
    // Don't validate credentials during construction to avoid build-time errors
    // Credentials will be validated lazily when needed
  }

  /**
   * Get and validate OAuth credentials
   * @throws Error if credentials are not configured
   */
  private getCredentials(): { clientKey: string; clientSecret: string; redirectUri: string } {
    if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
      this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
      this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
      this.redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || '';

      if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
        throw new Error('TikTok OAuth credentials not configured');
      }
    }

    return {
      clientKey: this.clientKey,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    };
  }

  /**
   * Generate authorization URL with state for CSRF protection
   * 
   * @param scopes - OAuth scopes to request
   * @returns Authorization URL and state
   */
  getAuthorizationUrl(scopes: string[] = DEFAULT_SCOPES): TikTokAuthUrl {
    const { clientKey, redirectUri } = this.getCredentials();

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL
    const params = new URLSearchParams({
      client_key: clientKey,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: redirectUri,
      state,
    });

    const url = `${TIKTOK_AUTH_URL}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Exchange authorization code for tokens
   * 
   * @param code - Authorization code from TikTok
   * @returns Access token, refresh token, and metadata
   * @throws Error if exchange fails
   */
  async exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
    const { clientKey, clientSecret, redirectUri } = this.getCredentials();

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    try {
      const response = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error_description || data.error || `Token exchange failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in,
        open_id: data.open_id,
        scope: data.scope,
        token_type: data.token_type,
      };
    } catch (error) {
      console.error('TikTok token exchange error:', error);
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * IMPORTANT: TikTok may rotate the refresh token
   * Always use the new refresh_token if provided
   * 
   * @param refreshToken - Current refresh token
   * @returns New tokens (refresh_token may be rotated)
   * @throws Error if refresh fails
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokRefreshResponse> {
    const { clientKey, clientSecret } = this.getCredentials();

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error_description || data.error || `Token refresh failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token, // May be rotated (new token)
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in,
        token_type: data.token_type,
      };
    } catch (error) {
      console.error('TikTok token refresh error:', error);
      throw new Error(
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke access token (disconnect)
   * 
   * @param accessToken - Access token to revoke
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const { clientKey, clientSecret } = this.getCredentials();

    const body = new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      token: accessToken,
    });

    try {
      const response = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error_description || data.error || 'Revoke failed');
      }
    } catch (error) {
      console.error('TikTok revoke error:', error);
      // Don't throw - revoke is best effort
    }
  }

  /**
   * Get user info using access token
   * 
   * @param accessToken - Valid access token
   * @returns User info (open_id, username, display_name, avatar_url)
   */
  async getUserInfo(accessToken: string): Promise<{
    open_id: string;
    union_id: string;
    avatar_url: string;
    display_name: string;
  }> {
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to get user info');
      }

      return data.data.user;
    } catch (error) {
      console.error('TikTok get user info error:', error);
      throw new Error(
        `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Lazy instantiation pattern - create instance only when needed
let tiktokOAuthInstance: TikTokOAuthService | null = null;

function getTikTokOAuth(): TikTokOAuthService {
  if (!tiktokOAuthInstance) {
    tiktokOAuthInstance = new TikTokOAuthService();
  }
  return tiktokOAuthInstance;
}

// Export singleton instance (lazy)
export const tiktokOAuth = {
  getAuthUrl: (...args: Parameters<TikTokOAuthService['getAuthUrl']>) => getTikTokOAuth().getAuthUrl(...args),
  handleCallback: (...args: Parameters<TikTokOAuthService['handleCallback']>) => getTikTokOAuth().handleCallback(...args),
  refreshAccessToken: (...args: Parameters<TikTokOAuthService['refreshAccessToken']>) => getTikTokOAuth().refreshAccessToken(...args),
  getUserInfo: (...args: Parameters<TikTokOAuthService['getUserInfo']>) => getTikTokOAuth().getUserInfo(...args),
};
