'use client';

/**
 * CSRF Token Hook
 * 
 * Client-side React hook for managing CSRF tokens in forms.
 * Automatically fetches, caches, and refreshes CSRF tokens.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 * 
 * Features:
 * - Automatic token fetching on mount
 * - Token caching to avoid unnecessary requests
 * - Automatic refresh on expiration
 * - Retry logic for transient failures
 * - Loading and error states
 * 
 * Usage:
 * ```tsx
 * function MyForm() {
 *   const { token, loading, error, refresh } = useCsrfToken();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <form>
 *       <input type="hidden" name="csrfToken" value={token || ''} />
 *       // ... rest of form
 *     </form>
 *   );
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * CSRF token response from API
 */
interface CsrfTokenResponse {
  success: boolean;
  data?: {
    token: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/**
 * Hook return type
 */
export interface UseCsrfTokenReturn {
  /** Current CSRF token (null if not loaded yet) */
  token: string | null;
  /** Whether the token is currently being fetched */
  loading: boolean;
  /** Error that occurred during token fetch (null if no error) */
  error: Error | null;
  /** Manually refresh the token */
  refresh: () => Promise<void>;
}

/**
 * Configuration options
 */
interface UseCsrfTokenOptions {
  /** Whether to automatically fetch token on mount (default: true) */
  autoFetch?: boolean;
  /** Number of retry attempts for failed requests (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelay?: number;
  /** Whether to automatically refresh before expiration (default: true) */
  autoRefresh?: boolean;
  /** How long before expiration to refresh (in ms, default: 300000 = 5 minutes) */
  refreshBuffer?: number;
}

const DEFAULT_OPTIONS: Required<UseCsrfTokenOptions> = {
  autoFetch: true,
  maxRetries: 3,
  retryDelay: 1000,
  autoRefresh: true,
  refreshBuffer: 300000, // 5 minutes
};

/**
 * In-memory token cache shared across all hook instances
 * This prevents multiple components from fetching the same token
 */
let tokenCache: {
  token: string | null;
  expiresAt: number | null;
  fetchPromise: Promise<string> | null;
} = {
  token: null,
  expiresAt: null,
  fetchPromise: null,
};

/**
 * Fetch CSRF token from API with retry logic
 */
async function fetchCsrfToken(
  retryCount = 0,
  maxRetries = 3,
  retryDelay = 1000
): Promise<string> {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: CsrfTokenResponse = await response.json().catch(() => ({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          retryable: response.status >= 500,
        },
      }));

      const error = new Error(
        errorData.error?.message || `Failed to fetch CSRF token: ${response.statusText}`
      );
      (error as any).code = errorData.error?.code || 'FETCH_ERROR';
      (error as any).retryable = errorData.error?.retryable ?? (response.status >= 500);

      throw error;
    }

    const data: CsrfTokenResponse = await response.json();

    if (!data.success || !data.data?.token) {
      throw new Error('Invalid CSRF token response');
    }

    // Update cache
    tokenCache.token = data.data.token;
    tokenCache.expiresAt = Date.now() + data.data.expiresIn;
    tokenCache.fetchPromise = null;

    return data.data.token;
  } catch (error: any) {
    // Check if error is retryable
    const isRetryable = error.retryable ?? (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    );

    // Retry if possible
    if (isRetryable && retryCount < maxRetries) {
      const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchCsrfToken(retryCount + 1, maxRetries, retryDelay);
    }

    // Clear cache on error
    tokenCache.fetchPromise = null;

    throw error;
  }
}

/**
 * Get CSRF token from cache or fetch new one
 */
async function getCsrfToken(
  maxRetries: number,
  retryDelay: number
): Promise<string> {
  // Check if token is cached and not expired
  if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // Check if a fetch is already in progress
  if (tokenCache.fetchPromise) {
    return tokenCache.fetchPromise;
  }

  // Start new fetch
  tokenCache.fetchPromise = fetchCsrfToken(0, maxRetries, retryDelay);
  return tokenCache.fetchPromise;
}

/**
 * React hook for managing CSRF tokens
 * 
 * Automatically fetches and manages CSRF tokens for forms.
 * Handles caching, expiration, and automatic refresh.
 * 
 * @param options - Configuration options
 * @returns Token state and refresh function
 * 
 * @example
 * ```tsx
 * function SignupForm() {
 *   const { token, loading, error, refresh } = useCsrfToken();
 *   
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     
 *     if (!token) {
 *       alert('CSRF token not available. Please refresh the page.');
 *       return;
 *     }
 *     
 *     const response = await fetch('/api/signup', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'x-csrf-token': token,
 *       },
 *       body: JSON.stringify({ email, password }),
 *     });
 *     
 *     if (response.status === 403) {
 *       // Token expired, refresh and retry
 *       await refresh();
 *       // Retry submission...
 *     }
 *   };
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   if (error) {
 *     return (
 *       <div>
 *         <p>Failed to load security token. Please refresh the page.</p>
 *         <button onClick={refresh}>Retry</button>
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input type="hidden" name="csrfToken" value={token || ''} />
 *       // ... rest of form
 *     </form>
 *   );
 * }
 * ```
 */
export function useCsrfToken(
  options: UseCsrfTokenOptions = {}
): UseCsrfTokenReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [token, setToken] = useState<string | null>(tokenCache.token);
  const [loading, setLoading] = useState<boolean>(opts.autoFetch && !tokenCache.token);
  const [error, setError] = useState<Error | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Fetch and update token
   */
  const fetchToken = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const newToken = await getCsrfToken(opts.maxRetries, opts.retryDelay);
      
      if (!isMountedRef.current) return;

      setToken(newToken);
      setLoading(false);

      // Schedule auto-refresh if enabled
      if (opts.autoRefresh && tokenCache.expiresAt) {
        const timeUntilRefresh = tokenCache.expiresAt - Date.now() - opts.refreshBuffer;
        
        if (timeUntilRefresh > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            fetchToken();
          }, timeUntilRefresh);
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      setError(err);
      setLoading(false);
    }
  }, [opts.maxRetries, opts.retryDelay, opts.autoRefresh, opts.refreshBuffer]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    // Clear cache to force new fetch
    tokenCache.token = null;
    tokenCache.expiresAt = null;
    tokenCache.fetchPromise = null;

    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    await fetchToken();
  }, [fetchToken]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (opts.autoFetch) {
      // Check if we already have a valid cached token
      if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > Date.now()) {
        setToken(tokenCache.token);
        setLoading(false);
      } else {
        fetchToken();
      }
    }

    return () => {
      isMountedRef.current = false;
      
      // Clear refresh timeout on unmount
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [opts.autoFetch, fetchToken]);

  return {
    token,
    loading,
    error,
    refresh,
  };
}

/**
 * Clear the token cache
 * 
 * Useful for testing or when you want to force a fresh token fetch
 * across all components.
 */
export function clearCsrfTokenCache(): void {
  tokenCache.token = null;
  tokenCache.expiresAt = null;
  tokenCache.fetchPromise = null;
}

/**
 * Get the current cached token without triggering a fetch
 * 
 * Returns null if no token is cached or if it's expired.
 * Useful for checking token availability without side effects.
 */
export function getCachedCsrfToken(): string | null {
  if (tokenCache.token && tokenCache.expiresAt && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  return null;
}
