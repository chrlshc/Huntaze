'use client';

/**
 * useAI Hook - React hook for AI interactions
 * 
 * Provides a simple interface for AI chat, code generation,
 * math solving, and creative writing in React components.
 */

import { useState, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export type AITaskType = 'chat' | 'math' | 'coding' | 'creative';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  cost?: number;
  tokens?: number;
  timestamp: Date;
}

export interface AIResponse {
  content: string;
  model: string;
  cost: number;
  tokens: number;
}

export interface UseAIOptions {
  /** Default task type */
  defaultType?: AITaskType;
  /** System prompt to use */
  systemPrompt?: string;
  /** API endpoint (default: /api/ai/chat) */
  endpoint?: string;
  /** Callback on successful response */
  onSuccess?: (response: AIResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseAIReturn {
  /** Send a message to AI */
  send: (message: string, type?: AITaskType) => Promise<AIResponse | null>;
  /** Chat history */
  messages: AIMessage[];
  /** Add a message to history */
  addMessage: (message: Omit<AIMessage, 'timestamp'>) => void;
  /** Clear chat history */
  clearMessages: () => void;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Clear error */
  clearError: () => void;
  /** Total cost accumulated */
  totalCost: number;
  /** Total tokens used */
  totalTokens: number;
  /** Reset stats */
  resetStats: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const {
    defaultType = 'chat',
    systemPrompt,
    endpoint = '/api/ai/chat',
    onSuccess,
    onError
  } = options;

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  
  // Use ref to avoid stale closures
  const abortControllerRef = useRef<AbortController | null>(null);

  const addMessage = useCallback((message: Omit<AIMessage, 'timestamp'>) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetStats = useCallback(() => {
    setTotalCost(0);
    setTotalTokens(0);
  }, []);

  const send = useCallback(async (
    message: string,
    type: AITaskType = defaultType
  ): Promise<AIResponse | null> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    // Add user message to history
    addMessage({ role: 'user', content: message });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type,
          systemPrompt
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const result: AIResponse = {
        content: data.message || data.content,
        model: data.model,
        cost: data.cost || 0,
        tokens: data.tokens || 0
      };

      // Add assistant message to history
      addMessage({
        role: 'assistant',
        content: result.content,
        model: result.model,
        cost: result.cost,
        tokens: result.tokens
      });

      // Update stats
      setTotalCost(prev => prev + result.cost);
      setTotalTokens(prev => prev + result.tokens);

      // Callback
      onSuccess?.(result);

      return result;
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [defaultType, endpoint, systemPrompt, addMessage, onSuccess, onError]);

  return {
    send,
    messages,
    addMessage,
    clearMessages,
    loading,
    error,
    clearError,
    totalCost,
    totalTokens,
    resetStats
  };
}

// =============================================================================
// Specialized Hooks
// =============================================================================

/**
 * Hook for chat interactions
 */
export function useAIChat(options: Omit<UseAIOptions, 'defaultType'> = {}) {
  return useAI({ ...options, defaultType: 'chat' });
}

/**
 * Hook for math/reasoning
 */
export function useAIMath(options: Omit<UseAIOptions, 'defaultType'> = {}) {
  return useAI({ ...options, defaultType: 'math' });
}

/**
 * Hook for code generation
 */
export function useAICode(options: Omit<UseAIOptions, 'defaultType'> = {}) {
  return useAI({ ...options, defaultType: 'coding' });
}

/**
 * Hook for creative writing
 */
export function useAICreative(options: Omit<UseAIOptions, 'defaultType'> = {}) {
  return useAI({ ...options, defaultType: 'creative' });
}

export default useAI;
