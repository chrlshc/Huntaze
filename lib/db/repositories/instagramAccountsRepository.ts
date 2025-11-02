/**
 * Instagram Accounts Repository
 * Manages instagram_accounts table
 */

import { getPool } from '../index';

export interface InstagramAccount {
  id: number;
  user_id: number;
  oauth_account_id: number;
  ig_business_id: string;
  page_id: string;
  username: string;
  access_level?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class InstagramAccountsRepository {
  async create(data: {
    userId: number;
    oauthAccountId: number;
    igBusinessId: string;
    pageId: string;
    username: string;
    accessLevel?: string;
    metadata?: any;
  }): Promise<InstagramAccount> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO instagram_accounts (user_id, oauth_account_id, ig_business_id, page_id, username, access_level, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, ig_business_id) DO UPDATE SET
         oauth_account_id = EXCLUDED.oauth_account_id,
         page_id = EXCLUDED.page_id,
         username = EXCLUDED.username,
         access_level = EXCLUDED.access_level,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()
       RETURNING *`,
      [data.userId, data.oauthAccountId, data.igBusinessId, data.pageId, data.username, data.accessLevel, data.metadata ? JSON.stringify(data.metadata) : null]
    );
    return result.rows[0];
  }

  async findByUser(userId: number): Promise<InstagramAccount[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM instagram_accounts WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }
}

export const instagramAccountsRepository = new InstagramAccountsRepository();
