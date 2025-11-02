import { db } from '../index';

export interface ContentItem {
  id: string;
  userId: string;
  text: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  category?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateContentItemData {
  userId: string;
  text: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  category?: string;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateContentItemData {
  text?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  category?: string;
  scheduledAt?: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

export const contentItemsRepository = {
  /**
   * Create a new content item
   */
  async create(data: CreateContentItemData): Promise<ContentItem> {
    const query = `
      INSERT INTO content_items (
        user_id, text, status, category, scheduled_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
    `;

    const values = [
      data.userId,
      data.text,
      data.status || 'draft',
      data.category || null,
      data.scheduledAt || null,
      JSON.stringify(data.metadata || {}),
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Get content item by ID
   */
  async findById(id: string): Promise<ContentItem | null> {
    const query = `
      SELECT 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
      FROM content_items
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Get all content items for a user with filters
   */
  async findByUser(
    userId: string,
    options: {
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ContentItem[]> {
    const conditions = ['user_id = $1'];
    const values: any[] = [userId];
    let paramCount = 1;

    if (options.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(options.status);
    }

    if (options.category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      values.push(options.category);
    }

    const query = `
      SELECT 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
      FROM content_items
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(options.limit || 50, options.offset || 0);

    const result = await db.query(query, values);
    return result.rows;
  },

  /**
   * Get scheduled content items that are due for publication
   */
  async findScheduledDue(beforeDate: Date = new Date()): Promise<ContentItem[]> {
    const query = `
      SELECT 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
      FROM content_items
      WHERE status = 'scheduled' AND scheduled_at <= $1
      ORDER BY scheduled_at ASC
    `;

    const result = await db.query(query, [beforeDate]);
    return result.rows;
  },

  /**
   * Update content item
   */
  async update(id: string, data: UpdateContentItemData): Promise<ContentItem | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.text !== undefined) {
      paramCount++;
      updates.push(`text = $${paramCount}`);
      values.push(data.text);
    }

    if (data.status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (data.category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      values.push(data.category);
    }

    if (data.scheduledAt !== undefined) {
      paramCount++;
      updates.push(`scheduled_at = $${paramCount}`);
      values.push(data.scheduledAt);
    }

    if (data.publishedAt !== undefined) {
      paramCount++;
      updates.push(`published_at = $${paramCount}`);
      values.push(data.publishedAt);
    }

    if (data.metadata !== undefined) {
      paramCount++;
      updates.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE content_items
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },

  /**
   * Delete content item
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM content_items WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  },

  /**
   * Count content items by user
   */
  async countByUser(userId: string, status?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM content_items WHERE user_id = $1';
    const values: any[] = [userId];

    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Search content items by text
   */
  async search(userId: string, searchTerm: string, limit: number = 20): Promise<ContentItem[]> {
    const query = `
      SELECT 
        id, user_id as "userId", text, status, category,
        scheduled_at as "scheduledAt", published_at as "publishedAt",
        created_at as "createdAt", updated_at as "updatedAt", metadata
      FROM content_items
      WHERE user_id = $1 AND text ILIKE $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await db.query(query, [userId, `%${searchTerm}%`, limit]);
    return result.rows;
  },
};
