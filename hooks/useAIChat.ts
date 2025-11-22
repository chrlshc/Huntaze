/**
 * useAIChat Hook
 * 
 * React hook for interacting with the AI Chat API
 */

import { useState, useCallback } from 'react';

type AIChatRequest = {
  fanId: string;
  message: string;
  context?: Record<string, any>;
};

type AIChatResponse = {
  response: string;
  confidence: number;
  suggestedUpsell?: string;
  salesTactics?: string[];
  suggestedPrice?: number;
};

type UseAIChatReturn = {
  generateResponse: (request: AIChatRequest) => Promise<AIChatResponse | null>;
  loading: boolean;
  error: string | null;
  response: AIChatResponse | null;
  reset: () => void;
};

export function useAIChat(): UseAIChatReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AIChatResponse | null>(null);

  const generateResponse = useCallback(async (request: AIChatRequest) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await res.json();
      const aiResponse = data.data as AIChatResponse;
      setResponse(aiResponse);
      return aiResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    generateResponse,
    loading,
    error,
    response,
    reset,
  };
}
