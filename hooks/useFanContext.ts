/**
 * useFanContext Hook
 * 
 * React hook for fan context operations (profile, notes, tags).
 * Provides state management for fan information in the context panel.
 * 
 * @requirements 10.5
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { huntazeMessagingAdapter } from '@/lib/api/adapters/huntaze-messaging.adapter';
import type { FanContext } from '@/lib/api/adapters/huntaze-messaging.adapter';

// ============================================
// Hook State Types
// ============================================

interface UseFanContextResult {
  fanContext: FanContext | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addNote: (content: string, category: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addTag: (label: string, color?: string) => Promise<void>;
  removeTag: (tagId: string) => Promise<void>;
}

// ============================================
// useFanContext Hook
// ============================================

/**
 * Hook for managing fan context (profile, notes, tags)
 * 
 * @param fanId - Fan ID
 * @returns Fan context state and operations
 */
export function useFanContext(fanId: string | null): UseFanContextResult {
  const [fanContext, setFanContext] = useState<FanContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadFanContext = useCallback(async () => {
    if (!fanId) {
      setFanContext(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await huntazeMessagingAdapter.getFanContext(fanId);
      setFanContext(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load fan context'));
    } finally {
      setLoading(false);
    }
  }, [fanId]);

  const refresh = useCallback(async () => {
    await loadFanContext();
  }, [loadFanContext]);

  const addNote = useCallback(
    async (content: string, category: string) => {
      if (!fanId) return;

      try {
        const newNote = await huntazeMessagingAdapter.addFanNote(
          fanId,
          content,
          category
        );

        setFanContext((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notes: [newNote, ...prev.notes],
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add note'));
        throw err;
      }
    },
    [fanId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!fanId) return;

      try {
        await huntazeMessagingAdapter.deleteFanNote(fanId, noteId);

        setFanContext((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notes: prev.notes.filter((note) => note.id !== noteId),
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete note'));
        throw err;
      }
    },
    [fanId]
  );

  const addTag = useCallback(
    async (label: string, color?: string) => {
      if (!fanId) return;

      try {
        const newTag = await huntazeMessagingAdapter.addFanTag(
          fanId,
          label,
          color as any
        );

        setFanContext((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tags: [...prev.tags, newTag],
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to add tag'));
        throw err;
      }
    },
    [fanId]
  );

  const removeTag = useCallback(
    async (tagId: string) => {
      if (!fanId) return;

      try {
        await huntazeMessagingAdapter.removeFanTag(fanId, tagId);

        setFanContext((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tags: prev.tags.filter((tag) => tag.id !== tagId),
          };
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to remove tag'));
        throw err;
      }
    },
    [fanId]
  );

  // Load fan context when fanId changes
  useEffect(() => {
    loadFanContext();
  }, [loadFanContext]);

  return {
    fanContext,
    loading,
    error,
    refresh,
    addNote,
    deleteNote,
    addTag,
    removeTag,
  };
}
