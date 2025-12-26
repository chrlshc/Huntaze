'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Search, Filter, MoreVertical, Info, DollarSign, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import { SmartReplySuggestions } from './smart-reply-suggestions';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'fan' | 'creator';
  content: {
    text: string;
    media?: string[];
  };
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  fanName: string;
  fanAvatar: string;
  fanId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isActive: boolean;
  totalSpent: number;
  messageCount: number;
  rfmSegment: 'vip' | 'regular' | 'new' | 'at_risk';
}

interface FanInfo {
  id: string;
  name: string;
  avatar: string;
  joinDate: Date;
  totalSpent: number;
  messageCount: number;
  lastActive: Date;
  rfmSegment: string;
  topSpender: boolean;
  notes: string;
}

interface ThreeColumnChatProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onAIDraft?: (message: string) => Promise<string | null>;
  onEscalate?: (id: string) => Promise<void>;
}

export function ThreeColumnChat({
  conversations,
  selectedConversation,
  onSelectConversation,
  messages,
  onSendMessage,
  currentMessage,
  setCurrentMessage,
  onAIDraft,
  onEscalate
}: ThreeColumnChatProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'vip' | 'new'>('all');
  const [showFanInfo, setShowFanInfo] = useState(true);
  const [sending, setSending] = useState(false);
  const [nowMs] = useState(() => Date.now());

  // Filter conversations based on search and filter
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.fanName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'vip' && conv.rfmSegment === 'vip') ||
      (filter === 'new' && conv.rfmSegment === 'new');
    return matchesSearch && matchesFilter;
  });

  // Get selected conversation details
  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const fanInfo: FanInfo | null = selectedConv ? {
    id: selectedConv.fanId,
    name: selectedConv.fanName,
    avatar: selectedConv.fanAvatar,
    joinDate: new Date(nowMs - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    totalSpent: selectedConv.totalSpent,
    messageCount: selectedConv.messageCount,
    lastActive: selectedConv.lastMessageTime,
    rfmSegment: selectedConv.rfmSegment,
    topSpender: selectedConv.totalSpent > 500,
    notes: 'Interested in custom content'
  } : null;

  const handleSend = async () => {
    if (!currentMessage.trim() || sending) return;
    
    setSending(true);
    await onSendMessage(currentMessage);
    setCurrentMessage('');
    setSending(false);
  };

  const handleAIDraft = async () => {
    if (!onAIDraft || !messages.length) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'fan') {
      const draft = await onAIDraft(lastMessage.content.text);
      if (draft) {
        setCurrentMessage(draft);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Column - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Messages</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'unread', 'vip', 'new'] as const).map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="flex-1"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedConversation === conv.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {conv.fanName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{conv.fanName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(conv.lastMessageTime, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={conv.rfmSegment === 'vip' ? 'default' : 'secondary'} className="text-xs">
                      {conv.rfmSegment}
                    </Badge>
                    {conv.totalSpent > 0 && (
                      <span className="text-xs text-green-600">${conv.totalSpent}</span>
                    )}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center Column - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedConv?.fanName[0]}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConv?.fanName}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedConv?.isActive ? 'Active now' : `Last seen ${formatDistanceToNow(selectedConv?.lastMessageTime || new Date(), { addSuffix: true })}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Info className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'creator' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'creator'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.content.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Suggestions */}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'fan' && (
              <div className="p-4 border-t border-gray-200">
                <SmartReplySuggestions
                  fanMessage={messages[messages.length - 1]?.content?.text || ''}
                  onSelectReply={(reply) => setCurrentMessage(reply)}
                  userId={1}
                  niche="lifestyle"
                />
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2 mb-2">
                {onAIDraft && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAIDraft}
                    className="flex items-center gap-2"
                  >
                    <span className="text-purple-500">✨</span>
                    AI Suggest
                  </Button>
                )}
                {onEscalate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEscalate(selectedConversation)}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <span>⚠️</span>
                    Escalate
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSend} disabled={!currentMessage.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Right Column - Fan Info */}
      {selectedConversation && showFanInfo && fanInfo && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Fan Info Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold mb-1">Fan Information</h3>
            <p className="text-sm text-gray-500">Detailed insights</p>
          </div>

          {/* Fan Details */}
          <div className="p-4 space-y-4">
            {/* Profile */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                {fanInfo.name[0]}
              </div>
              <h4 className="font-semibold">{fanInfo.name}</h4>
              <Badge variant={fanInfo.rfmSegment === 'vip' ? 'default' : 'secondary'}>
                {fanInfo.rfmSegment}
              </Badge>
              {fanInfo.topSpender && (
                <Badge variant="outline" className="mt-2">
                  <DollarSign className="w-3 h-3" />
                  Top Spender
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="font-semibold text-green-600">${fanInfo.totalSpent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Messages</span>
                <span className="font-semibold">{fanInfo.messageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="font-semibold">{fanInfo.joinDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="font-semibold">{formatDistanceToNow(fanInfo.lastActive, { addSuffix: true })}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h5 className="font-medium mb-2">Notes</h5>
              <p className="text-sm text-gray-600">{fanInfo.notes}</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Message History
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <DollarSign className="w-4 h-4 mr-2" />
                View Purchase History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
