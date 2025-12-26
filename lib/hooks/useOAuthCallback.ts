'use client';

import { useEffect } from 'react';
import { checkOnboardingUnlocks, completeOnboardingStep } from '@/lib/services/onboarding';

interface UseOAuthCallbackOptions {
  onSuccess?: (platform: string) => void;
  onError?: (error: Error) => void;
}

export function useOAuthCallback(options: UseOAuthCallbackOptions = {}) {
  const { onSuccess, onError } = options;

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform');
      const success = urlParams.get('success');
      const error = urlParams.get('error');

      if (platform && success === 'true') {
        try {
          // Trigger feature unlock check
          await checkOnboardingUnlocks(platform);

          // Update onboarding progress
          await completeOnboardingStep('platform_connection', { platform });

          onSuccess?.(platform);
        } catch (err) {
          console.error('OAuth callback handling failed:', err);
          onError?.(err as Error);
        }
      } else if (error) {
        onError?.(new Error(error));
      }
    };

    handleOAuthCallback();
  }, [onError, onSuccess]);
}
