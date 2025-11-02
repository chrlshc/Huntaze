/**
 * Reddit OAuth Service
 * 
 * Implements Reddit OAuth 2.0 flow for content publishing
 * 
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2
 * @see https://www.reddit.com/dev/api/oauth
 */

import crypto from 'crypto';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_URL = 'https://oauth.reddit.com';

// Required scopes for Reddit integration
const DEFAULT_SCOPES = [
  'identity',      // Access user identity
  'submit',        // Submit links and comments
  'edit',          // Edit posts and comments
  'read',          // Read posts and comments
  'mysubreddits',  // Access subscribed subreddits
];

export interface RedditAuthUrl {
  url: string;
  state: string;
}

export interface RedditTokens {
  access_token: string;
  token_type: string;
  expires_in: number; // Access tokens expire in 1 hour
  refresh_token: string; // Refresh tokens don't expire
  scope: string;
}

export interface RedditUserInfo {
  id: string;
  name: string;
  icon_img: string;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
}

/**
 * Reddit OAuth Service
 */
export class RedditOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private userAgent: string;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || '';
    this.userAgent = 'Huntaze/1.0.0';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Reddit OAuth credentials not configured');
    }
  }

  /**
   * Generate Reddit OAuth authorization URL
   * 
   * @param scopes - OAuth scopes to request
   * @param duration - 'temporary' (1 hour) or 'permanent' (refresh token)
   * @returns Authorization URL and state for CSRF protection
   */
  getAuthorizationUrl(
    scopes: string[] = DEFAULT_SCOPES,
    duration: 'temporary' | 'permanent' = 'permanent'
  ): RedditAuthUrl {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state,
      redirect_uri: this.redirectUri,
      duration,
      scope: scopes.join(' '),
    });

    const url = `${REDDIT_AUTH_URL}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * 
   * @param code - Authorization code from Reddit
   * @returns Access token, refresh token, and metadata
   * @throws Error if exchange fails
   */
  async exchangeCodeForTokens(code: string): Promise<RedditTokens> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    });

    try {
      // Reddit requires Basic Auth with client_id:client_secret
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error_description || data.error || `Token exchange failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Reddit token exchange error:', error);
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * Note: Reddit refresh tokens don't expire and can be used indefinitely
   * 
   * @param refreshToken - Refresh token
   * @returns New access token
   * @throws Error if refresh fails
   */
  async refreshAccessToken(refreshToken: string): Promise<RedditTokens> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error_description || data.error || `Token refresh failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: refreshToken, // Reddit doesn't rotate refresh tokens
        scope: data.scope,
      };
    } catch (error) {
      console.error('Reddit token refresh error:', error);
      throw new Error(
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get authenticated user information
   * 
   * @param accessToken - Valid access token
   * @returns User information
   * @throws Error if request fails
   */
  async getUserInfo(accessToken: string): Promise<RedditUserInfo> {
    try {
      const response = await fetch(`${REDDIT_API_URL}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to get user info');
      }

      return {
        id: data.id,
        name: data.name,
        icon_img: data.icon_img,
        created_utc: data.created_utc,
        link_karma: data.link_karma,
        comment_karma: data.comment_karma,
      };
    } catch (error) {
      console.error('Reddit get user info error:', error);
      throw new Error(
        `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's subscribed subreddits
   * 
   * @param accessToken - Valid access token
   * @returns List of subreddits
   */
  async getSubscribedSubreddits(accessToken: string): Promise<Array<{
    name: string;
    display_name: string;
    subscribers: number;
    public_description: string;
  }>> {
    try {
      const response = await fetch(`${REDDIT_API_URL}/subreddits/mine/subscriber?limit=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || 'Failed to get subreddits');
      }

      return data.data.children.map((child: any) => ({
        name: child.data.name,
        display_name: child.data.display_name,
        subscribers: child.data.subscribers,
        public_description: child.data.public_description,
      }));
    } catch (error) {
      console.error('Reddit get subreddits error:', error);
      throw new Error(
        `Failed to get subreddits: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke access token (disconnect)
   * 
   * @param accessToken - Access token to revoke
   * @param tokenType - 'access_token' or 'refresh_token'
   */
  async revokeAccess(accessToken: string, tokenType: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const params = new URLSearchParams({
        token: accessToken,
        token_type_hint: tokenType,
      });

      const response = await fetch(`${REDDIT_API_URL}/api/v1/revoke_token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Revoke failed');
      }
    } catch (error) {
      console.error('Reddit revoke error:', error);
      // Don't throw - revoke is best effort
    }
  }
}

// Export singleton instance
export const redditOAuth = new RedditOAuthService();
