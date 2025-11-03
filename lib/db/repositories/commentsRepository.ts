import { db } from '@/lib/db';

export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  parentId?: string;
  text: string;
  positionStart?: number;
  positionEnd?: number;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  userName?: string;
  userEmail?: string;
  replies?: Comment[];
}

export interface CreateCommentData {
  contentId: string;
  userId: string;
  parentId?: string;
  text: string;
  positionStart?: number;
  positionEnd?: number;
}

export interface UpdateCommentData {
  text?: string;
  resolved?: boolean;
}

class CommentsRepository {
  async create(data: CreateCommentData): Promise<Comment> {
    const query = `
      INSERT INTO content_comments (
        content_id, user_id, parent_id, text, 
        position_start, position_end, resolved
      )
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING *
    `;

    const values = [
      data.contentId,
      data.userId,
      data.parentId,
      data.text,
      data.positionStart,
      data.positionEnd,
    ];

    const result = await db.query(query, values);
    return this.mapComment(result.rows[0]);
  }

  async getById(id: string): Promise<Comment | null> {
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM content_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] ? this.mapCommentWithUser(result.rows[0]) : null;
  }

  async getByContentId(contentId: string): Promise<Comment[]> {
    const query = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM content_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.content_id = $1
      ORDER BY c.created_at ASC
    `;

    const result = await db.query(query, [contentId]);
    const comments = result.rows.map(row => this.mapCommentWithUser(row));

    // Organize comments into threads (parent comments with their replies)
    return this.organizeCommentThreads(comments);
  }

  async update(id: string, data: UpdateCommentData): Promise<Comment> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.text !== undefined) {
      setParts.push(`text = $${paramIndex++}`);
      values.push(data.text);
    }

    if (data.resolved !== undefined) {
      setParts.push(`resolved = $${paramIndex++}`);
      values.push(data.resolved);
    }

    setParts.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE content_comments 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.mapComment(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    // Delete replies first (cascade should handle this, but being explicit)
    await db.query('DELETE FROM content_comments WHERE parent_id = $1', [id]);
    
    // Delete the comment
    await db.query('DELETE FROM content_comments WHERE id = $1', [id]);
  }

  async getUnresolvedCount(contentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM content_comments
      WHERE content_id = $1 AND resolved = false
    `;

    const result = await db.query(query, [contentId]);
    return parseInt(result.rows[0].count);
  }

  async markAllResolved(contentId: string): Promise<void> {
    const query = `
      UPDATE content_comments 
      SET resolved = true, updated_at = NOW()
      WHERE content_id = $1 AND resolved = false
    `;

    await db.query(query, [contentId]);
  }

  private mapComment(row: any): Comment {
    return {
      id: row.id,
      contentId: row.content_id,
      userId: row.user_id,
      parentId: row.parent_id,
      text: row.text,
      positionStart: row.position_start,
      positionEnd: row.position_end,
      resolved: row.resolved,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapCommentWithUser(row: any): Comment {
    return {
      ...this.mapComment(row),
      userName: row.user_name,
      userEmail: row.user_email,
    };
  }

  private organizeCommentThreads(comments: Comment[]): Comment[] {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map and identify root comments
    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
      
      if (!comment.parentId) {
        rootComments.push(comment);
      }
    });

    // Second pass: organize replies under parent comments
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(comment);
        }
      }
    });

    return rootComments;
  }
}

export const commentsRepository = new CommentsRepository();