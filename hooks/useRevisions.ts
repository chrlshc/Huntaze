'use client';

import { useState, useEffect, useCallback } from 'react';
import { Revision } from '@/lib/db/repositories/revisionsRepository';

interface UseRevisionsProps {
  contentId: string;
}

interface UseRevisionsReturn {
  revisions: Revision[];
  loading: boolean;
  error: string | null;
  createRevision: (snapshot: any, description: string) => Promise<void>;
  restoreRevision: (revisionId: string) => Promise<void>;
  deleteRevision: (revisionId: string) => Promise<void>;
  refreshRevisions: () => Promise<void>;
}

export function useRevisions({ contentId }: UseRevisionsProps): UseRevisionsReturn {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/content/${contentId}/revisions`);
      if (!response.ok) {
        throw new Error('Failed to fetch revisions');
      }

      const data = await response.json();
      setRevisions(data.revisions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch revisions');
      console.error('Error fetching revisions:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  const createRevision = useCallback(async (snapshot: any, description: string) => {
    try {
      const response = await fetch(`/api/content/${contentId}/revisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshot,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create revision');
      }

      // Refresh revisions to get the updated list
      await fetchRevisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create revision');
      throw err;
    }
  }, [contentId, fetchRevisions]);

  const restoreRevision = useCallback(async (revisionId: string) => {
    try {
      const response = await fetch(`/api/content/revisions/${revisionId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore revision');
      }

      // Refresh revisions to get the updated list
      await fetchRevisions();
      
      return response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore revision');
      throw err;
    }
  }, [fetchRevisions]);

  const deleteRevision = useCallback(async (revisionId: string) => {
    try {
      const response = await fetch(`/api/content/revisions/${revisionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete revision');
      }

      // Refresh revisions to get the updated list
      await fetchRevisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete revision');
      throw err;
    }
  }, [fetchRevisions]);

  const refreshRevisions = useCallback(async () => {
    await fetchRevisions();
  }, [fetchRevisions]);

  useEffect(() => {
    if (contentId) {
      fetchRevisions();
    }
  }, [contentId, fetchRevisions]);

  return {
    revisions,
    loading,
    error,
    createRevision,
    restoreRevision,
    deleteRevision,
    refreshRevisions,
  };
}