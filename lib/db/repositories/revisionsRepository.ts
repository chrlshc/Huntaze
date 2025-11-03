import { db } from '@/lib/db';

export interface Revision {
  id: string;
  contentId: string;
  userId: string;
  snapshot: any; // JSON snapshot of the content at that time
  description: string;
  createdAt: Date;
  // Joined data
  userName?: string;
  userEmail?: string;
}

export interface CreateRevisionData {
  contentId: string;
  userId: string;
  snapshot: any;
  description: string;
}

class RevisionsRepository {
  async create(data: CreateRevisionData): Promise<Revision> {
    const query = `
      INSERT INTO content_revisions (
        content_id, user_id, snapshot, description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      data.contentId,
      data.userId,
      JSON.stringify(data.snapshot),
      data.description,
    ];

    const result = await db.query(query, values);
    return this.mapRevision(result.rows[0]);
  }

  async getById(id: string): Promise<Revision | null> {
    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email
      FROM content_revisions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] ? this.mapRevisionWithUser(result.rows[0]) : null;
  }

  async getByContentId(contentId: string, limit = 50): Promise<Revision[]> {
    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email
      FROM content_revisions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.content_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [contentId, limit]);
    return result.rows.map(row => this.mapRevisionWithUser(row));
  }

  async getLatestRevision(contentId: string): Promise<Revision | null> {
    const query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email
      FROM content_revisions r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.content_id = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [contentId]);
    return result.rows[0] ? this.mapRevisionWithUser(result.rows[0]) : null;
  }

  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM content_revisions WHERE id = $1', [id]);
  }

  async deleteOldRevisions(contentId: string, keepCount = 20): Promise<void> {
    // Keep only the most recent revisions
    const query = `
      DELETE FROM content_revisions 
      WHERE content_id = $1 
      AND id NOT IN (
        SELECT id FROM content_revisions 
        WHERE content_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      )
    `;

    await db.query(query, [contentId, keepCount]);
  }

  async getRevisionCount(contentId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM content_revisions
      WHERE content_id = $1
    `;

    const result = await db.query(query, [contentId]);
    return parseInt(result.rows[0].count);
  }

  // Create automatic revision when content changes significantly
  async createAutoRevision(
    contentId: string, 
    userId: string, 
    currentContent: any, 
    changeType: 'edit' | 'save' | 'publish' | 'schedule'
  ): Promise<Revision> {
    const descriptions = {
      edit: 'Content edited',
      save: 'Content saved',
      publish: 'Content published',
      schedule: 'Content scheduled'
    };

    return this.create({
      contentId,
      userId,
      snapshot: currentContent,
      description: descriptions[changeType]
    });
  }

  // Check if content has changed significantly to warrant a new revision
  async shouldCreateRevision(contentId: string, newContent: any): Promise<boolean> {
    const latestRevision = await this.getLatestRevision(contentId);
    
    if (!latestRevision) {
      return true; // First revision
    }

    const oldContent = latestRevision.snapshot;
    
    // Simple change detection - could be enhanced with more sophisticated diff
    const oldText = oldContent.text || '';
    const newText = newContent.text || '';
    
    // Create revision if text changed by more than 10 characters or 5%
    const textDiff = Math.abs(newText.length - oldText.length);
    const changePercentage = textDiff / Math.max(oldText.length, 1);
    
    return textDiff > 10 || changePercentage > 0.05;
  }

  private mapRevision(row: any): Revision {
    return {
      id: row.id,
      contentId: row.content_id,
      userId: row.user_id,
      snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot,
      description: row.description,
      createdAt: new Date(row.created_at),
    };
  }

  private mapRevisionWithUser(row: any): Revision {
    return {
      ...this.mapRevision(row),
      userName: row.user_name,
      userEmail: row.user_email,
    };
  }
}

export const revisionsRepository = new RevisionsRepository();