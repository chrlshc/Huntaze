/**
 * useMessaging Hook
 * 
 * React hook for messaging operations using the Huntaze API adapter.
 * Provides state management and real-time updates for conversations and messages.
 * 
 * @requirements 10.3, 10.4
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { huntazeMessagingAdapter } from '@/lib/api/adapters/huntaze-messaging.adapter';
import type {
  Conversation,
  Message,
  ConversationFilters,
  PaginationParams,
} from '@/lib/api/adapters/huntaze-messaging.adapter';

// ============================================
// Hook State Types
// ============================================

interface UseConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: ConversationFilters) => void;
}

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (content: string, attachments?: any[]) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================
// useConversations Hook
// ============================================

/**
 * Hook for managing conversations (fan list)
 * 
 * @param initialFilters - Initial filter options
 * @param pageSize - Number of items per page
 * @returns Conversations state and operations
 */
export function useConversations(
  initialFilters: ConversationFilters = {},
  pageSize: number = 50
): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<ConversationFilters>(initialFilters);
  const [offset, setOffset] = useState(0);

  const loadConversations = useCallback(
    async (reset: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const pagination: PaginationParams = {
          limit: pageSize,
          offset: currentOffset,
        };

        const result = await huntazeMessagingAdapter.getConversations(
          filters,
          pagination
        );

        if (reset) {
          setConversations(result.items);
          setOffset(result.items.length);
        } else {
          setConversations((prev) => [...prev, ...result.items]);
          setOffset((prev) => prev + result.items.length);
        }

        setHasMore(result.pagination.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load conversations'));
      } finally {
        setLoading(false);
      }
    },
    [filters, offset, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadConversations(false);
    }
  }, [loading, hasMore, loadConversations]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadConversations(true);
  }, [loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations(true);
  }, [filters]);

  // Real-time updates subscription
  useEffect(() => {
    const unsubscribe = huntazeMessagingAdapter.subscribeToConversations(
      (updatedConversation) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
        );
      }
    );

    return unsubscribe;
  }, []);

  return {
    conversations,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    setFilters,
  };
}

// ============================================
// useMessages Hook
// ============================================

/**
 * Hook for managing messages in a conversation
 * 
 * @param conversationId - Conversation ID
 * @param pageSize - Number of messages per page
 * @returns Messages state and operations
 */
export function useMessages(
  conversationId: string | null,
  pageSize: number = 50
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadMessages = useCallback(
    async (reset: boolean = false) => {
      if (!conversationId) return;

      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const pagination: PaginationParams = {
          limit: pageSize,
          offset: currentOffset,
        };

        const result = await huntazeMessagingAdapter.getMessages(
          conversationId,
          pagination
        );

        if (reset) {
          setMessages(result.items);
          setOffset(result.items.length);
        } else {
          setMessages((prev) => [...prev, ...result.items]);
          setOffset((prev) => prev + result.items.length);
        }

        setHasMore(result.pagination.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load messages'));
      } finally {
        setLoading(false);
      }
    },
    [conversationId, offset, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await loadMessages(false);
    }
  }, [loading, hasMore, loadMessages]);

  const refresh = useCallback(async () => {
    setOffset(0);
    await loadMessages(true);
  }, [loadMessages]);

  const sendMessage = useCallback(
    async (content: string, attachments?: any[]) => {
      if (!conversationId) return;

      try {
        // Optimistic update
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId,
          content,
          timestamp: new Date(),
          isFromFan: false,
          status: 'sending',
          attachments,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Send to API
        const sentMessage = await huntazeMessagingAdapter.sendMessage(
          conversationId,
          content,
          attachments
        );

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? sentMessage : msg
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to send message'));
        
        // Remove optimistic message on failure
        setMessages((prev) =>
          prev.filter((msg) => !msg.id.startsWith('temp-'))
        );
        
        throw err;
      }
    },
    [conversationId]
  );

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setOffset(0);
      loadMessages(true);
    }
  }, [conversationId]);

  // Real-time updates subscription
  useEffect(() => {
    if (!conversationId) return;

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to new messages
    unsubscribeRef.current = huntazeMessagingAdapter.subscribeToMessages(
      conversationId,
      (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((msg) => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    refresh,
  };
}

// ============================================
// useConversation Hook
// ============================================

/**
 * Hook for managing a single conversation
 * 
 * @param conversationId - Conversation ID
 * @returns Conversation state
 */
export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      return;
    }

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await huntazeMessagingAdapter.getConversation(conversationId);
        setConversation(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load conversation'));
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId]);

  return { conversation, loading, error };
}
