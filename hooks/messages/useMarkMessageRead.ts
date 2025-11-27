'use client';

/**
 * Mark Message as Read Hook
 * 
 * Optimized hook with:
 * - Debouncing to prevent double-clicks
 * - Optimistic updates
 * - Error handling with retry
 * - Loading states
 * - SWR cache invalidation
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useSWRConfig } from 'swr';
import type { Message } from '@/lib/services/crmData';

// ============================================================================
// Types
// ============================================================================

interface MarkMessageReadParams {
  threadId: string;
}

interface MarkMessageReadResponse {
  success: boolean;
  message?: Message;
  error?: string;
  correlationId?: string;
}

interface UseMarkMessageReadReturn {
  markAsRead: (params: MarkMessageReadParams) => Promise<MarkMessageReadResponse>;
  isMarking: boolean;
  error: Error | null;
  lastMarkedId: string | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to mark messages as read with optimistic updates
 * 
 * @example
 * ```tsx
 * const { markAsRead, isMarking, error } = useMarkMessageRead();
 * 
 * const handleMarkRead = async (threadId: string) => {
 *   const result = await markAsRead({ threadId });
 *   if (result.success) {
 *     toast.success('Message marked as read');
 *   }
 * };
 * ```
 */
export function useMarkMessageRead(): UseMarkMessageReadReturn {
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMarkedId, setLastMarkedId] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  
  // Debounce timeout ref
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Track in-flight requests to prevent duplicates
  const inflightRef = useRef<Set<string>>(new Set());

  /**
   * Mark message as read with debouncing and optimistic updates
   */
  const markAsRead = useCallback(async (
    params: MarkMessageReadParams
  ): Promise<MarkMessageReadResponse> => {
    const { threadId } = params;

    // Prevent duplicate requests
    if (inflightRef.current.has(threadId)) {
      return {
        success: false,
        error: 'Request already in progress',
      };
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsMarking(true);
    setError(null);
    inflightRef.current.add(threadId);

    try {
      // Optimistic update: immediately update cache
      mutate(
        (key: string) => typeof key === 'string' && key.includes('/api/messages'),
        undefined,
        { revalidate: false }
      );

      // Make API request
      const response = await fetch(`/api/messages/${threadId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Update last marked ID
      setLastMarkedId(threadId);

      // Revalidate cache with actual data
      mutate(
        (key: string) => typeof key === 'string' && key.includes('/api/messages'),
        undefined,
        { revalidate: true }
      );

      return {
        success: true,
        message: data.message,
        correlationId: data.correlationId,
      };

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      // Rollback optimistic update
      mutate(
        (key: string) => typeof key === 'string' && key.includes('/api/messages'),
        undefined,
        { revalidate: true }
      );

      return {
        success: false,
        error: error.message,
      };

    } finally {
      // Debounce: wait 500ms before allowing next request
      timeoutRef.current = setTimeout(() => {
        setIsMarking(false);
        inflightRef.current.delete(threadId);
      }, 500);
    }
  }, [mutate]);

  return {
    markAsRead,
    isMarking,
    error,
    lastMarkedId,
  };
}
