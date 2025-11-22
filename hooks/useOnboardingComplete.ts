/**
 * useOnboardingComplete Hook
 * 
 * React hook for completing user onboarding with automatic retry logic,
 * CSRF token management, and loading/error states.
 * 
 * Requirements: 5.4, 5.6, 5.9
 * 
 * @example
 * ```typescript
 * function OnboardingForm() {
 *   const { completeOnboarding, loading, error } = useOnboardingComplete();
 * 
 *   async function handleSubmit(data) {
 *     const result = await completeOnboarding(data);
 *     if (result.success) {
 *       router.push('/home');
 *     }
 *   }
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>{error}</div>}
 *       <button disabled={loading}>Complete</button>
 *     </form>
 *   );
 * }
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import { completeOnboarding as completeOnboardingClient } from '@/app/api/onboarding/complete/client';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import type {
  OnboardingCompleteRequest,
  OnboardingCompleteResponse,
  OnboardingCompleteSuccessData,
} from '@/app/api/onboarding/complete/types';

// ============================================================================
// Types
// ============================================================================

interface UseOnboardingCompleteReturn {
  /**
   * Complete onboarding with the provided data
   */
  completeOnboarding: (data: OnboardingCompleteRequest) => Promise<OnboardingCompleteResponse>;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error message (null if no error)
   */
  error: string | null;
  
  /**
   * Success data (null if not completed)
   */
  data: OnboardingCompleteSuccessData | null;
  
  /**
   * Reset error and data states
   */
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for completing user onboarding
 * 
 * Provides automatic CSRF token management, loading states, and error handling.
 * 
 * @returns Object with completeOnboarding function and state
 */
export function useOnboardingComplete(): UseOnboardingCompleteReturn {
  const { token: csrfToken, loading: csrfLoading } = useCsrfToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingCompleteSuccessData | null>(null);

  /**
   * Complete onboarding
   */
  const completeOnboarding = useCallback(
    async (requestData: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> => {
      // Reset state
      setError(null);
      setData(null);
      setLoading(true);

      try {
        // Wait for CSRF token if still loading
        if (csrfLoading) {
          console.warn('CSRF token still loading, waiting...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Call API client
        const result = await completeOnboardingClient(requestData, csrfToken || undefined);

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error.error);
          setData(null);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        setData(null);

        return {
          success: false,
          error: {
            error: errorMessage,
            correlationId: 'hook-error',
            retryable: false,
            statusCode: 0,
          },
        };
      } finally {
        setLoading(false);
      }
    },
    [csrfToken, csrfLoading]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
  }, []);

  return {
    completeOnboarding,
    loading: loading || csrfLoading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for completing onboarding with optimistic updates
 * 
 * Updates local state immediately and reverts on error.
 * 
 * @example
 * ```typescript
 * function OnboardingForm() {
 *   const { completeOnboarding, loading } = useOnboardingCompleteOptimistic();
 * 
 *   async function handleSubmit(data) {
 *     await completeOnboarding(data);
 *     // State is updated optimistically
 *   }
 * }
 * ```
 */
export function useOnboardingCompleteOptimistic(): UseOnboardingCompleteReturn {
  const baseHook = useOnboardingComplete();
  const [optimisticData, setOptimisticData] = useState<OnboardingCompleteSuccessData | null>(null);

  const completeOnboarding = useCallback(
    async (requestData: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> => {
      // Optimistic update
      setOptimisticData({
        success: true,
        message: 'Onboarding completed',
        user: {
          id: 0, // Will be updated with real data
          email: '',
          onboardingCompleted: true,
        },
        correlationId: 'optimistic',
        duration: 0,
      });

      const result = await baseHook.completeOnboarding(requestData);

      if (!result.success) {
        // Revert optimistic update on error
        setOptimisticData(null);
      }

      return result;
    },
    [baseHook]
  );

  return {
    ...baseHook,
    completeOnboarding,
    data: optimisticData || baseHook.data,
  };
}

/**
 * Hook for completing onboarding with callback
 * 
 * Executes callback on success or error.
 * 
 * @param onSuccess - Callback on successful completion
 * @param onError - Callback on error
 * 
 * @example
 * ```typescript
 * function OnboardingForm() {
 *   const { completeOnboarding } = useOnboardingCompleteWithCallback(
 *     (data) => router.push('/home'),
 *     (error) => toast.error(error.error)
 *   );
 * }
 * ```
 */
export function useOnboardingCompleteWithCallback(
  onSuccess?: (data: OnboardingCompleteSuccessData) => void,
  onError?: (error: { error: string; correlationId: string }) => void
): UseOnboardingCompleteReturn {
  const baseHook = useOnboardingComplete();

  const completeOnboarding = useCallback(
    async (requestData: OnboardingCompleteRequest): Promise<OnboardingCompleteResponse> => {
      const result = await baseHook.completeOnboarding(requestData);

      if (result.success && onSuccess) {
        onSuccess(result.data);
      } else if (!result.success && onError) {
        onError(result.error);
      }

      return result;
    },
    [baseHook, onSuccess, onError]
  );

  return {
    ...baseHook,
    completeOnboarding,
  };
}
