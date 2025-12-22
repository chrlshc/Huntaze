/**
 * Instagram OAuth Service - OPTIMIZED VERSION
 * 
 * Phase 2 & 3 Complete Integration:
 * - Structured error handling with correlation IDs
 * - Centralized logging
 * - Circuit breaker pattern
 * - Token manager
 * - Enhanced monitoring
 * 
 * @see https://developers.facebook.com/docs/instagram-api/overview
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens
 */

import * as crypto from 'crypto';
import { instagramLogger } from './instagram/logger';
import { CircuitBreaker } from './instagram/circuit-breaker';
import {
  InstagramError,
  InstagramErrorType,
  InstagramAuthUrl,
  InstagramPage,
  InstagramTokens,
  InstagramLongLivedToken,
  InstagramAccountInfo,
  InstagramAccountDetails,
  FacebookErrorResponse,
  TokenData,
} from './instagram/types';

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

/**
 * Instagram OAuth Service - Optimized
 */
export class InstagramOAuthServiceOptimized {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;
  private validationCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private circuitBreaker: CircuitBreaker;
  private tokenStore: Map<string, TokenData> = new Map();
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly TOKEN_REFRESH_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly REQUEST_TIMEOUT_MS = 15_000;

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';
    
    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 120000,
    }, 'Instagram OAuth');

    instagramLogger.info('Instagram OAuth Service initialized', {
      hasAppId: !!this.appId,
      hasAppSecret: !!this.appSecret,
      hasRedirectUri: !!this.redirectUri,
    });
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return instagramLogger.generateCorrelationId();
  }

  /**
   * Create structured error
   */
  private createError(
    type: InstagramErrorType,
    message: string,
    correlationId: string,
    statusCode?: number,
    originalError?: Error
  ): InstagramError {
    const userMessages: Record<InstagramErrorType, string> = {
      [InstagramErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
      [InstagramErrorType.AUTH_ERROR]: 'Authentication failed. Please reconnect your Instagram account.',
      [InstagramErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment and try again.',
      [InstagramErrorType.TOKEN_EXPIRED]: 'Your Instagram connection has expired. Please reconnect.',
      [InstagramErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
      [InstagramErrorType.API_ERROR]: 'Instagram API error. Please try again later.',
      [InstagramErrorType.PERMISSION_ERROR]: 'Missing permissions. Please reconnect with required permissions.',
    };
    
    return {
      type,
      message,
      userMessage: userMessages[type],
      retryable: this.isRetryable(type),
      correlationId,
      statusCode,
      originalError,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if error type is retryable
   */
  private isRetryable(type: InstagramErrorType): boolean {
    return [
      InstagramErrorType.NETWORK_ERROR,
      InstagramErrorType.API_ERROR,
    ].includes(type);
  }

  /**
   * Handle Facebook API error response
   */
  private handleFacebookError(
    data: FacebookErrorResponse,
    statusCode: number,
    correlationId: string
  ): InstagramError {
    const { error } = data;
    
    // Token expired
    if (error.code === 190) {
      return this.createError(
        InstagramErrorType.TOKEN_EXPIRED,
        error.message,
        correlationId,
        statusCode
      );
    }
    
    // Rate limit
    if (statusCode === 429) {
      return this.createError(
        InstagramErrorType.RATE_LIMIT_ERROR,
        error.message,
        correlationId,
        statusCode
      );
    }
    
    // Auth error
    if (statusCode === 401 || statusCode === 403) {
      return this.createError(
        InstagramErrorType.AUTH_ERROR,
        error.message,
        correlationId,
        statusCode
      );
    }
    
    // Validation error
    if (statusCode === 400) {
      return this.createError(
        InstagramErrorType.VALIDATION_ERROR,
        error.message,
        correlationId,
        statusCode
      );
    }
    
    // Generic API error
    return this.createError(
      InstagramErrorType.API_ERROR,
      error.message,
      correlationId,
      statusCode
    );
  }

  /**
   * Validate credentials
   */
  private async validateCredentials(correlationId: string): Promise<void> {
    if (!this.appId || !this.appSecret || !this.redirectUri) {
      const error = this.createError(
        InstagramErrorType.VALIDATION_ERROR,
        'Instagram/Facebook OAuth credentials not configured',
        correlationId
      );
      
      instagramLogger.error('Credentials not configured', error.originalError || new Error(error.message), {
        correlationId,
      });
      
      throw error;
    }

    // Check validation cache
    const cacheKey = `${this.appId}:${this.appSecret}:${this.redirectUri}`;
    const cached = this.validationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      if (!cached.result) {
        throw this.createError(
          InstagramErrorType.VALIDATION_ERROR,
          'Instagram/Facebook OAuth credentials are invalid (cached)',
          correlationId
        );
      }
      return;
    }

    // Cache successful validation
    this.validationCache.set(cacheKey, {
      result: true,
      timestamp: Date.now(),
    });
  }

  /**
   * Retry API call with circuit breaker
   */
  private async retryApiCall<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      let lastError: InstagramError;
      const startTime = Date.now();

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          const duration = Date.now() - startTime;
          
          instagramLogger.info(`${operationName} successful`, {
            correlationId,
            attempt,
            duration,
          });
          
          return result;
        } catch (error) {
          lastError = error as InstagramError;
          
          // Don't retry on non-retryable errors
          if (!lastError.retryable) {
            instagramLogger.error(
              `${operationName} failed (non-retryable)`,
              lastError.originalError || new Error(lastError.message),
              {
                correlationId,
                type: lastError.type,
                attempt,
              }
            );
            throw lastError;
          }

          if (attempt === maxRetries) {
            const duration = Date.now() - startTime;
            instagramLogger.error(
              `${operationName} failed after ${maxRetries} attempts`,
              lastError.originalError || new Error(lastError.message),
              {
                correlationId,
                maxRetries,
                duration,
                type: lastError.type,
              }
            );
            throw lastError;
          }

          // Exponential backoff with jitter
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
          
          instagramLogger.warn(
            `${operationName} attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`,
            {
              correlationId,
              error: lastError.message,
              attempt,
              delay: Math.round(delay),
            }
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    });
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    correlationId: string
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      const message =
        error instanceof Error && error.name === 'AbortError'
          ? 'Request timed out'
          : error instanceof Error
            ? error.message
            : 'Network error';

      throw this.createError(
        InstagramErrorType.NETWORK_ERROR,
        message,
        correlationId,
        undefined,
        error instanceof Error ? error : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Store token for management
   */
  private storeToken(userId: string, token: string, expiresIn: number): void {
    const tokenData: TokenData = {
      token,
      tokenType: 'bearer',
      expiresAt: Date.now() + (expiresIn * 1000),
      refreshedAt: Date.now(),
      userId,
    };
    
    this.tokenStore.set(userId, tokenData);
    
    instagramLogger.debug('Token stored', {
      userId,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
    });
  }

  /**
   * Check if token needs refresh
   */
  private shouldRefreshToken(userId: string): boolean {
    const tokenData = this.tokenStore.get(userId);
    if (!tokenData) return false;
    
    const timeUntilExpiry = tokenData.expiresAt - Date.now();
    return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Get valid token (auto-refresh if needed)
   */
  async getValidToken(userId: string): Promise<string> {
    const correlationId = this.generateCorrelationId();
    const tokenData = this.tokenStore.get(userId);
    
    if (!tokenData) {
      throw this.createError(
        InstagramErrorType.AUTH_ERROR,
        'No token found for user',
        correlationId
      );
    }
    
    // Auto-refresh if needed
    if (this.shouldRefreshToken(userId)) {
      instagramLogger.info('Auto-refreshing token', {
        correlationId,
        userId,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
      });
      
      try {
        const refreshed = await this.refreshLongLivedToken(tokenData.token);
        this.storeToken(userId, refreshed.access_token, refreshed.expires_in);
        return refreshed.access_token;
      } catch (error) {
        instagramLogger.error('Auto-refresh failed', error as Error, {
          correlationId,
          userId,
        });
        throw error;
      }
    }
    
    return tokenData.token;
  }

  /**
   * Generate authorization URL
   */
  async getAuthorizationUrl(permissions: string[] = DEFAULT_PERMISSIONS): Promise<InstagramAuthUrl> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Generating authorization URL', {
      correlationId,
      permissions,
    });
    
    await this.validateCredentials(correlationId);
    
    const state = crypto.randomBytes(32).toString('hex');
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: permissions.join(','),
      response_type: 'code',
      state,
    });

    const url = `${FACEBOOK_AUTH_URL}?${params.toString()}`;

    instagramLogger.debug('Authorization URL generated', {
      correlationId,
      state,
    });

    return { url, state };
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<InstagramTokens> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Exchanging code for tokens', {
      correlationId,
    });
    
    await this.validateCredentials(correlationId);
    
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(
        `${FACEBOOK_TOKEN_URL}?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleFacebookError(data, response.status, correlationId);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
      };
    }, 'Token exchange', correlationId);
  }

  /**
   * Get long-lived token
   */
  async getLongLivedToken(shortLivedToken: string, userId?: string): Promise<InstagramLongLivedToken> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Getting long-lived token', {
      correlationId,
      userId,
    });
    
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: shortLivedToken,
    });

    const result = await this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(
        `${FACEBOOK_TOKEN_URL}?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleFacebookError(data, response.status, correlationId);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
      };
    }, 'Long-lived token exchange', correlationId);
    
    // Store token if userId provided
    if (userId) {
      this.storeToken(userId, result.access_token, result.expires_in);
    }
    
    return result;
  }

  /**
   * Refresh long-lived token
   */
  async refreshLongLivedToken(token: string): Promise<InstagramLongLivedToken> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Refreshing long-lived token', {
      correlationId,
    });
    
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: token,
    });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(
        `${FACEBOOK_TOKEN_URL}?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleFacebookError(data, response.status, correlationId);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
      };
    }, 'Token refresh', correlationId);
  }

  /**
   * Get account info
   */
  async getAccountInfo(accessToken: string): Promise<InstagramAccountInfo> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Getting account info', {
      correlationId,
    });

    return this.retryApiCall(async () => {
      // Get user ID
      const meResponse = await this.fetchWithTimeout(
        `${FACEBOOK_GRAPH_URL}/me?access_token=${accessToken}`,
        {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let meData: any;
      try {
        meData = await meResponse.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          meResponse.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!meResponse.ok || meData.error) {
        throw this.handleFacebookError(meData, meResponse.status, correlationId);
      }

      // Get pages
      const pagesResponse = await this.fetchWithTimeout(
        `${FACEBOOK_GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`,
        {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let pagesData: any;
      try {
        pagesData = await pagesResponse.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          pagesResponse.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!pagesResponse.ok || pagesData.error) {
        throw this.handleFacebookError(pagesData, pagesResponse.status, correlationId);
      }

      return {
        user_id: meData.id,
        access_token: accessToken,
        pages: pagesData.data || [],
      };
    }, 'Account info', correlationId);
  }

  /**
   * Check if has Instagram Business account
   */
  hasInstagramBusinessAccount(pages: InstagramPage[]): boolean {
    return pages.some(page => page.instagram_business_account);
  }

  /**
   * Get Instagram account details
   */
  async getInstagramAccountDetails(
    igBusinessId: string,
    accessToken: string
  ): Promise<InstagramAccountDetails> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Getting Instagram account details', {
      correlationId,
      igBusinessId,
    });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(
        `${FACEBOOK_GRAPH_URL}/${igBusinessId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`,
        {
          cache: 'no-store',
          headers: {
            'User-Agent': 'Instagram-OAuth-Client/2.0',
          },
        },
        correlationId
      );

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          InstagramErrorType.API_ERROR,
          'Invalid JSON response from Instagram',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleFacebookError(data, response.status, correlationId);
      }

      return data;
    }, 'Instagram account details', correlationId);
  }

  /**
   * Revoke access
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    instagramLogger.info('Revoking access', {
      correlationId,
    });

    try {
      const response = await this.fetchWithTimeout(
        `${FACEBOOK_GRAPH_URL}/me/permissions?access_token=${accessToken}`,
        {
          method: 'DELETE',
          cache: 'no-store',
        },
        correlationId
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({} as any));
        instagramLogger.warn('Revoke failed', {
          correlationId,
          error: data.error?.message || response.statusText,
        });
      } else {
        instagramLogger.info('Access revoked successfully', {
          correlationId,
        });
      }
    } catch (error) {
      const maybeError = error as any;
      instagramLogger.error('Revoke error', (maybeError?.originalError as Error) || (error as Error), {
        correlationId,
      });
    }
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): void {
    this.validationCache.clear();
    instagramLogger.debug('Validation cache cleared');
  }

  /**
   * Get circuit breaker stats
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  /**
   * Get token info
   */
  getTokenInfo(userId: string): TokenData | undefined {
    return this.tokenStore.get(userId);
  }

  /**
   * Clear token
   */
  clearToken(userId: string): void {
    this.tokenStore.delete(userId);
    instagramLogger.debug('Token cleared', { userId });
  }
}

// Export singleton
let optimizedInstance: InstagramOAuthServiceOptimized | null = null;

function getOptimizedInstance(): InstagramOAuthServiceOptimized {
  if (!optimizedInstance) {
    optimizedInstance = new InstagramOAuthServiceOptimized();
  }
  return optimizedInstance;
}

export const instagramOAuthOptimized = {
  getAuthorizationUrl: (...args: Parameters<InstagramOAuthServiceOptimized['getAuthorizationUrl']>) => 
    getOptimizedInstance().getAuthorizationUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<InstagramOAuthServiceOptimized['exchangeCodeForTokens']>) => 
    getOptimizedInstance().exchangeCodeForTokens(...args),
  getLongLivedToken: (...args: Parameters<InstagramOAuthServiceOptimized['getLongLivedToken']>) => 
    getOptimizedInstance().getLongLivedToken(...args),
  refreshLongLivedToken: (...args: Parameters<InstagramOAuthServiceOptimized['refreshLongLivedToken']>) => 
    getOptimizedInstance().refreshLongLivedToken(...args),
  getAccountInfo: (...args: Parameters<InstagramOAuthServiceOptimized['getAccountInfo']>) => 
    getOptimizedInstance().getAccountInfo(...args),
  hasInstagramBusinessAccount: (...args: Parameters<InstagramOAuthServiceOptimized['hasInstagramBusinessAccount']>) => 
    getOptimizedInstance().hasInstagramBusinessAccount(...args),
  getInstagramAccountDetails: (...args: Parameters<InstagramOAuthServiceOptimized['getInstagramAccountDetails']>) => 
    getOptimizedInstance().getInstagramAccountDetails(...args),
  revokeAccess: (...args: Parameters<InstagramOAuthServiceOptimized['revokeAccess']>) => 
    getOptimizedInstance().revokeAccess(...args),
  getValidToken: (...args: Parameters<InstagramOAuthServiceOptimized['getValidToken']>) => 
    getOptimizedInstance().getValidToken(...args),
  clearValidationCache: () => getOptimizedInstance().clearValidationCache(),
  getCircuitBreakerStats: () => getOptimizedInstance().getCircuitBreakerStats(),
  resetCircuitBreaker: () => getOptimizedInstance().resetCircuitBreaker(),
  getTokenInfo: (...args: Parameters<InstagramOAuthServiceOptimized['getTokenInfo']>) => 
    getOptimizedInstance().getTokenInfo(...args),
  clearToken: (...args: Parameters<InstagramOAuthServiceOptimized['clearToken']>) => 
    getOptimizedInstance().clearToken(...args),
};
