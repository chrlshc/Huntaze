'use client';

import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface SwipeableItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  deleteLabel?: string;
  archiveLabel?: string;
  deleteThreshold?: number;
  className?: string;
}

export function SwipeableItem({
  children,
  onDelete,
  onArchive,
  deleteLabel = 'Delete',
  archiveLabel = 'Archive',
  deleteThreshold = 50,
  className = '',
}: SwipeableItemProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsSwiping(true);
      const deltaX = eventData.deltaX;
      
      // Limit swipe distance
      if (deltaX < 0 && onDelete) {
        // Swipe left for delete
        setOffset(Math.max(deltaX, -120));
      } else if (deltaX > 0 && onArchive) {
        // Swipe right for archive
        setOffset(Math.min(deltaX, 120));
      }
    },
    onSwiped: (eventData) => {
      setIsSwiping(false);
      const deltaX = eventData.deltaX;
      
      // Check if swipe threshold was met
      if (Math.abs(deltaX) >= deleteThreshold) {
        if (deltaX < 0 && onDelete) {
          // Trigger delete
          onDelete();
        } else if (deltaX > 0 && onArchive) {
          // Trigger archive
          onArchive();
        }
      }
      
      // Reset position
      setOffset(0);
    },
    trackTouch: true,
    trackMouse: false,
    delta: 10,
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between">
        {/* Archive Action (Left) */}
        {onArchive && (
          <div
            className={`flex items-center justify-center h-full px-6 bg-blue-500 text-white font-medium transition-opacity ${
              offset > 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: Math.abs(offset) }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            {offset > 60 && <span className="ml-2">{archiveLabel}</span>}
          </div>
        )}

        {/* Delete Action (Right) */}
        {onDelete && (
          <div
            className={`flex items-center justify-center h-full px-6 bg-red-500 text-white font-medium ml-auto transition-opacity ${
              offset < 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: Math.abs(offset) }}
          >
            {offset < -60 && <span className="mr-2">{deleteLabel}</span>}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Swipeable Content */}
      <div
        {...handlers}
        className={`relative bg-white dark:bg-[#1F1F1F] transition-transform ${
          isSwiping ? 'duration-0' : 'duration-300'
        }`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

interface SwipeableListProps {
  children: React.ReactNode;
  className?: string;
}

export function SwipeableList({ children, className = '' }: SwipeableListProps) {
  return (
    <div className={`space-y-2 ${className}`} role="list">
      {children}
    </div>
  );
}
