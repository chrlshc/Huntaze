/**
 * Reddit OAuth Service - OPTIMIZED VERSION
 * 
 * Phase 2 & 3 Complete Integration:
 * - Structured error handling with correlation IDs
 * - Centralized logging
 * - Circuit breaker pattern
 * - Token manager with auto-refresh
 * - Enhanced monitoring
 */

import * as crypto from 'crypto';
import { redditLogger } from './reddit/logger';
import { CircuitBreaker } from './reddit/circuit-breaker';
import {
  RedditError,
  RedditErrorType,
  RedditAuthUrl,
  RedditTokens,
  RedditUserInfo,
  RedditSubreddit,
  TokenData,
  RedditErrorResponse,
} from './reddit/types';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_API_URL = 'https://oauth.reddit.com';

const DEFAULT_SCOPES = ['identity', 'submit', 'edit', 'read', 'mysubreddits'];

export class RedditOAuthServiceOptimized {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private userAgent: string;
  private circuitBreaker: CircuitBreaker;
  private tokenStore: Map<string, TokenData> = new Map();
  
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
  private readonly REQUEST_TIMEOUT_MS = 15_000;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || '';
    this.userAgent = process.env.REDDIT_USER_AGENT || 'Huntaze/1.0.0';
    
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitoringPeriod: 120000,
    }, 'Reddit OAuth');

    redditLogger.info('Reddit OAuth Service initialized', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      hasRedirectUri: !!this.redirectUri,
    });
  }

  private generateCorrelationId(): string {
    return redditLogger.generateCorrelationId();
  }

  private createError(
    type: RedditErrorType,
    message: string,
    correlationId: string,
    statusCode?: number,
    originalError?: Error
  ): RedditError {
    const userMessages: Record<RedditErrorType, string> = {
      [RedditErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
      [RedditErrorType.AUTH_ERROR]: 'Authentication failed. Please reconnect your Reddit account.',
      [RedditErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment and try again.',
      [RedditErrorType.TOKEN_EXPIRED]: 'Your Reddit connection has expired. Please reconnect.',
      [RedditErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
      [RedditErrorType.API_ERROR]: 'Reddit API error. Please try again later.',
      [RedditErrorType.PERMISSION_ERROR]: 'Missing permissions. Please reconnect with required permissions.',
    };
    
    return {
      type,
      message,
      userMessage: userMessages[type],
      retryable: [RedditErrorType.NETWORK_ERROR, RedditErrorType.API_ERROR].includes(type),
      correlationId,
      statusCode,
      originalError,
      timestamp: new Date().toISOString(),
    };
  }

  private handleRedditError(
    data: RedditErrorResponse,
    statusCode: number,
    correlationId: string
  ): RedditError {
    if (statusCode === 429) {
      return this.createError(
        RedditErrorType.RATE_LIMIT_ERROR,
        data.error_description || 'Rate limit exceeded',
        correlationId,
        statusCode
      );
    }
    
    if (statusCode === 401 || statusCode === 403) {
      return this.createError(
        RedditErrorType.AUTH_ERROR,
        data.error_description || 'Authentication failed',
        correlationId,
        statusCode
      );
    }
    
    if (statusCode === 400) {
      return this.createError(
        RedditErrorType.VALIDATION_ERROR,
        data.error_description || 'Invalid request',
        correlationId,
        statusCode
      );
    }
    
    return this.createError(
      RedditErrorType.API_ERROR,
      data.error_description || data.message || 'API error',
      correlationId,
      statusCode
    );
  }

  private async retryApiCall<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      let lastError: RedditError;
      const startTime = Date.now();

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          const duration = Date.now() - startTime;
          
          redditLogger.info(`${operationName} successful`, {
            correlationId,
            attempt,
            duration,
          });
          
          return result;
        } catch (error) {
          lastError = error as RedditError;
          
          if (!lastError.retryable) {
            redditLogger.error(
              `${operationName} failed (non-retryable)`,
              lastError.originalError || new Error(lastError.message),
              { correlationId, type: lastError.type, attempt }
            );
            throw lastError;
          }

          if (attempt === maxRetries) {
            const duration = Date.now() - startTime;
            redditLogger.error(
              `${operationName} failed after ${maxRetries} attempts`,
              lastError.originalError || new Error(lastError.message),
              { correlationId, maxRetries, duration, type: lastError.type }
            );
            throw lastError;
          }

          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
          
          redditLogger.warn(
            `${operationName} attempt ${attempt} failed, retrying in ${Math.round(delay)}ms`,
            { correlationId, error: lastError.message, attempt, delay: Math.round(delay) }
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
        RedditErrorType.NETWORK_ERROR,
        message,
        correlationId,
        undefined,
        error instanceof Error ? error : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private storeToken(userId: string, token: string, expiresIn: number, refreshToken?: string): void {
    const tokenData: TokenData = {
      token,
      tokenType: 'bearer',
      expiresAt: Date.now() + (expiresIn * 1000),
      refreshedAt: Date.now(),
      userId,
      refreshToken,
    };
    
    this.tokenStore.set(userId, tokenData);
    
    redditLogger.debug('Token stored', {
      userId,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
    });
  }

  private shouldRefreshToken(userId: string): boolean {
    const tokenData = this.tokenStore.get(userId);
    if (!tokenData) return false;
    
    const timeUntilExpiry = tokenData.expiresAt - Date.now();
    return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD;
  }

  async getValidToken(userId: string): Promise<string> {
    const correlationId = this.generateCorrelationId();
    const tokenData = this.tokenStore.get(userId);
    
    if (!tokenData) {
      throw this.createError(
        RedditErrorType.AUTH_ERROR,
        'No token found for user',
        correlationId
      );
    }
    
    if (this.shouldRefreshToken(userId) && tokenData.refreshToken) {
      redditLogger.info('Auto-refreshing token', {
        correlationId,
        userId,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
      });
      
      try {
        const refreshed = await this.refreshAccessToken(tokenData.refreshToken);
        this.storeToken(userId, refreshed.access_token, refreshed.expires_in, refreshed.refresh_token);
        return refreshed.access_token;
      } catch (error) {
        redditLogger.error('Auto-refresh failed', error as Error, { correlationId, userId });
        throw error;
      }
    }
    
    return tokenData.token;
  }

  async getAuthorizationUrl(
    scopes: string[] = DEFAULT_SCOPES,
    duration: 'temporary' | 'permanent' = 'permanent'
  ): Promise<RedditAuthUrl> {
    const correlationId = this.generateCorrelationId();
    
    redditLogger.info('Generating authorization URL', { correlationId, scopeCount: scopes.length });
    
    const state = crypto.randomBytes(32).toString('hex');
    
    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('response_type', 'code');
    params.append('state', state);
    params.append('redirect_uri', this.redirectUri);
    params.append('duration', duration);
    params.append('scope', scopes.join(' '));

    const url = `${REDDIT_AUTH_URL}?${params.toString()}`;

    redditLogger.debug('Authorization URL generated', { correlationId, state });

    return { url, state };
  }

  async exchangeCodeForTokens(code: string): Promise<RedditTokens> {
    const correlationId = this.generateCorrelationId();
    
    redditLogger.info('Exchanging code for tokens', { correlationId });
    
    return this.retryApiCall(async () => {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await this.fetchWithTimeout(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          RedditErrorType.API_ERROR,
          'Invalid JSON response from Reddit',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleRedditError(data, response.status, correlationId);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
      };
    }, 'Token exchange', correlationId);
  }

  async refreshAccessToken(refreshToken: string): Promise<RedditTokens> {
    const correlationId = this.generateCorrelationId();
    
    redditLogger.info('Refreshing access token', { correlationId });
    
    return this.retryApiCall(async () => {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await this.fetchWithTimeout(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          RedditErrorType.API_ERROR,
          'Invalid JSON response from Reddit',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleRedditError(data, response.status, correlationId);
      }

      return {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: refreshToken,
        scope: data.scope,
      };
    }, 'Token refresh', correlationId);
  }

  async getUserInfo(accessToken: string): Promise<RedditUserInfo> {
    const correlationId = this.generateCorrelationId();
    
    redditLogger.info('Getting user info', { correlationId });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(`${REDDIT_API_URL}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          RedditErrorType.API_ERROR,
          'Invalid JSON response from Reddit',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleRedditError(data, response.status, correlationId);
      }

      return {
        id: data.id,
        name: data.name,
        icon_img: data.icon_img,
        created_utc: data.created_utc,
        link_karma: data.link_karma,
        comment_karma: data.comment_karma,
      };
    }, 'User info', correlationId);
  }

  async getSubscribedSubreddits(accessToken: string): Promise<RedditSubreddit[]> {
    const correlationId = this.generateCorrelationId();
    
    redditLogger.info('Getting subscribed subreddits', { correlationId });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(`${REDDIT_API_URL}/subreddits/mine/subscriber?limit=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          RedditErrorType.API_ERROR,
          'Invalid JSON response from Reddit',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleRedditError(data, response.status, correlationId);
      }

      return data.data.children.map((child: any) => ({
        name: child.data.name,
        display_name: child.data.display_name,
        subscribers: child.data.subscribers,
        public_description: child.data.public_description,
      }));
    }, 'Subreddits', correlationId);
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  getTokenInfo(userId: string): TokenData | undefined {
    return this.tokenStore.get(userId);
  }

  clearToken(userId: string): void {
    this.tokenStore.delete(userId);
    redditLogger.debug('Token cleared', { userId });
  }
}

let optimizedInstance: RedditOAuthServiceOptimized | null = null;

function getOptimizedInstance(): RedditOAuthServiceOptimized {
  if (!optimizedInstance) {
    optimizedInstance = new RedditOAuthServiceOptimized();
  }
  return optimizedInstance;
}

export const redditOAuthOptimized = {
  getAuthorizationUrl: (...args: Parameters<RedditOAuthServiceOptimized['getAuthorizationUrl']>) => 
    getOptimizedInstance().getAuthorizationUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<RedditOAuthServiceOptimized['exchangeCodeForTokens']>) => 
    getOptimizedInstance().exchangeCodeForTokens(...args),
  refreshAccessToken: (...args: Parameters<RedditOAuthServiceOptimized['refreshAccessToken']>) => 
    getOptimizedInstance().refreshAccessToken(...args),
  getUserInfo: (...args: Parameters<RedditOAuthServiceOptimized['getUserInfo']>) => 
    getOptimizedInstance().getUserInfo(...args),
  getSubscribedSubreddits: (...args: Parameters<RedditOAuthServiceOptimized['getSubscribedSubreddits']>) => 
    getOptimizedInstance().getSubscribedSubreddits(...args),
  getValidToken: (...args: Parameters<RedditOAuthServiceOptimized['getValidToken']>) => 
    getOptimizedInstance().getValidToken(...args),
  getCircuitBreakerStats: () => getOptimizedInstance().getCircuitBreakerStats(),
  resetCircuitBreaker: () => getOptimizedInstance().resetCircuitBreaker(),
  getTokenInfo: (...args: Parameters<RedditOAuthServiceOptimized['getTokenInfo']>) => 
    getOptimizedInstance().getTokenInfo(...args),
  clearToken: (...args: Parameters<RedditOAuthServiceOptimized['clearToken']>) => 
    getOptimizedInstance().clearToken(...args),
};
