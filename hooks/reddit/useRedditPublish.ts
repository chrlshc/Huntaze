'use client';

/**
 * Reddit Publish Hook - Debounced Mutations
 * Phase 3: Optimized mutations with debouncing
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface RedditContent {
  subreddit: string;
  title: string;
  text?: string;
  url?: string;
  kind: 'self' | 'link';
}

export function useRedditPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const publishContent = useCallback(async (content: RedditContent) => {
    // Prevent double-click
    if (isPublishing) return;
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsPublishing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reddit/publish', {
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
      // Debounce by 1 second
      timeoutRef.current = setTimeout(() => {
        setIsPublishing(false);
      }, 1000);
    }
  }, [isPublishing]);

  return {
    publishContent,
    isPublishing,
    error,
  };
}
