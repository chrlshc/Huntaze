'use client';

import React, { useState } from 'react';
import { useUnifiedMessages } from '@/hooks/messages/useUnifiedMessages';
import { MessageSquare, Star, Check, Send, Loader2 } from 'lucide-react';
import type { MessagePlatform, MessageThread } from '@/lib/types/messages';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';

export default function MessagesPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<MessagePlatform | 'all'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [page, setPage] = useState(0);
  const [allThreads, setAllThreads] = useState<MessageThread[]>([]);

  const creatorId = 'creator_123';
  const THREADS_PER_PAGE = 20;

  const { messages, isLoading, error } = useUnifiedMessages({
    creatorId,
    platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
    filter: selectedFilter,
    limit: THREADS_PER_PAGE,
    offset: page * THREADS_PER_PAGE,
  });

  const threads = messages?.threads || [];
  const stats = messages?.stats;
  const [isSending, setIsSending] = useState(false);

  // Accumulate threads when new data arrives
  React.useEffect(() => {
    if (threads && threads.length > 0) {
      if (page === 0) {
        // First page - replace all threads
        setAllThreads(threads);
      } else {
        // Subsequent pages - append new threads, avoiding duplicates
        setAllThreads(prev => {
          const existingIds = new Set(prev.map((t: MessageThread) => t.id));
          const newThreads = threads.filter((t: MessageThread) => !existingIds.has(t.id));
          return [...prev, ...newThreads];
        });
      }
    }
  }, [threads, page]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(0);
    setAllThreads([]);
  }, [selectedPlatform, selectedFilter]);

  const hasMoreThreads = threads && threads.length === THREADS_PER_PAGE;
  const displayThreads = allThreads.length > 0 ? allThreads : threads || [];

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !messageInput.trim()) return;

    setIsSending(true);
    try {
      // TODO: Implement sendMessage API call
      // await messagesService.sendMessage({
      //   creatorId,
      //   threadId: selectedThread.id,
      //   platform: selectedThread.platform,
      //   content: messageInput,
      // });
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getPlatformColor = (platform: MessagePlatform) => {
    switch (platform) {
      case 'onlyfans': return 'bg-blue-100 text-blue-800';
      case 'instagram': return 'bg-pink-100 text-pink-800';
      case 'tiktok': return 'bg-purple-100 text-purple-800';
      case 'reddit': return 'bg-orange-100 text-orange-800';
      case 'fansly': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Retry mechanism with exponential backoff
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = React.useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Force refresh by resetting page
    setPage(0);
    setAllThreads([]);
    setIsRetrying(false);
  }, [retryCount]);

  // Auto-retry on error (max 3 attempts)
  React.useEffect(() => {
    if (error && retryCount < 3 && !isRetrying) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000); // Wait 2s before auto-retry
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, isRetrying, handleRetry]);

  if (isLoading && displayThreads.length === 0) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[var(--color-indigo)] animate-spin mx-auto mb-4" />
            <p className="text-[var(--color-text-sub)]">Loading messages...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && displayThreads.length === 0) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="max-w-md w-full p-6">
            <div className="bg-red-50 border border-red-200 rounded-[var(--radius-card)] p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-red-800 font-semibold mb-2">Failed to load messages</h3>
              <p className="text-red-600 text-sm mb-4">
                {error.message || 'Unable to connect to the messaging service'}
              </p>
              
              {retryCount < 3 ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    {isRetrying ? 'Retrying...' : `Retry attempt ${retryCount + 1} of 3`}
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      'Retry Now'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 mb-2">
                    Maximum retry attempts reached
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <ContentPageErrorBoundary pageName="Messages">
        <div className="h-[calc(100vh-4rem)] flex">
        {/* Platform Selector - Left Column */}
      <div className="w-64 border-r border-gray-200 bg-[var(--bg-surface)] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Platforms</h2>
          
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
              selectedPlatform === 'all'
                ? 'bg-[var(--color-indigo)] text-white'
                : 'hover:bg-gray-100 text-[var(--color-text-main)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>All Messages</span>
              {stats && <span className="text-sm">{stats.totalUnread}</span>}
            </div>
          </button>

          {(['onlyfans', 'instagram', 'tiktok', 'reddit', 'fansly'] as MessagePlatform[]).map(platform => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                selectedPlatform === platform
                  ? 'bg-[var(--color-indigo)] text-white'
                  : 'hover:bg-gray-100 text-[var(--color-text-main)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize">{platform}</span>
                {stats && stats.byPlatform[platform] > 0 && (
                  <span className="text-sm">{stats.byPlatform[platform]}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-medium text-[var(--color-text-sub)] mb-2">Filters</h3>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 text-sm ${
              selectedFilter === 'all'
                ? 'bg-gray-100 text-[var(--color-text-main)]'
                : 'text-[var(--color-text-sub)] hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('unread')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 text-sm ${
              selectedFilter === 'unread'
                ? 'bg-gray-100 text-[var(--color-text-main)]'
                : 'text-[var(--color-text-sub)] hover:bg-gray-50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setSelectedFilter('starred')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              selectedFilter === 'starred'
                ? 'bg-gray-100 text-[var(--color-text-main)]'
                : 'text-[var(--color-text-sub)] hover:bg-gray-50'
            }`}
          >
            Starred
          </button>
        </div>
      </div>

      {/* Thread List - Middle Column */}
      <div className="w-96 border-r border-gray-200 bg-[var(--bg-surface)] flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayThreads.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">No messages</h3>
              <p className="text-[var(--color-text-sub)]">Your messages will appear here</p>
            </div>
          ) : (
            <>
              {displayThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedThread?.id === thread.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={thread.sender.avatar || 'https://i.pravatar.cc/150'}
                      alt={thread.sender.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-[var(--color-text-main)] truncate">
                          {thread.sender.name}
                        </h3>
                        <span className="text-xs text-[var(--color-text-sub)]">
                          {new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(thread.platform)}`}>
                          {thread.platform}
                        </span>
                        {thread.sender.tier && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {thread.sender.tier}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-sub)] truncate">
                        {thread.lastMessage.content}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-indigo)] text-white text-xs rounded-full">
                          {thread.unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Load More Button */}
              {hasMoreThreads && (
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-sm font-medium text-[var(--color-indigo)] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More (${displayThreads.length} loaded)`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversation - Right Column */}
      <div className="flex-1 flex flex-col bg-[var(--bg-app)]">
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 bg-[var(--bg-surface)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedThread.sender.avatar || 'https://i.pravatar.cc/150'}
                    alt={selectedThread.sender.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-main)]">{selectedThread.sender.name}</h3>
                    <p className="text-sm text-[var(--color-text-sub)]">{selectedThread.sender.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Star className="w-5 h-5 text-[var(--color-text-sub)]" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Check className="w-5 h-5 text-[var(--color-text-sub)]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-start">
                <div className="max-w-xs bg-[var(--bg-surface)] rounded-lg p-3 shadow-[var(--shadow-soft)]">
                  <p className="text-[var(--color-text-main)]">{selectedThread.lastMessage.content}</p>
                  <p className="text-xs text-[var(--color-text-sub)] mt-1">
                    {new Date(selectedThread.lastMessage.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-[var(--bg-surface)] text-[var(--color-text-main)]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="px-4 py-2 bg-[var(--color-indigo)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">Select a conversation</h3>
              <p className="text-[var(--color-text-sub)]">Choose a message from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
      </div>
      </ContentPageErrorBoundary>
    </ProtectedRoute>
  );
}
