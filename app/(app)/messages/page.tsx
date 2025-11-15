'use client';

import { useState } from 'react';
import { useUnifiedMessages } from '@/hooks/messages/useUnifiedMessages';
import { MessageSquare, Star, Check, Send } from 'lucide-react';
import type { MessagePlatform, MessageThread } from '@/lib/types/messages';

export default function MessagesPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<MessagePlatform | 'all'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const creatorId = 'creator_123';

  const { threads, stats, isLoading, error, sendMessage, isSending } = useUnifiedMessages({
    creatorId,
    platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
    filter: selectedFilter,
  });

  const handleSendMessage = async () => {
    if (!selectedThread || !messageInput.trim()) return;

    try {
      await sendMessage({
        creatorId,
        threadId: selectedThread.id,
        platform: selectedThread.platform,
        content: messageInput,
      });
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const getPlatformColor = (platform: MessagePlatform) => {
    switch (platform) {
      case 'onlyfans': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'instagram': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'tiktok': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'reddit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'fansly': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load messages'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Platform Selector - Left Column */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platforms</h2>
          
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
              selectedPlatform === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Filters</h3>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 text-sm ${
              selectedFilter === 'all'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('unread')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-2 text-sm ${
              selectedFilter === 'unread'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setSelectedFilter('starred')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
              selectedFilter === 'starred'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Starred
          </button>
        </div>
      </div>

      {/* Thread List - Middle Column */}
      <div className="w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages</h3>
              <p className="text-gray-500 dark:text-gray-400">Your messages will appear here</p>
            </div>
          ) : (
            threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''
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
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {thread.sender.name}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlatformColor(thread.platform)}`}>
                        {thread.platform}
                      </span>
                      {thread.sender.tier && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {thread.sender.tier}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {thread.lastMessage.content}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {thread.unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation - Right Column */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedThread.sender.avatar || 'https://i.pravatar.cc/150'}
                    alt={selectedThread.sender.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedThread.sender.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedThread.sender.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Check className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-start">
                <div className="max-w-xs bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <p className="text-gray-900 dark:text-white">{selectedThread.lastMessage.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(selectedThread.lastMessage.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400">Choose a message from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
