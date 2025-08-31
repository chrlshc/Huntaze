'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search,
  Filter,
  Plus,
  Bot,
  Check,
  CheckCheck,
  Clock,
  DollarSign
} from 'lucide-react';

export default function MobileMessages() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All', count: 24 },
    { id: 'unread', label: 'Unread', count: 8 },
    { id: 'vip', label: 'VIP', count: 3 },
    { id: 'pending', label: 'Pending', count: 5 }
  ];

  const messages = [
    {
      id: 1,
      name: 'Alex Thompson',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=gradient',
      lastMessage: 'Hey! I loved your latest content...',
      time: '2m',
      unread: true,
      isVip: true,
      revenue: '$456',
      aiHandled: false
    },
    {
      id: 2,
      name: 'Sarah Mitchell',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=gradient',
      lastMessage: 'Thanks for the personalized video!',
      time: '15m',
      unread: true,
      isVip: false,
      revenue: '$89',
      aiHandled: true
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=gradient',
      lastMessage: 'Can you do a custom request?',
      time: '1h',
      unread: false,
      isVip: false,
      revenue: '$234',
      aiHandled: true
    },
    {
      id: 4,
      name: 'Emma Wilson',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=gradient',
      lastMessage: 'Just subscribed! Excited to see more',
      time: '3h',
      unread: false,
      isVip: false,
      revenue: '$45',
      aiHandled: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <div className="flex items-center gap-2">
              <button className="p-2">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2">
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
              <Link href="/messages/compose" className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <Plus className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className="ml-1.5">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* AI Status Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">AI handling 87% of messages</span>
          </div>
          <Link href="/automations" className="text-xs text-purple-600 font-medium">
            Settings
          </Link>
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-gray-100">
        {messages.map((message) => (
          <Link
            key={message.id}
            href={`/messages/${message.id}`}
            className="block bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={message.avatar}
                    alt={message.name}
                    className="w-12 h-12 rounded-full"
                  />
                  {message.isVip && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white">VIP</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${message.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {message.name}
                      </h3>
                      {message.aiHandled && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 rounded-full">
                          <Bot className="w-3 h-3 text-purple-600" />
                          <span className="text-[10px] text-purple-700 font-medium">AI</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  
                  <p className={`text-sm truncate ${message.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {message.lastMessage}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      {message.unread ? (
                        <Check className="w-3 h-3 text-gray-400" />
                      ) : (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {message.revenue}
                    </span>
                  </div>
                </div>
                
                {message.unread && (
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-600">Start a conversation with your fans</p>
          <Link
            href="/messages/compose"
            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium"
          >
            Send First Message
          </Link>
        </div>
      )}
    </div>
  );
}