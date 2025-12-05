'use client';

/**
 * OnlyFans Messages Page
 * Requirements: 7.1-8.4 - Messages interface with design system components
 * Feature: dashboard-design-refactor
 * 
 * Refactored to use:
 * - ConversationList component (Requirements 7.1-7.3)
 * - FanContextSidebar component (Requirements 8.1)
 * - StatCard component for metrics
 * - Design tokens throughout
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatCard } from '@/components/ui/StatCard';
import { ConversationList, type Conversation } from '@/components/messages/ConversationList';
import { FanContextSidebar, type FanContext } from '@/components/messages/FanContextSidebar';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Send, 
  Search, 
  CheckCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { Button } from "@/components/ui/button";
import { MetricSkeleton } from '@/components/layout/LoadingSkeletons';

interface MessageThread {
  id: string;
  fanName: string;
  fanUsername: string;
  fanAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: number;
  isVIP: boolean;
  ltv?: number;
  notes?: string[];
  purchaseHistory?: { date: Date; amount: number; item: string }[];
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
      await trackAPIRequest('/api/onlyfans/messages/threads', 'GET', async () => {
        const response = await fetch('/api/onlyfans/messages/threads');
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || getMockThreads());
        } else {
          setThreads(getMockThreads());
        }
      });

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
      await trackAPIRequest('/api/ai/message-suggestions', 'POST', async () => {
        const response = await fetch('/api/ai/message-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: selectedThread.id,
            context: messages.slice(-5),
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
      ltv: 450,
      notes: ['VIP subscriber since Jan 2024', 'Prefers exclusive content'],
      purchaseHistory: [
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), amount: 25, item: 'PPV Video' },
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), amount: 15, item: 'Custom Photo' },
      ],
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
      ltv: 120,
      notes: [],
      purchaseHistory: [
        { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), amount: 10, item: 'Tip' },
      ],
    },
    {
      id: '3',
      fanName: 'Alex K.',
      fanUsername: '@alex_k',
      fanAvatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'Love your work!',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
      unread: 1,
      isVIP: false,
      ltv: 85,
      notes: ['New subscriber'],
      purchaseHistory: [],
    },
  ];

  const getDefaultStats = (): MessageStats => ({
    sent: 0,
    received: 0,
    responseRate: 0,
    avgResponseTime: 0,
  });

  // Convert threads to Conversation format for ConversationList
  const conversations: Conversation[] = useMemo(() => {
    return threads
      .filter(thread =>
        thread.fanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.fanUsername.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(thread => ({
        id: thread.id,
        name: thread.fanName,
        avatar: thread.fanAvatar,
        lastMessage: thread.lastMessage,
        timestamp: thread.lastMessageTime,
        unread: thread.unread > 0,
        ltv: thread.ltv,
      }));
  }, [threads, searchQuery]);

  // Convert selected thread to FanContext format
  const selectedFanContext: FanContext | null = useMemo(() => {
    if (!selectedThread) return null;
    return {
      id: selectedThread.id,
      name: selectedThread.fanName,
      ltv: selectedThread.ltv || 0,
      status: selectedThread.isVIP ? 'vip' : 'active',
      notes: selectedThread.notes || [],
      purchaseHistory: (selectedThread.purchaseHistory || []).map(p => ({
        date: p.date,
        amount: p.amount,
        item: p.item,
      })),
    };
  }, [selectedThread]);

  const handleSelectConversation = (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (thread) {
      setSelectedThread(thread);
    }
  };

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Messages">
        <PageLayout
          title="Messages"
          subtitle="AI-powered messaging for OnlyFans"
          breadcrumbs={[
            { label: 'OnlyFans', href: '/onlyfans' },
            { label: 'Messages' }
          ]}
        >
          <div className="space-y-6">
            <MetricSkeleton count={4} />
            <div className="h-[600px] bg-[var(--surface-card)] rounded-[var(--radius-base)] animate-pulse" />
          </div>
        </PageLayout>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Messages">
      <PageLayout
        title="Messages"
        subtitle="AI-powered messaging for OnlyFans"
        breadcrumbs={[
          { label: 'OnlyFans', href: '/onlyfans' },
          { label: 'Messages' }
        ]}
        actions={
          <Button variant="primary" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            New Message
          </Button>
        }
      >
        {/* Stats using StatCard component */}
        {stats && (
          <div 
            className="grid grid-cols-1 md:grid-cols-4 gap-[var(--space-4)]"
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <StatCard
              label="Sent"
              value={stats.sent}
              isEmpty={stats.sent === 0}
              emptyMessage="No messages sent yet"
            />
            <StatCard
              label="Received"
              value={stats.received}
              isEmpty={stats.received === 0}
              emptyMessage="No messages received yet"
            />
            <StatCard
              label="Response Rate"
              value={`${stats.responseRate}%`}
              trend={stats.responseRate > 80 ? { direction: 'up', value: 'Good' } : undefined}
              isEmpty={stats.responseRate === 0}
              emptyMessage="Start responding to see your rate"
            />
            <StatCard
              label="Avg Response Time"
              value={`${stats.avgResponseTime}m`}
              trend={stats.avgResponseTime < 30 ? { direction: 'up', value: 'Fast' } : undefined}
              isEmpty={stats.avgResponseTime === 0}
              emptyMessage="No response time data yet"
            />
          </div>
        )}

        {/* Messages Interface */}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-12" style={{ height: '600px' }}>
            {/* Conversation List - Using design system component */}
            <div 
              className="col-span-3 border-r flex flex-col"
              style={{ borderColor: 'var(--border-default)' }}
            >
              {/* Search */}
              <div 
                className="border-b"
                style={{ 
                  padding: 'var(--space-4)',
                  borderColor: 'var(--border-default)'
                }}
              >
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--text-subdued)' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 rounded-[var(--radius-sm)] text-sm transition-all"
                    style={{
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-base)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* ConversationList Component */}
              <div className="flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedThread?.id}
                  onSelect={handleSelectConversation}
                  density="compact"
                  loading={false}
                />
              </div>
            </div>

            {/* Conversation View */}
            <div className="col-span-6 flex flex-col">
              {selectedThread ? (
                <>
                  {/* Conversation Header */}
                  <div 
                    className="border-b flex items-center justify-between"
                    style={{ 
                      padding: 'var(--space-4)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedThread.fanAvatar}
                        alt={selectedThread.fanName}
                        className="w-10 h-10 rounded-full"
                        style={{ border: '2px solid var(--border-subdued)' }}
                      />
                      <div>
                        <p 
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)', fontSize: '14px' }}
                        >
                          {selectedThread.fanName}
                        </p>
                        <p 
                          style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
                        >
                          {selectedThread.fanUsername}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={getAISuggestions} 
                      disabled={loadingAI}
                    >
                      {loadingAI ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI Suggestions
                    </Button>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <div 
                      className="border-b"
                      style={{ 
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--status-info-bg)',
                        borderColor: 'var(--status-info)'
                      }}
                    >
                      <p 
                        className="text-sm font-medium mb-2"
                        style={{ color: 'var(--status-info)' }}
                      >
                        AI Suggestions:
                      </p>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion) => (
                          <button 
                            key={suggestion.id}
                            onClick={() => useSuggestion(suggestion)}
                            className="w-full text-left p-3 rounded-[var(--radius-sm)] transition-all hover:opacity-80"
                            style={{
                              backgroundColor: 'var(--surface-card)',
                              border: '1px solid var(--border-default)',
                            }}
                          >
                            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {suggestion.content}
                            </p>
                            <p 
                              className="text-xs mt-1"
                              style={{ color: 'var(--text-subdued)' }}
                            >
                              Tone: {suggestion.tone}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Error */}
                  {aiError && (
                    <div 
                      className="border-b"
                      style={{ 
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--status-critical-bg)',
                        borderColor: 'var(--status-critical)'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" style={{ color: 'var(--status-critical)' }} />
                        <p className="text-sm" style={{ color: 'var(--status-critical)' }}>
                          {aiError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div 
                    className="flex-1 overflow-y-auto space-y-4"
                    style={{ padding: 'var(--space-4)' }}
                  >
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p style={{ color: 'var(--text-subdued)', fontSize: '14px' }}>
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromCreator ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[70%] rounded-[var(--radius-base)] p-3"
                            style={{
                              backgroundColor: message.isFromCreator 
                                ? 'var(--action-primary)' 
                                : 'var(--surface-subdued)',
                              color: message.isFromCreator 
                                ? 'white' 
                                : 'var(--text-primary)',
                              boxShadow: 'var(--shadow-card)',
                            }}
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
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div 
                    className="border-t"
                    style={{ 
                      padding: 'var(--space-4)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-[var(--radius-base)] text-sm transition-all"
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--surface-base)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Button 
                        variant="primary" 
                        onClick={sendMessage} 
                        disabled={!messageInput.trim() || sendingMessage}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
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
                <EmptyState
                  icon={<Send className="w-8 h-8" />}
                  title="Select a conversation"
                  description="Choose a conversation from the list to start messaging"
                />
              )}
            </div>

            {/* Fan Context Sidebar - Using design system component */}
            <div 
              className="col-span-3 border-l"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <FanContextSidebar
                fan={selectedFanContext}
                loading={false}
              />
            </div>
          </div>
        </Card>
      </PageLayout>
    </ContentPageErrorBoundary>
  );
}
