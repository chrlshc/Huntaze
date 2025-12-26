'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ComponentProps } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { TailAdminCard } from '@/components/ui/tailadmin/TailAdminCard';
import { FanList } from './FanList';
import { FanCardProps } from './FanCard';
import { ChatContainer, ChatMessage } from './ChatContainer';
import { ContextPanel } from './ContextPanel';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { Message, MessageThread, UnifiedMessagesResponse } from '@/lib/types/messages';
import type { Fan } from '@/lib/services/crmData';
import { useMarkMessageRead } from '@/hooks/messages/useMarkMessageRead';
import './messaging-interface.css';

type ContextPanelProps = ComponentProps<typeof ContextPanel>;
type FanContext = NonNullable<ContextPanelProps['fanContext']>;

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const ACTIVE_WINDOW_MS = 30 * DAY_MS;

function formatRelativeTimestamp(value?: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return '';

  const diffMs = Math.max(0, Date.now() - timestamp);

  if (diffMs < MINUTE_MS) return '1m';
  if (diffMs < HOUR_MS) {
    return `${Math.max(1, Math.floor(diffMs / MINUTE_MS))}m`;
  }
  if (diffMs < DAY_MS) {
    return `${Math.floor(diffMs / HOUR_MS)}h`;
  }
  return `${Math.floor(diffMs / DAY_MS)}d`;
}

function normalizeTagList(tags: Fan['tags']): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag)).filter((tag) => tag.trim().length > 0);
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag)).filter((tag) => tag.trim().length > 0);
      }
    } catch {
      // noop - fall through to comma split
    }
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  return [];
}

function tagToColor(label: string): FanContext['tags'][number]['color'] {
  const normalized = label.toLowerCase();
  if (normalized.includes('vip')) return 'warning';
  if (normalized.includes('top')) return 'success';
  if (normalized.includes('loyal')) return 'primary';
  if (normalized.includes('new')) return 'info';
  if (normalized.includes('risk')) return 'danger';
  return 'info';
}

function buildFanContext(fan: Fan | undefined, thread?: MessageThread | null): FanContext | null {
  if (!fan && !thread) return null;

  const fallbackId = thread?.sender.id ?? 'fan';
  const fallbackName = thread?.sender.name ?? 'Fan';
  const fallbackAvatar = thread?.sender.avatar ?? '';
  const tags = normalizeTagList(fan?.tags);
  if (tags.length === 0 && thread?.sender.tier) {
    tags.push(thread.sender.tier);
  }

  const createdAt = fan?.createdAt ? new Date(fan.createdAt) : new Date();
  const lastActive = fan?.lastSeenAt
    ? new Date(fan.lastSeenAt)
    : fan?.updatedAt
      ? new Date(fan.updatedAt)
      : createdAt;
  const lastActiveMs = lastActive.getTime();
  const isActive = Number.isFinite(lastActiveMs) && Date.now() - lastActiveMs <= ACTIVE_WINDOW_MS;
  const isVip = tags.some((tag) => tag.toLowerCase() === 'vip');
  const totalSpent =
    typeof fan?.valueCents === 'number' && Number.isFinite(fan.valueCents)
      ? fan.valueCents / 100
      : 0;

  const notes: FanContext['notes'] = [];
  if (fan?.notes && typeof fan.notes === 'string' && fan.notes.trim()) {
    notes.push({
      id: `note-${fan.id}`,
      content: fan.notes,
      createdAt,
      author: 'System',
      category: 'engagement',
    });
  }

  return {
    fanId: String(fan?.id ?? fallbackId),
    name: fan?.name ?? fallbackName,
    avatar: fan?.avatar ?? fallbackAvatar,
    status: isVip ? 'vip' : isActive ? 'active' : 'inactive',
    joinDate: createdAt,
    lastActive,
    totalSpent,
    subscriptionTier: isVip ? 'VIP' : 'Standard',
    notes,
    tags: tags.map((tag, index) => ({
      id: `${fan?.id ?? fallbackId}-${index}`,
      label: tag,
      color: tagToColor(tag),
    })),
  };
}

function mapThreadToConversation(thread: MessageThread): FanCardProps {
  const timestampSource = thread.lastMessage?.timestamp || thread.updatedAt;
  const lastMessageText = thread.lastMessage?.content?.trim() || 'No messages yet';
  const diffMs = timestampSource ? Date.now() - new Date(timestampSource).getTime() : Number.POSITIVE_INFINITY;

  return {
    id: thread.id,
    name: thread.sender.name,
    avatarUrl: thread.sender.avatar,
    lastMessage: lastMessageText,
    timestamp: formatRelativeTimestamp(timestampSource),
    unreadCount: thread.unreadCount || 0,
    isOnline: Number.isFinite(diffMs) && diffMs >= 0 && diffMs < 5 * MINUTE_MS,
    tags: thread.sender.tier ? [thread.sender.tier] : [],
  };
}

function mapMessageStatus(status?: Message['status']): ChatMessage['status'] {
  if (!status) return undefined;
  if (status === 'read') return 'read';
  if (status === 'replied') return 'delivered';
  if (status === 'unread') return 'sent';
  return 'sent';
}

function mapMessageToChatMessage(
  message: Message,
  creatorId: string | undefined,
  thread?: MessageThread | null
): ChatMessage {
  const senderId = message.sender?.id || '';
  const isCreator = creatorId ? senderId === creatorId : false;
  const senderName = message.sender?.name || (isCreator ? 'You' : thread?.sender.name || 'Fan');
  const senderAvatar = message.sender?.avatar || (isCreator ? '' : thread?.sender.avatar || '');

  return {
    id: message.id,
    content: message.content || '',
    timestamp: message.timestamp,
    sender: {
      id: senderId || (isCreator ? creatorId || 'creator' : thread?.sender.id || 'fan'),
      name: senderName,
      avatar: senderAvatar || '',
      type: isCreator ? 'creator' : 'fan',
    },
    status: isCreator ? mapMessageStatus(message.status) : undefined,
  };
}
export interface MessagingInterfaceProps {
  className?: string;
}

/**
 * MessagingInterface - Three-column layout for messages
 * 
 * Layout structure:
 * - Left column (25%): Fan/conversation list
 * - Center column (45-50%): Active chat/messages
 * - Right column (25-30%): Fan context panel
 * 
 * Responsive behavior:
 * - Desktop (>1024px): Three columns
 * - Tablet (768-1024px): Two columns (list + chat OR chat + context)
 * - Mobile (<768px): Single column with navigation
 * 
 * Keyboard Navigation:
 * - Tab: Navigate through interactive elements in logical order
 * - Ctrl/Cmd+K: Focus search input
 * - Escape: Clear selection on mobile
 * - Enter: Select conversation or send message
 * - Shift+Enter: New line in message input
 */
// Mobile view states
type MobileView = 'list' | 'chat' | 'notes';

export function MessagingInterface({ 
  className = '',
}: MessagingInterfaceProps) {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  const { data: session } = useSession();
  const creatorId = session?.user?.id;
  const { markAsRead } = useMarkMessageRead();

  const {
    data: threadsData,
    error: threadsError,
    isLoading: threadsLoading,
    mutate: mutateThreads,
  } = useSWR<UnifiedMessagesResponse>(
    creatorId ? `/api/messages/unified?creatorId=${creatorId}` : null,
    (url) => internalApiFetch<UnifiedMessagesResponse>(url),
  );

  const threads = useMemo(() => threadsData?.threads ?? [], [threadsData]);
  const conversations = useMemo(() => threads.map(mapThreadToConversation), [threads]);

  const { data: fansData } = useSWR<{ fans: Fan[] }>(
    creatorId && threads.length > 0 ? '/api/crm/fans' : null,
    (url) => internalApiFetch<{ fans: Fan[] }>(url),
  );

  const fanById = useMemo(() => {
    const map = new Map<string, Fan>();
    for (const fan of fansData?.fans ?? []) {
      if (fan?.id !== undefined && fan?.id !== null) {
        map.set(String(fan.id), fan);
      }
    }
    return map;
  }, [fansData]);

  const [userSelectedConversation, setUserSelectedConversation] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [optimisticMessagesByConversation, setOptimisticMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [sendError, setSendError] = useState<{ conversationId: string | null; message: string | null }>({
    conversationId: null,
    message: null,
  });

  const selectedConversation = useMemo(() => {
    if (!threads.length) return null;
    const threadIds = new Set(threads.map((thread) => thread.id));
    if (requestedConversationId && threadIds.has(requestedConversationId)) {
      return requestedConversationId;
    }
    if (userSelectedConversation && threadIds.has(userSelectedConversation)) {
      return userSelectedConversation;
    }
    return threads[0].id;
  }, [requestedConversationId, threads, userSelectedConversation]);

  const effectiveMobileView: MobileView = threads.length ? mobileView : 'list';
  const effectiveShowContext = threads.length ? showContext : false;
  const activeSendError = sendError.conversationId === selectedConversation ? sendError.message : null;

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedConversation) || null,
    [threads, selectedConversation],
  );

  const selectedFan = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversation) || null,
    [conversations, selectedConversation],
  );

  const currentFanContext = useMemo(
    () => buildFanContext(selectedThread ? fanById.get(selectedThread.sender.id) : undefined, selectedThread),
    [fanById, selectedThread],
  );

  const {
    data: messagesData,
    error: messagesError,
    isLoading: messagesLoading,
    mutate: mutateMessages,
  } = useSWR<{ messages: Message[] }>(
    selectedConversation && creatorId ? `/api/messages/${selectedConversation}?creatorId=${creatorId}` : null,
    (url) => internalApiFetch<{ messages: Message[] }>(url),
  );

  const apiMessages = useMemo(
    () => (messagesData?.messages ?? []).map((message) => mapMessageToChatMessage(message, creatorId, selectedThread)),
    [messagesData, creatorId, selectedThread],
  );

  const optimisticMessages = useMemo(
    () => (selectedConversation ? optimisticMessagesByConversation[selectedConversation] || [] : []),
    [optimisticMessagesByConversation, selectedConversation],
  );

  const currentMessages = useMemo(
    () => [...apiMessages, ...optimisticMessages],
    [apiMessages, optimisticMessages],
  );
  // Refs for focus management
  const fanListRef = useRef<HTMLDivElement>(null);
  const contextPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedConversation || !selectedThread?.unreadCount) return;

    void markAsRead({ threadId: selectedConversation });
    mutateThreads((current) => {
      if (!current) return current;
      return {
        ...current,
        threads: current.threads.map((thread) =>
          thread.id === selectedConversation
            ? { ...thread, unreadCount: 0, status: 'read', priority: 'normal' }
            : thread
        ),
      };
    }, false);
  }, [markAsRead, mutateThreads, selectedConversation, selectedThread?.unreadCount]);

  const isTyping = false;

  // Build grid class names based on state
  const gridClasses = [
    'messaging-grid',
    selectedConversation && 'conversation-selected',
    effectiveShowContext && 'show-context',
    `mobile-view-${effectiveMobileView}`,
  ].filter(Boolean).join(' ');

  // Handle mobile conversation selection - go to chat view
  const handleConversationSelect = useCallback((conversationId: string) => {
    setUserSelectedConversation(conversationId);
    setSendError({ conversationId, message: null });
    setMobileView('chat');
  }, []);

  // Handle mobile back to list
  const handleBackToList = useCallback(() => {
    setMobileView('list');
  }, []);

  // Handle show notes - mobile: change view, desktop: toggle context panel
  const handleShowNotes = useCallback(() => {
    // Check if we're on mobile (< 768px)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (isMobile) {
      setMobileView('notes');
    } else {
      // On desktop, toggle the context panel (column 3)
      setShowContext(prev => !prev);
    }
  }, []);

  // Handle mobile back to chat from notes
  const handleBackToChat = useCallback(() => {
    setMobileView('chat');
  }, []);

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = fanListRef.current?.querySelector<HTMLInputElement>('[type="search"]');
        searchInput?.focus();
      }
      
      // Escape: Clear selection on mobile
      if (e.key === 'Escape') {
        if (window.innerWidth < 768) {
          setUserSelectedConversation(null);
          setShowContext(false);
        }
      }

      // Tab navigation: Move focus through logical order
      // This is handled by browser's default tab behavior with proper tabIndex
      // but we can enhance it if needed
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation || !creatorId) return;

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        content,
        timestamp: new Date().toISOString(),
        sender: {
          id: creatorId,
          name: session?.user?.name || 'You',
          avatar: session?.user?.image || '',
          type: 'creator',
        },
        status: 'sending',
      };

      setSendError({ conversationId: selectedConversation, message: null });
      setOptimisticMessagesByConversation((prev) => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] || []), optimisticMessage],
      }));

      try {
        const response = await internalApiFetch<{ message: Message }>(
          `/api/messages/${selectedConversation}/send`,
          {
            method: 'POST',
            body: { creatorId, content },
          },
        );

        setOptimisticMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation]: (prev[selectedConversation] || []).filter(
            (message) => message.id !== optimisticId,
          ),
        }));

        if (response?.message) {
          mutateMessages(
            (current) => ({
              ...current,
              messages: [...(current?.messages || []), response.message],
            }),
            false,
          );
        } else {
          void mutateMessages();
        }

        void mutateThreads();
      } catch (error) {
        setOptimisticMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation]: (prev[selectedConversation] || []).filter(
            (message) => message.id !== optimisticId,
          ),
        }));
        setSendError({
          conversationId: selectedConversation,
          message: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    },
    [creatorId, mutateMessages, mutateThreads, selectedConversation, session?.user?.image, session?.user?.name],
  );

  const handleAttachFile = useCallback(() => {
    // TODO: Implement file attachment
  }, []);

  const handleAddNote = useCallback(() => {
    // TODO: Implement add note modal
  }, []);

  const handleRemoveTag = useCallback((tagId: string) => {
    // TODO: Implement tag removal API call
    // For now, just show a confirmation
    if (confirm('Are you sure you want to remove this tag?')) {
      void tagId;
      // In production, call API: await fetch(`/api/fans/${fanId}/tags/${tagId}`, { method: 'DELETE' })
    }
  }, []);

  return (
    <div 
      className={`messaging-interface ${className}`}
      role="main"
      aria-label="Messaging interface"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Three-column grid layout - Header removed for full height */}
      <div 
        className={gridClasses}
        role="region"
        aria-label="Messaging workspace"
        style={{ display: 'grid', flex: '1 1 auto', minHeight: 0 }}
      >
        {/* Left Column: Fan List */}
        <aside 
          ref={fanListRef}
          className="messaging-column messaging-column--left"
          data-column="fan-list"
          role="complementary"
          aria-label="Conversations list"
          tabIndex={-1}
        >
          <TailAdminCard
            padding="none"
            className="flex-1 min-h-0 overflow-hidden messaging-interface__fan-list-card"
          >
            {threadsError && (
              <div
                role="alert"
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #fecaca',
                  background: '#fee2e2',
                  color: '#991b1b',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span>Failed to load conversations.</span>
                <button
                  type="button"
                  onClick={() => void mutateThreads()}
                  style={{
                    border: '1px solid #fca5a5',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    background: '#fff1f2',
                    color: '#991b1b',
                  }}
                >
                  Retry
                </button>
              </div>
            )}
            <FanList
              conversations={conversations}
              activeConversationId={selectedConversation || undefined}
              onConversationSelect={handleConversationSelect}
              isLoading={threadsLoading}
            />
          </TailAdminCard>
        </aside>

        {/* Center Column: Chat Container */}
        <main 
          className="messaging-column messaging-column--center"
          data-column="chat"
          role="main"
          aria-label="Active conversation"
          tabIndex={-1}
        >
          {/* Mobile navigation header - iMessage style */}
          <div className="mobile-chat-header">
            <div className="mobile-chat-header-inner">
              <button 
                className="mobile-nav-btn mobile-nav-btn--back"
                onClick={handleBackToList}
                aria-label="Back to conversations"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {selectedFan && (
                <>
                  {selectedFan.avatarUrl ? (
                    <Image
                      src={selectedFan.avatarUrl}
                      alt={selectedFan.name}
                      width={36}
                      height={36}
                      className="mobile-header-avatar"
                    />
                  ) : (
                    <div className="mobile-header-avatar bg-gray-200" aria-hidden="true" />
                  )}
                  <div className="mobile-header-info">
                    <div className="mobile-header-name">{selectedFan.name}</div>
                    <div className="mobile-header-status">
                      {selectedFan.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </>
              )}
              
              <button 
                className="mobile-nav-btn mobile-nav-btn--notes"
                onClick={handleShowNotes}
                aria-label="View fan notes"
              >
                Notes
              </button>
            </div>
          </div>
          <TailAdminCard padding="none" className="flex-1 min-h-0 overflow-hidden">
            {selectedConversation && selectedFan ? (
              <>
                {(messagesError || activeSendError) && (
                  <div
                    role="alert"
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #fed7aa',
                      background: '#ffedd5',
                      color: '#9a3412',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span>
                      {messagesError
                        ? 'Failed to load messages.'
                        : activeSendError || 'Failed to send message.'}
                    </span>
                    {messagesError && (
                      <button
                        type="button"
                        onClick={() => void mutateMessages()}
                        style={{
                          border: '1px solid #fdba74',
                          borderRadius: '999px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          background: '#ffedd5',
                          color: '#9a3412',
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
                {messagesLoading && currentMessages.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full text-gray-500 p-8"
                    role="status"
                    aria-live="polite"
                  >
                    <h3 className="text-lg font-semibold mb-2">Loading messages</h3>
                    <p>Fetching the latest conversation...</p>
                  </div>
                ) : (
                  <ChatContainer
                    conversationId={selectedConversation}
                    fanName={selectedFan.name}
                    fanAvatar={selectedFan.avatarUrl || ''}
                    fanStatus={selectedFan.isOnline ? 'Online' : 'Offline'}
                    messages={currentMessages}
                    isTyping={isTyping}
                    onSendMessage={handleSendMessage}
                    onAttachFile={handleAttachFile}
                    onToggleNotes={handleShowNotes}
                    showNotes={effectiveShowContext}
                  />
                )}
              </>
            ) : (
              <div 
                className="flex flex-col items-center justify-center h-full text-gray-500 p-8"
                role="status"
                aria-live="polite"
              >
                <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </TailAdminCard>
        </main>

        {/* Right Column: Context Panel */}
        <aside 
          ref={contextPanelRef}
          className="messaging-column messaging-column--right"
          data-column="context"
          role="complementary"
          aria-label="Fan context and information"
          tabIndex={-1}
        >
          {/* Mobile navigation header for notes */}
          <div className="mobile-notes-header">
            <button 
              className="mobile-nav-btn mobile-nav-btn--back"
              onClick={handleBackToChat}
              aria-label="Back to chat"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back</span>
            </button>
            <span className="mobile-notes-title">
              {selectedFan ? `${selectedFan.name}` : 'Fan Notes'}
            </span>
          </div>
          <ContextPanel
            fanContext={currentFanContext}
            onAddNote={handleAddNote}
            onRemoveTag={handleRemoveTag}
          />
        </aside>
      </div>

      {/* Mobile navigation controls - hidden, using inline buttons now */}
      <div 
        className="messaging-mobile-nav messaging-mobile-nav--hidden"
        role="navigation"
        aria-label="Mobile view controls"
        aria-hidden="true"
      >
        {/* Legacy toggle - kept for backwards compatibility */}
      </div>
    </div>
  );
}
