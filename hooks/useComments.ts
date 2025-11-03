'use client';

import { useState, useEffect, useCallback } from 'react';
import { Comment } from '@/lib/db/repositories/commentsRepository';

interface UseCommentsProps {
  contentId: string;
}

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  addComment: (text: string, parentId?: string, position?: { start: number; end: number }) => Promise<void>;
  updateComment: (commentId: string, text?: string, resolved?: boolean) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
  unresolvedCount: number;
}

export function useComments({ contentId }: UseCommentsProps): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/content/${contentId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  const addComment = useCallback(async (
    text: string, 
    parentId?: string, 
    position?: { start: number; end: number }
  ) => {
    try {
      const response = await fetch(`/api/content/${contentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          parentId,
          positionStart: position?.start,
          positionEnd: position?.end,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

      // Refresh comments to get the updated list
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [contentId, fetchComments]);

  const updateComment = useCallback(async (
    commentId: string, 
    text?: string, 
    resolved?: boolean
  ) => {
    try {
      const updateData: any = {};
      if (text !== undefined) updateData.text = text;
      if (resolved !== undefined) updateData.resolved = resolved;

      const response = await fetch(`/api/content/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update comment');
      }

      // Refresh comments to get the updated list
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/content/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      // Refresh comments to get the updated list
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, [fetchComments]);

  const refreshComments = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

  // Calculate unresolved count
  const unresolvedCount = comments.reduce((count, comment) => {
    if (!comment.resolved) count++;
    if (comment.replies) {
      count += comment.replies.filter(reply => !reply.resolved).length;
    }
    return count;
  }, 0);

  useEffect(() => {
    if (contentId) {
      fetchComments();
    }
  }, [contentId, fetchComments]);

  return {
    comments,
    loading,
    error,
    addComment,
    updateComment,
    deleteComment,
    refreshComments,
    unresolvedCount,
  };
}