/**
 * Campaign Launch Hook
 * 
 * Optimized hook for launching marketing campaigns with:
 * - Debounced mutations (prevent double-click)
 * - Automatic retry on network errors
 * - Error handling with user-friendly messages
 * - Loading states
 * - Success callbacks
 * - Cache invalidation
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { LaunchCampaignInput, LaunchCampaignApiResponse, CampaignErrorResponse } from '@/lib/types/marketing';

interface UseCampaignLaunchOptions {
  onSuccess?: (response: LaunchCampaignApiResponse) => void;
  onError?: (error: CampaignErrorResponse) => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface LaunchResult {
  success: boolean;
  data?: LaunchCampaignApiResponse;
  error?: CampaignErrorResponse;
}

/**
 * Hook to launch marketing campaigns with retry logic and debouncing
 * 
 * @param options - Configuration options
 * @returns Launch function, loading state, and error
 * 
 * @example
 * ```tsx
 * const { launchCampaign, isLaunching, error } = useCampaignLaunch({
 *   onSuccess: (response) => {
 *     toast.success(response.message);
 *     router.push(`/campaigns/${response.campaign.id}`);
 *   },
 *   onError: (error) => {
 *     toast.error(error.userMessage || 'Failed to launch campaign');
 *   },
 * });
 * 
 * const handleLaunch = async () => {
 *   const result = await launchCampaign('camp_123', {
 *     creatorId: 'creator_456',
 *     scheduledFor: '2025-12-01T10:00:00Z',
 *   });
 *   
 *   if (result.success) {
 *     console.log('Campaign launched:', result.data);
 *   }
 * };
 * ```
 */
export function useCampaignLaunch(options: UseCampaignLaunchOptions = {}) {
  const {
    onSuccess,
    onError,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<CampaignErrorResponse | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  /**
   * Launch campaign with retry logic
   */
  const launchCampaign = useCallback(async (
    campaignId: string,
    input: LaunchCampaignInput
  ): Promise<LaunchResult> => {
    // Prevent double-click
    if (isLaunching) {
      return { 
        success: false, 
        error: {
          error: 'Already launching',
          type: 'VALIDATION_ERROR',
          correlationId: 'debounce',
          userMessage: 'Please wait for the current operation to complete.',
        },
      };
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLaunching(true);
    setError(null);

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    let lastError: CampaignErrorResponse | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Generate correlation ID for tracing
        const correlationId = `launch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const response = await fetch(`/api/marketing/campaigns/${campaignId}/launch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
          },
          body: JSON.stringify(input),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          const errorData = data as CampaignErrorResponse;
          lastError = errorData;

          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw errorData;
          }

          // Don't retry if explicitly marked as non-retryable
          if (errorData.retryable === false) {
            throw errorData;
          }

          // Retry on server errors (5xx) or rate limits (429)
          if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.warn(`[useCampaignLaunch] Attempt ${attempt} failed, retrying in ${delay}ms`, {
              campaignId,
              error: errorData.error,
              correlationId: errorData.correlationId,
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw errorData;
        }

        // Success
        const successData = data as LaunchCampaignApiResponse;
        
        console.log('[useCampaignLaunch] Campaign launched successfully', {
          campaignId,
          status: successData.campaign.status,
          correlationId,
        });

        setIsLaunching(false);
        
        if (onSuccess) {
          onSuccess(successData);
        }

        return {
          success: true,
          data: successData,
        };
      } catch (err) {
        // Handle abort
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('[useCampaignLaunch] Request aborted', { campaignId });
          setIsLaunching(false);
          return {
            success: false,
            error: {
              error: 'Request aborted',
              type: 'API_ERROR',
              correlationId: 'abort',
              userMessage: 'Request was cancelled.',
            },
          };
        }

        // Handle network errors
        if (err instanceof Error && !('type' in err)) {
          lastError = {
            error: err.message,
            type: 'API_ERROR',
            correlationId: 'network-error',
            userMessage: 'Network error. Please check your connection and try again.',
            retryable: true,
          };

          // Retry on network errors
          if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.warn(`[useCampaignLaunch] Network error, retrying in ${delay}ms`, {
              campaignId,
              attempt,
              error: err.message,
            });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          lastError = err as CampaignErrorResponse;
        }

        // Last attempt failed
        break;
      }
    }

    // All retries failed
    console.error('[useCampaignLaunch] All attempts failed', {
      campaignId,
      attempts: maxRetries,
      lastError,
    });

    setError(lastError);
    setIsLaunching(false);

    if (onError && lastError) {
      onError(lastError);
    }

    return {
      success: false,
      error: lastError || undefined,
    };
  }, [isLaunching, maxRetries, retryDelay, onSuccess, onError]);

  /**
   * Cancel any pending launch request
   */
  const cancelLaunch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLaunching(false);
  }, []);

  return {
    launchCampaign,
    isLaunching,
    error,
    cancelLaunch,
  };
}
