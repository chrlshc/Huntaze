/**
 * Unified Messages Types
 */

export type MessagePlatform = 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'fansly';
export type MessageStatus = 'unread' | 'read' | 'replied' | 'starred' | 'archived';
export type MessagePriority = 'high' | 'normal' | 'low';

export interface MessageSender {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  platform: MessagePlatform;
  tier?: string; // VIP, Active, etc.
}

export interface MessageMedia {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnail?: string;
  size?: number;
}

export interface Message {
  id: string;
  threadId: string;
  platform: MessagePlatform;
  sender: MessageSender;
  content: string;
  media?: MessageMedia[];
  status: MessageStatus;
  priority: MessagePriority;
  timestamp: string;
  readAt?: string;
  repliedAt?: string;
}

export interface MessageThread {
  id: string;
  platform: MessagePlatform;
  sender: MessageSender;
  lastMessage: Message;
  unreadCount: number;
  messageCount: number;
  status: MessageStatus;
  priority: MessagePriority;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedMessagesResponse {
  threads: MessageThread[];
  stats: {
    totalUnread: number;
    byPlatform: Record<MessagePlatform, number>;
  };
  metadata?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SendMessageInput {
  creatorId: string;
  threadId: string;
  platform: MessagePlatform;
  content: string;
  media?: string[];
}

// ============================================================================
// Error Types
// ============================================================================

export enum MessagesErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export interface MessagesError {
  type: MessagesErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  correlationId?: string;
}
