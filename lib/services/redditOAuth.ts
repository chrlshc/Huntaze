/**
 * Reddit OAuth Service
 * 
 * Implements Reddit OAuth 2.0 flow for content publishing with integrated credential validation
 * 
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2
 * @see https://www.reddit.com/dev/api/oauth
 */

import crypto from 'crypto';
import { RedditCredentialValidator, RedditCredentials } from '@/lib/validation';

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
  private validator: RedditCredentialValidator;
  private validationCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || '';
    this.userAgent = process.env.REDDIT_USER_AGENT || 'Huntaze/1.0.0';
    this.validator = new RedditCredentialValidator();

    // Don't throw during construction to avoid build-time errors
    // Validation will happen when methods are called
  }

  /**
   * Validate that credentials are configured and valid
   * @throws Error if credentials are missing or invalid
   */
  private async validateCredentials(): Promise<void> {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Reddit OAuth credentials not configured. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, NEXT_PUBLIC_REDDIT_REDIRECT_URI, and REDDIT_USER_AGENT environment variables.');
    }

    // Check validation cache first
    const cacheKey = `${this.clientId}:${this.clientSecret}:${this.redirectUri}:${this.userAgent}`;
    const cached = this.validationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      if (!cached.result) {
        throw new Error('Reddit OAuth credentials are invalid (cached result)');
      }
      return;
    }

    // Validate credentials using the validator
    const credentials: RedditCredentials = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
      userAgent: this.userAgent,
    };

    try {
      const result = await this.validator.validateCredentials(credentials);
      
      // Cache the result
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
        
        throw new Error(`Reddit OAuth credentials validation failed: ${errorMessages}${suggestions ? ` Suggestions: ${suggestions}` : ''}`);
      }

      // Log warnings if any
      if (result.warnings.length > 0) {
        console.warn('Reddit OAuth credential warnings:', result.warnings.map(w => w.message).join(', '));
      }
    } catch (error) {
      // Cache negative result for a shorter time
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
   * Retry utility for API calls with exponential backoff
   */
  private async retryApiCall<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on authentication errors or client errors
        if (lastError.message.includes('Invalid') || 
            lastError.message.includes('unauthorized') ||
            lastError.message.includes('400') ||
            lastError.message.includes('401') ||
            lastError.message.includes('403')) {
          throw lastError;
        }

        if (attempt === maxRetries) {
          console.error(`${operationName} failed after ${maxRetries} attempts:`, lastError);
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Generate Reddit OAuth authorization URL
   * Validates credentials before generating URL
   * 
   * @param scopes - OAuth scopes to request
   * @param duration - 'temporary' (1 hour) or 'permanent' (refresh token)
   * @returns Authorization URL and state for CSRF protection
   * @throws Error if credentials are invalid
   */
  async getAuthorizationUrl(
    scopes: string[] = DEFAULT_SCOPES,
    duration: 'temporary' | 'permanent' = 'permanent'
  ): Promise<RedditAuthUrl> {
    await this.validateCredentials();
    
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
   * Validates credentials before token exchange
   * 
   * @param code - Authorization code from Reddit
   * @returns Access token, refresh token, and metadata
   * @throws Error if exchange fails or credentials are invalid
   */
  async exchangeCodeForTokens(code: string): Promise<RedditTokens> {
    await this.validateCredentials();
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    });

    return this.retryApiCall(async () => {
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
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
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
    }, 'Reddit token exchange');
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

    return this.retryApiCall(async () => {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await fetch(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: params.toString(),
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        // Handle specific refresh errors
        if (data.error === 'invalid_grant') {
          throw new Error('Refresh token has expired or been revoked. Please reconnect your Reddit account.');
        }
        
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
    }, 'Reddit token refresh');
  }

  /**
   * Get authenticated user information
   * 
   * @param accessToken - Valid access token
   * @returns User information
   * @throws Error if request fails
   */
  async getUserInfo(accessToken: string): Promise<RedditUserInfo> {
    return this.retryApiCall(async () => {
      const response = await fetch(`${REDDIT_API_URL}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
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
    }, 'Reddit user info');
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
    return this.retryApiCall(async () => {
      const response = await fetch(`${REDDIT_API_URL}/subreddits/mine/subscriber?limit=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(data.message || 'Failed to get subreddits');
      }

      return data.data.children.map((child: any) => ({
        name: child.data.name,
        display_name: child.data.display_name,
        subscribers: child.data.subscribers,
        public_description: child.data.public_description,
      }));
    }, 'Reddit subreddits');
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
        cache: 'no-store',
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

// Lazy instantiation pattern - create instance only when needed
let redditOAuthInstance: RedditOAuthService | null = null;

function getRedditOAuth(): RedditOAuthService {
  if (!redditOAuthInstance) {
    redditOAuthInstance = new RedditOAuthService();
  }
  return redditOAuthInstance;
}

// Export singleton instance (lazy)
export const redditOAuth = {
  getAuthorizationUrl: (...args: Parameters<RedditOAuthService['getAuthorizationUrl']>) => getRedditOAuth().getAuthorizationUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<RedditOAuthService['exchangeCodeForTokens']>) => getRedditOAuth().exchangeCodeForTokens(...args),
  refreshAccessToken: (...args: Parameters<RedditOAuthService['refreshAccessToken']>) => getRedditOAuth().refreshAccessToken(...args),
  getUserInfo: (...args: Parameters<RedditOAuthService['getUserInfo']>) => getRedditOAuth().getUserInfo(...args),
  getSubscribedSubreddits: (...args: Parameters<RedditOAuthService['getSubscribedSubreddits']>) => getRedditOAuth().getSubscribedSubreddits(...args),
  revokeAccess: (...args: Parameters<RedditOAuthService['revokeAccess']>) => getRedditOAuth().revokeAccess(...args),
  clearValidationCache: () => getRedditOAuth().clearValidationCache(),
};
