/**
 * Optimized Fetcher with Request Cancellation
 * 
 * Provides a fetcher function that supports AbortController for
 * request cancellation on component unmount.
 * 
 * Requirements: 3.5
 */

/**
 * Create a fetcher with AbortController support
 * Returns both the fetcher function and abort controller
 */
export function createCancellableFetcher() {
  const abortController = new AbortController();

  const redirectToLoginForExpiredSession = () => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname.startsWith('/auth/login')) return;
    const callbackUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/auth/login?error=session_expired&callbackUrl=${callbackUrl}`;
  };
  
  const fetcher = async (url: string) => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
      });

      if (response.status === 401) {
        redirectToLoginForExpiredSession();
        const error: any = new Error('Unauthorized');
        error.status = 401;
        throw error;
      }
      
      if (!response.ok) {
        const error: any = new Error('An error occurred while fetching the data.');
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    } catch (error: any) {
      // Don't throw on abort - this is expected behavior
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
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
  const response = await fetch(url);

  if (response.status === 401 && typeof window !== 'undefined') {
    if (!window.location.pathname.startsWith('/auth/login')) {
      const callbackUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = `/auth/login?error=session_expired&callbackUrl=${callbackUrl}`;
    }
    const error: any = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }
  
  if (!response.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * Fetcher with custom options
 */
export function createFetcherWithOptions(options: RequestInit = {}) {
  return async (url: string) => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error: any = new Error('An error occurred while fetching the data.');
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  };
}

/**
 * POST fetcher for mutations
 */
export const postFetcher = async (url: string, data: any) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error: any = new Error('An error occurred while posting the data.');
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};
