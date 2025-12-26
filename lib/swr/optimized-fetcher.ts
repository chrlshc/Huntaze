/**
 * Optimized Fetcher with Request Cancellation
 * 
 * Provides a fetcher function that supports AbortController for
 * request cancellation on component unmount.
 * 
 * Requirements: 3.5
 */

import { internalApiFetch } from '@/lib/api/client/internal-api-client';

/**
 * Create a fetcher with AbortController support
 * Returns both the fetcher function and abort controller
 */
export function createCancellableFetcher() {
  const abortController = new AbortController();
  
  const fetcher = async (url: string) => {
    return internalApiFetch(url, { signal: abortController.signal });
  };
  
  return {
    fetcher,
    abort: () => abortController.abort(),
  };
}

/**
 * Standard fetcher without cancellation
 * Use this for simple cases where cancellation isn't needed
 */
export const standardFetcher = async (url: string) => {
  return internalApiFetch(url);
};

/**
 * Fetcher with custom options
 */
export function createFetcherWithOptions(options: RequestInit = {}) {
  return async (url: string) => {
    return internalApiFetch(url, options);
  };
}

/**
 * POST fetcher for mutations
 */
export const postFetcher = async (url: string, data: any) => {
  return internalApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  });
};
