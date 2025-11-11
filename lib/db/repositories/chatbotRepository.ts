import { getPool } from '../index';

const pool = getPool();

export interface ChatbotConversation {
  id: string;
  user_id: string;
  title: string | null;
  context: Record<string, any> | null;
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ChatbotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export class ChatbotRepository {
  // Create a new conversation
  static async createConversation(
    userId: string,
    title?: string,
    context?: Record<string, any>
  ): Promise<ChatbotConversation> {
    const result = await pool.query(
      `INSERT INTO chatbot_conversations (user_id, title, context)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title || null, context ? JSON.stringify(context) : null]
    );
    return result.rows[0];
  }

  // Get conversation by ID
  static async getConversation(conversationId: string): Promise<ChatbotConversation | null> {
    const result = await pool.query(
      'SELECT * FROM chatbot_conversations WHERE id = $1',
      [conversationId]
    );
    return result.rows[0] || null;
  }

  // Get user's conversations
  static async getUserConversations(
    userId: string,
    limit = 20
  ): Promise<ChatbotConversation[]> {
    const result = await pool.query(
      `SELECT * FROM chatbot_conversations
       WHERE user_id = $1
       ORDER BY last_message_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Add message to conversation
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ChatbotMessage> {
    const result = await pool.query(
      `INSERT INTO chatbot_messages (conversation_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversationId, role, content, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  // Get conversation messages
  static async getMessages(
    conversationId: string,
    limit = 50
  ): Promise<ChatbotMessage[]> {
    const result = await pool.query(
      `SELECT * FROM chatbot_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, limit]
    );
    return result.rows;
  }

  // Get recent messages (for context)
  static async getRecentMessages(
    conversationId: string,
    count = 10
  ): Promise<ChatbotMessage[]> {
    const result = await pool.query(
      `SELECT * FROM chatbot_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [conversationId, count]
    );
    return result.rows.reverse(); // Return in chronological order
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    await pool.query(
      `UPDATE chatbot_conversations
       SET title = $1, updated_at = NOW()
       WHERE id = $2`,
      [title, conversationId]
    );
  }

  // Delete conversation
  static async deleteConversation(conversationId: string): Promise<void> {
    await pool.query(
      'DELETE FROM chatbot_conversations WHERE id = $1',
      [conversationId]
    );
  }

  // Get conversation stats
  static async getConversationStats(conversationId: string): Promise<{
    message_count: number;
    user_messages: number;
    assistant_messages: number;
  }> {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as message_count,
        COUNT(*) FILTER (WHERE role = 'user') as user_messages,
        COUNT(*) FILTER (WHERE role = 'assistant') as assistant_messages
       FROM chatbot_messages
       WHERE conversation_id = $1`,
      [conversationId]
    );
    return {
      message_count: parseInt(result.rows[0].message_count),
      user_messages: parseInt(result.rows[0].user_messages),
      assistant_messages: parseInt(result.rows[0].assistant_messages),
    };
  }
}
