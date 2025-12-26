/**
 * Service de gestion des messages OF
 * 
 * Lit depuis PostgreSQL (pas d'appel direct à OF)
 * Le scraper remplit la DB via le callback
 */

import { prisma } from '@/lib/prisma';
import type { OFThread, OFMessage, OFApiThread, OFApiMessage } from './types';

export class OFMessagesService {
  /**
   * Récupère les threads (conversations) depuis la DB
   */
  static async getThreads(userId: number, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<OFThread[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = options || {};

    const threads = await prisma.oFThread.findMany({
      where: {
        userId,
        ...(unreadOnly ? { unreadCount: { gt: 0 } } : {}),
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return threads.map(this.mapDbThread);
  }

  /**
   * Récupère un thread spécifique
   */
  static async getThread(userId: number, threadId: string): Promise<OFThread | null> {
    const thread = await prisma.oFThread.findFirst({
      where: { userId, id: threadId },
    });

    return thread ? this.mapDbThread(thread) : null;
  }

  /**
   * Récupère les messages d'un thread
   */
  static async getMessages(userId: number, threadId: string, options?: {
    limit?: number;
    before?: Date;
    after?: Date;
  }): Promise<OFMessage[]> {
    const { limit = 100, before, after } = options || {};

    const messages = await prisma.oFMessage.findMany({
      where: {
        userId,
        threadId,
        ...(before ? { sentAt: { lt: before } } : {}),
        ...(after ? { sentAt: { gt: after } } : {}),
      },
      orderBy: { sentAt: 'asc' },
      take: limit,
    });

    return messages.map(this.mapDbMessage);
  }

  /**
   * Marque un thread comme lu
   */
  static async markThreadAsRead(userId: number, threadId: string): Promise<void> {
    await prisma.$transaction([
      prisma.oFThread.update({
        where: { id_userId: { id: threadId, userId } },
        data: { unreadCount: 0 },
      }),
      prisma.oFMessage.updateMany({
        where: { userId, threadId, isRead: false, senderType: 'fan' },
        data: { isRead: true },
      }),
    ]);
  }

  /**
   * Compte les messages non lus
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const result = await prisma.oFThread.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount || 0;
  }

  /**
   * Sauvegarde les threads depuis l'API OF (appelé par le callback)
   */
  static async upsertThreadsFromApi(
    userId: number,
    apiThreads: OFApiThread[]
  ): Promise<number> {
    let count = 0;

    for (const apiThread of apiThreads) {
      await prisma.oFThread.upsert({
        where: {
          id_userId: {
            id: String(apiThread.id),
            userId,
          },
        },
        create: {
          id: String(apiThread.id),
          userId,
          ofUserId: String(apiThread.withUser.id),
          fanName: apiThread.withUser.name,
          fanUsername: apiThread.withUser.username,
          fanAvatar: apiThread.withUser.avatar,
          lastMessageAt: apiThread.lastMessage 
            ? new Date(apiThread.lastMessage.createdAt) 
            : new Date(),
          lastMessagePreview: apiThread.lastMessage?.text || '',
          unreadCount: apiThread.unreadMessagesCount || 0,
          isOnline: apiThread.withUser.isOnline || false,
          isPinned: apiThread.isPinned || false,
          isMuted: apiThread.isMuted || false,
        },
        update: {
          fanName: apiThread.withUser.name,
          fanUsername: apiThread.withUser.username,
          fanAvatar: apiThread.withUser.avatar,
          lastMessageAt: apiThread.lastMessage 
            ? new Date(apiThread.lastMessage.createdAt) 
            : undefined,
          lastMessagePreview: apiThread.lastMessage?.text,
          unreadCount: apiThread.unreadMessagesCount || 0,
          isOnline: apiThread.withUser.isOnline || false,
          isPinned: apiThread.isPinned || false,
          isMuted: apiThread.isMuted || false,
          updatedAt: new Date(),
        },
      });
      count++;
    }

    return count;
  }

  /**
   * Sauvegarde les messages depuis l'API OF (appelé par le callback)
   */
  static async upsertMessagesFromApi(
    userId: number,
    threadId: string,
    creatorOfId: string,
    apiMessages: OFApiMessage[]
  ): Promise<number> {
    let count = 0;

    for (const apiMsg of apiMessages) {
      const isFromCreator = String(apiMsg.fromUser.id) === creatorOfId;

      await prisma.oFMessage.upsert({
        where: {
          id_userId: {
            id: String(apiMsg.id),
            userId,
          },
        },
        create: {
          id: String(apiMsg.id),
          threadId,
          userId,
          senderId: String(apiMsg.fromUser.id),
          senderType: isFromCreator ? 'creator' : 'fan',
          content: apiMsg.text || '',
          mediaIds: apiMsg.media?.map(m => String(m.id)) || [],
          price: apiMsg.price || null,
          isPaid: apiMsg.isOpened || false,
          isRead: isFromCreator || apiMsg.isOpened || false,
          sentAt: new Date(apiMsg.createdAt),
        },
        update: {
          content: apiMsg.text || '',
          isPaid: apiMsg.isOpened || false,
          isRead: isFromCreator || apiMsg.isOpened || false,
        },
      });
      count++;
    }

    return count;
  }

  // Mappers
  private static mapDbThread(db: any): OFThread {
    return {
      id: db.id,
      ofUserId: db.ofUserId,
      userId: db.userId,
      fanName: db.fanName,
      fanUsername: db.fanUsername,
      fanAvatar: db.fanAvatar,
      lastMessageAt: db.lastMessageAt,
      lastMessagePreview: db.lastMessagePreview,
      unreadCount: db.unreadCount,
      isOnline: db.isOnline,
      isPinned: db.isPinned,
      isMuted: db.isMuted,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    };
  }

  private static mapDbMessage(db: any): OFMessage {
    return {
      id: db.id,
      threadId: db.threadId,
      userId: db.userId,
      senderId: db.senderId,
      senderType: db.senderType,
      content: db.content,
      mediaIds: db.mediaIds,
      price: db.price,
      isPaid: db.isPaid,
      isRead: db.isRead,
      sentAt: db.sentAt,
      createdAt: db.createdAt,
    };
  }
}
