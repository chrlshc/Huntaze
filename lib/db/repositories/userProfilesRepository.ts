import { getPool } from '../index';

export interface UserProfile {
  userId: number;
  displayName?: string;
  bio?: string;
  timezone?: string;
  niche?: string;
  goals?: string[];
  avatarUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export class UserProfilesRepository {
  static async getProfile(userId: number): Promise<UserProfile | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        user_id as "userId", display_name as "displayName", bio, timezone,
        niche, goals, avatar_url as "avatarUrl", metadata,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM user_profiles 
      WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async upsertProfile(userId: number, data: Partial<UserProfile>): Promise<UserProfile> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO user_profiles (
        user_id, display_name, bio, timezone, niche, goals, avatar_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
        bio = COALESCE(EXCLUDED.bio, user_profiles.bio),
        timezone = COALESCE(EXCLUDED.timezone, user_profiles.timezone),
        niche = COALESCE(EXCLUDED.niche, user_profiles.niche),
        goals = COALESCE(EXCLUDED.goals, user_profiles.goals),
        avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
        metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata),
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        user_id as "userId", display_name as "displayName", bio, timezone,
        niche, goals, avatar_url as "avatarUrl", metadata,
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        data.displayName || null,
        data.bio || null,
        data.timezone || null,
        data.niche || null,
        JSON.stringify(data.goals || []),
        data.avatarUrl || null,
        JSON.stringify(data.metadata || {})
      ]
    );
    return result.rows[0];
  }
}
