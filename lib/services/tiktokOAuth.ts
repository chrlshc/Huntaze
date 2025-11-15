/**
 * TikTok OAuth Service
 * 
 * Implements TikTok OAuth 2.0 flow with integrated credential validation
 * 
 * Features:
 * - Exponential backoff retry strategy (3 attempts)
 * - Request timeout handling (10s)
 * - Credential validation caching (5min TTL)
 * - Comprehensive error handling with correlation IDs
 * - TypeScript strict typing for all responses
 * - Detailed logging for debugging
 * 
 * @see https://developers.tiktok.com/doc/oauth-user-access-token-management
 */

import crypto from 'crypto';
import { TikTokCredentialValidator, TikTokCredentials } from '@/lib/validation';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_REVOKE_URL = 'https://open.tiktokapis.com/v2/oauth/revoke/';
const TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/';

// Default scopes for TikTok integration
const DEFAULT_SCOPES = ['user.info.basic', 'video.upload', 'video.list'];

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100, // ms
  maxDelay: 2000, // ms
  backoffFactor: 2,
} as const;

// Request timeout
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// ============================================================================
// TypeScript Types for API Responses
// ============================================================================

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

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  display_name: string;
}

export interface TikTokErrorResponse {
  error: string;
  error_description?: string;
  log_id?: string;
}

export interface TikTokAPIError extends Error {
  code: string;
  statusCode?: number;
  correlationId: string;
  retryable: boolean;
  logId?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum TikTokErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  RATE_LIMIT = 'RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * TikTok OAuth Service
 * 
 * Handles all TikTok OAuth 2.0 operations with:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Comprehensive error handling
 * - Credential validation caching
 * - Detailed logging
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

  // ============================================================================
  // Private Utility Methods
  // ============================================================================

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `tiktok-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = REQUEST_TIMEOUT_MS
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(
          TikTokErrorCode.TIMEOUT_ERROR,
          `Request timeout after ${timeoutMs}ms`,
          '',
          true
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Create standardized TikTok API error
   */
  private createError(
    code: TikTokErrorCode,
    message: string,
    correlationId: string,
    retryable: boolean = false,
    statusCode?: number,
    logId?: string
  ): TikTokAPIError {
    const error = new Error(message) as TikTokAPIError;
    error.code = code;
    error.correlationId = correlationId;
    error.retryable = retryable;
    error.statusCode = statusCode;
    error.logId = logId;
    return error;
  }

  /**
   * Make API request with retry logic and error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    correlationId: string,
    operation: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = RETRY_CONFIG.initialDelay;

    console.log(`[TikTokOAuth] ${operation} - Starting request`, {
      url,
      method: options.method,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.fetchWithTimeout(url, options);
        const duration = Date.now() - startTime;

        const data = await response.json();

        // Log response
        console.log(`[TikTokOAuth] ${operation} - Response received`, {
          status: response.status,
          duration: `${duration}ms`,
          attempt,
          correlationId,
          logId: data.log_id,
        });

        if (!response.ok || data.error) {
          const errorCode = this.mapErrorCode(data.error, response.status);
          const errorMessage = data.error_description || data.error || `Request failed: ${response.status}`;
          
          throw this.createError(
            errorCode,
            errorMessage,
            correlationId,
            this.isRetryable(errorCode, response.status),
            response.status,
            data.log_id
          );
        }

        console.log(`[TikTokOAuth] ${operation} - Success`, {
          duration: `${duration}ms`,
          correlationId,
        });

        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        const isRetryable = (error as TikTokAPIError).retryable || false;

        // Log error
        console.error(`[TikTokOAuth] ${operation} - Error (attempt ${attempt}/${RETRY_CONFIG.maxAttempts})`, {
          error: lastError.message,
          code: (error as TikTokAPIError).code,
          retryable: isRetryable,
          correlationId,
        });

        // Don't retry if not retryable or last attempt
        if (!isRetryable || attempt === RETRY_CONFIG.maxAttempts) {
          throw lastError;
        }

        // Wait before retry
        console.log(`[TikTokOAuth] ${operation} - Retrying in ${delay}ms`, {
          attempt,
          correlationId,
        });

        await this.sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxDelay);
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Map TikTok error to error code
   */
  private mapErrorCode(error: string, statusCode: number): TikTokErrorCode {
    if (error === 'invalid_grant' || error === 'invalid_token') {
      return TikTokErrorCode.INVALID_TOKEN;
    }
    if (error === 'invalid_client') {
      return TikTokErrorCode.INVALID_CREDENTIALS;
    }
    if (statusCode === 429) {
      return TikTokErrorCode.RATE_LIMIT;
    }
    if (statusCode >= 500) {
      return TikTokErrorCode.API_ERROR;
    }
    return TikTokErrorCode.API_ERROR;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(errorCode: TikTokErrorCode, statusCode: number): boolean {
    // Retry on network errors, timeouts, rate limits, and server errors
    return (
      errorCode === TikTokErrorCode.NETWORK_ERROR ||
      errorCode === TikTokErrorCode.TIMEOUT_ERROR ||
      errorCode === TikTokErrorCode.RATE_LIMIT ||
      errorCode === TikTokErrorCode.API_ERROR ||
      statusCode >= 500
    );
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

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Generate authorization URL with state for CSRF protection
   * 
   * Validates credentials before generating URL
   * 
   * @param scopes - OAuth scopes to request (default: user.info.basic, video.upload, video.list)
   * @returns Authorization URL and cryptographically secure state
   * @throws TikTokAPIError if credentials are invalid
   * 
   * @example
   * ```typescript
   * const { url, state } = await tiktokOAuth.getAuthorizationUrl();
   * // Store state in session for CSRF validation
   * res.redirect(url);
   * ```
   */
  async getAuthorizationUrl(scopes: string[] = DEFAULT_SCOPES): Promise<TikTokAuthUrl> {
    const correlationId = this.generateCorrelationId();
    
    console.log('[TikTokOAuth] getAuthorizationUrl - Starting', {
      scopes,
      correlationId,
    });

    try {
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

      console.log('[TikTokOAuth] getAuthorizationUrl - Success', {
        stateLength: state.length,
        scopeCount: scopes.length,
        correlationId,
      });

      return { url, state };
    } catch (error) {
      console.error('[TikTokOAuth] getAuthorizationUrl - Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens
   * 
   * Validates credentials before token exchange
   * Includes automatic retry with exponential backoff
   * 
   * @param code - Authorization code from TikTok callback
   * @returns Access token, refresh token, and metadata
   * @throws TikTokAPIError if exchange fails or credentials are invalid
   * 
   * @example
   * ```typescript
   * const tokens = await tiktokOAuth.exchangeCodeForTokens(code);
   * // Store tokens securely
   * await db.tokens.create({
   *   userId,
   *   accessToken: tokens.access_token,
   *   refreshToken: tokens.refresh_token,
   *   expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
   * });
   * ```
   */
  async exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
    const correlationId = this.generateCorrelationId();
    
    console.log('[TikTokOAuth] exchangeCodeForTokens - Starting', {
      codeLength: code.length,
      correlationId,
    });

    try {
      const { clientKey, clientSecret, redirectUri } = await this.getCredentials();

      const body = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const data = await this.makeRequest<any>(
        TIKTOK_TOKEN_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          cache: 'no-store',
        },
        correlationId,
        'exchangeCodeForTokens'
      );

      const tokens: TikTokTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in,
        open_id: data.open_id,
        scope: data.scope,
        token_type: data.token_type,
      };

      console.log('[TikTokOAuth] exchangeCodeForTokens - Success', {
        openId: tokens.open_id,
        expiresIn: `${tokens.expires_in}s`,
        scopes: tokens.scope,
        correlationId,
      });

      return tokens;
    } catch (error) {
      console.error('[TikTokOAuth] exchangeCodeForTokens - Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      
      if ((error as TikTokAPIError).code) {
        throw error;
      }
      
      throw this.createError(
        TikTokErrorCode.NETWORK_ERROR,
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
        correlationId,
        true
      );
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * Validates credentials before token refresh
   * Includes automatic retry with exponential backoff
   * 
   * IMPORTANT: TikTok may rotate the refresh token
   * Always use the new refresh_token if provided in the response
   * 
   * @param refreshToken - Current refresh token
   * @returns New tokens (refresh_token may be rotated)
   * @throws TikTokAPIError if refresh fails or credentials are invalid
   * 
   * @example
   * ```typescript
   * const newTokens = await tiktokOAuth.refreshAccessToken(oldRefreshToken);
   * // Update stored tokens
   * await db.tokens.update({
   *   accessToken: newTokens.access_token,
   *   refreshToken: newTokens.refresh_token || oldRefreshToken, // Use new if rotated
   *   expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
   * });
   * ```
   */
  async refreshAccessToken(refreshToken: string): Promise<TikTokRefreshResponse> {
    const correlationId = this.generateCorrelationId();
    
    console.log('[TikTokOAuth] refreshAccessToken - Starting', {
      refreshTokenLength: refreshToken.length,
      correlationId,
    });

    try {
      const { clientKey, clientSecret } = await this.getCredentials();

      const body = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const data = await this.makeRequest<any>(
        TIKTOK_TOKEN_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          cache: 'no-store',
        },
        correlationId,
        'refreshAccessToken'
      );

      const response: TikTokRefreshResponse = {
        access_token: data.access_token,
        refresh_token: data.refresh_token, // May be rotated (new token)
        expires_in: data.expires_in,
        refresh_expires_in: data.refresh_expires_in,
        token_type: data.token_type,
      };

      console.log('[TikTokOAuth] refreshAccessToken - Success', {
        expiresIn: `${response.expires_in}s`,
        tokenRotated: !!response.refresh_token && response.refresh_token !== refreshToken,
        correlationId,
      });

      return response;
    } catch (error) {
      console.error('[TikTokOAuth] refreshAccessToken - Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      
      if ((error as TikTokAPIError).code) {
        throw error;
      }
      
      throw this.createError(
        TikTokErrorCode.NETWORK_ERROR,
        `Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        correlationId,
        true
      );
    }
  }

  /**
   * Revoke access token (disconnect)
   * 
   * Validates credentials before revocation
   * Best-effort operation - does not throw on failure
   * 
   * @param accessToken - Access token to revoke
   * 
   * @example
   * ```typescript
   * // User disconnects TikTok
   * await tiktokOAuth.revokeAccess(accessToken);
   * await db.tokens.delete({ userId });
   * ```
   */
  async revokeAccess(accessToken: string): Promise<void> {
    const correlationId = this.generateCorrelationId();
    
    console.log('[TikTokOAuth] revokeAccess - Starting', {
      accessTokenLength: accessToken.length,
      correlationId,
    });

    try {
      const { clientKey, clientSecret } = await this.getCredentials();

      const body = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        token: accessToken,
      });

      await this.makeRequest<any>(
        TIKTOK_REVOKE_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          cache: 'no-store',
        },
        correlationId,
        'revokeAccess'
      );

      console.log('[TikTokOAuth] revokeAccess - Success', {
        correlationId,
      });
    } catch (error) {
      console.error('[TikTokOAuth] revokeAccess - Failed (best effort)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      // Don't throw - revoke is best effort
    }
  }

  /**
   * Get user info using access token
   * 
   * Includes automatic retry with exponential backoff
   * 
   * @param accessToken - Valid access token
   * @returns User info (open_id, union_id, display_name, avatar_url)
   * @throws TikTokAPIError if request fails
   * 
   * @example
   * ```typescript
   * const userInfo = await tiktokOAuth.getUserInfo(accessToken);
   * console.log(`Connected: ${userInfo.display_name}`);
   * ```
   */
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    const correlationId = this.generateCorrelationId();
    
    console.log('[TikTokOAuth] getUserInfo - Starting', {
      accessTokenLength: accessToken.length,
      correlationId,
    });

    try {
      const data = await this.makeRequest<any>(
        TIKTOK_USER_INFO_URL,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        },
        correlationId,
        'getUserInfo'
      );

      const userInfo: TikTokUserInfo = data.data.user;

      console.log('[TikTokOAuth] getUserInfo - Success', {
        openId: userInfo.open_id,
        displayName: userInfo.display_name,
        correlationId,
      });

      return userInfo;
    } catch (error) {
      console.error('[TikTokOAuth] getUserInfo - Failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      });
      
      if ((error as TikTokAPIError).code) {
        throw error;
      }
      
      throw this.createError(
        TikTokErrorCode.NETWORK_ERROR,
        `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        correlationId,
        true
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
