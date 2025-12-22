'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Conversation data model
 */
export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
  unreadCount?: number;
  ltv?: number;
  isVIP?: boolean;
}

/**
 * ConversationList component props
 */
export interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  density?: 'compact' | 'default';
  loading?: boolean;
  className?: string;
}

/**
 * Skeleton loader for conversation items
 */
function ConversationSkeleton({ density }: { density: 'compact' | 'default' }) {
  const avatarSize = density === 'compact' ? 32 : 40;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 animate-pulse bg-white rounded-xl border border-gray-100"
      style={{ minHeight: density === 'compact' ? '56px' : '64px' }}
    >
      <div
        className="rounded-full bg-gray-200 flex-shrink-0"
        style={{ width: avatarSize, height: avatarSize }}
      />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-12" />
    </div>
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}


/**
 * Single conversation item component
 */
function ConversationItem({
  conversation,
  isSelected,
  density,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  density: 'compact' | 'default';
  onSelect: () => void;
}) {
  const avatarSize = density === 'compact' ? 32 : 40;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        transition-colors duration-150 ease-in-out rounded-xl border
        hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] focus-visible:ring-offset-1
        ${isSelected ? 'bg-gray-100 border-blue-200' : 'bg-white border-transparent hover:border-gray-200'}
        ${conversation.unread || isSelected ? 'border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
      `}
      style={{ minHeight: density === 'compact' ? '56px' : '64px' }}
      data-testid="conversation-item"
      data-unread={conversation.unread}
    >
      {/* Avatar - 32-40px as per Requirements 7.1 */}
      <div 
        className="relative flex-shrink-0 rounded-full overflow-hidden bg-gray-200"
        style={{ width: avatarSize, height: avatarSize }}
        data-testid="conversation-avatar"
      >
        {conversation.avatar ? (
          <Image
            src={conversation.avatar}
            alt={conversation.name}
            width={avatarSize}
            height={avatarSize}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
            {conversation.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Content - Clear hierarchy as per Requirements 7.2 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="font-semibold text-gray-900 truncate text-sm"
              data-testid="conversation-name"
            >
              {conversation.name}
            </div>
            {conversation.isVIP ? (
              <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold px-2 py-[2px] border border-purple-100">
                VIP
              </span>
            ) : conversation.ltv ? (
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-[2px] border border-gray-200">
                ${conversation.ltv}
              </span>
            ) : null}
          </div>
          <div
            className="flex-shrink-0 text-[11px] text-gray-400"
            data-testid="conversation-timestamp"
          >
            {formatTimestamp(conversation.timestamp)}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div
            className="text-gray-500 truncate text-xs"
            data-testid="conversation-excerpt"
          >
            {conversation.lastMessage}
          </div>
          {conversation.unreadCount ? (
            <span className="inline-flex items-center justify-center text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2 py-[2px]">
              {conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

/**
 * ConversationList Component
 * 
 * Displays a list of conversations with compact avatars and clear hierarchy.
 * Supports unread indicators with left border as per Requirements 7.3.
 * 
 * @example
 * ```tsx
 * <ConversationList
 *   conversations={conversations}
 *   selectedId={selectedId}
 *   onSelect={(id) => setSelectedId(id)}
 *   density="compact"
 * />
 * ```
 */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  density = 'default',
  loading = false,
  className,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-2" data-testid="conversation-list-loading">
        {Array.from({ length: 8 }).map((_, i) => (
          <ConversationSkeleton key={i} density={density} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 px-4 text-center"
        data-testid="conversation-list-empty"
      >
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No conversations yet</h3>
        <p className="text-sm text-gray-500">Start chatting with your fans to see conversations here.</p>
      </div>
    );
  }

  return (
    <div 
      className={`overflow-y-auto space-y-2 ${className ?? ''}`}
      data-testid="conversation-list"
      role="listbox"
      aria-label="Conversations"
    >
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          density={density}
          onSelect={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
}

export default ConversationList;
