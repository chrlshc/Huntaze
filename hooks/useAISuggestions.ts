'use client';

/**
 * Hook personnalisé pour les suggestions AI
 */

import { useState, useCallback } from 'react';

interface MessageSuggestion {
  text: string;
  category: string;
  confidence?: number;
}

export function useAISuggestions(fanId: string, creatorId: string) {
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSuggestions = useCallback(async (context?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId,
          creatorId,
          ...context,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      return data.suggestions;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fanId, creatorId]);

  return { suggestions, loading, error, refresh: loadSuggestions };
}
