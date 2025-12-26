'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  MainContainer,
  ConversationHeader,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import {
  processMessagesForGrouping,
  formatMessageTime,
  type Message as MessageType,
} from '@/lib/messages/message-grouping';
import { groupMessagesByDate } from '@/lib/messages/date-grouping';
import DateSeparator from './DateSeparator';
import { CustomMessageInput } from './CustomMessageInput';
import './chat-container.css';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date | string; // Allow both Date and ISO string to prevent hydration issues
  sender: {
    id: string;
    name: string;
    avatar: string;
    type: 'creator' | 'fan';
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatContainerProps {
  conversationId: string;
  fanName: string;
  fanAvatar: string;
  fanStatus?: string;
  messages: ChatMessage[];
  isTyping?: boolean;
  onSendMessage: (message: string, attachments?: File[]) => void;
  onAttachFile?: () => void;
  onLoadMore?: () => Promise<void> | void; // Callback to load older messages
  isLoadingMore?: boolean; // NEW: Loading state for older messages
  hasMore?: boolean; // NEW: Pagination state for older messages
  onToggleNotes?: () => void; // Toggle notes panel (desktop)
  showNotes?: boolean; // Whether notes panel is visible
  className?: string;
}

/**
 * ChatContainer - Center column chat interface using Chat UI Kit
 * 
 * Features:
 * - Message list with virtualization
 * - Typing indicators
 * - Message input with attachments
 * - Styled with TailAdmin design tokens
 */
export function ChatContainer({
  conversationId,
  fanName,
  fanAvatar,
  fanStatus = 'Active',
  messages,
  isTyping = false,
  onSendMessage,
  onAttachFile,
  onLoadMore,
  isLoadingMore = false,
  hasMore = true,
  onToggleNotes,
  showNotes = false,
  className = '',
}: ChatContainerProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const preserveScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const isLoadingOlderRef = useRef(false);
  const isNearBottomRef = useRef(true);

  // Normalize timestamps to ISO strings to prevent hydration mismatches
  const normalizedMessages = useMemo(() => {
    return messages
      .map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' 
          ? msg.timestamp 
          : msg.timestamp.toISOString(),
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    bottomSentinelRef.current?.scrollIntoView({ block: 'end', behavior });
  }, []);

  // Initial scroll to the latest message when opening/switching conversations
  useLayoutEffect(() => {
    preserveScrollRef.current = null;
    isLoadingOlderRef.current = false;
    isNearBottomRef.current = true;
    scrollToBottom('auto');
    const resetId = requestAnimationFrame(() => setIsLoadingOlder(false));
    return () => cancelAnimationFrame(resetId);
  }, [conversationId, scrollToBottom]);

  // Track whether user is near the bottom (so we only auto-scroll in that case)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateNearBottom = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isNearBottomRef.current = distanceFromBottom < 120;
    };

    updateNearBottom();
    el.addEventListener('scroll', updateNearBottom, { passive: true });
    return () => el.removeEventListener('scroll', updateNearBottom);
  }, [conversationId]);

  // Load older messages when reaching the top sentinel (and preserve scroll position)
  useEffect(() => {
    const root = listRef.current;
    const target = topSentinelRef.current;
    if (!root || !target || !onLoadMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoadingOlderRef.current || isLoadingMore) return;
        if (!hasMore) return;

        isLoadingOlderRef.current = true;
        setIsLoadingOlder(true);
        preserveScrollRef.current = { scrollHeight: root.scrollHeight, scrollTop: root.scrollTop };

        Promise.resolve(onLoadMore()).catch((error) => {
          console.error('[ChatContainer] Failed to load older messages:', error);
          preserveScrollRef.current = null;
          isLoadingOlderRef.current = false;
          setIsLoadingOlder(false);
        });
      },
      { root, threshold: 0.01, rootMargin: '120px 0px 0px 0px' },
    );

    io.observe(target);
    return () => io.disconnect();
  }, [conversationId, hasMore, isLoadingMore, onLoadMore]);

  // After older messages are prepended, compensate scrollTop to avoid jumps
  useLayoutEffect(() => {
    const root = listRef.current;
    const preserve = preserveScrollRef.current;
    if (!root || !preserve) return;

    const newScrollHeight = root.scrollHeight;
    root.scrollTop = preserve.scrollTop + (newScrollHeight - preserve.scrollHeight);

    preserveScrollRef.current = null;
    isLoadingOlderRef.current = false;
    const resetId = requestAnimationFrame(() => setIsLoadingOlder(false));
    return () => cancelAnimationFrame(resetId);
  }, [normalizedMessages.length]);

  // Auto-scroll to bottom on new messages only if user is already near bottom
  useEffect(() => {
    if (preserveScrollRef.current) return;
    if (!isNearBottomRef.current) return;
    scrollToBottom('smooth');
  }, [normalizedMessages.length, scrollToBottom]);

  const handleSend = (textContent: string) => {
    if (textContent.trim()) {
      onSendMessage(textContent.trim());
      setInputValue('');
    }
  };

  const handleAttachClick = () => {
    if (onAttachFile) {
      onAttachFile();
    }
  };

  // Determine if send button should be active
  const hasText = inputValue.trim().length > 0;

  // Apply has-text class to send button based on input state
  useEffect(() => {
    const sendButton = document.querySelector('.chat-container-wrapper .cs-button--send');
    if (sendButton) {
      if (hasText) {
        sendButton.classList.add('has-text');
      } else {
        sendButton.classList.remove('has-text');
      }
    }
  }, [hasText]);

  return (
    <div className={`chat-container-wrapper ${className}`}>
      <MainContainer className="flex-1 min-h-0 overflow-hidden">
        <div className="cs-chat-container flex-1 min-h-0 overflow-hidden">
          {/* Conversation Header - Sans avatar, juste le nom */}
          <ConversationHeader>
            <ConversationHeader.Content
              userName={fanName}
              info={fanStatus}
            />
          </ConversationHeader>
          
          {/* Notes toggle button - visible on desktop, positioned in header */}
          {onToggleNotes && (
            <div className="chat-header-actions">
              <button
                className={`chat-header-notes-btn ${showNotes ? 'chat-header-notes-btn--active' : ''}`}
                onClick={onToggleNotes}
                aria-label={showNotes ? 'Hide notes' : 'Show notes'}
                aria-pressed={showNotes}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Notes
              </button>
            </div>
          )}

          {/* Messages - Internal scroll only */}
          <div
            ref={listRef}
            className="chat-messages-scroll"
            role="log"
            aria-label="Messages"
            aria-live="polite"
          >
            <div ref={topSentinelRef} />

            {/* Loading indicator for older messages */}
            {(isLoadingMore || isLoadingOlder) && (
              <div className="message-loading-indicator">
                <div className="message-loading-spinner"></div>
                <span>Chargement des messages...</span>
              </div>
            )}
            {(() => {
              // Group messages by date first
              const dateGroups = groupMessagesByDate(normalizedMessages as MessageType[]);
              
              return dateGroups.map((group, groupIndex) => (
                <div key={group.date.toISOString()} className="message-date-group">
                  {/* Date Separator */}
                  <DateSeparator 
                    label={group.label}
                    className={groupIndex === 0 ? 'date-separator--first' : ''}
                  />
                  
                  {/* Messages within this date group */}
                  {(() => {
                    const groupedMessages = processMessagesForGrouping(group.messages as MessageType[]);
                    
                    return groupedMessages.map((msg) => {
                      const isOutgoing = msg.sender.type === 'creator';
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`message-row message-row--${isOutgoing ? 'outgoing' : 'incoming'}`}
                        >
                          <div className={`message-bubble message-bubble--${isOutgoing ? 'outgoing' : 'incoming'}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ));
            })()}

            {isTyping ? (
              <div className="chat-typing-indicator">
                <TypingIndicator content={`${fanName} is typing`} />
              </div>
            ) : null}

            <div ref={bottomSentinelRef} />
          </div>
        </div>
      </MainContainer>

      {/* Custom Message Input - Pilule unifiée style ChatGPT */}
      <CustomMessageInput
        placeholder="Message"
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onAttachClick={onAttachFile ? handleAttachClick : undefined}
        autoFocus
      />
      
      {/* AI Disclaimer - discret sous la barre de message */}
      <div 
        className="ai-disclaimer"
        style={{
          textAlign: 'center',
          fontSize: '11px',
          lineHeight: '14px',
          color: '#9CA3AF',
          padding: '4px 24px 8px 24px',
          margin: 0,
          backgroundColor: 'transparent',
        }}
      >
        Huntaze can make mistakes. Make sure to reread any AI suggestions.
      </div>
    </div>
  );
}
