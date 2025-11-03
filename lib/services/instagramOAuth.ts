/**
 * Instagram OAuth Service
 * 
 * Implements Facebook OAuth 2.0 flow for Instagram Business/Creator accounts
 * Instagram uses Facebook OAuth because Instagram Business accounts are linked to Facebook Pages
 * 
 * @see https://developers.facebook.com/docs/instagram-api/overview
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */

import crypto from 'crypto';

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';

// Required permissions for Instagram Business integration
const DEFAULT_PERMISSIONS = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'instagram_manage_comments',
  'pages_show_list',
  'pages_read_engagement',
];

export interface InstagramAuthUrl {
  url: string;
  state: string;
}

export interface InstagramPage {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export interface InstagramTokens {
  access_token: string;
  token_type: string;
  expires_in?: number; // Short-lived tokens expire in ~2 hours
}

export interface InstagramLongLivedToken {
  access_token: string;
  token_type: string;
  expires_in: number; // Long-lived tokens expire in 60 days
}

export interface InstagramAccountInfo {
  user_id: string;
  access_token: string;
  pages: InstagramPage[];
}

/**
 * Instagram OAuth Service
 */
export class InstagramOAuthService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';

    // Don't throw during construction to avoid build-time errors
    // Validation will happen when methods are called
  }

  /**
   * Validate that credentials are configured
   * @throws Error if credentials are missing
   */
  private validateCredentials(): void {
    if (!this.appId || !this.appSecret || !this.redirectUri) {
      throw new Error('Instagram/Facebook OAuth credentials not configured');
    }
  }

  /**
   * Generate Facebook OAuth authorization URL for Instagram permissions
   * 
   * @param permissions - OAuth permissions to request
   * @returns Authorization URL and state for CSRF protection
   */
  getAuthorizationUrl(permissions: string[] = DEFAULT_PERMISSIONS): InstagramAuthUrl {
    this.validateCredentials();
    
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: permissions.join(','),
      response_type: 'code',
      state,
    });

    const url = `${FACEBOOK_AUTH_URL}?${params.toString()}`;

    return { url, state };
  }

  /**
   * Exchange authorization code for short-lived access token
   * 
   * @param code - Authorization code from Facebook
   * @returns Short-lived access token (expires in ~2 hours)
   * @throws Error if exchange fails
   */
  async exchangeCodeForTokens(code: string): Promise<InstagramTokens> {
    this.validateCredentials();
    
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    try {
      const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || data.error_description || `Token exchange failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
      };
    } catch (error) {
      console.error('Instagram token exchange error:', error);
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   * 
   * @param shortLivedToken - Short-lived access token
   * @returns Long-lived access token (expires in 60 days)
   * @throws Error if exchange fails
   */
  async getLongLivedToken(shortLivedToken: string): Promise<InstagramLongLivedToken> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    try {
      const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Long-lived token exchange failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in, // 5184000 seconds = 60 days
      };
    } catch (error) {
      console.error('Instagram long-lived token error:', error);
      throw new Error(
        `Failed to get long-lived token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Refresh long-lived token before expiry
   * 
   * Note: Long-lived tokens can be refreshed once per day
   * Each refresh extends the token for another 60 days
   * 
   * @param token - Current long-lived token
   * @returns New long-lived token (60 days)
   * @throws Error if refresh fails
   */
  async refreshLongLivedToken(token: string): Promise<InstagramLongLivedToken> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: token,
    });

    try {
      const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Token refresh failed: ${response.status}`
        );
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
      };
    } catch (error) {
      console.error('Instagram token refresh error:', error);
      throw new Error(
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get user's Facebook Pages with Instagram Business accounts
   * 
   * @param accessToken - Valid access token
   * @returns User ID and list of pages with Instagram accounts
   * @throws Error if request fails
   */
  async getAccountInfo(accessToken: string): Promise<InstagramAccountInfo> {
    try {
      // Get user ID
      const meResponse = await fetch(`${FACEBOOK_GRAPH_URL}/me?access_token=${accessToken}`, {
        cache: 'no-store',
      });
      const meData = await meResponse.json();

      if (!meResponse.ok || meData.error) {
        throw new Error(meData.error?.message || 'Failed to get user info');
      }

      // Get user's pages with Instagram Business accounts
      const pagesResponse = await fetch(
        `${FACEBOOK_GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`,
        { cache: 'no-store' }
      );
      const pagesData = await pagesResponse.json();

      if (!pagesResponse.ok || pagesData.error) {
        throw new Error(pagesData.error?.message || 'Failed to get pages');
      }

      return {
        user_id: meData.id,
        access_token: accessToken,
        pages: pagesData.data || [],
      };
    } catch (error) {
      console.error('Instagram get account info error:', error);
      throw new Error(
        `Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate that user has at least one Instagram Business/Creator account
   * 
   * @param pages - List of Facebook Pages
   * @returns True if user has Instagram Business account
   */
  hasInstagramBusinessAccount(pages: InstagramPage[]): boolean {
    return pages.some(page => page.instagram_business_account);
  }

  /**
   * Get Instagram Business Account details
   * 
   * @param igBusinessId - Instagram Business Account ID
   * @param accessToken - Valid access token
   * @returns Instagram account details
   */
  async getInstagramAccountDetails(
    igBusinessId: string,
    accessToken: string
  ): Promise<{
    id: string;
    username: string;
    name: string;
    profile_picture_url: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
  }> {
    try {
      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${igBusinessId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to get Instagram account details');
      }

      return data;
    } catch (error) {
      console.error('Instagram get account details error:', error);
      throw new Error(
        `Failed to get account details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Revoke access token (disconnect)
   * 
   * @param accessToken - Access token to revoke
   */
  async revokeAccess(accessToken: string): Promise<void> {
    try {
      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/me/permissions?access_token=${accessToken}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Revoke failed');
      }
    } catch (error) {
      console.error('Instagram revoke error:', error);
      // Don't throw - revoke is best effort
    }
  }
}

// Lazy instantiation pattern - create instance only when needed
let instagramOAuthInstance: InstagramOAuthService | null = null;

function getInstagramOAuth(): InstagramOAuthService {
  if (!instagramOAuthInstance) {
    instagramOAuthInstance = new InstagramOAuthService();
  }
  return instagramOAuthInstance;
}

// Export singleton instance (lazy)
export const instagramOAuth = {
  getAuthUrl: (...args: Parameters<InstagramOAuthService['getAuthUrl']>) => getInstagramOAuth().getAuthUrl(...args),
  handleCallback: (...args: Parameters<InstagramOAuthService['handleCallback']>) => getInstagramOAuth().handleCallback(...args),
  refreshAccessToken: (...args: Parameters<InstagramOAuthService['refreshAccessToken']>) => getInstagramOAuth().refreshAccessToken(...args),
  revokeAccess: (...args: Parameters<InstagramOAuthService['revokeAccess']>) => getInstagramOAuth().revokeAccess(...args),
};
