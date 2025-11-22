/**
 * useCsrfToken Hook
 * 
 * React hook for managing CSRF tokens with automatic refresh and caching.
 * 
 * @module hooks/useCsrfToken
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  csrfTokenManager,
  CsrfTokenError,
} from '@/app/api/csrf/token/client';
import type { CsrfTokenState } from '@/app/api/csrf/token/types';

/**
 * Hook options
 */
export interface UseCsrfTokenOptions {
  /** Whether to fetch token on mount */
  fetchOnMount?: boolean;
  /** Whether to auto-refresh before expiry */
  autoRefresh?: boolean;
  /** Callback on token change */
  onTokenChange?: (token: string | null) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * React hook for CSRF token management
 * 
 * Features:
 * - Automatic token fetching on mount
 * - Token caching and reuse
 * - Auto-refresh before expiry
 * - Error handling with retry
 * - Loading states
 * 
 * @param options - Hook options
 * @returns CSRF token state and actions
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { token, isLoading, error, refresh } = useCsrfToken();
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   async function handleSubmit(data: any) {
 *     const response = await fetch('/api/endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'X-CSRF-Token': token!,
 *       },
 *       body: JSON.stringify(data),
 *     });
 *   }
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCsrfToken(
  options: UseCsrfTokenOptions = {}
): CsrfTokenState {
  const {
    fetchOnMount = true,
    autoRefresh = true,
    onTokenChange,
    onError,
  } = options;

  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const isMountedRef = useRef(true);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);

  // Update refs
  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onErrorRef.current = onError;
  }, [onTokenChange, onError]);

  // Fetch token function
  const fetchToken = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const fetchedToken = await csrfTokenManager.getToken();

      if (!isMountedRef.current) return;

      setToken(fetchedToken);
      setExpiresAt(Date.now() + 3600000); // 1 hour
      onTokenChangeRef.current?.(fetchedToken);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof CsrfTokenError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to fetch CSRF token';

      setError(errorMessage);
      onErrorRef.current?.(
        err instanceof Error ? err : new Error(errorMessage)
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refresh token function
  const refresh = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      await csrfTokenManager.refresh();
      const newToken = await csrfTokenManager.getToken();

      if (!isMountedRef.current) return;

      setToken(newToken);
      setExpiresAt(Date.now() + 3600000); // 1 hour
      onTokenChangeRef.current?.(newToken);
    } catch (err) {
      if (!isMountedRef.current) return;

      const errorMessage =
        err instanceof CsrfTokenError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to refresh CSRF token';

      setError(errorMessage);
      onErrorRef.current?.(
        err instanceof Error ? err : new Error(errorMessage)
      );
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch token on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchToken();
    }
  }, [fetchOnMount, fetchToken]);

  // Subscribe to token manager changes
  useEffect(() => {
    const unsubscribe = csrfTokenManager.subscribe(() => {
      if (!isMountedRef.current) return;

      if (csrfTokenManager.isValid()) {
        csrfTokenManager.getToken().then((newToken) => {
          if (isMountedRef.current) {
            setToken(newToken);
            setExpiresAt(Date.now() + 3600000);
          }
        });
      } else {
        setToken(null);
        setExpiresAt(null);
      }
    });

    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    token,
    isLoading,
    error,
    expiresAt,
    refresh,
  };
}

/**
 * Hook for fetching CSRF token once and caching
 * Simpler version without auto-refresh
 * 
 * @returns Token, loading state, and error
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { token, isLoading, error } = useCsrfTokenOnce();
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return <div>Token: {token}</div>;
 * }
 * ```
 */
export function useCsrfTokenOnce() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchToken() {
      try {
        const fetchedToken = await csrfTokenManager.getToken();

        if (isMounted) {
          setToken(fetchedToken);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to fetch CSRF token';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return { token, isLoading, error };
}

/**
 * Hook for checking if CSRF token is valid
 * 
 * @returns Whether token is valid
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isValid = useCsrfTokenValid();
 * 
 *   return <div>Token valid: {isValid ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useCsrfTokenValid(): boolean {
  const [isValid, setIsValid] = useState(csrfTokenManager.isValid());

  useEffect(() => {
    const unsubscribe = csrfTokenManager.subscribe(() => {
      setIsValid(csrfTokenManager.isValid());
    });

    return unsubscribe;
  }, []);

  return isValid;
}
