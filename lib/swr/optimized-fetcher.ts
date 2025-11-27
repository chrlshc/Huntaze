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
  
  const fetcher = async (url: string) => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        const error: any = new Error('An error occurred while fetching the data.');
        error.status = response.status;
        throw error;
      }
      
      return response.json();
    } catch (error: any) {
      // Don't throw on abort - this is expected behavior
      if (error.name === 'AbortError') {
        console.log(`[SWR] Request cancelled: ${url}`);
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
