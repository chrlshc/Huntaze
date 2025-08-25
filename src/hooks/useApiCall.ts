import { useState, useCallback } from 'react';
import { createError, getErrorCodeFromStatus, shouldRetry, getRetryDelay } from '@/lib/errors';
import type { AppError } from '@/lib/errors';

interface UseApiCallOptions {
  maxRetries?: number;
  onError?: (error: AppError) => void;
  onSuccess?: (data: any) => void;
}

export function useApiCall<T = any>(options: UseApiCallOptions = {}) {
  const { maxRetries = 3, onError, onSuccess } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    url: string,
    fetchOptions: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    let lastError: AppError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          lastError = createError(
            getErrorCodeFromStatus(response.status),
            errorData,
            response.status
          );

          if (!shouldRetry(lastError) || attempt === maxRetries) {
            throw lastError;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
          continue;
        }

        const result = await response.json();
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        return result;

      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err) {
          lastError = err as AppError;
        } else if (err instanceof Error) {
          lastError = createError(
            'NETWORK_ERROR',
            { originalError: err.message }
          );
        } else {
          lastError = createError('SERVER_ERROR');
        }

        if (!shouldRetry(lastError) || attempt === maxRetries) {
          setError(lastError);
          setLoading(false);
          onError?.(lastError);
          return null;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, getRetryDelay(attempt)));
      }
    }

    return null;
  }, [maxRetries, onError, onSuccess]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}

// Specific hooks for common API calls
export function useStripeCheckout() {
  return useApiCall({
    maxRetries: 2,
    onError: (error) => {
      console.error('Stripe checkout error:', error);
    },
  });
}

export function useOnboardingSubmit() {
  return useApiCall({
    maxRetries: 1,
    onError: (error) => {
      console.error('Onboarding error:', error);
    },
  });
}