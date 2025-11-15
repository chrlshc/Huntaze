/**
 * Messages Service - Unified Messages Management
 * 
 * Handles fetching and sending messages across all platforms
 */

import { messagesAPI } from './api-client';
import type {
  UnifiedMessagesResponse,
  MessageThread,
  Message,
  SendMessageInput,
  MessagePlatform,
} from '@/lib/types/messages';

export class MessagesService {
  /**
   * Get unified messages from all platforms
   */
  async getUnifiedMessages(
    creatorId: string,
    options?: {
      platform?: MessagePlatform;
      filter?: 'unread' | 'starred' | 'all';
      limit?: number;
      offset?: number;
    }
  ): Promise<UnifiedMessagesResponse> {
    console.log('[MessagesService] Fetching unified messages:', {
      creatorId,
      ...options,
    });

    const params: Record<string, string> = {
      creatorId,
    };

    if (options?.platform) params.platform = options.platform;
    if (options?.filter) params.filter = options.filter;
    if (options?.limit) params.limit = String(options.limit);
    if (options?.offset) params.offset = String(options.offset);

    const data = await messagesAPI.get<UnifiedMessagesResponse>('/unified', params);

    console.log('[MessagesService] Unified messages received:', {
      creatorId,
      threadsCount: data.threads.length,
      totalUnread: data.stats.totalUnread,
      hasMore: data.metadata?.hasMore,
    });

    return data;
  }

  /**
   * Get messages for a specific thread
   */
  async getThreadMessages(
    creatorId: string,
    threadId: string,
    platform: MessagePlatform
  ): Promise<Message[]> {
    console.log('[MessagesService] Fetching thread messages:', {
      creatorId,
      threadId,
      platform,
    });

    const data = await messagesAPI.get<{ messages: Message[] }>(
      `/${threadId}`,
      { creatorId, platform }
    );

    console.log('[MessagesService] Thread messages received:', {
      threadId,
      messageCount: data.messages.length,
    });

    return data.messages;
  }

  /**
   * Send a message
   */
  async sendMessage(input: SendMessageInput): Promise<Message> {
    console.log('[MessagesService] Sending message:', {
      creatorId: input.creatorId,
      threadId: input.threadId,
      platform: input.platform,
      hasMedia: !!input.media?.length,
    });

    const data = await messagesAPI.post<{ message: Message }>(
      `/${input.threadId}/send`,
      input
    );

    console.log('[MessagesService] Message sent:', {
      messageId: data.message.id,
      threadId: input.threadId,
    });

    return data.message;
  }

  /**
   * Mark thread as read
   */
  async markAsRead(
    creatorId: string,
    threadId: string,
    platform: MessagePlatform
  ): Promise<void> {
    console.log('[MessagesService] Marking thread as read:', {
      creatorId,
      threadId,
      platform,
    });

    await messagesAPI.put(`/${threadId}/read`, {
      creatorId,
      platform,
    });

    console.log('[MessagesService] Thread marked as read:', { threadId });
  }

  /**
   * Star/unstar a thread
   */
  async toggleStar(
    creatorId: string,
    threadId: string,
    platform: MessagePlatform,
    starred: boolean
  ): Promise<void> {
    console.log('[MessagesService] Toggling star:', {
      creatorId,
      threadId,
      platform,
      starred,
    });

    await messagesAPI.put(`/${threadId}/star`, {
      creatorId,
      platform,
      starred,
    });

    console.log('[MessagesService] Star toggled:', { threadId, starred });
  }

  /**
   * Archive a thread
   */
  async archiveThread(
    creatorId: string,
    threadId: string,
    platform: MessagePlatform
  ): Promise<void> {
    console.log('[MessagesService] Archiving thread:', {
      creatorId,
      threadId,
      platform,
    });

    await messagesAPI.put(`/${threadId}/archive`, {
      creatorId,
      platform,
    });

    console.log('[MessagesService] Thread archived:', { threadId });
  }
}

export const messagesService = new MessagesService();
