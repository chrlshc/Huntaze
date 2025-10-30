import { useState, useEffect, useCallback } from 'react';

// Types
interface Conversation {
  id: string;
  userId: string;
  subscriberId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subscriber: {
    id: string;
    username: string;
    tier: string;
  };
  _count: {
    messages: number;
  };
}

interface AutoReply {
  id: string;
  name: string;
  triggers: string;
  response: string;
  isActive: boolean;
  priority: number;
  conditions?: string;
  createdAt: string;
}

interface AutoReplyMatch {
  matched: boolean;
  reply?: any;
  rule?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Hook: useConversations
export function useConversations(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) {
  const [data, setData] = useState<Conversation[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
      if (params?.status) queryParams.set('status', params.status);

      const response = await fetch(`/api/chatbot/conversations?${queryParams}`);
      const result: PaginatedResponse<Conversation> = await response.json();

      if (result.success) {
        setData(result.data);
        setMetadata(result.metadata);
      } else {
        setError(result.error?.message || 'Failed to fetch conversations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.pageSize, params?.status]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (data: {
    subscriberId: string;
    initialMessage?: string;
  }) => {
    try {
      const response = await fetch('/api/chatbot/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<Conversation> = await response.json();

      if (result.success) {
        await fetchConversations(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create conversation');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    conversations: data,
    metadata,
    loading,
    error,
    refetch: fetchConversations,
    createConversation,
  };
}

// Hook: useAutoReplies
export function useAutoReplies() {
  const [data, setData] = useState<AutoReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutoReplies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/chatbot/auto-reply');
      const result: ApiResponse<AutoReply[]> = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch auto-replies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoReplies();
  }, [fetchAutoReplies]);

  const createAutoReply = async (autoReply: {
    name: string;
    triggers: string[];
    response: string;
    isActive?: boolean;
    priority?: number;
    conditions?: any;
  }) => {
    try {
      const response = await fetch('/api/chatbot/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoReply),
      });

      const result: ApiResponse<AutoReply> = await response.json();

      if (result.success) {
        await fetchAutoReplies(); // Refresh list
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create auto-reply');
      }
    } catch (err) {
      throw err;
    }
  };

  const processAutoReply = async (data: {
    messageId: string;
    content: string;
    subscriberId: string;
  }): Promise<AutoReplyMatch> => {
    try {
      const response = await fetch('/api/chatbot/auto-reply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<AutoReplyMatch> = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to process auto-reply');
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    autoReplies: data,
    loading,
    error,
    refetch: fetchAutoReplies,
    createAutoReply,
    processAutoReply,
  };
}
