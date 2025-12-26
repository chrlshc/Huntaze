/**
 * Hook pour les messages OnlyFans
 * 
 * Utilise les nouveaux endpoints /api/of/messages qui lisent depuis PostgreSQL
 * (pas d'appel direct à OF - le scraper remplit la DB)
 */

import useSWR from 'swr';
import { useCallback, useState } from 'react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { OFThread, OFMessage } from '@/lib/of-messages/types';

// Response types
interface OFThreadsResponse {
  threads: OFThread[];
  unreadCount: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface OFMessagesResponse {
  thread: OFThread;
  messages: OFMessage[];
  pagination: {
    limit: number;
    hasMore: boolean;
  };
}

interface OFSyncStatusResponse {
  syncStatus: {
    lastSyncAt: string | null;
    syncInProgress: boolean;
    threadCount: number;
    messageCount: number;
    errorMessage?: string;
  };
}

interface SendMessageParams {
  threadId: string;
  content: string;
  mediaIds?: string[];
  price?: number;
}

export function useOFThreads(options?: { unreadOnly?: boolean }) {
  const { unreadOnly = false } = options || {};
  
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<OFThreadsResponse>(
    `/api/of/messages?unreadOnly=${unreadOnly}`,
    (url) => internalApiFetch<OFThreadsResponse>(url),
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  return {
    threads: data?.threads ?? [],
    unreadCount: data?.unreadCount ?? 0,
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useOFMessages(threadId: string | null) {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<OFMessagesResponse>(
    threadId ? `/api/of/messages/${threadId}` : null,
    (url) => internalApiFetch<OFMessagesResponse>(url),
    {
      refreshInterval: 10000, // Refresh every 10s when viewing a thread
      revalidateOnFocus: true,
    }
  );

  return {
    thread: data?.thread ?? null,
    messages: data?.messages ?? [],
    pagination: data?.pagination,
    error,
    isLoading,
    mutate,
  };
}

export function useOFSyncStatus() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<OFSyncStatusResponse>(
    '/api/of/messages/sync',
    (url) => internalApiFetch<OFSyncStatusResponse>(url),
    {
      refreshInterval: 5000, // Check sync status frequently
    }
  );

  const triggerSync = useCallback(async (threadId?: string) => {
    try {
      await internalApiFetch('/api/of/messages/sync', {
        method: 'POST',
        body: { threadId },
      });
      mutate();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Sync failed' };
    }
  }, [mutate]);

  return {
    syncStatus: data?.syncStatus ?? null,
    error,
    isLoading,
    triggerSync,
    mutate,
  };
}

export function useOFSendMessage() {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const sendMessage = useCallback(async (params: SendMessageParams) => {
    setIsSending(true);
    setSendError(null);

    try {
      const response = await internalApiFetch<{ success: boolean; jobId: string; optimisticId: string }>(
        '/api/of/messages/send',
        {
          method: 'POST',
          body: params,
        }
      );
      setIsSending(false);
      return { success: true, jobId: response.jobId, optimisticId: response.optimisticId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setSendError(errorMessage);
      setIsSending(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => setSendError(null), []);

  return {
    sendMessage,
    isSending,
    sendError,
    clearError,
  };
}

export function useOFMarkAsRead() {
  const markAsRead = useCallback(async (threadId: string) => {
    try {
      await internalApiFetch(`/api/of/messages/${threadId}`, {
        method: 'POST',
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to mark as read' };
    }
  }, []);

  return { markAsRead };
}
