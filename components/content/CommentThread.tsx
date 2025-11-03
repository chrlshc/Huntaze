'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '@/lib/db/repositories/commentsRepository';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageCircle, 
  Reply, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  MoreVertical,
  CheckCircle2
} from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  contentId: string;
  currentUserId: string;
  onAddComment: (text: string, parentId?: string, position?: { start: number; end: number }) => Promise<void>;
  onUpdateComment: (commentId: string, text?: string, resolved?: boolean) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  selectedText?: { text: string; start: number; end: number };
  onClearSelection?: () => void;
}

export default function CommentThread({
  comments,
  contentId,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  selectedText,
  onClearSelection,
}: CommentThreadProps) {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo, editingComment]);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(
        newCommentText.trim(),
        undefined,
        selectedText ? { start: selectedText.start, end: selectedText.end } : undefined
      );
      setNewCommentText('');
      onClearSelection?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(replyText.trim(), parentId);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onUpdateComment(commentId, editText.trim());
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      await onUpdateComment(commentId, undefined, resolved);
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText('');
  };

  const startReplying = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const isOwner = comment.userId === currentUserId;

    return (
      <div
        key={comment.id}
        className={`border rounded-lg p-4 ${
          isReply ? 'ml-8 border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
        } ${comment.resolved ? 'opacity-60' : ''}`}
      >
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {comment.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">
                {comment.userName || 'Unknown User'}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </div>
            </div>
            {comment.resolved && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>

          <div className="flex items-center space-x-1">
            {!comment.resolved && (
              <button
                onClick={() => handleResolve(comment.id, true)}
                className="p-1 text-gray-400 hover:text-green-600 rounded"
                title="Mark as resolved"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {comment.resolved && (
              <button
                onClick={() => handleResolve(comment.id, false)}
                className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                title="Mark as unresolved"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => startEditing(comment)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                  title="Edit comment"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Position indicator for text-based comments */}
        {comment.positionStart !== null && comment.positionEnd !== null && (
          <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Comment on selected text (position {comment.positionStart}-{comment.positionEnd})
          </div>
        )}

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Edit your comment..."
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(comment.id)}
                disabled={!editText.trim() || isSubmitting}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-800 mb-3 whitespace-pre-wrap">
            {comment.text}
          </div>
        )}

        {/* Reply Button */}
        {!isEditing && !isReply && (
          <button
            onClick={() => startReplying(comment.id)}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <textarea
              ref={textareaRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Write a reply..."
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleReply(comment.id)}
                disabled={!replyText.trim() || isSubmitting}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Replying...' : 'Reply'}
              </button>
              <button
                onClick={cancelReplying}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>Comments ({comments.length})</span>
        </h3>
        {comments.some(c => !c.resolved) && (
          <div className="text-sm text-orange-600">
            {comments.filter(c => !c.resolved).length} unresolved
          </div>
        )}
      </div>

      {/* Selected Text Indicator */}
      {selectedText && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Adding comment to selected text:
            </span>
            <button
              onClick={onClearSelection}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded">
            "{selectedText.text}"
          </div>
        </div>
      )}

      {/* New Comment Form */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder={selectedText ? "Comment on selected text..." : "Add a comment..."}
        />
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-gray-500">
            {selectedText ? 'This comment will be linked to the selected text' : 'General comment on the content'}
          </div>
          <button
            onClick={handleAddComment}
            disabled={!newCommentText.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No comments yet. Be the first to add one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}