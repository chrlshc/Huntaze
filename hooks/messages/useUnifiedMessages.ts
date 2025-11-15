/**
 * useUnifiedMessages Hook
 * 
 * Fetches and manages unified messages from all platforms with optimizations:
 * - SWR caching (30s TTL)
 * - Auto-refresh every 30s
 * - Request deduplication (5s)
 * - Error boundaries
 * - Optimistic updates
 */

import useSWR from 'swr';
import { useState } from 'react';
import { messagesService } from '@/lib/services/messages';
import type {
  UnifiedMessagesResponse,
  MessagePlatform,
  MessagesError,
} from '@/lib/services/messages';

const CACHE_KEY_PREFIX = 'unified-messages';
const CACHE_TTL = 30 * 1000; // 30 seconds
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

interface UseUnifiedMessagesOptions {
  creatorId: string;
  platform?: MessagePlatform;
  filter?: 'unread' | 'starred' | 'all';
  limit?: number;
  offset?: number;
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function useUnifiedMessages({
  creatorId,
  platform,
  filter = 'all',
  limit = 50,
  offset = 0,
  enabled = true,
  autoRefresh = true,
}: UseUnifiedMessagesOptions) {
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isTogglingStar, setIsTogglingStar] = useState(false);

  // Generate cache key
  const cacheKey = enabled
    ? `${CACHE_KEY_PREFIX}:${creatorId}:${platform || 'all'}:${filter}:${limit}:${offset}`
    : null;

  // Fetch unified messages with SWR
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<UnifiedMessagesResponse, MessagesError>(
    cacheKey,
    () => messagesService.getUnifiedMessages(creatorId, { platform, filter, limit, offset }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5s
      refreshInterval: autoRefresh ? REFRESH_INTERVAL : 0,
      onError: (err) => {
        console.error('[useUnifiedMessages] Error:', {
          error: err,
          creatorId,
          platform,
          filter,
        });
      },
    }
  );

  /**
   * Mark thread as read with optimistic update
   */
  const markAsRead = async (threadId: string, threadPlatform: MessagePlatform) => {
    setIsMarkingRead(true);

    try {
      // Optimistic update - mark as read immediately
      if (data) {
        mutate({
          ...data,
          threads: data.threads.map(thread =>
            thread.id === threadId
              ? { ...thread, unreadCount: 0, status: 'read' as const }
              : thread
          ),
          stats: {
            ...data.stats,
            totalUnread: Math.max(0, data.stats.totalUnread - (data.threads.find(t => t.id === threadId)?.unreadCount || 0)),
            byPlatform: {
              ...data.stats.byPlatform,
              [threadPlatform]: Math.max(0, data.stats.byPlatform[threadPlatform] - (data.threads.find(t => t.id === threadId)?.unreadCount || 0)),
            },
          },
        }, false);
      }

      // Make API call
      await messagesService.markAsRead(creatorId, threadId, threadPlatform);

      // Revalidate from server
      await mutate();
    } catch (err) {
      console.error('[useUnifiedMessages] Mark as read error:', err);
      // Rollback on error
      await mutate();
      throw err;
    } finally {
      setIsMarkingRead(false);
    }
  };

  /**
   * Toggle star with optimistic update
   */
  const toggleStar = async (threadId: string, threadPlatform: MessagePlatform, starred: boolean) => {
    setIsTogglingStar(true);

    try {
      // Optimistic update
      if (data) {
        mutate({
          ...data,
          threads: data.threads.map(thread =>
            thread.id === threadId
              ? { ...thread, status: starred ? 'starred' as const : 'read' as const }
              : thread
          ),
        }, false);
      }

      // Make API call
      await messagesService.toggleStar(creatorId, threadId, threadPlatform, starred);

      // Revalidate from server
      await mutate();
    } catch (err) {
      console.error('[useUnifiedMessages] Toggle star error:', err);
      // Rollback on error
      await mutate();
      throw err;
    } finally {
      setIsTogglingStar(false);
    }
  };

  /**
   * Archive thread with optimistic update
   */
  const archiveThread = async (threadId: string, threadPlatform: MessagePlatform) => {
    try {
      // Optimistic update - remove from list
      if (data) {
        mutate({
          ...data,
          threads: data.threads.filter(thread => thread.id !== threadId),
        }, false);
      }

      // Make API call
      await messagesService.archiveThread(creatorId, threadId, threadPlatform);

      // Revalidate from server
      await mutate();
    } catch (err) {
      console.error('[useUnifiedMessages] Archive error:', err);
      // Rollback on error
      await mutate();
      throw err;
    }
  };

  /**
   * Manual refresh
   */
  const refresh = () => mutate();

  return {
    messages: data,
    isLoading,
    error,
    markAsRead,
    toggleStar,
    archiveThread,
    isMarkingRead,
    isTogglingStar,
    refresh,
  };
}
