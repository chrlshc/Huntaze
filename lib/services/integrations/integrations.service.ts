/**
 * Integrations Service
 * 
 * Core service for managing OAuth integrations across multiple platforms
 * Requirements: 11.1, 11.2, 11.4
 */

import { PrismaClient } from '@prisma/client';
import { encryptToken, decryptToken } from './encryption';
import { InstagramAdapter, TikTokAdapter, RedditAdapter, OnlyFansAdapter } from './adapters';
import type { Provider, Integration, OAuthResult, IntegrationsServiceError } from './types';
import { csrfProtection } from './csrf-protection';
import { auditLogger } from './audit-logger';
import { integrationCache, getCachedIntegrations } from './cache';

const prisma = new PrismaClient();

export class IntegrationsService {
  private adapters: Map<Provider, any>;

  constructor() {
    // Initialize platform adapters
    this.adapters = new Map([
      ['instagram', new InstagramAdapter()],
      ['tiktok', new TikTokAdapter()],
      ['reddit', new RedditAdapter()],
      ['onlyfans', new OnlyFansAdapter()],
    ]);
  }

  /**
   * Get adapter for a provider
   */
  private getAdapter(provider: Provider) {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw this.createError('INVALID_PROVIDER', `Unsupported provider: ${provider}`, provider);
    }
    return adapter;
  }

  /**
   * Create a service error with proper typing and metadata
   */
  private createError(
    code: string,
    message: string,
    provider?: Provider,
    metadata?: Record<string, any>
  ): IntegrationsServiceError {
    const error = new Error(message) as IntegrationsServiceError;
    error.code = code as any;
    error.provider = provider;
    error.retryable = [
      'NETWORK_ERROR',
      'API_ERROR',
      'TIMEOUT_ERROR',
      'DATABASE_ERROR',
      'TOKEN_REFRESH_ERROR',
    ].includes(code);
    error.timestamp = new Date();
    error.correlationId = `int-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    error.metadata = metadata;
    return error;
  }

  /**
   * Get all integrations for a user with caching
   * 
   * Implements 5-minute TTL cache to reduce database load.
   * Requirements: 10.1, 10.2
   */
  async getConnectedIntegrations(userId: number): Promise<Integration[]> {
    return getCachedIntegrations(userId, async () => {
      try {
        const accounts = await prisma.oAuthAccount.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        return accounts.map(account => {
          // Determine status based on token expiry
          let status: 'connected' | 'expired' | 'error' | 'disconnected' = 'connected';
          if (this.isTokenExpired(account.expiresAt)) {
            status = 'expired';
          }
          
          return {
            id: account.id,
            provider: account.provider as Provider,
            providerAccountId: account.providerAccountId,
            isConnected: true,
            status,
            expiresAt: account.expiresAt || undefined,
            metadata: account.metadata as Record<string, any> | undefined,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          };
        });
      } catch (error) {
        throw this.createError('DATABASE_ERROR', 'Failed to fetch integrations');
      }
    });
  }

  /**
   * Initiate OAuth flow for a provider
   * 
   * Generates a cryptographically secure state parameter to prevent CSRF attacks.
   * Uses HMAC-signed state with embedded user ID and timestamp.
   * 
   * @param provider - OAuth provider (instagram, tiktok, reddit, onlyfans)
   * @param userId - User ID to embed in state
   * @param redirectUrl - Callback URL after OAuth
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns OAuth result with authorization URL and state
   * @throws IntegrationsServiceError with code OAUTH_INIT_ERROR
   */
  async initiateOAuthFlow(
    provider: Provider,
    userId: number,
    redirectUrl: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<OAuthResult> {
    const startTime = Date.now();
    const correlationId = `oauth-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      // Validate inputs
      if (!userId || userId <= 0) {
        throw this.createError('INVALID_USER_ID', 'User ID must be a positive integer', provider);
      }
      
      if (!redirectUrl || !redirectUrl.startsWith('http')) {
        throw this.createError('INVALID_REDIRECT_URL', 'Invalid redirect URL', provider);
      }
      
      const adapter = this.getAdapter(provider);
      
      // Generate cryptographically secure state with HMAC signature
      const state = csrfProtection.generateState(userId, provider);
      
      console.log(`[IntegrationsService] Initiating OAuth flow`, {
        provider,
        userId,
        correlationId,
        duration: Date.now() - startTime,
      });
      
      // Audit log OAuth initiation
      await auditLogger.logOAuthInitiated(
        userId,
        provider,
        ipAddress,
        userAgent,
        correlationId
      );
      
      const result = await adapter.getAuthUrl(redirectUrl, state);
      
      return result;
    } catch (error) {
      console.error(`[IntegrationsService] OAuth initiation failed`, {
        provider,
        userId,
        correlationId,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      
      // Audit log OAuth failure
      await auditLogger.logOAuthFailed(
        userId,
        provider,
        (error as Error).message,
        ipAddress,
        userAgent,
        correlationId
      );
      
      if ((error as IntegrationsServiceError).code) {
        throw error;
      }
      
      throw this.createError(
        'OAUTH_INIT_ERROR',
        `Failed to initiate OAuth flow: ${(error as Error).message}`,
        provider
      );
    }
  }

  /**
   * Handle OAuth callback with comprehensive state validation
   * 
   * Validates state parameter using CSRF protection to prevent attacks.
   * Implements retry logic for network failures and comprehensive audit logging.
   * 
   * @param provider - OAuth provider
   * @param code - Authorization code from OAuth provider
   * @param state - State parameter (HMAC-signed with user ID and timestamp)
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   * @returns User ID and account ID
   * @throws IntegrationsServiceError with codes:
   *   - INVALID_STATE: State parameter is malformed or invalid
   *   - OAUTH_CALLBACK_ERROR: General callback processing error
   *   - NETWORK_ERROR: Network failure (retryable)
   */
  async handleOAuthCallback(
    provider: Provider,
    code: string,
    state: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ userId: number; accountId: string }> {
    const startTime = Date.now();
    const correlationId = `callback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Declare stateValidation outside try block so it's accessible in catch
    let stateValidation: ReturnType<typeof csrfProtection.validateState> | undefined;
    
    try {
      // Validate state parameter using CSRF protection
      stateValidation = csrfProtection.validateState(state, provider);
      
      if (!stateValidation.valid) {
        console.warn(`[IntegrationsService] State validation failed`, {
          provider,
          error: stateValidation.error,
          errorCode: stateValidation.errorCode,
          correlationId,
        });
        
        // Audit log CSRF validation failure
        await auditLogger.logInvalidStateDetected(
          provider,
          stateValidation.error || 'Unknown error',
          ipAddress,
          userAgent,
          correlationId
        );
        
        throw this.createError(
          'INVALID_STATE',
          stateValidation.error || 'State validation failed',
          provider,
          { errorCode: stateValidation.errorCode }
        );
      }
      
      const userId = stateValidation.userId!;
      
      console.log(`[IntegrationsService] State validation passed`, {
        provider,
        userId,
        correlationId,
      });

      const adapter = this.getAdapter(provider);
      
      // Exchange code for tokens with retry logic
      const tokens = await this.retryWithBackoff(
        () => adapter.exchangeCodeForToken(code),
        3,
        'Token exchange'
        correlationId
       string };
      
      // Get user profile with retry logic
      const profile = await this.retryWithBackoff(
        ()
        3,
        'Profile fetch',
      
      ) as { providerAccountIdny> };d<string, a: Recora?tadatg; mein: strlationId  corre
      
      // Calculate expiry date
      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;
      
      // Encrypt tokens
      const encryptedAccessToken = encryptToken(tokens.accessToken);
      const encryptedRefreshToken = tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : null;
      
      // Store in database (upsert to handle reconnections)
      const account = await prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        create: {
          userId,
          provider,
          providerAccountId: profile.providerAccountId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          tokenType: tokens.tokenType || 'Bearer',
          scope: tokens.scope || null,
          metadata: profile.metadata || {},
        },
        update: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          tokenType: tokens.tokenType || 'Bearer',
          scope: tokens.scope || null,
          metadata: profile.metadata || {},
          updatedAt: new Date(),
        },
      });
      
      console.log(`[IntegrationsService] OAuth callback completed`, {
        provider,
        userId,
        accountId: account.providerAccountId,
        correlationId,
        duration: Date.now() - startTime,
      });
      
      // Audit log OAuth completion
      await auditLogger.logOAuthCompleted(
        userId,
        provider,
        account.providerAccountId,
        ipAddress,
        userAgent,
        correlationId
      );
      
      // Invalidate cache after connecting new integration
      integrationCache.invalidate(userId);
      
      return {
        userId,
        accountId: account.providerAccountId,
      };
    } catch (error) {
      console.error(`[IntegrationsService] OAuth callback failed`, {
        provider,
        error: (error as Error).message,
        code: (error as IntegrationsServiceError).code,
        correlationId,
        duration: Date.now() - startTime,
      });
      
      // Audit log OAuth failure (if we have user ID)
      if (stateValidation?.userId) {
        await auditLogger.logOAuthFailed(
          stateValidation.userId,
          provider,
          (error as Error).message,
          ipAddress,
          userAgent,
          correlationId
        );
      }
      
      // Re-throw if already a service error
      if ((error as IntegrationsServiceError).code) {
        throw error;
      }
      
      throw this.createError(
        'OAUTH_CALLBACK_ERROR',
        `Failed to handle OAuth callback: ${(error as Error).message}`,
        provider
      );
    }
  }
  
  /**
   * Retry a function with exponential backoff
   * 
   * Implements comprehensive retry strategy with:
   * - Exponential backoff (100ms, 200ms, 400ms, 800ms)
   * - Network error detection
   * - HTTP status code handling (429, 502, 503, 504)
   * - Structured logging with correlation IDs
   * - Type-safe error handling
   * 
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param operation - Operation name for logging
   * @param correlationId - Optional correlation ID for tracking
   * @returns Result of the function
   * @throws Last error if all retries fail
   * 
   * @example
   * ```typescript
   * const result = await this.retryWithBackoff(
   *   () => adapter.exchangeCodeForToken(code),
   *   3,
   *   'Token exchange',
   *   'oauth-123-abc'
   * );
   * ```
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    operation: string,
    correlationId?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    const retryCorrelationId = correlationId || `retry-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        
        // Log successful retry if not first attempt
        if (attempt > 1) {
          console.log(`[IntegrationsService] ${operation} succeeded after retry`, {
            operation,
            attempt,
            correlationId: retryCorrelationId,
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Extract error details safely
        const errorMessage = lastError?.message || '';
        const errorCode = (lastError as any)?.code || '';
        const errorStatus = (lastError as any)?.status || (lastError as any)?.statusCode || 0;
        
        // Check if error is retryable
        const isNetworkError = 
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ENETUNREACH') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ENOTFOUND' ||
          errorCode === 'ENETUNREACH';
        
        const isRetryableHttpStatus = 
          errorStatus === 429 || // Rate limit
          errorStatus === 502 || // Bad gateway
          errorStatus === 503 || // Service unavailable
          errorStatus === 504;   // Gateway timeout
        
        const isRetryable = isNetworkError || isRetryableHttpStatus;
        
        // If not retryable or last attempt, throw
        if (!isRetryable || attempt === maxRetries) {
          console.error(`[IntegrationsService] ${operation} failed permanently`, {
            operation,
            attempt,
            maxRetries,
            error: errorMessage,
            errorCode,
            errorStatus,
            isRetryable,
            correlationId: retryCorrelationId,
          });
          throw lastError;
        }
        
        // Calculate exponential backoff with jitter
        const baseDelay = 100 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 100; // Add 0-100ms jitter
        const delay = Math.min(baseDelay + jitter, 5000); // Cap at 5 seconds
        
        console.warn(`[IntegrationsService] ${operation} failed, retrying`, {
          operation,
          attempt,
          maxRetries,
          nextAttempt: attempt + 1,
          delay: Math.round(delay),
          error: errorMessage,
          errorCode,
          errorStatus,
          isNetworkError,
          isRetryableHttpStatus,
          correlationId: retryCorrelationId,
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error(`${operation} failed after ${maxRetries} retries`);
  }

  /**
   * Refresh an expired token with retry logic and exponential backoff
   * 
   * Implements automatic token refresh with:
   * - Exponential backoff retry strategy
   * - Graceful error handling
   * - Connection preservation
   * 
   * Requirements: 8.1, 8.2, 8.3
   * 
   * @param provider - OAuth provider
   * @param accountId - Provider account ID
   * @param options - Refresh options
   * @returns Updated integration with new token
   * @throws IntegrationsServiceError with codes:
   *   - ACCOUNT_NOT_FOUND: Integration not found
   *   - NO_REFRESH_TOKEN: No refresh token available
   *   - TOKEN_REFRESH_ERROR: Refresh failed after retries
   */
  async refreshToken(
    provider: Provider,
    accountId: string,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
    } = {}
  ): Promise<Integration> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries ?? 3;
    const initialDelay = options.initialDelay ?? 1000;
    const maxDelay = options.maxDelay ?? 10000;
    
    let lastError: Error | null = null;
    
    try {
      // Get account from database
      const account = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: accountId,
          },
        },
      });
      
      if (!account) {
        throw this.createError('ACCOUNT_NOT_FOUND', 'Integration not found', provider);
      }
      
      if (!account.refreshToken) {
        throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available', provider);
      }
      
      const adapter = this.getAdapter(provider);
      
      // Decrypt refresh token
      const refreshToken = decryptToken(account.refreshToken);
      
      // Retry token refresh with exponential backoff
      let tokens;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[IntegrationsService] Refreshing token`, {
            provider,
            accountId,
            attempt,
            maxRetries,
          });
          
          // Refresh the token
          tokens = await adapter.refreshAccessToken(refreshToken);
          
          console.log(`[IntegrationsService] Token refresh succeeded`, {
            provider,
            accountId,
            attempt,
            duration: Date.now() - startTime,
          });
          
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error as Error;
          
          console.warn(`[IntegrationsService] Token refresh attempt failed`, {
            provider,
            accountId,
            attempt,
            maxRetries,
            error: lastError.message,
          });
          
          // Check if error is retryable
          const errorMessage = lastError?.message || '';
          const isRetryable = 
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ETIMEDOUT') ||
            errorMessage.includes('ENOTFOUND') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('503') ||
            errorMessage.includes('502') ||
            errorMessage.includes('429');
          
          // If not retryable or last attempt, throw
          if (!isRetryable || attempt === maxRetries) {
            throw lastError;
          }
          
          // Calculate exponential backoff delay
          const delay = Math.min(
            initialDelay * Math.pow(2, attempt - 1),
            maxDelay
          );
          
          console.log(`[IntegrationsService] Retrying token refresh`, {
            provider,
            accountId,
            attempt,
            nextAttempt: attempt + 1,
            delay,
          });
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!tokens) {
        throw lastError || new Error('Token refresh failed');
      }
      
      // Calculate new expiry
      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : null;
      
      // Encrypt new tokens
      const encryptedAccessToken = encryptToken(tokens.accessToken);
      const encryptedRefreshToken = tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : account.refreshToken; // Keep old refresh token if new one not provided
      
      // Update in database
      const updatedAccount = await prisma.oAuthAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          updatedAt: new Date(),
        },
      });
      
      console.log(`[IntegrationsService] Token refresh completed`, {
        provider,
        accountId,
        duration: Date.now() - startTime,
      });
      
      // Generate correlation ID for audit logging
      const auditCorrelationId = `refresh-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Audit log token refresh
      await auditLogger.logTokenRefreshed(
        account.userId,
        provider,
        accountId,
        auditCorrelationId
      );
      
      // Invalidate cache after token refresh
      integrationCache.invalidate(account.userId);
      
      // Return updated integration
      return {
        provider: updatedAccount.provider as Provider,
        providerAccountId: updatedAccount.providerAccountId,
        isConnected: true,
        status: 'connected',
        expiresAt: updatedAccount.expiresAt || undefined,
        metadata: updatedAccount.metadata as Record<string, any> | undefined,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      };
    } catch (error) {
      console.error(`[IntegrationsService] Token refresh failed`, {
        provider,
        accountId,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      
      // Audit log token refresh failure (if we have account)
      const auditCorrelationId = `refresh-fail-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      try {
        const failedAccount = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider,
              providerAccountId: accountId,
            },
          },
        });
        
        if (failedAccount) {
          await auditLogger.logTokenRefreshFailed(
            failedAccount.userId,
            provider,
            accountId,
            (error as Error).message,
            auditCorrelationId
          );
        }
      } catch (auditError) {
        console.error('[IntegrationsService] Failed to log token refresh failure', auditError);
      }
      
      // Re-throw if already a service error
      if ((error as IntegrationsServiceError).code) {
        throw error;
      }
      
      throw this.createError(
        'TOKEN_REFRESH_ERROR',
        `Failed to refresh token: ${(error as Error).message}`,
        provider,
        {
          accountId,
          attempts: maxRetries,
          duration: Date.now() - startTime,
        }
      );
    }
  }
  
  /**
   * Check if token needs refresh (within 5 minutes of expiry)
   * 
   * @param expiresAt - Token expiry date
   * @returns True if token should be refreshed
   */
  shouldRefreshToken(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    
    // Refresh if token expires within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return new Date().getTime() + fiveMinutes >= expiresAt.getTime();
  }
  
  /**
   * Automatically refresh token if needed before returning access token
   * 
   * This method implements automatic token refresh logic that:
   * - Detects when tokens are expired or about to expire
   * - Automatically refreshes tokens transparently
   * - Preserves the connection without user intervention
   * 
   * Requirements: 8.1, 8.2
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param accountId - Provider account ID
   * @returns Decrypted access token
   */
  async getAccessTokenWithAutoRefresh(
    userId: number,
    provider: Provider,
    accountId: string
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const account = await prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
          providerAccountId: accountId,
        },
      });
      
      if (!account) {
        throw this.createError('ACCOUNT_NOT_FOUND', 'Integration not found', provider);
      }
      
      if (!account.accessToken) {
        throw this.createError('NO_ACCESS_TOKEN', 'No access token available', provider);
      }
      
      // Check if token needs refresh
      if (this.shouldRefreshToken(account.expiresAt)) {
        console.log(`[IntegrationsService] Token needs refresh`, {
          provider,
          accountId,
          expiresAt: account.expiresAt,
        });
        
        // Try to refresh if refresh token available
        if (account.refreshToken) {
          try {
            await this.refreshToken(provider, accountId);
            
            // Fetch updated account
            const updatedAccount = await prisma.oAuthAccount.findFirst({
              where: {
                userId,
                provider,
                providerAccountId: accountId,
              },
            });
            
            console.log(`[IntegrationsService] Auto-refresh succeeded`, {
              provider,
              accountId,
              duration: Date.now() - startTime,
            });
            
            return decryptToken(updatedAccount!.accessToken!);
          } catch (error) {
            console.error(`[IntegrationsService] Auto-refresh failed`, {
              provider,
              accountId,
              error: (error as Error).message,
            });
            
            // If refresh fails, throw TOKEN_EXPIRED to prompt reconnection
            throw this.createError(
              'TOKEN_EXPIRED',
              'Token expired and refresh failed. Please reconnect.',
              provider
            );
          }
        } else {
          throw this.createError(
            'TOKEN_EXPIRED',
            'Token expired and no refresh token available',
            provider
          );
        }
      }
      
      return decryptToken(account.accessToken);
    } catch (error) {
      if ((error as IntegrationsServiceError).code) {
        throw error;
      }
      throw this.createError(
        'GET_TOKEN_ERROR',
        `Failed to get access token: ${(error as Error).message}`,
        provider
      );
    }
  }

  /**
   * Disconnect an integration
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param accountId - Provider account ID
   * @param ipAddress - Client IP address for audit logging
   * @param userAgent - Client user agent for audit logging
   */
  async disconnectIntegration(
    userId: number,
    provider: Provider,
    accountId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const correlationId = `disconnect-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      // Get account from database
      const account = await prisma.oAuthAccount.findFirst({
        where: {
          userId,
          provider,
          providerAccountId: accountId,
        },
      });
      
      if (!account) {
        throw this.createError('ACCOUNT_NOT_FOUND', 'Integration not found', provider);
      }
      
      // Try to revoke access on the platform
      if (account.accessToken) {
        try {
          const adapter = this.getAdapter(provider);
          const accessToken = decryptToken(account.accessToken);
          await adapter.revokeAccess(accessToken);
        } catch (error) {
          // Log but don't fail - we'll delete locally anyway
          console.warn(`Failed to revoke access for ${provider}:`, error);
        }
      }
      
      // Delete from database (ensures all credentials are removed per requirement 11.5)
      await prisma.oAuthAccount.delete({
        where: { id: account.id },
      });
      
      // Audit log disconnection
      await auditLogger.logIntegrationDisconnected(
        userId,
        provider,
        accountId,
        ipAddress,
        userAgent,
        correlationId
      );
      
      // Invalidate cache after disconnection
      integrationCache.invalidate(userId);
      
      console.log(`[IntegrationsService] Integration disconnected`, {
        provider,
        userId,
        accountId,
        correlationId,
      });
    } catch (error) {
      if ((error as IntegrationsServiceError).code === 'ACCOUNT_NOT_FOUND') {
        throw error;
      }
      throw this.createError(
        'DISCONNECT_ERROR',
        `Failed to disconnect integration: ${(error as Error).message}`,
        provider
      );
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() >= expiresAt;
  }

  /**
   * Get decrypted access token for an integration
   * 
   * This method uses automatic token refresh to ensure tokens are valid.
   * Use this method when you need an access token for API calls.
   * 
   * @param userId - User ID
   * @param provider - OAuth provider
   * @param accountId - Provider account ID
   * @returns Decrypted access token
   */
  async getAccessToken(userId: number, provider: Provider, accountId: string): Promise<string> {
    return this.getAccessTokenWithAutoRefresh(userId, provider, accountId);
  }

  /**
   * Batch refresh multiple tokens
   * 
   * Implements request batching to reduce database load when refreshing
   * multiple tokens simultaneously.
   * 
   * Requirements: 10.2
   * 
   * @param requests - Array of refresh requests
   * @returns Array of updated integrations
   */
  async batchRefreshTokens(
    requests: Array<{ provider: Provider; accountId: string }>
  ): Promise<Integration[]> {
    // Process in batches of 5 to avoid overwhelming the database
    const batchSize = 5;
    const results: Integration[] = [];
    
    console.log(`[IntegrationsService] Batch refreshing ${requests.length} tokens`, {
      batchSize,
      totalBatches: Math.ceil(requests.length / batchSize),
    });
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      console.log(`[IntegrationsService] Processing batch ${Math.floor(i / batchSize) + 1}`, {
        batchStart: i,
        batchEnd: i + batch.length,
      });
      
      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(req => this.refreshToken(req.provider, req.accountId))
      );
      
      // Collect successful results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`[IntegrationsService] Token refresh failed in batch`, {
            error: result.reason,
          });
        }
      }
    }
    
    console.log(`[IntegrationsService] Batch refresh completed`, {
      total: requests.length,
      successful: results.length,
      failed: requests.length - results.length,
    });
    
    return results;
  }
}

// Export singleton instance
export const integrationsService = new IntegrationsService();
