'use client';
/**
 * Majordome Chatbot
 * Uses assistant conversation APIs.
 */
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { MessageCircle, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createAssistantConversation,
  getAssistantConversation,
  listAssistantConversations,
  sendAssistantMessage,
} from '@/lib/services/assistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
}

interface ApiConversationSummary {
  id: string;
  title?: string;
  updatedAt?: string;
}

interface ConversationsResponse {
  conversations: ApiConversationSummary[];
}

interface ApiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface ConversationResponse {
  conversation: {
    id: string;
    title?: string;
    updatedAt?: string;
    messages?: ApiMessage[];
  };
}

export default function ChatbotPage() {
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{ message: string; conversationId?: string | null } | null>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationsData,
    error: conversationsError,
    isLoading: conversationsLoading,
    mutate: mutateConversations,
  } = useSWR<ConversationsResponse>('/api/assistant/conversations', () => listAssistantConversations());

  const conversations: Conversation[] = useMemo(() => {
    const list = conversationsData?.conversations ?? [];
    return list.map((conv) => ({
      id: conv.id,
      title: conv.title || 'New Conversation',
      lastMessage: conv.updatedAt ? new Date(conv.updatedAt) : new Date(),
    }));
  }, [conversationsData]);

  useEffect(() => {
    if (!currentConversation && conversations.length > 0) {
      setCurrentConversation(conversations[0].id);
    }
  }, [conversations, currentConversation]);

  const {
    data: conversationData,
    error: conversationError,
    isLoading: conversationLoading,
  } = useSWR<ConversationResponse>(
    currentConversation ? `/api/assistant/conversations/${currentConversation}` : null,
    () => getAssistantConversation(currentConversation as string),
  );

  useEffect(() => {
    if (!conversationData?.conversation?.messages) {
      setMessages([]);
      return;
    }

    const apiMessages = conversationData.conversation.messages;
    setMessages(
      apiMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }))
    );
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, sendError]);

  const startNewConversation = async () => {
    if (creatingConversation) return;
    setCreatingConversation(true);
    setSendError(null);

    try {
      const data = await createAssistantConversation();
      const conversationId = data?.conversation?.id;
      if (conversationId) {
        setCurrentConversation(conversationId);
        setMessages([]);
        await mutateConversations();
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to start conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendToApi = async (request: { message: string; conversationId?: string | null }) => {
    setIsSending(true);
    setSendError(null);
    setPendingRequest(request);

    try {
      const data = await sendAssistantMessage({
        message: request.message,
        conversationId: request.conversationId || undefined,
      });

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPendingRequest(null);

      if (data.conversationId && data.conversationId !== currentConversation) {
        setCurrentConversation(data.conversationId);
      }

      void mutateConversations();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const request = { message: input, conversationId: currentConversation };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    await sendToApi(request);
  };

  const retrySend = async () => {
    if (!pendingRequest || isSending) return;
    await sendToApi(pendingRequest);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const showWelcome = !currentConversation || messages.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button variant="primary" onClick={startNewConversation} disabled={creatingConversation}>
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversationsLoading ? (
            <div className="text-center text-gray-500 mt-8 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : conversationsError ? (
            <div className="text-center text-red-500 mt-8 px-4">
              <p className="text-sm">Failed to load conversations.</p>
              <button
                type="button"
                className="text-xs underline mt-2"
                onClick={() => void mutateConversations()}
              >
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 px-4">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Button
                key={conv.id}
                variant="ghost"
                onClick={() => setCurrentConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  currentConversation === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm truncate">{conv.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {conv.lastMessage.toLocaleDateString()}
                </p>
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-500">Ask me anything about Huntaze</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {conversationError ? (
            <div className="max-w-2xl mx-auto text-center text-red-500">
              <p className="text-sm">Failed to load conversation.</p>
            </div>
          ) : showWelcome ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Welcome to Huntaze AI Assistant
                </h2>
                <p className="text-gray-500 mb-6">
                  Start a new conversation to get help with:
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <Card className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">OnlyFans CRM</h3>
                    <p className="text-sm text-gray-600">
                      Fan management, messaging, campaigns
                    </p>
                  </Card>
                  <Card className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Content Creation</h3>
                    <p className="text-sm text-gray-600">
                      Create, edit, and schedule content
                    </p>
                  </Card>
                  <Card className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Social Media</h3>
                    <p className="text-sm text-gray-600">
                      TikTok, Instagram, Reddit integration
                    </p>
                  </Card>
                  <Card className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold mb-2">Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Track performance and insights
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {conversationLoading && (
                <div className="flex justify-center text-sm text-gray-500">Loading conversation...</div>
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              {sendError && (
                <div className="flex justify-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-3">
                    <span>{sendError}</span>
                    <button
                      type="button"
                      onClick={retrySend}
                      className="underline font-medium"
                      disabled={isSending}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {currentConversation && (
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={isSending}
                />
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
