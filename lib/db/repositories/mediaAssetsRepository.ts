import { db } from '../index';

export interface MediaAsset {
  id: string;
  userId: string;
  type: 'image' | 'video';
  filename: string;
  originalUrl: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  mimeType?: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateMediaAssetData {
  userId: string;
  type: 'image' | 'video';
  filename: string;
  originalUrl: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export const mediaAssetsRepository = {
  /**
   * Create a new media asset
   */
  async create(data: CreateMediaAssetData): Promise<MediaAsset> {
    const query = `
      INSERT INTO media_assets (
        user_id, type, filename, original_url, thumbnail_url,
        size_bytes, width, height, duration_seconds, mime_type, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, user_id as "userId", type, filename,
        original_url as "originalUrl", thumbnail_url as "thumbnailUrl",
        size_bytes as "sizeBytes", width, height,
        duration_seconds as "durationSeconds", mime_type as "mimeType",
        uploaded_at as "uploadedAt", metadata
    `;

    const values = [
      data.userId,
      data.type,
      data.filename,
      data.originalUrl,
      data.thumbnailUrl || null,
      data.sizeBytes,
      data.width || null,
      data.height || null,
      data.durationSeconds || null,
      data.mimeType || null,
      JSON.stringify(data.metadata || {}),
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Get media asset by ID
   */
  async findById(id: string): Promise<MediaAsset | null> {
    const query = `
      SELECT 
        id, user_id as "userId", type, filename,
        original_url as "originalUrl", thumbnail_url as "thumbnailUrl",
        size_bytes as "sizeBytes", width, height,
        duration_seconds as "durationSeconds", mime_type as "mimeType",
        uploaded_at as "uploadedAt", metadata
      FROM media_assets
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  /**
   * Get all media assets for a user with filters
   */
  async findByUser(
    userId: string,
    options: {
      type?: 'image' | 'video';
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ): Promise<MediaAsset[]> {
    const conditions = ['user_id = $1'];
    const values: any[] = [userId];
    let paramCount = 1;

    if (options.type) {
      paramCount++;
      conditions.push(`type = $${paramCount}`);
      values.push(options.type);
    }

    if (options.search) {
      paramCount++;
      conditions.push(`filename ILIKE $${paramCount}`);
      values.push(`%${options.search}%`);
    }

    const query = `
      SELECT 
        id, user_id as "userId", type, filename,
        original_url as "originalUrl", thumbnail_url as "thumbnailUrl",
        size_bytes as "sizeBytes", width, height,
        duration_seconds as "durationSeconds", mime_type as "mimeType",
        uploaded_at as "uploadedAt", metadata
      FROM media_assets
      WHERE ${conditions.join(' AND ')}
      ORDER BY uploaded_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(options.limit || 50, options.offset || 0);

    const result = await db.query(query, values);
    return result.rows;
  },

  /**
   * Get media assets by IDs
   */
  async findByIds(ids: string[]): Promise<MediaAsset[]> {
    if (ids.length === 0) return [];

    const query = `
      SELECT 
        id, user_id as "userId", type, filename,
        original_url as "originalUrl", thumbnail_url as "thumbnailUrl",
        size_bytes as "sizeBytes", width, height,
        duration_seconds as "durationSeconds", mime_type as "mimeType",
        uploaded_at as "uploadedAt", metadata
      FROM media_assets
      WHERE id = ANY($1)
    `;

    const result = await db.query(query, [ids]);
    return result.rows;
  },

  /**
   * Delete media asset
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM media_assets WHERE id = $1';
    const result = await db.query(query, [id]);
    return (result.rowCount || 0) > 0;
  },

  /**
   * Get storage usage for a user
   */
  async getStorageUsage(userId: string): Promise<{ usedBytes: number; quotaBytes: number }> {
    const query = `
      SELECT used_bytes as "usedBytes", quota_bytes as "quotaBytes"
      FROM user_storage_quota
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Initialize quota if not exists
      const initQuery = `
        INSERT INTO user_storage_quota (user_id, used_bytes, quota_bytes)
        VALUES ($1, 0, 10737418240)
        RETURNING used_bytes as "usedBytes", quota_bytes as "quotaBytes"
      `;
      const initResult = await db.query(initQuery, [userId]);
      return initResult.rows[0];
    }

    return result.rows[0];
  },

  /**
   * Count media assets by user
   */
  async countByUser(userId: string, type?: 'image' | 'video'): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM media_assets WHERE user_id = $1';
    const values: any[] = [userId];

    if (type) {
      query += ' AND type = $2';
      values.push(type);
    }

    const result = await db.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Check if media is used in any content
   */
  async isUsedInContent(mediaId: string): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM content_media WHERE media_id = $1';
    const result = await db.query(query, [mediaId]);
    return parseInt(result.rows[0].count, 10) > 0;
  },

  /**
   * Link media to content
   */
  async linkToContent(contentId: string, mediaId: string, position: number): Promise<void> {
    const query = `
      INSERT INTO content_media (content_id, media_id, position)
      VALUES ($1, $2, $3)
      ON CONFLICT (content_id, media_id) DO UPDATE SET position = $3
    `;
    await db.query(query, [contentId, mediaId, position]);
  },

  /**
   * Get media for content
   */
  async getContentMedia(contentId: string): Promise<MediaAsset[]> {
    const query = `
      SELECT 
        m.id, m.user_id as "userId", m.type, m.filename,
        m.original_url as "originalUrl", m.thumbnail_url as "thumbnailUrl",
        m.size_bytes as "sizeBytes", m.width, m.height,
        m.duration_seconds as "durationSeconds", m.mime_type as "mimeType",
        m.uploaded_at as "uploadedAt", m.metadata
      FROM media_assets m
      INNER JOIN content_media cm ON m.id = cm.media_id
      WHERE cm.content_id = $1
      ORDER BY cm.position ASC
    `;

    const result = await db.query(query, [contentId]);
    return result.rows;
  },

  /**
   * Unlink media from content
   */
  async unlinkFromContent(contentId: string, mediaId: string): Promise<void> {
    const query = 'DELETE FROM content_media WHERE content_id = $1 AND media_id = $2';
    await db.query(query, [contentId, mediaId]);
  },
};

// Export as class for compatibility
export class MediaAssetsRepository {
  static create = mediaAssetsRepository.create;
  static findById = mediaAssetsRepository.findById;
  static findByUser = mediaAssetsRepository.findByUser;
  static findByIds = mediaAssetsRepository.findByIds;
  static delete = mediaAssetsRepository.delete;
  static getStorageUsage = mediaAssetsRepository.getStorageUsage;
  static countByUser = mediaAssetsRepository.countByUser;
  static isUsedInContent = mediaAssetsRepository.isUsedInContent;
  static linkToContent = mediaAssetsRepository.linkToContent;
  static getContentMedia = mediaAssetsRepository.getContentMedia;
  static unlinkFromContent = mediaAssetsRepository.unlinkFromContent;
}
