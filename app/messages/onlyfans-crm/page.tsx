'use client';

import { useState, useEffect } from 'react';
// Using native HTML elements for simplicity
import { Send, Search, MoreVertical, DollarSign, ArrowLeft, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Fan {
  id: number;
  name: string;
  handle?: string;
  avatar?: string;
  platform: string;
}

interface Conversation {
  id: number;
  fanId: number;
  platform: string;
  lastMessageAt: string;
  unreadCount: number;
  fan: Fan | null;
}

interface Message {
  id: number;
  conversationId: number;
  fanId: number;
  direction: 'in' | 'out';
  text: string;
  priceCents?: number;
  attachments?: Array<{
    type: string;
    url: string;
    filename?: string;
  }>;
  read: boolean;
  createdAt: string;
}

interface AISuggestion {
  id: string;
  text: string;
  tone: string;
  confidence: number;
  category: string;
  emoji?: string;
}

export default function OnlyFansCRMMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messagePrice, setMessagePrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/crm/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/crm/conversations/${conversationId}/messages?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadAISuggestions = async () => {
    if (!selectedConversation?.fan) return;

    setLoadingSuggestions(true);
    try {
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      const response = await fetch('/api/onlyfans/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fanId: selectedConversation.fan.id,
          fanName: selectedConversation.fan.name,
          fanHandle: selectedConversation.fan.handle,
          lastMessage: lastMessage?.text,
          lastMessageDate: lastMessage?.createdAt,
          messageCount: messages.length,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    setNewMessage(suggestion.text);
    setShowSuggestions(false);
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setSending(true);
    try {
      const priceCents = messagePrice ? Math.round(parseFloat(messagePrice) * 100) : undefined;
      
      const response = await fetch(`/api/crm/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newMessage,
          priceCents,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setMessagePrice('');
        // Reload messages
        loadMessages(selectedConversation.id);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.fan?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.fan?.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (cents: number) => {
    return `${(cents / 100).toFixed(2)}€`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/messages" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">OnlyFans CRM Messages</h1>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for a fan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                      {conversation.fan?.name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.fan?.name || 'Unknown Fan'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.fan?.handle || '@unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content - Messages */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                    {selectedConversation.fan?.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h2 className="font-medium">{selectedConversation.fan?.name || 'Unknown Fan'}</h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.fan?.handle || '@unknown'} • OnlyFans
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'out' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'out'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        {message.priceCents && message.priceCents > 0 && (
                          <div className="flex items-center mt-1 text-xs opacity-75">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatPrice(message.priceCents)}
                          </div>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} className="text-xs opacity-75">
                                📎 {attachment.filename || 'Attached file'}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                {/* AI Suggestions Panel */}
                {showSuggestions && aiSuggestions.length > 0 && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">AI Suggestions</span>
                      </div>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => applySuggestion(suggestion)}
                          className="w-full text-left p-2 bg-white hover:bg-purple-50 rounded-lg border border-purple-100 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{suggestion.emoji}</span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{suggestion.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-purple-600 font-medium">{suggestion.tone}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{Math.round(suggestion.confidence * 100)}% confidence</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 mb-2">
                  <input
                    type="number"
                    placeholder="Price ($) - optional"
                    value={messagePrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessagePrice(e.target.value)}
                    step="0.01"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={loadAISuggestions}
                    disabled={loadingSuggestions}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Sparkles className={`w-4 h-4 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                    <span className="text-sm">AI Suggestions</span>
                  </button>
                </div>
                <div className="flex space-x-2">
                  <textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 min-h-[60px] max-h-32 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="self-end px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
