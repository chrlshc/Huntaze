/**
 * useAICaption Hook
 * 
 * React hook for interacting with the AI Caption Generator API
 */

import { useState, useCallback } from 'react';

type Platform = 'instagram' | 'tiktok' | 'twitter' | 'onlyfans' | 'facebook';

type CaptionRequest = {
  platform: Platform;
  contentInfo: {
    type?: string;
    description?: string;
    mood?: string;
    targetAudience?: string;
  };
};

type CaptionResponse = {
  caption: string;
  hashtags: string[];
  confidence: number;
  performanceInsights?: string[];
};

type UseAICaptionReturn = {
  generateCaption: (request: CaptionRequest) => Promise<CaptionResponse | null>;
  loading: boolean;
  error: string | null;
  caption: CaptionResponse | null;
  reset: () => void;
};

export function useAICaption(): UseAICaptionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState<CaptionResponse | null>(null);

  const generateCaption = useCallback(async (request: CaptionRequest) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate caption');
      }

      const data = await res.json();
      const captionResponse = data.data as CaptionResponse;
      setCaption(captionResponse);
      return captionResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate caption';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCaption(null);
    setError(null);
  }, []);

  return {
    generateCaption,
    loading,
    error,
    caption,
    reset,
  };
}
