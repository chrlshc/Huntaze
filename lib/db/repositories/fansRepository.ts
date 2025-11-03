import { getPool } from '../index';
import type { Fan } from '@/lib/services/crmData';

export class FansRepository {
  /**
   * List all fans for a user
   */
  static async listFans(userId: number): Promise<Fan[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar as "avatar", tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM fans 
      WHERE user_id = $1 
      ORDER BY updated_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get a single fan by ID
   */
  static async getFan(userId: number, fanId: number): Promise<Fan | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar, tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM fans 
      WHERE id = $1 AND user_id = $2`,
      [fanId, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new fan
   */
  static async createFan(userId: number, data: Partial<Fan>): Promise<Fan> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO fans (
        user_id, name, platform, handle, email, phone, avatar,
        tags, value_cents, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar, tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"`,
      [
        userId,
        data.name || 'Unnamed',
        data.platform || null,
        data.handle || null,
        data.email || null,
        data.phone || null,
        data.avatar || null,
        JSON.stringify(data.tags || []),
        data.valueCents || 0,
        data.notes || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Update a fan
   */
  static async updateFan(
    userId: number,
    fanId: number,
    data: Partial<Fan>
  ): Promise<Fan | null> {
    const pool = getPool();
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.platform !== undefined) {
      updates.push(`platform = $${paramIndex++}`);
      values.push(data.platform);
    }
    if (data.handle !== undefined) {
      updates.push(`handle = $${paramIndex++}`);
      values.push(data.handle);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(data.avatar);
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(data.tags));
    }
    if (data.valueCents !== undefined) {
      updates.push(`value_cents = $${paramIndex++}`);
      values.push(data.valueCents);
    }
    if (data.lastSeenAt !== undefined) {
      updates.push(`last_seen_at = $${paramIndex++}`);
      values.push(data.lastSeenAt);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      return this.getFan(userId, fanId);
    }

    values.push(fanId, userId);

    const result = await pool.query(
      `UPDATE fans 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar, tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a fan
   */
  static async deleteFan(userId: number, fanId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM fans WHERE id = $1 AND user_id = $2',
      [fanId, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Search fans by name or handle
   */
  static async searchFans(userId: number, query: string): Promise<Fan[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar, tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM fans 
      WHERE user_id = $1 
      AND (name ILIKE $2 OR handle ILIKE $2 OR email ILIKE $2)
      ORDER BY updated_at DESC
      LIMIT 50`,
      [userId, `%${query}%`]
    );
    return result.rows;
  }

  /**
   * Get top fans by value
   */
  static async getTopFans(userId: number, limit: number = 10): Promise<Fan[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id, user_id as "userId", name, platform, handle, email, phone,
        avatar, tags, value_cents as "valueCents",
        last_seen_at as "lastSeenAt", notes,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM fans 
      WHERE user_id = $1 
      ORDER BY value_cents DESC, updated_at DESC
      LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
}
