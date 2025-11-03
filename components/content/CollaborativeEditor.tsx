'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ContentEditor from './ContentEditor';
import { PresenceIndicators } from './PresenceIndicators';
import CommentThread from './CommentThread';
import CommentableText from './CommentableText';
import RevisionHistory from './RevisionHistory';
import RevisionComparison from './RevisionComparison';
import { usePresence } from '@/hooks/usePresence';
import { useComments } from '@/hooks/useComments';
import { useRevisions } from '@/hooks/useRevisions';
import { MessageCircle, X, Users, Eye, EyeOff, History } from 'lucide-react';

interface CollaborativeEditorProps {
  contentId: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  currentUserId: string;
  className?: string;
}

interface TextSelection {
  text: string;
  start: number;
  end: number;
}

export default function CollaborativeEditor({
  contentId,
  initialContent = '',
  currentUserId,
  onChange,
  onSave,
  className = ''
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [showComments, setShowComments] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [comparisonRevisions, setComparisonRevisions] = useState<{left: any, right: any} | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { 
    updateCursor, 
    updateSelection, 
    startTyping, 
    stopTyping,
    isConnected 
  } = usePresence({ contentId });

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    addComment,
    updateComment,
    deleteComment,
    unresolvedCount
  } = useComments({ contentId });

  const {
    revisions,
    loading: revisionsLoading,
    error: revisionsError,
    createRevision,
    restoreRevision,
    deleteRevision,
    refreshRevisions
  } = useRevisions({ contentId });

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
    startTyping();
    
    // Stop typing after a delay
    setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [onChange, startTyping, stopTyping]);

  // Handle text selection for commenting
  const handleTextSelected = useCallback((selection: TextSelection) => {
    setSelectedText(selection);
    setShowComments(true);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedText(null);
  }, []);

  // Handle adding comments
  const handleAddComment = useCallback(async (
    text: string, 
    parentId?: string, 
    position?: { start: number; end: number }
  ) => {
    await addComment(text, parentId, position);
    if (!parentId) {
      // Clear selection after adding a new top-level comment
      setSelectedText(null);
    }
  }, [addComment]);

  // Handle revision operations
  const handleRestoreRevision = useCallback(async (revisionId: string) => {
    const result = await restoreRevision(revisionId);
    if (result.content) {
      setContent(result.content.text);
      onChange?.(result.content.text);
    }
  }, [restoreRevision, onChange]);

  const handlePreviewRevision = useCallback((revision: any) => {
    if (revisions.length > 0) {
      setComparisonRevisions({
        left: revision,
        right: revisions[0] // Compare with latest
      });
    }
  }, [revisions]);

  // Toggle between editor and preview mode
  const toggleMode = () => {
    setIsEditorMode(!isEditorMode);
  };

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Main Content Area */}
      <div className="flex-1">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Content Editor</h3>
              <div className="flex items-center space-x-3">
                {/* Mode Toggle */}
                <button
                  onClick={toggleMode}
                  className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {isEditorMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{isEditorMode ? 'Preview' : 'Edit'}</span>
                </button>

                {/* Comments Toggle */}
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`flex items-center space-x-2 px-3 py-1 text-sm border rounded-md ${
                    showComments 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comments</span>
                  {unresolvedCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unresolvedCount}
                    </span>
                  )}
                </button>

                {/* Revisions Toggle */}
                <button
                  onClick={() => setShowRevisions(!showRevisions)}
                  className={`flex items-center space-x-2 px-3 py-1 text-sm border rounded-md ${
                    showRevisions 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                  {revisions.length > 0 && (
                    <span className="bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {revisions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Presence Indicators */}
            <PresenceIndicators contentId={contentId} />
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm mt-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-gray-600">
                {isConnected ? 'Real-time collaboration active' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="p-4">
            {isEditorMode ? (
              <div ref={editorRef}>
                <ContentEditor
                  initialContent={content}
                  onChange={handleContentChange}
                  placeholder="Start typing... Your collaborators will see your changes in real-time."
                />
              </div>
            ) : (
              <CommentableText
                content={content}
                onTextSelected={handleTextSelected}
                onClearSelection={handleClearSelection}
                selectedRange={selectedText ? { start: selectedText.start, end: selectedText.end } : undefined}
                className="min-h-[300px] p-4 border border-gray-200 rounded-md bg-gray-50"
              />
            )}
          </div>
        </div>
      </div>

      {/* Comments Sidebar */}
      {showComments && (
        <div className="w-96 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {commentsLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading comments...
              </div>
            ) : commentsError ? (
              <div className="text-center py-8 text-red-500">
                Error loading comments: {commentsError}
              </div>
            ) : (
              <CommentThread
                comments={comments}
                contentId={contentId}
                currentUserId={currentUserId}
                onAddComment={handleAddComment}
                onUpdateComment={updateComment}
                onDeleteComment={deleteComment}
                selectedText={selectedText}
                onClearSelection={handleClearSelection}
              />
            )}
          </div>
        </div>
      )}

      {/* Revisions Sidebar */}
      {showRevisions && (
        <div className="w-96 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Revision History</h3>
              <button
                onClick={() => setShowRevisions(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <RevisionHistory
              revisions={revisions}
              loading={revisionsLoading}
              error={revisionsError}
              onRestore={handleRestoreRevision}
              onDelete={deleteRevision}
              onPreview={handlePreviewRevision}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}

      {/* Revision Comparison Modal */}
      {comparisonRevisions && (
        <RevisionComparison
          leftRevision={comparisonRevisions.left}
          rightRevision={comparisonRevisions.right}
          onClose={() => setComparisonRevisions(null)}
        />
      )}
    </div>
  );
}

// Enhanced version that works with any text input/textarea
export function CollaborativeTextArea({
  contentId,
  value,
  onChange,
  placeholder = "Start typing...",
  className = '',
  ...props
}: {
  contentId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { 
    updateCursor, 
    updateSelection, 
    startTyping, 
    stopTyping 
  } = usePresence({ contentId });

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      updateCursor(start);
    } else {
      updateSelection(start, end);
    }
  }, [updateCursor, updateSelection]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    startTyping();
    onChange(e.target.value);
    
    // Auto-stop typing after 1 second
    setTimeout(() => {
      stopTyping();
    }, 1000);
  }, [startTyping, stopTyping, onChange]);

  const handleKeyDown = useCallback(() => {
    startTyping();
  }, [startTyping]);

  return (
    <div className="space-y-3">
      <PresenceIndicators contentId={contentId} />
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          onMouseUp={handleSelectionChange}
          placeholder={placeholder}
          className={`w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}