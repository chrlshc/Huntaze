/**
 * Client-Side CSRF Token Utilities
 * 
 * Provides utilities for managing CSRF tokens in client-side code.
 * Automatically fetches and includes CSRF tokens in API requests.
 * 
 * Requirements: 16.5
 * 
 * Usage:
 * ```typescript
 * import { fetchWithCsrf, getCsrfToken } from '@/lib/utils/csrf-client';
 * 
 * // Automatic CSRF token handling
 * const response = await fetchWithCsrf('/api/auth/register', {
 *   method: 'POST',
 *   body: JSON.stringify({ email, password }),
 * });
 * 
 * // Manual token retrieval
 * const token = await getCsrfToken();
 * ```
 */

'use client';

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('csrf-client');

/**
 * In-memory CSRF token cache
 */
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Fetch a new CSRF token from the server
 * 
 * @returns CSRF token string
 * @throws Error if token fetch fails
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include', // Include cookies
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.token) {
      throw new Error('CSRF token not found in response');
    }
    
    // Cache token with expiry
    cachedToken = data.token;
    tokenExpiry = Date.now() + (data.expiresIn || 3600000); // Default 1 hour
    
    logger.info('CSRF token fetched', {
      tokenLength: data.token.length,
      expiresIn: data.expiresIn,
    });
    
    return data.token;
  } catch (error) {
    logger.error('Failed to fetch CSRF token', error as Error);
    throw error;
  }
}

/**
 * Get CSRF token (from cache or fetch new)
 * 
 * @param forceRefresh - Force fetch a new token even if cached
 * @returns CSRF token string
 */
export async function getCsrfToken(forceRefresh = false): Promise<string> {
  // Check if cached token is still valid
  if (!forceRefresh && cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    logger.info('Using cached CSRF token');
    return cachedToken;
  }
  
  // Fetch new token
  logger.info('Fetching new CSRF token', { forceRefresh });
  return fetchCsrfToken();
}

/**
 * Clear cached CSRF token
 * 
 * Call this after logout or when token is invalidated.
 */
export function clearCsrfToken(): void {
  cachedToken = null;
  tokenExpiry = null;
  logger.info('CSRF token cache cleared');
}

/**
 * Fetch with automatic CSRF token handling
 * 
 * This is a wrapper around the native fetch API that automatically
 * includes CSRF tokens in POST/PUT/DELETE/PATCH requests.
 * 
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch response
 * 
 * @example
 * ```typescript
 * const response = await fetchWithCsrf('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password }),
 * });
 * ```
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF token for state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    try {
      // Get CSRF token
      const token = await getCsrfToken();
      
      // Add token to headers
      const headers = new Headers(options.headers);
      headers.set('x-csrf-token', token);
      
      // Make request with CSRF token
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });
      
      // Check if token expired and retry once
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.shouldRefresh || errorData.errorCode === 'EXPIRED_TOKEN') {
          logger.warn('CSRF token expired, refreshing and retrying', {
            url,
            method,
          });
          
          // Fetch new token and retry
          const newToken = await getCsrfToken(true);
          headers.set('x-csrf-token', newToken);
          
          return fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      }
      
      return response;
    } catch (error) {
      logger.error('Failed to fetch with CSRF token', error as Error, {
        url,
        method,
      });
      throw error;
    }
  }
  
  // For GET requests, just pass through
  return fetch(url, options);
}

/**
 * React hook for CSRF token
 * 
 * @returns CSRF token string or null if not loaded
 * 
 * @example
 * ```typescript
 * function MyForm() {
 *   const csrfToken = useCsrfToken();
 *   
 *   return (
 *     <form>
 *       <input type="hidden" name="csrfToken" value={csrfToken || ''} />
 *       <div>form fields...</div>
 *     </form>
 *   );
 * }
 * ```
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    getCsrfToken()
      .then(setToken)
      .catch((error) => {
        logger.error('Failed to load CSRF token', error);
      });
  }, []);
  
  return token;
}

// Re-export React for the hook
import * as React from 'react';
