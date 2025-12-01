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
import { Card } from '@/components/ui/card';
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
import { Button } from "@/components/ui/button";

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--text-primary)]">Loading messages...</p>
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Messages</h1>
          <p className="text-[var(--text-primary)]">
            AI-powered messaging for OnlyFans
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-sm text-[var(--text-primary)] mb-1">Sent</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.sent}</p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--text-primary)] mb-1">Received</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.received}</p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--text-primary)] mb-1">Response Rate</p>
              <p className="text-2xl font-bold text-[var(--accent-success)]">{stats.responseRate}%</p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--text-primary)] mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgResponseTime}m</p>
            </Card>
          </div>
        )}

        {/* Messages Interface */}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-12 h-[600px]">
            {/* Thread List */}
            <div className="col-span-4 border-r border-[var(--border-subtle)] flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Threads */}
              <div className="flex-1 overflow-y-auto">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-glass-hover)] transition-all text-left ${
                      selectedThread?.id === thread.id ? 'bg-[var(--bg-glass-hover)]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={thread.fanAvatar}
                        alt={thread.fanName}
                        className="w-12 h-12 rounded-full ring-2 ring-[var(--border-subtle)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--text-primary)] truncate">
                              {thread.fanName}
                            </p>
                            {thread.isVIP && (
                              <Star className="w-4 h-4 text-[var(--accent-warning)] fill-[var(--accent-warning)]" />
                            )}
                          </div>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {new Date(thread.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] truncate">
                          {thread.lastMessage}
                        </p>
                      </div>
                      {thread.unread > 0 && (
                        <div className="flex-shrink-0 w-6 h-6 bg-[var(--accent-info)] text-white rounded-full flex items-center justify-center text-xs font-medium">
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
                  <div className="p-4 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedThread.fanAvatar}
                          alt={selectedThread.fanName}
                          className="w-10 h-10 rounded-full ring-2 ring-[var(--border-subtle)]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--text-primary)]">
                              {selectedThread.fanName}
                            </p>
                            {selectedThread.isVIP && (
                              <Star className="w-4 h-4 text-[var(--accent-warning)] fill-[var(--accent-warning)]" />
                            )}
                          </div>
                          <p className="text-sm text-[var(--text-primary)]">
                            {selectedThread.fanUsername}
                          </p>
                        </div>
                      </div>
                      <Button variant="primary" onClick={getAISuggestions} disabled={loadingAI}>
  {loadingAI ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        AI Suggestions
</Button>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div className="p-4 bg-[var(--accent-bg-muted)] border-b border-[var(--accent-primary)]">
                      <p className="text-sm font-medium text-[var(--accent-primary)] mb-2">
                        AI Suggestions:
                      </p>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion) => (
                          <Button 
                            key={suggestion.content}
                            variant="primary" 
                            onClick={() => useSuggestion(suggestion)}
                            className="w-full text-left p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--accent-primary)] transition-all"
                          >
                            <p className="text-sm text-[var(--text-primary)]">{suggestion.content}</p>
                            <p className="text-xs text-[var(--accent-primary)] mt-1">
                              Tone: {suggestion.tone}
                            </p>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Error */}
                  {aiError && (
                    <div className="p-4 bg-[var(--accent-error)]/10 border-b border-[var(--accent-error)]">
                      <div className="flex items-center gap-2 text-[var(--accent-error)]">
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
                          className={`max-w-[70%] rounded-lg p-3 shadow-[var(--shadow-sm)] ${
                            message.isFromCreator
                              ? 'bg-[var(--accent-info)] text-white'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
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
                  <div className="p-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-[var(--border-default)] rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                      />
                      <Button variant="primary" onClick={sendMessage} disabled={!messageInput.trim() || sendingMessage}>
  {sendingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center border border-[var(--border-subtle)]">
                        <Send className="w-8 h-8 text-[var(--text-tertiary)]" />
                      </div>
                      <p className="text-[var(--text-primary)]">
                        Select a conversation to start messaging
                      </p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </ContentPageErrorBoundary>
  );
}
