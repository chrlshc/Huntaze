import { getPool } from '../index';
import type { Message } from '@/lib/services/crmData';

type ListMessagesOptions = {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
};

export class MessagesRepository {
  static async listMessages(
    userId: number,
    conversationId: number,
    options: ListMessagesOptions = {}
  ): Promise<Message[]> {
    const { limit, offset, order = 'asc' } = options;
    const pool = getPool();
    const direction = order === 'desc' ? 'DESC' : 'ASC';

    const values: Array<number> = [userId, conversationId];
    let limitOffsetClause = '';

    if (typeof limit === 'number') {
      values.push(limit);
      limitOffsetClause += ` LIMIT $${values.length}`;
    }

    if (typeof offset === 'number') {
      values.push(offset);
      limitOffsetClause += ` OFFSET $${values.length}`;
    }

    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", conversation_id as "conversationId",
        fan_id as "fanId", direction, text, price_cents as "priceCents",
        read, attachments, created_at as "createdAt"
      FROM messages 
      WHERE user_id = $1 AND conversation_id = $2
      ORDER BY created_at ${direction}${limitOffsetClause}`,
      values
    );
    return result.rows;
  }

  static async countMessages(userId: number, conversationId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND conversation_id = $2',
      [userId, conversationId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  static async markConversationRead(userId: number, conversationId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE messages
       SET read = TRUE
       WHERE user_id = $1 AND conversation_id = $2 AND direction = $3 AND read = FALSE`,
      [userId, conversationId, 'in']
    );
    return result.rowCount || 0;
  }

  static async createMessage(
    userId: number,
    conversationId: number,
    fanId: number,
    direction: 'in' | 'out',
    text: string,
    priceCents?: number,
    attachments?: any[]
  ): Promise<Message> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO messages (
        user_id, conversation_id, fan_id, direction, text, price_cents, attachments, read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, user_id as "userId", conversation_id as "conversationId",
        fan_id as "fanId", direction, text, price_cents as "priceCents",
        read, attachments, created_at as "createdAt"`,
      [userId, conversationId, fanId, direction, text, priceCents || null, JSON.stringify(attachments || []), direction === 'out']
    );
    
    // Update conversation last_message_at
    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );
    
    // Increment unread count if incoming message
    if (direction === 'in') {
      await pool.query(
        'UPDATE conversations SET unread_count = unread_count + 1 WHERE id = $1',
        [conversationId]
      );
    }
    
    return result.rows[0];
  }

  static async markMessageRead(userId: number, messageId: number): Promise<Message | null> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE messages 
      SET read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING 
        id, user_id as "userId", conversation_id as "conversationId",
        fan_id as "fanId", direction, text, price_cents as "priceCents",
        read, attachments, created_at as "createdAt"`,
      [messageId, userId]
    );
    return result.rows[0] || null;
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND direction = $2 AND read = FALSE',
      [userId, 'in']
    );
    return parseInt(result.rows[0]?.count || '0');
  }
}
