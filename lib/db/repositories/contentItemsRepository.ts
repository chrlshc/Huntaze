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

  // ===== COLLABORATION METHODS =====

  /**
   * Check if user has access to content (owner or collaborator)
   */
  async checkUserAccess(contentId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM content_items ci
      LEFT JOIN content_collaborators cc ON ci.id = cc.content_id
      WHERE ci.id = $1 AND (
        ci.user_id = $2 OR 
        (cc.user_id = $2 AND cc.status = 'accepted')
      )
      LIMIT 1
    `;

    const result = await db.query(query, [contentId, userId]);
    return result.rows.length > 0;
  },

  /**
   * Get collaborators for content
   */
  async getCollaborators(contentId: string): Promise<any[]> {
    const query = `
      SELECT 
        cc.id,
        cc.permission,
        cc.status,
        cc.created_at,
        u.id as user_id,
        u.email,
        u.name
      FROM content_collaborators cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.content_id = $1
      ORDER BY cc.created_at DESC
    `;

    const result = await db.query(query, [contentId]);
    return result.rows.map(row => ({
      id: row.id,
      permission: row.permission,
      status: row.status,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        email: row.email,
        name: row.name
      }
    }));
  },

  /**
   * Add collaborator to content
   */
  async addCollaborator(data: {
    contentId: string;
    email: string;
    permission: 'owner' | 'editor' | 'viewer';
    invitedBy: string;
    message?: string;
  }): Promise<any> {
    // Generate invitation token
    const token = require('crypto').randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO content_collaborators (
        content_id, email, permission, invited_by, message, token, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, email, permission, token
    `;

    const values = [
      data.contentId,
      data.email,
      data.permission,
      data.invitedBy,
      data.message || null,
      token
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<any | null> {
    const query = `
      SELECT 
        cc.id,
        cc.content_id,
        cc.email,
        cc.permission,
        cc.message,
        cc.status,
        cc.created_at,
        ci.title,
        ci.type,
        u.name as inviter_name,
        u.email as inviter_email
      FROM content_collaborators cc
      JOIN content_items ci ON cc.content_id = ci.id
      JOIN users u ON cc.invited_by = u.id
      WHERE cc.token = $1
    `;

    const result = await db.query(query, [token]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      content_id: row.content_id,
      email: row.email,
      permission: row.permission,
      message: row.message,
      status: row.status,
      created_at: row.created_at,
      content: {
        title: row.title,
        type: row.type
      },
      inviter: {
        name: row.inviter_name,
        email: row.inviter_email
      }
    };
  },

  /**
   * Accept invitation and add user as collaborator
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const query = `
      UPDATE content_collaborators 
      SET status = 'accepted', user_id = $2, accepted_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [invitationId, userId]);
  },

  /**
   * Update invitation status
   */
  async updateInvitationStatus(invitationId: string, status: string): Promise<void> {
    const query = `
      UPDATE content_collaborators 
      SET status = $2
      WHERE id = $1
    `;

    await db.query(query, [invitationId, status]);
  },

  /**
   * Update collaborator permission
   */
  async updateCollaboratorPermission(collaboratorId: string, permission: string): Promise<void> {
    const query = `
      UPDATE content_collaborators 
      SET permission = $2
      WHERE id = $1
    `;

    await db.query(query, [collaboratorId, permission]);
  },

  /**
   * Get collaborator by ID
   */
  async getCollaboratorById(collaboratorId: string): Promise<any | null> {
    const query = `
      SELECT id, content_id, user_id, permission, status
      FROM content_collaborators
      WHERE id = $1
    `;

    const result = await db.query(query, [collaboratorId]);
    return result.rows[0] || null;
  },

  /**
   * Remove collaborator
   */
  async removeCollaborator(collaboratorId: string): Promise<void> {
    const query = `
      DELETE FROM content_collaborators
      WHERE id = $1
    `;

    await db.query(query, [collaboratorId]);
  },

  // ===== PRESENCE METHODS =====

  /**
   * Update user presence for content
   */
  async updatePresence(
    contentId: string, 
    userId: string, 
    data: {
      cursor_position: number | null;
      selection_start: number | null;
      selection_end: number | null;
    }
  ): Promise<void> {
    const query = `
      INSERT INTO content_presence (
        content_id, user_id, cursor_position, selection_start, selection_end, last_seen
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (content_id, user_id)
      DO UPDATE SET
        cursor_position = EXCLUDED.cursor_position,
        selection_start = EXCLUDED.selection_start,
        selection_end = EXCLUDED.selection_end,
        last_seen = NOW()
    `;

    await db.query(query, [
      contentId,
      userId,
      data.cursor_position,
      data.selection_start,
      data.selection_end
    ]);
  },

  /**
   * Get active presence for content
   */
  async getActivePresence(contentId: string): Promise<any[]> {
    const query = `
      SELECT 
        cp.user_id,
        cp.cursor_position,
        cp.selection_start,
        cp.selection_end,
        cp.last_seen,
        u.name as user_name,
        u.email as user_email
      FROM content_presence cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.content_id = $1 
        AND cp.last_seen > NOW() - INTERVAL '5 minutes'
      ORDER BY cp.last_seen DESC
    `;

    const result = await db.query(query, [contentId]);
    return result.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      cursorPosition: row.cursor_position,
      selectionStart: row.selection_start,
      selectionEnd: row.selection_end,
      lastSeen: row.last_seen
    }));
  },

  /**
   * Remove user presence
   */
  async removePresence(contentId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM content_presence
      WHERE content_id = $1 AND user_id = $2
    `;

    await db.query(query, [contentId, userId]);
  },

  /**
   * Clean up old presence records
   */
  async cleanupOldPresence(): Promise<void> {
    const query = `
      DELETE FROM content_presence
      WHERE last_seen < NOW() - INTERVAL '5 minutes'
    `;

    await db.query(query);
  },
};

// Export as class for compatibility
export class ContentItemsRepository {
  static create = contentItemsRepository.create;
  static findById = contentItemsRepository.findById;
  static findByUser = contentItemsRepository.findByUser;
  static findScheduledDue = contentItemsRepository.findScheduledDue;
  static update = contentItemsRepository.update;
  static delete = contentItemsRepository.delete;
  static countByUser = contentItemsRepository.countByUser;
  static search = contentItemsRepository.search;
}
