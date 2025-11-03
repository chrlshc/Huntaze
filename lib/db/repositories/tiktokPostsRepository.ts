/**
 * TikTok Posts Repository
 * 
 * Manages TikTok posts:
 * - Create posts with upsert on publish_id
 * - Update post status
 * - Find posts by user
 * - Find pending posts for status updates
 */

import { getPool } from '../index';

export type TikTokPostStatus =
  | 'PROCESSING_UPLOAD'
  | 'SEND_TO_USER_INBOX'
  | 'PUBLISH_COMPLETE'
  | 'FAILED';

export type TikTokPostSource = 'FILE_UPLOAD' | 'PULL_FROM_URL';

export interface TikTokPost {
  id: number;
  userId: number;
  oauthAccountId: number;
  publishId: string;
  status: TikTokPostStatus;
  source: TikTokPostSource;
  title: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTikTokPostParams {
  userId: number;
  oauthAccountId: number;
  publishId: string;
  status: TikTokPostStatus;
  source: TikTokPostSource;
  title: string;
  metadata?: Record<string, any>;
}

export interface UpdateStatusParams {
  publishId: string;
  status: TikTokPostStatus;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * TikTok Posts Repository
 */
export class TikTokPostsRepository {
  /**
   * Create TikTok post with upsert on publish_id
   * 
   * @param params - Post parameters
   * @returns Created/updated post
   */
  async create(params: CreateTikTokPostParams): Promise<TikTokPost> {
    const {
      userId,
      oauthAccountId,
      publishId,
      status,
      source,
      title,
      metadata,
    } = params;

    const pool = getPool();

    const result = await pool.query(
      `INSERT INTO tiktok_posts (
        user_id,
        oauth_account_id,
        publish_id,
        status,
        source,
        title,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (publish_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id, user_id, oauth_account_id, publish_id, status, source, title, 
                error_code, error_message, metadata, created_at, updated_at`,
      [
        userId,
        oauthAccountId,
        publishId,
        status,
        source,
        title,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return this.mapRowToPost(result.rows[0]);
  }

  /**
   * Update post status
   * 
   * @param params - Update parameters
   */
  async updateStatus(params: UpdateStatusParams): Promise<void> {
    const { publishId, status, errorCode, errorMessage, metadata } = params;

    const pool = getPool();

    // Build dynamic query based on provided fields
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [publishId, status];
    let paramIndex = 3;

    if (errorCode !== undefined) {
      updates.push(`error_code = $${paramIndex}`);
      values.push(errorCode);
      paramIndex++;
    }

    if (errorMessage !== undefined) {
      updates.push(`error_message = $${paramIndex}`);
      values.push(errorMessage);
      paramIndex++;
    }

    if (metadata !== undefined) {
      updates.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${paramIndex}::jsonb`);
      values.push(JSON.stringify(metadata));
      paramIndex++;
    }

    await pool.query(
      `UPDATE tiktok_posts
       SET ${updates.join(', ')}
       WHERE publish_id = $1`,
      values
    );
  }

  /**
   * Find post by publish_id
   * 
   * @param publishId - TikTok publish ID
   * @returns Post or null if not found
   */
  async findByPublishId(publishId: string): Promise<TikTokPost | null> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, oauth_account_id, publish_id, status, source, title,
              error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE publish_id = $1`,
      [publishId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPost(result.rows[0]);
  }

  /**
   * Find posts by user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of posts to return
   * @returns List of posts
   */
  async findByUser(userId: number, limit: number = 50): Promise<TikTokPost[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, oauth_account_id, publish_id, status, source, title,
              error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapRowToPost(row));
  }

  /**
   * Find pending posts (for status updates)
   * 
   * @param limit - Maximum number of posts to return
   * @returns List of pending posts
   */
  async findPendingPosts(limit: number = 100): Promise<TikTokPost[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, oauth_account_id, publish_id, status, source, title,
              error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX')
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => this.mapRowToPost(row));
  }

  /**
   * Find posts by status
   * 
   * @param status - Post status
   * @param limit - Maximum number of posts to return
   * @returns List of posts
   */
  async findByStatus(status: TikTokPostStatus, limit: number = 100): Promise<TikTokPost[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, oauth_account_id, publish_id, status, source, title,
              error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE status = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [status, limit]
    );

    return result.rows.map(row => this.mapRowToPost(row));
  }

  /**
   * Count pending posts for user in last 24 hours
   * Used for quota enforcement
   * 
   * @param userId - User ID
   * @returns Count of pending posts
   */
  async countPendingPostsLast24h(userId: number): Promise<number> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM tiktok_posts
       WHERE user_id = $1
         AND status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX')
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get post statistics for user
   * 
   * @param userId - User ID
   * @returns Statistics object
   */
  async getStatistics(userId: number): Promise<{
    total: number;
    processing: number;
    inbox: number;
    complete: number;
    failed: number;
  }> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'PROCESSING_UPLOAD') as processing,
         COUNT(*) FILTER (WHERE status = 'SEND_TO_USER_INBOX') as inbox,
         COUNT(*) FILTER (WHERE status = 'PUBLISH_COMPLETE') as complete,
         COUNT(*) FILTER (WHERE status = 'FAILED') as failed
       FROM tiktok_posts
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total, 10),
      processing: parseInt(row.processing, 10),
      inbox: parseInt(row.inbox, 10),
      complete: parseInt(row.complete, 10),
      failed: parseInt(row.failed, 10),
    };
  }

  /**
   * Delete post
   * 
   * @param id - Post ID
   * @returns True if deleted
   */
  async delete(id: number): Promise<boolean> {
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM tiktok_posts WHERE id = $1`,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Map database row to TikTokPost object
   */
  private mapRowToPost(row: any): TikTokPost {
    return {
      id: row.id,
      userId: row.user_id,
      oauthAccountId: row.oauth_account_id,
      publishId: row.publish_id,
      status: row.status,
      source: row.source,
      title: row.title,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton instance
export const tiktokPostsRepository = new TikTokPostsRepository();
