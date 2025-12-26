'use client';

/**
 * Onboarding Status Hook
 * 
 * Client-side hook for managing user onboarding status with:
 * - Auto-fetching on mount
 * - Caching with SWR
 * - Error handling
 * - Optimistic updates
 */

'use client';

import { useState, useCallback } from 'react';
import { InternalApiError } from '@/lib/api/client/internal-api-client';
import { useInternalSWR } from '@/lib/swr';
import {
  completeAuthOnboarding,
  fetchAuthOnboardingStatus,
  type AuthOnboardingStatusResponse,
} from '@/lib/services/onboarding';

/**
 * Hook to manage user onboarding status
 * 
 * @returns Onboarding status, loading state, error, and completion function
 * 
 * @example
 * ```typescript
 * function OnboardingFlow() {
 *   const { completed, loading, error, completeOnboarding } = useOnboardingStatus();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   if (!completed) {
 *     return (
 *       <OnboardingSteps 
 *         onComplete={async () => {
 *           const success = await completeOnboarding();
 *           if (success) {
 *             router.push('/dashboard');
 *           }
 *         }}
 *       />
 *     );
 *   }
 *   
 *   return <Dashboard />;
 * }
 * ```
 */
export function useOnboardingStatus() {
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Fetch onboarding status with SWR
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useInternalSWR<AuthOnboardingStatusResponse>(
    '/api/auth/onboarding-status',
    fetchAuthOnboardingStatus,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
      refreshInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: (error) => {
        // Don't retry on auth errors
        return !(error instanceof InternalApiError && error.kind === 'Auth');
      },
    }
  );

  /**
   * Mark onboarding as completed
   * 
   * @returns Promise<boolean> - True if successful
   */
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (isCompleting) return false;
    
    setIsCompleting(true);
    
    try {
      // Optimistic update
      mutate(
        { onboarding_completed: true, correlationId: 'optimistic' },
        false
      );
      
      await completeAuthOnboarding();
      
      // Revalidate to get fresh data
      await mutate();
      
      return true;
    } catch (error) {
      console.error('Complete onboarding error:', error);
      
      // Revert optimistic update
      mutate();
      
      return false;
    } finally {
      setIsCompleting(false);
    }
  }, [isCompleting, mutate]);

  /**
   * Refresh onboarding status
   */
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    completed: data?.onboarding_completed ?? null,
    loading: isLoading,
    error: error ? new Error(error.message) : null,
    completeOnboarding,
    isCompleting,
    refresh,
    correlationId: data?.correlationId,
  };
}

/**
 * Hook variant that throws on error (for use with Suspense)
 * 
 * @example
 * ```typescript
 * function OnboardingFlow() {
 *   const { completed, completeOnboarding } = useOnboardingStatusSuspense();
 *   
 *   // No loading or error states needed - handled by Suspense/ErrorBoundary
 *   if (!completed) {
 *     return <OnboardingSteps onComplete={completeOnboarding} />;
 *   }
 *   
 *   return <Dashboard />;
 * }
 * ```
 */
export function useOnboardingStatusSuspense() {
  const { completed, loading, error, completeOnboarding, isCompleting } = useOnboardingStatus();
  
  if (loading) {
    throw new Promise(() => {}); // Suspend
  }
  
  if (error) {
    throw error; // Let ErrorBoundary handle
  }
  
  return {
    completed: completed!,
    completeOnboarding,
    isCompleting,
  };
}
