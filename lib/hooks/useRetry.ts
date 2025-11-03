'use client';

import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onError?: (error: Error, attempt: number) => void;
  onSuccess?: () => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    onError,
    onSuccess
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    setIsRetrying(true);
    setError(null);

    for (let i = 0; i < maxAttempts; i++) {
      try {
        setAttempt(i + 1);
        const result = await asyncFunction();
        setIsRetrying(false);
        setAttempt(0);
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error, i + 1);

        // If this was the last attempt, throw the error
        if (i === maxAttempts - 1) {
          setIsRetrying(false);
          throw error;
        }

        // Wait before retrying
        const delay = exponentialBackoff 
          ? delayMs * Math.pow(2, i)
          : delayMs;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsRetrying(false);
    return null;
  }, [asyncFunction, maxAttempts, delayMs, exponentialBackoff, onError, onSuccess]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttempt(0);
    setError(null);
  }, []);

  return {
    execute,
    reset,
    isRetrying,
    attempt,
    error,
    canRetry: attempt < maxAttempts
  };
}

// Helper hook for auto-retry on mount
export function useAutoRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const retry = useRetry(asyncFunction, options);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await retry.execute();
      setData(result);
    } catch (error) {
      console.error('Auto-retry failed:', error);
    } finally {
      setLoading(false);
    }
  }, [retry]);

  return {
    data,
    loading,
    error: retry.error,
    retry: load,
    ...retry
  };
}
