/**
 * Example: Messages Integration with Optimized API
 * 
 * This file demonstrates how to integrate the optimized
 * Messages Read API in a real component.
 */

'use client';

import { useState } from 'react';
import { useMarkMessageRead } from '@/hooks/messages/useMarkMessageRead';
import { MessageCircle, Check, CheckCheck, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  userId: string;
  conversationId: string;
  fanId: string;
  direction: 'in' | 'out';
  text: string;
  read?: boolean;
  createdAt: string;
  priceCents?: number;
}

interface MessageItemProps {
  message: Message;
  onMarkRead?: (messageId: string) => void;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Individual Message Item
 */
function MessageItem({ message, onMarkRead }: MessageItemProps) {
  const { markAsRead, isMarking, error } = useMarkMessageRead();
  const [localRead, setLocalRead] = useState(message.read);

  const handleMarkRead = async () => {
    if (localRead || isMarking) return;

    // Optimistic update
    setLocalRead(true);

    const result = await markAsRead({ threadId: message.id });

    if (result.success) {
      onMarkRead?.(message.id);
    } else {
      // Rollback on error
      setLocalRead(false);
      console.error('Failed to mark as read:', result.error);
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg
        ${message.direction === 'in' ? 'bg-gray-50' : 'bg-purple-50'}
        ${!localRead && message.direction === 'in' ? 'border-l-4 border-purple-500' : ''}
      `}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">
            {message.direction === 'in' ? 'Fan' : 'You'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <p className="text-sm text-gray-700 break-words">
          {message.text}
        </p>

        {/* Price tag if paid message */}
        {message.priceCents && message.priceCents > 0 && (
          <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
            💰 ${(message.priceCents / 100).toFixed(2)}
          </div>
        )}
      </div>

      {/* Read status */}
      <div className="flex-shrink-0">
        {message.direction === 'in' && (
          <button
            onClick={handleMarkRead}
            disabled={isMarking || localRead}
            className={`
              p-2 rounded-full transition-colors
              ${localRead 
                ? 'bg-green-100 text-green-600 cursor-default' 
                : 'bg-gray-100 text-gray-400 hover:bg-purple-100 hover:text-purple-600'
              }
              ${isMarking ? 'opacity-50 cursor-wait' : ''}
            `}
            title={localRead ? 'Read' : 'Mark as read'}
          >
            {isMarking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : localRead ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Error indicator */}
      {error && (
        <div className="absolute top-0 right-0 mt-2 mr-2">
          <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
            Failed to mark as read
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Messages List Component
 */
export function MessagesList({ messages }: { messages: Message[] }) {
  const [localMessages, setLocalMessages] = useState(messages);

  const handleMarkRead = (messageId: string) => {
    // Update local state
    setLocalMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  };

  const unreadCount = localMessages.filter(
    msg => msg.direction === 'in' && !msg.read
  ).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
        
        {unreadCount > 0 && (
          <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
            {unreadCount} unread
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {localMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No messages yet</p>
          </div>
        ) : (
          localMessages.map(message => (
            <MessageItem
              key={message.id}
              message={message}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {localMessages.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {unreadCount}
            </div>
            <div className="text-sm text-gray-600">Unread</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {localMessages.filter(m => m.read).length}
            </div>
            <div className="text-sm text-gray-600">Read</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example Usage in a Page
 */
export default function MessagesPage() {
  // Mock data for demonstration
  const mockMessages: Message[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: 'user-123',
      conversationId: 'conv-456',
      fanId: 'fan-789',
      direction: 'in',
      text: 'Hey! How are you doing today? 😊',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'user-123',
      conversationId: 'conv-456',
      fanId: 'fan-789',
      direction: 'out',
      text: "I'm doing great, thanks for asking! How about you?",
      read: true,
      createdAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      userId: 'user-123',
      conversationId: 'conv-456',
      fanId: 'fan-789',
      direction: 'in',
      text: 'Would love to see your new content! 💕',
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      priceCents: 1500,
    },
  ];

  return <MessagesList messages={mockMessages} />;
}
