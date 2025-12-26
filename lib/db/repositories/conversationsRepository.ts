import { getPool } from '../index';
import type { Conversation } from '@/lib/services/crmData';

export class ConversationsRepository {
  static async listConversations(userId: number): Promise<Conversation[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", fan_id as "fanId", platform,
        unread_count as "unreadCount",
        last_message_at as "lastMessageAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM conversations 
      WHERE user_id = $1 
      ORDER BY last_message_at DESC NULLS LAST, updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async getConversation(userId: number, conversationId: number): Promise<Conversation | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", fan_id as "fanId", platform,
        unread_count as "unreadCount",
        last_message_at as "lastMessageAt",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM conversations 
      WHERE id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
    return result.rows[0] || null;
  }

  static async createConversation(userId: number, fanId: number, platform?: string): Promise<Conversation> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO conversations (user_id, fan_id, platform)
      VALUES ($1, $2, $3)
      RETURNING 
        id, user_id as "userId", fan_id as "fanId", platform,
        unread_count as "unreadCount",
        last_message_at as "lastMessageAt",
        created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, fanId, platform || null]
    );
    return result.rows[0];
  }

  static async updateLastMessageAt(conversationId: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
  }

  static async incrementUnreadCount(conversationId: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE conversations SET unread_count = unread_count + 1 WHERE id = $1',
      [conversationId]
    );
  }

  static async resetUnreadCount(userId: number, conversationId: number): Promise<void> {
    const pool = getPool();
    await pool.query(
      'UPDATE conversations SET unread_count = 0 WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );
  }
}
