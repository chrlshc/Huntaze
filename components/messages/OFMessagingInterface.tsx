'use client';

/**
 * OFMessagingInterface - Messages OnlyFans avec backend scraper
 * 
 * Utilise les endpoints /api/of/messages qui lisent depuis PostgreSQL
 * Le scraper remplit la DB en arrière-plan
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { TailAdminCard } from '@/components/ui/tailadmin/TailAdminCard';
import { FanList } from './FanList';
import { FanCardProps } from './FanCard';
import { ChatContainer, ChatMessage } from './ChatContainer';
import { ContextPanel } from './ContextPanel';
import { 
  useOFThreads, 
  useOFMessages, 
  useOFSyncStatus, 
  useOFSendMessage,
  useOFMarkAsRead,
} from '@/hooks/useOFMessages';
import type { OFThread, OFMessage } from '@/lib/of-messages/types';
import './messaging-interface.css';

// Mobile view states
type MobileView = 'list' | 'chat' | 'notes';

// Map OFThread to FanCardProps for the list
function mapThreadToConversation(thread: OFThread): FanCardProps {
  const diffMs = Date.now() - new Date(thread.lastMessageAt).getTime();
  const MINUTE_MS = 60_000;
  const HOUR_MS = 3_600_000;
  const DAY_MS = 86_400_000;

  let timestamp = '';
  if (diffMs < MINUTE_MS) timestamp = '1m';
  else if (diffMs < HOUR_MS) timestamp = `${Math.floor(diffMs / MINUTE_MS)}m`;
  else if (diffMs < DAY_MS) timestamp = `${Math.floor(diffMs / HOUR_MS)}h`;
  else timestamp = `${Math.floor(diffMs / DAY_MS)}d`;

  return {
    id: thread.id,
    name: thread.fanName,
    avatarUrl: thread.fanAvatar || undefined,
    lastMessage: thread.lastMessagePreview || 'No messages yet',
    timestamp,
    unreadCount: thread.unreadCount,
    isOnline: thread.isOnline,
    tags: thread.isPinned ? ['📌'] : [],
  };
}

// Map OFMessage to ChatMessage
function mapOFMessageToChatMessage(msg: OFMessage, thread: OFThread | null): ChatMessage {
  const isCreator = msg.senderType === 'creator';
  
  return {
    id: msg.id,
    content: msg.content,
    timestamp: msg.sentAt.toString(),
    sender: {
      id: msg.senderId,
      name: isCreator ? 'You' : (thread?.fanName || 'Fan'),
      avatar: isCreator ? '' : (thread?.fanAvatar || ''),
      type: isCreator ? 'creator' : 'fan',
    },
    status: isCreator ? (msg.isRead ? 'read' : 'sent') : undefined,
  };
}

export interface OFMessagingInterfaceProps {
  className?: string;
}

export function OFMessagingInterface({ className = '' }: OFMessagingInterfaceProps) {
  const searchParams = useSearchParams();
  const requestedConversationId = searchParams.get('conversation');

  // OF Messages hooks
  const { threads, unreadCount, isLoading: threadsLoading, error: threadsError, mutate: mutateThreads } = useOFThreads();
  const { syncStatus, triggerSync } = useOFSyncStatus();
  const { sendMessage, isSending, sendError, clearError } = useOFSendMessage();
  const { markAsRead } = useOFMarkAsRead();

  // Local state
  const [userSelectedConversation, setUserSelectedConversation] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);

  // Auto-sync on mount if never synced or stale (> 5 min)
  useEffect(() => {
    if (!syncStatus) return;
    
    const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
    const lastSync = syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).getTime() : 0;
    const isStale = Date.now() - lastSync > STALE_THRESHOLD_MS;
    const neverSynced = !syncStatus.lastSyncAt;
    
    if ((neverSynced || isStale) && !syncStatus.syncInProgress) {
      triggerSync();
    }
  }, [syncStatus, triggerSync]);

  // Refs
  const fanListRef = useRef<HTMLDivElement>(null);
  const contextPanelRef = useRef<HTMLDivElement>(null);

  // Computed values
  const selectedConversation = useMemo(() => {
    if (!threads.length) return null;
    const threadIds = new Set(threads.map(t => t.id));
    if (requestedConversationId && threadIds.has(requestedConversationId)) {
      return requestedConversationId;
    }
    if (userSelectedConversation && threadIds.has(userSelectedConversation)) {
      return userSelectedConversation;
    }
    return threads[0].id;
  }, [requestedConversationId, threads, userSelectedConversation]);

  // Fetch messages for selected thread
  const { 
    thread: selectedThread, 
    messages: apiMessages, 
    isLoading: messagesLoading, 
    error: messagesError,
    mutate: mutateMessages,
  } = useOFMessages(selectedConversation);

  const conversations = useMemo(() => threads.map(mapThreadToConversation), [threads]);
  
  const selectedFan = useMemo(
    () => conversations.find(c => c.id === selectedConversation) || null,
    [conversations, selectedConversation]
  );

  const currentMessages = useMemo(() => {
    const mapped = apiMessages.map(msg => mapOFMessageToChatMessage(msg, selectedThread));
    return [...mapped, ...optimisticMessages];
  }, [apiMessages, selectedThread, optimisticMessages]);

  const effectiveMobileView: MobileView = threads.length ? mobileView : 'list';
  const effectiveShowContext = threads.length ? showContext : false;

  // Mark as read when selecting a thread
  useEffect(() => {
    if (selectedConversation && selectedThread?.unreadCount) {
      markAsRead(selectedConversation);
      mutateThreads();
    }
  }, [selectedConversation, selectedThread?.unreadCount, markAsRead, mutateThreads]);

  // Grid classes
  const gridClasses = [
    'messaging-grid',
    selectedConversation && 'conversation-selected',
    effectiveShowContext && 'show-context',
    `mobile-view-${effectiveMobileView}`,
  ].filter(Boolean).join(' ');

  // Handlers
  const handleConversationSelect = useCallback((conversationId: string) => {
    setUserSelectedConversation(conversationId);
    setOptimisticMessages([]);
    clearError();
    setMobileView('chat');
  }, [clearError]);

  const handleBackToList = useCallback(() => setMobileView('list'), []);
  
  const handleShowNotes = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      setMobileView('notes');
    } else {
      setShowContext(prev => !prev);
    }
  }, []);

  const handleBackToChat = useCallback(() => setMobileView('chat'), []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation) return;

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      content,
      timestamp: new Date().toISOString(),
      sender: { id: 'creator', name: 'You', avatar: '', type: 'creator' },
      status: 'sending',
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);

    const result = await sendMessage({ threadId: selectedConversation, content });
    
    if (result.success) {
      // Remove optimistic message, refresh will bring the real one
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
      mutateMessages();
      mutateThreads();
    } else {
      // Remove failed message (user can retry)
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
    }
  }, [selectedConversation, sendMessage, mutateMessages, mutateThreads]);

  const handleSync = useCallback(async () => {
    await triggerSync();
    mutateThreads();
  }, [triggerSync, mutateThreads]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = fanListRef.current?.querySelector<HTMLInputElement>('[type="search"]');
        searchInput?.focus();
      }
      if (e.key === 'Escape' && window.innerWidth < 768) {
        setUserSelectedConversation(null);
        setShowContext(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className={`messaging-interface ${className}`}
      role="main"
      aria-label="OnlyFans Messaging"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Sync status banner */}
      {syncStatus?.syncInProgress && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
          <span className="animate-spin">⟳</span>
          Synchronisation en cours...
        </div>
      )}
      
      {syncStatus?.errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 flex items-center justify-between">
          <span>Erreur de sync: {syncStatus.errorMessage}</span>
          <button onClick={handleSync} className="underline">Réessayer</button>
        </div>
      )}

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
          <TailAdminCard padding="none" className="flex-1 min-h-0 overflow-hidden">
            {/* Sync status indicator */}
            {syncStatus?.syncInProgress && (
              <div className="px-3 py-1.5 border-b bg-blue-50 text-blue-600 text-xs flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                Synchronisation...
              </div>
            )}

            {threadsError && (
              <div role="alert" className="p-2 bg-red-50 text-red-700 text-xs border-b">
                Erreur de chargement
                <button onClick={() => mutateThreads()} className="ml-2 underline">Réessayer</button>
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

        {/* Center Column: Chat */}
        <main 
          className="messaging-column messaging-column--center"
          data-column="chat"
          role="main"
          aria-label="Active conversation"
          tabIndex={-1}
        >
          {/* Mobile header */}
          <div className="mobile-chat-header">
            <div className="mobile-chat-header-inner">
              <button className="mobile-nav-btn mobile-nav-btn--back" onClick={handleBackToList}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {selectedFan && (
                <>
                  {selectedFan.avatarUrl ? (
                    <Image src={selectedFan.avatarUrl} alt={selectedFan.name} width={36} height={36} className="mobile-header-avatar" />
                  ) : (
                    <div className="mobile-header-avatar bg-gray-200" />
                  )}
                  <div className="mobile-header-info">
                    <div className="mobile-header-name">{selectedFan.name}</div>
                    <div className="mobile-header-status">{selectedFan.isOnline ? 'Online' : 'Offline'}</div>
                  </div>
                </>
              )}
              
              <button className="mobile-nav-btn mobile-nav-btn--notes" onClick={handleShowNotes}>Notes</button>
            </div>
          </div>

          <TailAdminCard padding="none" className="flex-1 min-h-0 overflow-hidden">
            {(messagesError || sendError) && (
              <div role="alert" className="p-2 bg-orange-50 text-orange-700 text-xs border-b flex justify-between">
                <span>{messagesError ? 'Erreur de chargement' : sendError}</span>
                {messagesError && <button onClick={() => mutateMessages()} className="underline">Réessayer</button>}
              </div>
            )}

            {selectedConversation && selectedFan ? (
              messagesLoading && currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <h3 className="text-lg font-semibold mb-2">Chargement...</h3>
                </div>
              ) : (
                <ChatContainer
                  conversationId={selectedConversation}
                  fanName={selectedFan.name}
                  fanAvatar={selectedFan.avatarUrl || ''}
                  fanStatus={selectedFan.isOnline ? 'Online' : 'Offline'}
                  messages={currentMessages}
                  isTyping={false}
                  onSendMessage={handleSendMessage}
                  onAttachFile={() => {}}
                  onToggleNotes={handleShowNotes}
                  showNotes={effectiveShowContext}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                <h3 className="text-lg font-semibold mb-2">
                  {threads.length === 0 && syncStatus?.syncInProgress 
                    ? 'Synchronisation en cours...' 
                    : threads.length === 0 
                      ? 'Aucune conversation' 
                      : 'Sélectionnez une conversation'}
                </h3>
                {threads.length === 0 && !syncStatus?.syncInProgress && (
                  <p className="text-sm text-gray-400">Les messages se synchronisent automatiquement</p>
                )}
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
          aria-label="Fan context"
          tabIndex={-1}
        >
          <div className="mobile-notes-header">
            <button className="mobile-nav-btn mobile-nav-btn--back" onClick={handleBackToChat}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back</span>
            </button>
            <span className="mobile-notes-title">{selectedFan?.name || 'Fan Notes'}</span>
          </div>
          <ContextPanel
            fanContext={selectedThread ? {
              fanId: selectedThread.ofUserId,
              name: selectedThread.fanName,
              avatar: selectedThread.fanAvatar || '',
              status: selectedThread.isOnline ? 'active' : 'inactive',
              joinDate: new Date(selectedThread.createdAt),
              lastActive: new Date(selectedThread.lastMessageAt),
              totalSpent: 0,
              subscriptionTier: 'Standard',
              notes: [],
              tags: selectedThread.isPinned ? [{ id: 'pinned', label: '📌 Pinned', color: 'warning' }] : [],
            } : null}
            onAddNote={() => {}}
            onRemoveTag={() => {}}
          />
        </aside>
      </div>
    </div>
  );
}
