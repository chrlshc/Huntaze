'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MessageCircle, Plus } from 'lucide-react';

interface TextSelection {
  text: string;
  start: number;
  end: number;
}

interface CommentableTextProps {
  content: string;
  onTextSelected: (selection: TextSelection) => void;
  onClearSelection: () => void;
  selectedRange?: { start: number; end: number };
  className?: string;
  readOnly?: boolean;
}

export default function CommentableText({
  content,
  onTextSelected,
  onClearSelection,
  selectedRange,
  className = '',
  readOnly = false,
}: CommentableTextProps) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseUp = useCallback(() => {
    if (readOnly) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) {
      setSelection(null);
      setShowCommentButton(false);
      return;
    }

    const range = windowSelection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (!selectedText || !textRef.current) {
      setSelection(null);
      setShowCommentButton(false);
      return;
    }

    // Calculate text positions
    const textContent = textRef.current.textContent || '';
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    // Get the position for the comment button
    const rect = range.getBoundingClientRect();
    const containerRect = textRef.current.getBoundingClientRect();

    const newSelection: TextSelection = {
      text: selectedText,
      start: startOffset,
      end: endOffset,
    };

    setSelection(newSelection);
    setButtonPosition({
      x: rect.right - containerRect.left + 10,
      y: rect.top - containerRect.top,
    });
    setShowCommentButton(true);

    // Auto-hide the button after 5 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowCommentButton(false);
    }, 5000);
  }, [readOnly]);

  const handleAddComment = useCallback(() => {
    if (selection) {
      onTextSelected(selection);
      setSelection(null);
      setShowCommentButton(false);
    }
  }, [selection, onTextSelected]);

  const handleClearSelection = useCallback(() => {
    setSelection(null);
    setShowCommentButton(false);
    onClearSelection();
    
    // Clear browser selection
    const windowSelection = window.getSelection();
    if (windowSelection) {
      windowSelection.removeAllRanges();
    }
  }, [onClearSelection]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Highlight selected range if provided
  const renderContentWithHighlight = () => {
    if (!selectedRange || !content) {
      return content;
    }

    const before = content.slice(0, selectedRange.start);
    const selected = content.slice(selectedRange.start, selectedRange.end);
    const after = content.slice(selectedRange.end);

    return (
      <>
        {before}
        <span className="bg-blue-100 border-l-2 border-blue-400 px-1 rounded">
          {selected}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="relative">
      <div
        ref={textRef}
        className={`
          relative whitespace-pre-wrap leading-relaxed
          ${!readOnly ? 'select-text cursor-text' : 'select-none'}
          ${className}
        `}
        onMouseUp={handleMouseUp}
        style={{ userSelect: readOnly ? 'none' : 'text' }}
      >
        {renderContentWithHighlight()}
      </div>

      {/* Comment Button */}
      {showCommentButton && selection && (
        <div
          className="absolute z-10 flex items-center space-x-1"
          style={{
            left: buttonPosition.x,
            top: buttonPosition.y,
          }}
        >
          <button
            onClick={handleAddComment}
            className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded-md text-sm hover:bg-blue-700 shadow-lg"
            title="Add comment to selected text"
          >
            <MessageCircle className="w-3 h-3" />
            <span>Comment</span>
          </button>
          <button
            onClick={handleClearSelection}
            className="bg-gray-500 text-white px-2 py-1 rounded-md text-sm hover:bg-gray-600 shadow-lg"
            title="Clear selection"
          >
            ×
          </button>
        </div>
      )}

      {/* Selection Info */}
      {selection && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border">
          Selected: "{selection.text}" (characters {selection.start}-{selection.end})
        </div>
      )}
    </div>
  );
}