/**
 * Huntaze Messaging API Adapter
 * 
 * Adapts the Huntaze backend API to the messaging interface requirements.
 * Provides a clean interface for conversation, message, and fan context operations.
 * 
 * @requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

import type { OnlyFansFan } from '../services/onlyfans.service';

// ============================================
// Type Definitions
// ============================================

/**
 * Conversation item for the fan list
 */
export interface Conversation {
  id: string;
  fanId: string;
  fanName: string;
  fanUsername: string;
  fanAvatar?: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    isFromFan: boolean;
  };
  unreadCount: number;
  isPinned: boolean;
  tags: string[];
  status: 'active' | 'inactive' | 'vip';
}

/**
 * Message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  timestamp: Date;
  isFromFan: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    thumbnailUrl?: string;
  }>;
}

/**
 * Fan context information
 */
export interface FanContext {
  fanId: string;
  name: string;
  username: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'vip';
  joinDate: Date;
  lastActive: Date;
  totalSpent: number;
  subscriptionTier: string;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: string;
    category: string;
    source: 'manual' | 'ai';
  }>;
  tags: Array<{
    id: string;
    label: string;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  }>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Filter options for conversations
 */
export interface ConversationFilters {
  status?: 'all' | 'unread' | 'vip';
  search?: string;
}

// ============================================
// Huntaze Messaging API Adapter
// ============================================

export class HuntazeMessagingAdapter {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   * @param token - JWT or session token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // ============================================
  // Conversation Operations
  // ============================================

  /**
   * Fetch conversations (fan list)
   * 
   * @param filters - Filter options
   * @param pagination - Pagination parameters
   * @returns Paginated list of conversations
   * @requirements 10.3
   */
  async getConversations(
    filters: ConversationFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResult<Conversation>> {
    const { limit = 50, offset = 0 } = pagination;
    const { status = 'all', search = '' } = filters;

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(status !== 'all' && { status }),
        ...(search && { search }),
      });

      const response = await fetch(
        `${this.baseUrl}/messages/conversations?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get a single conversation by ID
   * 
   * @param conversationId - Conversation ID
   * @returns Conversation details
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messages/conversations/${conversationId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error fetching conversation:', error);
      throw error;
    }
  }

  // ============================================
  // Message Operations
  // ============================================

  /**
   * Fetch messages for a conversation
   * 
   * @param conversationId - Conversation ID
   * @param pagination - Pagination parameters
   * @returns Paginated list of messages
   * @requirements 10.4
   */
  async getMessages(
    conversationId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResult<Message>> {
    const { limit = 50, offset = 0 } = pagination;

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/messages/conversations/${conversationId}/messages?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a message
   * 
   * @param conversationId - Conversation ID
   * @param content - Message content
   * @param attachments - Optional attachments
   * @returns Sent message
   * @requirements 10.4
   */
  async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ type: string; url: string }>
  ): Promise<Message> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messages/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            content,
            attachments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   * 
   * @param conversationId - Conversation ID
   * @param messageIds - Array of message IDs to mark as read
   */
  async markMessagesAsRead(
    conversationId: string,
    messageIds: string[]
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messages/conversations/${conversationId}/read`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ messageIds }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error marking messages as read:', error);
      throw error;
    }
  }

  // ============================================
  // Fan Context Operations
  // ============================================

  /**
   * Fetch fan context information
   * 
   * @param fanId - Fan ID
   * @returns Fan context with notes and tags
   * @requirements 10.5
   */
  async getFanContext(fanId: string): Promise<FanContext> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fans/${fanId}/context`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch fan context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error fetching fan context:', error);
      throw error;
    }
  }

  /**
   * Add a note to a fan
   * 
   * @param fanId - Fan ID
   * @param content - Note content
   * @param category - Note category
   * @returns Created note
   * @requirements 10.5
   */
  async addFanNote(
    fanId: string,
    content: string,
    category: string
  ): Promise<FanContext['notes'][0]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fans/${fanId}/notes`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ content, category }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add fan note: ${response.statusText}`);
      }

      const data = await response.json();
      return data.note;
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error adding fan note:', error);
      throw error;
    }
  }

  /**
   * Delete a fan note
   * 
   * @param fanId - Fan ID
   * @param noteId - Note ID
   */
  async deleteFanNote(fanId: string, noteId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fans/${fanId}/notes/${noteId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete fan note: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error deleting fan note:', error);
      throw error;
    }
  }

  /**
   * Add a tag to a fan
   * 
   * @param fanId - Fan ID
   * @param label - Tag label
   * @param color - Tag color
   * @returns Created tag
   */
  async addFanTag(
    fanId: string,
    label: string,
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  ): Promise<FanContext['tags'][0]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fans/${fanId}/tags`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ label, color }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add fan tag: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tag;
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error adding fan tag:', error);
      throw error;
    }
  }

  /**
   * Remove a tag from a fan
   * 
   * @param fanId - Fan ID
   * @param tagId - Tag ID
   */
  async removeFanTag(fanId: string, tagId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/fans/${fanId}/tags/${tagId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove fan tag: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[HuntazeMessagingAdapter] Error removing fan tag:', error);
      throw error;
    }
  }

  // ============================================
  // Real-time Updates
  // ============================================

  /**
   * Subscribe to real-time message updates
   * 
   * @param conversationId - Conversation ID
   * @param onMessage - Callback for new messages
   * @returns Unsubscribe function
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ): () => void {
    // TODO: Implement WebSocket or Server-Sent Events
    // For now, use polling as fallback
    const pollInterval = setInterval(async () => {
      try {
        const result = await this.getMessages(conversationId, { limit: 1 });
        if (result.items.length > 0) {
          onMessage(result.items[0]);
        }
      } catch (error) {
        console.error('[HuntazeMessagingAdapter] Error polling messages:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }

  /**
   * Subscribe to conversation updates
   * 
   * @param onUpdate - Callback for conversation updates
   * @returns Unsubscribe function
   */
  subscribeToConversations(
    onUpdate: (conversation: Conversation) => void
  ): () => void {
    // TODO: Implement WebSocket or Server-Sent Events
    // For now, use polling as fallback
    const pollInterval = setInterval(async () => {
      try {
        const result = await this.getConversations({}, { limit: 10 });
        result.items.forEach(onUpdate);
      } catch (error) {
        console.error('[HuntazeMessagingAdapter] Error polling conversations:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }
}

// Export singleton instance
export const huntazeMessagingAdapter = new HuntazeMessagingAdapter();
