'use client';

import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { FanCard, FanCardProps } from './FanCard';
import { SearchInput } from '@/components/ui/SearchInput';
import './fan-list.css';

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export type FilterType = 'all' | 'unread' | 'vip';

function parseRelativeTimestampMsAgo(raw: string | undefined): number {
  if (!raw) return -1;
  const match = raw.trim().match(/^(\d+)\s*([a-zA-Z]+)$/);
  if (!match) return -1;

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(value)) return -1;

  switch (unit) {
    case 'm':
    case 'min':
    case 'mins':
    case 'minute':
    case 'minutes':
      return value * 60_000;
    case 'h':
    case 'hr':
    case 'hrs':
    case 'hour':
    case 'hours':
      return value * 3_600_000;
    case 'd':
    case 'day':
    case 'days':
    case 'j': // jour
      return value * 86_400_000;
    default:
      return -1;
  }
}

export interface FanListProps {
  conversations: FanCardProps[];
  activeConversationId?: string;
  onConversationSelect?: (id: string) => void;
  isLoading?: boolean;
}

export const FanList: React.FC<FanListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter and search logic with debounced query
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Apply filter
    if (activeFilter === 'unread') {
      filtered = filtered.filter(conv => (conv.unreadCount ?? 0) > 0);
    } else if (activeFilter === 'vip') {
      filtered = filtered.filter(conv => 
        conv.tags?.some(tag => tag.toLowerCase() === 'vip')
      );
    }

    // Apply search with debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.name.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Oldest -> newest (newest appears at bottom, like a message thread)
    filtered.sort((a, b) => {
      const aAge = parseRelativeTimestampMsAgo(a.timestamp);
      const bAge = parseRelativeTimestampMsAgo(b.timestamp);
      return bAge - aAge;
    });

    return filtered;
  }, [conversations, activeFilter, debouncedSearchQuery]);

  const handleFilterClick = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with Ctrl/Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Arrow keys to navigate conversations
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const conversationItems = document.querySelectorAll('[role="button"][data-conversation-id]');
        if (conversationItems.length === 0) return;

        const activeElement = document.activeElement;
        const currentIndex = Array.from(conversationItems).indexOf(activeElement as Element);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, conversationItems.length - 1);
          (conversationItems[nextIndex] as HTMLElement).focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = currentIndex === -1 ? conversationItems.length - 1 : Math.max(currentIndex - 1, 0);
          (conversationItems[prevIndex] as HTMLElement).focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // On mount / selection change: keep the active conversation (or newest) visible.
  useLayoutEffect(() => {
    const root = conversationScrollRef.current;
    if (!root) return;

    const raf = requestAnimationFrame(() => {
      if (activeConversationId) {
        const activeEl = root.querySelector<HTMLElement>(
          `[data-conversation-id="${activeConversationId}"]`,
        );
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          return;
        }
      }

      // Default: scroll to the bottom (most recent at bottom).
      root.scrollTop = root.scrollHeight;
    });

    return () => cancelAnimationFrame(raf);
  }, [activeConversationId]);

  return (
    <div 
      className="fan-list"
      role="region"
      aria-label="Conversations list"
    >
      {/* Search Bar */}
      <div className="fan-list__search">
        <SearchInput
          ref={searchInputRef}
          placeholder="Search…"
          value={searchQuery}
          onChange={setSearchQuery}
          ariaLabel="Search conversations"
          showClearButton
          inputProps={{
            type: 'search',
            'aria-describedby': 'search-help',
            style: {
              height: '36px',
              fontSize: '13px',
              padding: '6px 12px',
              paddingLeft: '40px',
              paddingRight: '40px',
            },
          }}
        />
        <span id="search-help" className="sr-only">
          Search by name, message content, or tags
        </span>
      </div>

      {/* Filter Buttons */}
      <div 
        className="fan-list__filters"
        role="group"
        aria-label="Filter conversations"
      >
        <button
          className={`fan-list__filter-btn ${activeFilter === 'all' ? 'fan-list__filter-btn--active' : ''}`}
          onClick={() => handleFilterClick('all')}
          aria-pressed={activeFilter === 'all'}
        >
          All
          <span className="fan-list__filter-count">
            ({conversations.length})
          </span>
        </button>
        <button
          className={`fan-list__filter-btn ${activeFilter === 'unread' ? 'fan-list__filter-btn--active' : ''}`}
          onClick={() => handleFilterClick('unread')}
          aria-pressed={activeFilter === 'unread'}
        >
          Unread
          <span className="fan-list__filter-count">
            ({conversations.filter(c => (c.unreadCount ?? 0) > 0).length})
          </span>
        </button>
        <button
          className={`fan-list__filter-btn ${activeFilter === 'vip' ? 'fan-list__filter-btn--active' : ''}`}
          onClick={() => handleFilterClick('vip')}
          aria-pressed={activeFilter === 'vip'}
        >
          VIP
          <span className="fan-list__filter-count">
            ({conversations.filter(c => c.tags?.some(t => t.toLowerCase() === 'vip')).length})
          </span>
        </button>
      </div>

      {/* Conversation List */}
      <div 
        className="fan-list__conversations"
        role="list"
        aria-label={`${filteredConversations.length} conversations`}
        aria-live="polite"
        aria-busy={isLoading}
        ref={conversationScrollRef}
      >
        {isLoading ? (
          <div 
            className="fan-list__loading"
            role="status"
            aria-label="Loading conversations"
          >
            <div className="fan-list__skeleton" />
            <div className="fan-list__skeleton" />
            <div className="fan-list__skeleton" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div 
            className="fan-list__empty"
            role="status"
            aria-live="polite"
          >
            <svg
              className="fan-list__empty-icon"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 20H16.02"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 20H32.02"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 32C16 32 19 28 24 28C29 28 32 32 32 32"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="fan-list__empty-text">
              {searchQuery || activeFilter !== 'all'
                ? 'No conversation found'
                : 'No conversations'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                className="fan-list__empty-action"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <FanCard
              key={conversation.id}
              {...conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => onConversationSelect?.(conversation.id)}
            />
          ))
        )}
      </div>

      {/* Footer Spacer for Column Alignment */}
      <div className="fan-list__footer-spacer" />
    </div>
  );
};
