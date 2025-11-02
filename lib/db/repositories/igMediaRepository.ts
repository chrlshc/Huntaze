/**
 * Instagram Media Repository
 * Manages ig_media table
 */

import { getPool } from '../index';

export class IgMediaRepository {
  async upsert(data: {
    instagramAccountId: number;
    igId: string;
    mediaType: string;
    caption?: string;
    permalink?: string;
    timestamp?: Date;
    metricsJson?: any;
  }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO ig_media (instagram_account_id, ig_id, media_type, caption, permalink, timestamp, metrics_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (ig_id) DO UPDATE SET
         media_type = EXCLUDED.media_type,
         caption = EXCLUDED.caption,
         permalink = EXCLUDED.permalink,
         metrics_json = EXCLUDED.metrics_json,
         updated_at = NOW()
       RETURNING *`,
      [data.instagramAccountId, data.igId, data.mediaType, data.caption, data.permalink, data.timestamp, data.metricsJson ? JSON.stringify(data.metricsJson) : null]
    );
    return result.rows[0];
  }

  async findByAccount(instagramAccountId: number) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM ig_media WHERE instagram_account_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [instagramAccountId]
    );
    return result.rows;
  }
}

export const igMediaRepository = new IgMediaRepository();
