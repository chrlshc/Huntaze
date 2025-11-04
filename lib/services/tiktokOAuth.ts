/**
 * TikTok OAuth Service
 * 
 * Implements TikTok OAuth 2.0 flow with integrated credential validation
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 */

import crypto from 'crypto';
import { TikTokCredentialValidator, TikTokCredentials } from '@/lib/validation';

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
  private validator: TikTokCredentialValidator;
  private validationCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Don't validate credentials during construction to avoid build-time errors
    // Credentials will be validated lazily when needed
    this.validator = new TikTokCredentialValidator();
  }

  /**
   * Get and validate OAuth credentials with integrated validation
   * @throws Error if credentials are not configured or invalid
   */
  private async getCredentials(): Promise<{ clientKey: string; clientSecret: string; redirectUri: string }> {
    if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
      this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
      this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
      this.redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || '';

      if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
        throw new Error('TikTok OAuth credentials not configured. Please set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and NEXT_PUBLIC_TIKTOK_REDIRECT_URI environment variables.');
      }
    }

    // Check validation cache first
    const cacheKey = `${this.clientKey}:${this.clientSecret}:${this.redirectUri}`;
    const cached = this.validationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      if (!cached.result) {
        throw new Error('TikTok OAuth credentials are invalid (cached result)');
      }
    } else {
      // Validate credentials
      await this.validateCredentials();
    }

    return {
      clientKey: this.clientKey,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    };
  }

  /**
   * Validate TikTok OAuth credentials
   * @throws Error if credentials are invalid
   */
  private async validateCredentials(): Promise<void> {
    if (!this.clientKey || !this.clientSecret || !this.redirectUri) {
      throw new Error('Credentials not loaded');
    }

    const credentials: TikTokCredentials = {
      clientKey: this.clientKey,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    };

    try {
      const result = await this.validator.validateCredentials(credentials);
      
      // Cache the result
      const cacheKey = `${this.clientKey}:${this.clientSecret}:${this.redirectUri}`;
      this.validationCache.set(cacheKey, {
        result: result.isValid,
        timestamp: Date.now(),
      });

      if (!result.isValid) {
        const errorMessages = result.errors.map(error => error.message).join(', ');
        const suggestions = result.errors
          .filter(error => error.suggestion)
          .map(error => error.suggestion)
          .join(' ');
        
        throw new Error(`TikTok OAuth credentials validation failed: ${errorMessages}${suggestions ? ` Suggestions: ${suggestions}` : ''}`);
      }

      // Log warnings if any
      if (result.warnings.length > 0) {
        console.warn('TikTok OAuth credential warnings:', result.warnings.map(w => w.message).join(', '));
      }
    } catch (error) {
      // Cache negative result for a shorter time
      const cacheKey = `${this.clientKey}:${this.clientSecret}:${this.redirectUri}`;
      this.validationCache.set(cacheKey, {
        result: false,
        timestamp: Date.now(),
      });
      
      throw error;
    }
  }

  /**
   * Clear validation cache (useful for testing or credential updates)
   */
  clearValidationCache(): void {
    this.validationCache.clear();
  }

  /**
   * Generate authorization URL with state for CSRF protection
   * Validates credentials before generating URL
   * 
   * @param scopes - OAuth scopes to request
   * @returns Authorization URL and state
   * @throws Error if credentials are invalid
   */
  async getAuthorizationUrl(scopes: string[] = DEFAULT_SCOPES): Promise<TikTokAuthUrl> {
    const { clientKey, redirectUri } = await this.getCredentials();

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
   * Validates credentials before token exchange
   * 
   * @param code - Authorization code from TikTok
   * @returns Access token, refresh token, and metadata
   * @throws Error if exchange fails or credentials are invalid
   */
  async exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
    const { clientKey, clientSecret, redirectUri } = await this.getCredentials();

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
        cache: 'no-store',
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
   * Validates credentials before token refresh
   * 
   * IMPORTANT: TikTok may rotate the refresh token
   * Always use the new refresh_token if provided
   * 
   * @param refreshToken - Current refresh token
   * @returns New tokens (refresh_token may be rotated)
   * @throws Error if refresh fails or credentials are invalid
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokRefreshResponse> {
    const { clientKey, clientSecret } = await this.getCredentials();

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
        cache: 'no-store',
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
   * Validates credentials before revocation
   * 
   * @param accessToken - Access token to revoke
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const { clientKey, clientSecret } = await this.getCredentials();

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
        cache: 'no-store',
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
        cache: 'no-store',
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
  getAuthorizationUrl: (...args: Parameters<TikTokOAuthService['getAuthorizationUrl']>) => getTikTokOAuth().getAuthorizationUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<TikTokOAuthService['exchangeCodeForTokens']>) => getTikTokOAuth().exchangeCodeForTokens(...args),
  refreshAccessToken: (...args: Parameters<TikTokOAuthService['refreshAccessToken']>) => getTikTokOAuth().refreshAccessToken(...args),
  revokeAccess: (...args: Parameters<TikTokOAuthService['revokeAccess']>) => getTikTokOAuth().revokeAccess(...args),
  getUserInfo: (...args: Parameters<TikTokOAuthService['getUserInfo']>) => getTikTokOAuth().getUserInfo(...args),
  clearValidationCache: () => getTikTokOAuth().clearValidationCache(),
};
