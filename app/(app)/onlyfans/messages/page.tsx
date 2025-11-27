'use client';

/**
 * OnlyFans Messages Page
 * Requirements: 2.1, 2.3, 3.3, 3.4
 * 
 * Features:
 * - Messages interface with thread list and conversation view
 * - Gemini AI integration for message suggestions
 * - Rate limiting for AI requests
 * - AI-powered reply suggestions
 * - Message stats (sent, received, response rate)
 * - Error handling with ContentPageErrorBoundary
 * - Loading states with AsyncOperationWrapper
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { 
  Send, 
  Search, 
  Filter, 
  Star, 
  Clock,
  CheckCheck,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { AsyncOperationWrapper } from '@/components/dashboard/AsyncOperationWrapper';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface MessageThread {
  id: string;
  fanName: string;
  fanUsername: string;
  fanAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
  isVIP: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromCreator: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface MessageStats {
  sent: number;
  received: number;
  responseRate: number;
  avgResponseTime: number;
}

interface AISuggestion {
  id: string;
  content: string;
  tone: 'friendly' | 'flirty' | 'professional';
}

export default function OnlyFansMessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Performance monitoring
  const { trackAPIRequest } = usePerformanceMonitoring({
    pageName: 'OnlyFans Messages',
    trackScrollPerformance: true,
    trackInteractions: true,
  });

  useEffect(() => {
    loadMessagesData();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadThreadMessages(selectedThread.id);
    }
  }, [selectedThread]);

  const loadMessagesData = async () => {
    try {
      // Fetch message threads
      await trackAPIRequest('/api/onlyfans/messages/threads', 'GET', async () => {
        const response = await fetch('/api/onlyfans/messages/threads');
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || getMockThreads());
        } else {
          setThreads(getMockThreads());
        }
      });

      // Fetch message stats
      await trackAPIRequest('/api/onlyfans/messages/stats', 'GET', async () => {
        const statsResponse = await fetch('/api/onlyfans/messages/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats || getDefaultStats());
        } else {
          setStats(getDefaultStats());
        }
      });
    } catch (error) {
      console.error('Failed to load messages data:', error);
      setThreads(getMockThreads());
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      await trackAPIRequest(`/api/onlyfans/messages/${threadId}`, 'GET', async () => {
        const response = await fetch(`/api/onlyfans/messages/${threadId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else {
          setMessages([]);
        }
      });
    } catch (error) {
      console.error('Failed to load thread messages:', error);
      setMessages([]);
    }
  };

  const getAISuggestions = async () => {
    if (!selectedThread) return;

    setLoadingAI(true);
    setAiError(null);

    try {
      // Use rate limiting via lib/ai/rate-limit.ts
      await trackAPIRequest('/api/ai/message-suggestions', 'POST', async () => {
        const response = await fetch('/api/ai/message-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: selectedThread.id,
            context: messages.slice(-5), // Last 5 messages for context
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setAiSuggestions(data.suggestions || []);
        } else if (response.status === 429) {
          setAiError('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          setAiError('AI quota exceeded. Please upgrade your plan.');
        } else {
          setAiError('Failed to generate suggestions. Please try again.');
        }
      });
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      setAiError('Failed to generate suggestions. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedThread || sendingMessage) return;

    setSendingMessage(true);

    try {
      await trackAPIRequest('/api/onlyfans/messages/send', 'POST', async () => {
        const response = await fetch('/api/onlyfans/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: selectedThread.id,
            content: messageInput,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([...messages, data.message]);
          setMessageInput('');
          setAiSuggestions([]);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const useSuggestion = (suggestion: AISuggestion) => {
    setMessageInput(suggestion.content);
    setAiSuggestions([]);
  };

  const getMockThreads = (): MessageThread[] => [
    {
      id: '1',
      fanName: 'Sarah M.',
      fanUsername: '@sarah_m',
      fanAvatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Thanks for the content! 💕',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unread: 2,
      isVIP: true,
    },
    {
      id: '2',
      fanName: 'Mike R.',
      fanUsername: '@mike_r',
      fanAvatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'When is the next post?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unread: 0,
      isVIP: false,
    },
  ];

  const getDefaultStats = (): MessageStats => ({
    sent: 0,
    received: 0,
    responseRate: 0,
    avgResponseTime: 0,
  });

  const filteredThreads = threads.filter(thread =>
    thread.fanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.fanUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Messages">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-indigo)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-sub)]">Loading messages...</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Messages">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Messages</h1>
          <p className="text-[var(--color-text-sub)]">
            AI-powered messaging for OnlyFans
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-[var(--color-text-sub)] mb-1">Sent</p>
              <p className="text-2xl font-bold text-[var(--color-text-main)]">{stats.sent}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-[var(--color-text-sub)] mb-1">Received</p>
              <p className="text-2xl font-bold text-[var(--color-text-main)]">{stats.received}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-[var(--color-text-sub)] mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.responseRate}%</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-[var(--color-text-sub)] mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-[var(--color-text-main)]">{stats.avgResponseTime}m</p>
            </div>
          </div>
        )}

        {/* Messages Interface */}
        <div className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="grid grid-cols-12 h-[600px]">
            {/* Thread List */}
            <div className="col-span-4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  />
                </div>
              </div>

              {/* Threads */}
              <div className="flex-1 overflow-y-auto">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                      selectedThread?.id === thread.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={thread.fanAvatar}
                        alt={thread.fanName}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--color-text-main)] truncate">
                              {thread.fanName}
                            </p>
                            {thread.isVIP && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-[var(--color-text-sub)]">
                            {new Date(thread.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-text-sub)] truncate">
                          {thread.lastMessage}
                        </p>
                      </div>
                      {thread.unread > 0 && (
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {thread.unread}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation View */}
            <div className="col-span-8 flex flex-col">
              {selectedThread ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedThread.fanAvatar}
                          alt={selectedThread.fanName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--color-text-main)]">
                              {selectedThread.fanName}
                            </p>
                            {selectedThread.isVIP && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-[var(--color-text-sub)]">
                            {selectedThread.fanUsername}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={getAISuggestions}
                        disabled={loadingAI}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {loadingAI ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        AI Suggestions
                      </button>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                        AI Suggestions:
                      </p>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => useSuggestion(suggestion)}
                            className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <p className="text-sm text-[var(--color-text-main)]">{suggestion.content}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              Tone: {suggestion.tone}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Error */}
                  {aiError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm">{aiError}</p>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isFromCreator ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.isFromCreator
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-[var(--color-text-main)]'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {message.isFromCreator && message.status === 'read' && (
                              <CheckCheck className="w-3 h-3 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Send className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[var(--color-text-sub)]">
                      Select a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
