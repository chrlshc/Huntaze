'use client';

import { useEffect } from 'react';

interface UseOAuthCallbackOptions {
  onSuccess?: (platform: string) => void;
  onError?: (error: Error) => void;
}

export function useOAuthCallback(options: UseOAuthCallbackOptions = {}) {
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform');
      const success = urlParams.get('success');
      const error = urlParams.get('error');

      if (platform && success === 'true') {
        try {
          // Trigger feature unlock check
          await fetch('/api/onboarding/check-unlocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform })
          });

          // Update onboarding progress
          await fetch(`/api/onboarding/step/platform_connection/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform })
          });

          options.onSuccess?.(platform);
        } catch (err) {
          console.error('OAuth callback handling failed:', err);
          options.onError?.(err as Error);
        }
      } else if (error) {
        options.onError?.(new Error(error));
      }
    };

    handleOAuthCallback();
  }, []);
}
