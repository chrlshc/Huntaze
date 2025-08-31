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
  DollarSign,
  MessageSquare
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Messages</h1>
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
              <Link href="/messages/compose" className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
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
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200'
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
      <div className="mx-4 mt-4 mb-2">
        <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 rounded-2xl px-4 py-3 flex items-center justify-between border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">AI Assistant Active</p>
              <p className="text-xs text-gray-600">Handling 87% of messages</p>
            </div>
          </div>
          <Link href="/automations" className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-full shadow-sm">
            Configure
          </Link>
        </div>
      </div>

      {/* Messages List */}
      <div className="px-4 space-y-3 mt-4">
        {messages.map((message) => (
          <Link
            key={message.id}
            href={`/messages/${message.id}`}
            className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <img
                    src={message.avatar}
                    alt={message.name}
                    className="w-14 h-14 rounded-2xl"
                  />
                  {message.isVip && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-[10px] text-white font-bold">VIP</span>
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
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200">
                          <Bot className="w-3 h-3 text-purple-600" />
                          <span className="text-[11px] text-purple-700 font-semibold">AI</span>
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
                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                      <DollarSign className="w-3 h-3" />
                      {message.revenue}
                    </span>
                  </div>
                </div>
                
                {message.unread && (
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mt-2 shadow-md"></div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">No messages yet</h3>
          <p className="text-gray-600 text-center mb-6">Start meaningful conversations with your amazing fans</p>
          <Link
            href="/messages/compose"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Send First Message
          </Link>
        </div>
      )}
    </div>
  );
}