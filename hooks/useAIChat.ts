import { useState, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  cost?: number;
}

interface UseAIChatOptions {
  tone?: 'flirty' | 'sweet' | 'dominant' | 'playful' | 'professional';
  useCase?: 'chat' | 'content' | 'analysis' | 'strategy';
  onError?: (error: Error) => void;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          tone: options.tone,
          useCase: options.useCase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        cost: data.cost,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (err: any) {
      setError(err.message);
      if (options.onError) {
        options.onError(err);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [messages, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const getTotalCost = useCallback(() => {
    return messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
  }, [messages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    deleteMessage,
    getTotalCost,
  };
}