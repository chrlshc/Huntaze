/**
 * Types pour les messages OnlyFans
 * 
 * Architecture:
 * - OFThread: Une conversation avec un fan
 * - OFMessage: Un message dans une conversation
 * - OFContact: Info sur un fan (cache local)
 */

export interface OFThread {
  id: string;              // OF thread ID
  ofUserId: string;        // OF user ID du fan
  userId: number;          // Notre user ID (creator)
  fanName: string;
  fanUsername: string;
  fanAvatar: string | null;
  lastMessageAt: Date;
  lastMessagePreview: string;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OFMessage {
  id: string;              // OF message ID
  threadId: string;        // OF thread ID
  userId: number;          // Notre user ID
  senderId: string;        // OF user ID de l'expéditeur
  senderType: 'creator' | 'fan';
  content: string;
  mediaIds: string[];      // IDs des médias attachés
  price: number | null;    // Prix si PPV
  isPaid: boolean;
  isRead: boolean;
  sentAt: Date;
  createdAt: Date;
}

export interface OFContact {
  ofUserId: string;
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  isSubscribed: boolean;
  subscribedAt: Date | null;
  totalSpent: number;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types from OF
export interface OFApiThread {
  id: number;
  withUser: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    isOnline?: boolean;
  };
  lastMessage?: {
    id: number;
    text: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadMessagesCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
}

export interface OFApiMessage {
  id: number;
  text: string;
  fromUser: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  media?: Array<{
    id: number;
    type: string;
    src: string;
  }>;
  price?: number;
  isOpened?: boolean;
  createdAt: string;
}

// Sync job types
export interface MessageSyncJob {
  type: 'messages-sync';
  userId: number;
  threadId?: string;      // Si null, sync toutes les conversations
  limit?: number;
  cursor?: string;
}

export interface MessageSyncResult {
  threads: OFThread[];
  messages: OFMessage[];
  syncedAt: Date;
  hasMore: boolean;
  cursor?: string;
}
