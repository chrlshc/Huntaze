'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Circle, DollarSign, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { OfConversation } from '@/lib/types/onlyfans';
import OfConversationView from './conversation-view';
import { useCachedFetch } from '@/lib/cache-manager';

export default function OfInbox() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'vip' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch conversations
  const { data, loading, error } = useCachedFetch(
    `/api/of/inbox?filter=${filter}&search=${searchQuery}`
  );

  const conversations = data?.conversations || [];

  if (selectedConversation) {
    return (
      <OfConversationView
        conversationId={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'unread', 'vip', 'active'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No conversations found</div>
        ) : (
          conversations.map((conversation: OfConversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-4 text-left"
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={conversation.avatarUrl || `https://ui-avatars.com/api/?name=${conversation.username}`}
                  alt={conversation.username}
                  className="w-12 h-12 rounded-full"
                />
                {conversation.isSubscribed && (
                  <Circle className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" fill="currentColor" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {conversation.displayName || conversation.username}
                    </h3>
                    {conversation.tags.includes('VIP') && (
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${conversation.totalSpent}
                  </span>
                  {conversation.subscriptionPrice && (
                    <span>${conversation.subscriptionPrice}/mo</span>
                  )}
                  {conversation.unreadCount > 0 && (
                    <span className="ml-auto bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}