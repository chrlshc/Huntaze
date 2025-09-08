'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Paperclip, DollarSign, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { OfMessage } from '@/lib/types/onlyfans';
import { useCachedFetch } from '@/lib/cache-manager';
import { InlineQuickReply } from '@/components/mobile/micro-interactions';

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
}

export default function OfConversationView({ conversationId, onBack }: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch messages
  const { data, loading, error, refresh } = useCachedFetch(`/api/of/threads/${conversationId}`);
  const messages = data?.messages || [];

  // Quick replies
  const quickReplies = [
    'Hey babe! 😘',
    'Check your DMs for something special 🔥',
    'Thanks for the tip! 💕',
    'New content dropping soon!',
    'How are you today?'
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live updates from SSE for this conversation
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail: any = (e as CustomEvent).detail;
        if (detail?.type === 'new-message' && detail.conversationId === conversationId) {
          // Refresh thread to include the new message
          refresh().then(() => {
            requestAnimationFrame(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
          });
        }
      } catch {}
    };
    window.addEventListener('new-message', handler as EventListener);
    return () => window.removeEventListener('new-message', handler as EventListener);
  }, [conversationId, refresh]);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/of/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: { text: message }
        })
      });

      if (response.ok) {
        setMessage('');
        // Refresh messages without full reload
        await refresh();
        // Ensure scroll to bottom after refresh
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
      {/* Header */}
      <div className="sticky top-0 z-10 sticky-header-blur p-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Conversation
          </h2>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          messages.map((msg: OfMessage) => (
            <div key={msg.id} className={`flex ${msg.isFromCreator ? 'justify-end' : 'justify-start'}`}>
              <div className={`bubble ${msg.isFromCreator ? 'bubble-outgoing' : 'bubble-incoming'}`}>
                {msg.content.tip && (
                  <div className="flex items-center gap-1 text-sm mb-1 opacity-90">
                    <DollarSign className="w-3 h-3" />
                    <span>Tipped ${msg.content.tip}</span>
                  </div>
                )}
                {msg.content.text}
                <div className={`bubble-meta ${msg.isFromCreator ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  {msg.readAt && ' • Read'}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <InlineQuickReply
          suggestions={quickReplies}
          onSelect={(text) => setMessage(text)}
        />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={1}
          />
          
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className={`p-2 rounded-lg transition-all ${
              message.trim() && !sending
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Rate limit warning */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Messages are sent with natural delays to maintain authenticity
        </p>
      </div>
    </div>
  );
}
