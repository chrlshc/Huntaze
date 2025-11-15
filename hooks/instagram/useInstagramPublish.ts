/**
 * Instagram Publish Hook - Debounced Mutations
 * Phase 3: Optimized mutations with debouncing
 */

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface InstagramContent {
  caption: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
}

export function useInstagramPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publishContent = useDebouncedCallback(
    async (content: InstagramContent) => {
      setIsPublishing(true);
      setError(null);
      
      try {
        const response = await fetch('/api/instagram/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Publish failed');
        }
        
        return await response.json();
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsPublishing(false);
      }
    },
    1000,
    { leading: true, trailing: false }
  );

  return {
    publishContent,
    isPublishing,
    error,
  };
}
