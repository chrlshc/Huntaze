/**
 * TikTok OAuth Service - OPTIMIZED VERSION
 * 
 * Phase 2 & 3 Complete Integration:
 * - Structured error handling with correlation IDs
 * - Centralized logging
 * - Circuit breaker pattern
 * - Token manager with auto-refresh
 * - Enhanced monitoring
 */

import * as crypto from 'crypto';
import { tiktokLogger } from './tiktok/logger';
import { CircuitBreaker } from './tiktok/circuit-breaker';
import {
  TikTokError,
  TikTokErrorType,
  TikTokAuthUrl,
  TikTokTokens,
  TikTokUserInfo,
  TokenData,
  TikTokErrorResponse,
} from './tiktok/types';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

const DEFAULT_SCOPES = ['user.info.basic', 'video.upload', 'video.list'];

export class TikTokOAuthServiceOptimized {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;
  private circuitBreaker: CircuitBreaker;
  private tokenStore: Map<string, TokenData> = new Map();
  
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly TOKEN_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 1 day
  private readonly REQUEST_TIMEOUT_MS = 15_000;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || '';
    
    this.circuitBreaker = new CircuitBreaker('TikTok OAuth', {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeout: 60000,
      monitoringPeriod: 120000,
    });

    tiktokLogger.info('TikTok OAuth Service initialized', {
      hasClientKey: !!this.clientKey,
      hasClientSecret: !!this.clientSecret,
      hasRedirectUri: !!this.redirectUri,
    });
  }

  private generateCorrelationId(): string {
    return tiktokLogger.generateCorrelationId();
  }

  private createError(
    type: TikTokErrorType,
    message: string,
    correlationId: string,
    statusCode?: number,
    originalError?: Error
  ): TikTokError {
    const userMessages: Record<TikTokErrorType, string> = {
      [TikTokErrorType.NETWORK_ERROR]: 'Connection issue. Please check your internet and try again.',
      [TikTokErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [TikTokErrorType.AUTH_ERROR]: 'Authentication failed. Please reconnect your TikTok account.',
      [TikTokErrorType.TOKEN_EXPIRED]: 'Your TikTok connection has expired. Please reconnect.',
      [TikTokErrorType.INVALID_TOKEN]: 'Invalid TikTok token. Please reconnect your account.',
      [TikTokErrorType.INVALID_CREDENTIALS]: 'Invalid TikTok credentials. Please check your configuration.',
      [TikTokErrorType.SCOPE_NOT_AUTHORIZED]: 'Missing required permissions. Please reconnect with necessary permissions.',
      [TikTokErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment and try again.',
      [TikTokErrorType.QUOTA_EXCEEDED]: 'Upload quota exceeded. Please try again later.',
      [TikTokErrorType.VALIDATION_ERROR]: 'Invalid request. Please check your input.',
      [TikTokErrorType.INVALID_PARAM]: 'Invalid parameters. Please check your input.',
      [TikTokErrorType.API_ERROR]: 'TikTok API error. Please try again later.',
      [TikTokErrorType.SERVER_ERROR]: 'TikTok server error. Please try again later.',
      [TikTokErrorType.UPLOAD_ERROR]: 'Video upload failed. Please try again.',
      [TikTokErrorType.URL_OWNERSHIP_UNVERIFIED]: 'Video URL ownership not verified. Please use a verified domain.',
    };
    
    const error = new Error(message) as TikTokError;
    error.type = type;
    error.message = message;
    error.userMessage = userMessages[type];
    error.retryable = [TikTokErrorType.NETWORK_ERROR, TikTokErrorType.API_ERROR, TikTokErrorType.SERVER_ERROR].includes(type);
    error.correlationId = correlationId;
    error.statusCode = statusCode;
    error.originalError = originalError;
    error.timestamp = new Date();
    
    return error;
  }

  private handleTikTokError(
    data: TikTokErrorResponse,
    statusCode: number,
    correlationId: string
  ): TikTokError {
    const errorMessage = data.error_description || data.message || data.data?.error?.message || 'Unknown error';
    
    if (statusCode === 429) {
      return this.createError(
        TikTokErrorType.RATE_LIMIT_ERROR,
        errorMessage,
        correlationId,
        statusCode
      );
    }
    
    if (statusCode === 401 || statusCode === 403) {
      return this.createError(
        TikTokErrorType.AUTH_ERROR,
        errorMessage,
        correlationId,
        statusCode
      );
    }
    
    if (statusCode === 400) {
      return this.createError(
        TikTokErrorType.VALIDATION_ERROR,
        errorMessage,
        correlationId,
        statusCode
      );
    }
    
    if (statusCode >= 500) {
      return this.createError(
        TikTokErrorType.SERVER_ERROR,
        errorMessage,
        correlationId,
        statusCode
      );
    }
    
    return this.createError(
      TikTokErrorType.API_ERROR,
      errorMessage,
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
      let lastError: TikTokError;
      const startTime = Date.now();

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();
          const duration = Date.now() - startTime;
          
          tiktokLogger.info(`${operationName} successful`, {
            correlationId,
            attempt,
            duration,
          });
          
          return result;
        } catch (error) {
          lastError = error as TikTokError;
          
          if (!lastError.retryable) {
            tiktokLogger.error(
              `${operationName} failed (non-retryable)`,
              lastError.originalError || new Error(lastError.message),
              { correlationId, type: lastError.type, attempt }
            );
            throw lastError;
          }

          if (attempt === maxRetries) {
            const duration = Date.now() - startTime;
            tiktokLogger.error(
              `${operationName} failed after ${maxRetries} attempts`,
              lastError.originalError || new Error(lastError.message),
              { correlationId, maxRetries, duration, type: lastError.type }
            );
            throw lastError;
          }

          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
          
          tiktokLogger.warn(
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
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          TikTokErrorType.TIMEOUT_ERROR,
          'Request timed out',
          correlationId,
          undefined,
          error
        );
      }

      throw this.createError(
        TikTokErrorType.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Network error',
        correlationId,
        undefined,
        error instanceof Error ? error : undefined
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private storeToken(userId: string, token: string, expiresIn: number, refreshToken?: string, refreshExpiresIn?: number): void {
    const tokenData: TokenData = {
      token,
      tokenType: 'bearer',
      expiresAt: Date.now() + (expiresIn * 1000),
      refreshedAt: Date.now(),
      userId,
      refreshToken,
      refreshExpiresAt: refreshExpiresIn ? Date.now() + (refreshExpiresIn * 1000) : undefined,
    };
    
    this.tokenStore.set(userId, tokenData);
    
    tiktokLogger.debug('Token stored', {
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
        TikTokErrorType.AUTH_ERROR,
        'No token found for user',
        correlationId
      );
    }
    
    if (this.shouldRefreshToken(userId) && tokenData.refreshToken) {
      tiktokLogger.info('Auto-refreshing token', {
        correlationId,
        userId,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
      });
      
      try {
        const refreshed = await this.refreshAccessToken(tokenData.refreshToken);
        this.storeToken(userId, refreshed.access_token, refreshed.expires_in, refreshed.refresh_token, refreshed.refresh_expires_in);
        return refreshed.access_token;
      } catch (error) {
        tiktokLogger.error('Auto-refresh failed', error as Error, { correlationId, userId });
        throw error;
      }
    }
    
    return tokenData.token;
  }

  async getAuthorizationUrl(scopes: string[] = DEFAULT_SCOPES): Promise<TikTokAuthUrl> {
    const correlationId = this.generateCorrelationId();
    
    tiktokLogger.info('Generating authorization URL', { correlationId, scopes });
    
    const state = crypto.randomBytes(32).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    const params = new URLSearchParams({
      client_key: this.clientKey,
      redirect_uri: this.redirectUri,
      scope: scopes.join(','),
      response_type: 'code',
      state,
    });

    const url = `${TIKTOK_AUTH_URL}?${params.toString()}`;

    tiktokLogger.debug('Authorization URL generated', { correlationId, state });

    return { url, state, codeVerifier };
  }

  async exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
    const correlationId = this.generateCorrelationId();
    
    tiktokLogger.info('Exchanging code for tokens', { correlationId });
    
    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          TikTokErrorType.API_ERROR,
          'Invalid JSON response from TikTok',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleTikTokError(data, response.status, correlationId);
      }

      return data.data;
    }, 'Token exchange', correlationId);
  }

  async refreshAccessToken(refreshToken: string): Promise<TikTokTokens> {
    const correlationId = this.generateCorrelationId();
    
    tiktokLogger.info('Refreshing access token', { correlationId });
    
    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(TIKTOK_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
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
          TikTokErrorType.API_ERROR,
          'Invalid JSON response from TikTok',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleTikTokError(data, response.status, correlationId);
      }

      return data.data;
    }, 'Token refresh', correlationId);
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    const correlationId = this.generateCorrelationId();
    
    tiktokLogger.info('Getting user info', { correlationId });

    return this.retryApiCall(async () => {
      const response = await this.fetchWithTimeout(TIKTOK_USER_INFO_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: ['open_id', 'union_id', 'avatar_url', 'display_name'],
        }),
        cache: 'no-store',
      }, correlationId);

      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw this.createError(
          TikTokErrorType.API_ERROR,
          'Invalid JSON response from TikTok',
          correlationId,
          response.status,
          error instanceof Error ? error : undefined
        );
      }

      if (!response.ok || data.error) {
        throw this.handleTikTokError(data, response.status, correlationId);
      }

      return data.data.user;
    }, 'User info', correlationId);
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
    tiktokLogger.debug('Token cleared', { userId });
  }
}

let optimizedInstance: TikTokOAuthServiceOptimized | null = null;

function getOptimizedInstance(): TikTokOAuthServiceOptimized {
  if (!optimizedInstance) {
    optimizedInstance = new TikTokOAuthServiceOptimized();
  }
  return optimizedInstance;
}

export const tiktokOAuthOptimized = {
  getAuthorizationUrl: (...args: Parameters<TikTokOAuthServiceOptimized['getAuthorizationUrl']>) => 
    getOptimizedInstance().getAuthorizationUrl(...args),
  exchangeCodeForTokens: (...args: Parameters<TikTokOAuthServiceOptimized['exchangeCodeForTokens']>) => 
    getOptimizedInstance().exchangeCodeForTokens(...args),
  refreshAccessToken: (...args: Parameters<TikTokOAuthServiceOptimized['refreshAccessToken']>) => 
    getOptimizedInstance().refreshAccessToken(...args),
  getUserInfo: (...args: Parameters<TikTokOAuthServiceOptimized['getUserInfo']>) => 
    getOptimizedInstance().getUserInfo(...args),
  getValidToken: (...args: Parameters<TikTokOAuthServiceOptimized['getValidToken']>) => 
    getOptimizedInstance().getValidToken(...args),
  getCircuitBreakerStats: () => getOptimizedInstance().getCircuitBreakerStats(),
  resetCircuitBreaker: () => getOptimizedInstance().resetCircuitBreaker(),
  getTokenInfo: (...args: Parameters<TikTokOAuthServiceOptimized['getTokenInfo']>) => 
    getOptimizedInstance().getTokenInfo(...args),
  clearToken: (...args: Parameters<TikTokOAuthServiceOptimized['clearToken']>) => 
    getOptimizedInstance().clearToken(...args),
};
