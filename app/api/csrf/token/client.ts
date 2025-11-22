/**
 * CSRF Token API Client
 * 
 * Optimized client utilities for fetching and managing CSRF tokens.
 * Includes retry logic, caching, and automatic refresh.
 * 
 * @module app/api/csrf/token/client
 */

'use client';

import type {
  CsrfTokenResponse,
  CsrfTokenFetchResult,
  CsrfTokenRequestOptions,
  CsrfTokenErrorCode,
} from './types';
import {
  CsrfTokenError,
  isCsrfTokenSuccess,
  isRetryableError,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second
const RETRY_MAX_DELAY = 5000; // 5 seconds
const RETRY_BACKOFF_FACTOR = 2;

// Token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Check if error is retryable
 */
function shouldRetry(error: any, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  // Network errors
  if (error.name === 'TypeError' || error.name === 'NetworkError') {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }

  // HTTP 5xx errors
  if (error.status && error.status >= 500) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt: number): number {
  const delay = RETRY_BASE_DELAY * Math.pow(RETRY_BACKOFF_FACTOR, attempt - 1);
  return Math.min(delay, RETRY_MAX_DELAY);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Token Fetching
// ============================================================================

/**
 * Fetch CSRF token from API with retry logic
 * 
 * @param options - Request options
 * @returns Token fetch result
 * @throws CsrfTokenError on failure
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await fetchCsrfToken({ timeout: 5000 });
 *   console.log('Token:', result.token);
 * } catch (error) {
 *   if (error instanceof CsrfTokenError) {
 *     console.error('Error:', error.code, error.message);
 *   }
 * }
 * ```
 */
export async function fetchCsrfToken(
  options: CsrfTokenRequestOptions = {}
): Promise<CsrfTokenFetchResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    signal,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      const combinedSignal = signal
        ? combineAbortSignals([signal, controller.signal])
        : controller.signal;

      const startTime = Date.now();

      // Fetch token
      const response = await fetch('/api/csrf/token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new CsrfTokenError(
          response.status === 401
            ? 'UNAUTHORIZED' as CsrfTokenErrorCode
            : 'INTERNAL_ERROR' as CsrfTokenErrorCode,
          errorData.error?.message || `HTTP ${response.status}`,
          response.status >= 500,
          errorData.error?.retryAfter
        );
      }

      // Parse response
      const data: CsrfTokenResponse = await response.json();

      // Validate response format
      if (!isCsrfTokenSuccess(data)) {
        throw new CsrfTokenError(
          'INVALID_RESPONSE' as CsrfTokenErrorCode,
          'Invalid response format from server',
          false
        );
      }

      const duration = Date.now() - startTime;
      const expiresAt = Date.now() + data.data.expiresIn;

      // Cache token
      cachedToken = data.data.token;
      tokenExpiresAt = expiresAt;

      return {
        token: data.data.token,
        expiresAt,
        duration,
      };

    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (shouldRetry(error, attempt, maxRetries)) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `CSRF token fetch failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
          error.message
        );
        await sleep(delay);
        continue;
      }

      // No more retries, throw error
      break;
    }
  }

  // All retries exhausted
  if (lastError instanceof CsrfTokenError) {
    throw lastError;
  }

  throw new CsrfTokenError(
    'NETWORK_ERROR' as CsrfTokenErrorCode,
    lastError?.message || 'Failed to fetch CSRF token',
    false
  );
}

/**
 * Get cached CSRF token or fetch new one
 * 
 * @param options - Request options
 * @returns Token string
 * @throws CsrfTokenError on failure
 * 
 * @example
 * ```typescript
 * const token = await getCsrfToken();
 * // Use token in request headers
 * ```
 */
export async function getCsrfToken(
  options: CsrfTokenRequestOptions = {}
): Promise<string> {
  // Check if cached token is still valid
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // Fetch new token
  const result = await fetchCsrfToken(options);
  return result.token;
}

/**
 * Refresh CSRF token (force fetch new token)
 * 
 * @param options - Request options
 * @returns Token fetch result
 * @throws CsrfTokenError on failure
 * 
 * @example
 * ```typescript
 * const result = await refreshCsrfToken();
 * console.log('New token:', result.token);
 * ```
 */
export async function refreshCsrfToken(
  options: CsrfTokenRequestOptions = {}
): Promise<CsrfTokenFetchResult> {
  // Clear cache
  cachedToken = null;
  tokenExpiresAt = null;

  // Fetch new token
  return await fetchCsrfToken(options);
}

/**
 * Check if cached token is valid
 * 
 * @returns True if cached token exists and is not expired
 * 
 * @example
 * ```typescript
 * if (!isCsrfTokenValid()) {
 *   await refreshCsrfToken();
 * }
 * ```
 */
export function isCsrfTokenValid(): boolean {
  return !!(cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt);
}

/**
 * Clear cached CSRF token
 * 
 * @example
 * ```typescript
 * clearCsrfToken(); // Clear on logout
 * ```
 */
export function clearCsrfToken(): void {
  cachedToken = null;
  tokenExpiresAt = null;
}

/**
 * Get cached token without fetching
 * 
 * @returns Cached token or null
 * 
 * @example
 * ```typescript
 * const token = getCachedCsrfToken();
 * if (!token) {
 *   await getCsrfToken(); // Fetch if not cached
 * }
 * ```
 */
export function getCachedCsrfToken(): string | null {
  if (isCsrfTokenValid()) {
    return cachedToken;
  }
  return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combine multiple abort signals
 */
function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener('abort', () => controller.abort(), {
      once: true,
    });
  }

  return controller.signal;
}

/**
 * Create a fetch wrapper with CSRF token
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch response
 * 
 * @example
 * ```typescript
 * const response = await fetchWithCsrf('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' }),
 * });
 * ```
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token
  const token = await getCsrfToken();

  // Add token to headers
  const headers = new Headers(options.headers);
  headers.set('X-CSRF-Token', token);

  // Make request
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

// ============================================================================
// React Hook Support
// ============================================================================

/**
 * CSRF token manager for React hooks
 */
export class CsrfTokenManager {
  private token: string | null = null;
  private expiresAt: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Get current token or fetch new one
   */
  async getToken(): Promise<string> {
    if (this.isValid()) {
      return this.token!;
    }

    const result = await fetchCsrfToken();
    this.setToken(result.token, result.expiresAt);
    return result.token;
  }

  /**
   * Refresh token
   */
  async refresh(): Promise<void> {
    const result = await refreshCsrfToken();
    this.setToken(result.token, result.expiresAt);
  }

  /**
   * Check if token is valid
   */
  isValid(): boolean {
    return !!(this.token && this.expiresAt && Date.now() < this.expiresAt);
  }

  /**
   * Clear token
   */
  clear(): void {
    this.token = null;
    this.expiresAt = null;
    this.stopAutoRefresh();
    this.notifyListeners();
  }

  /**
   * Subscribe to token changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Set token and start auto-refresh
   */
  private setToken(token: string, expiresAt: number): void {
    this.token = token;
    this.expiresAt = expiresAt;
    this.startAutoRefresh();
    this.notifyListeners();
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    if (!this.expiresAt) return;

    // Refresh 5 minutes before expiry
    const refreshTime = this.expiresAt - Date.now() - 5 * 60 * 1000;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refresh().catch(console.error);
      }, refreshTime);
    }
  }

  /**
   * Stop auto-refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Export singleton instance
export const csrfTokenManager = new CsrfTokenManager();
