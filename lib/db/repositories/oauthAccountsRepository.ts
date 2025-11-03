/**
 * OAuth Accounts Repository
 * 
 * Manages OAuth accounts for all social platforms:
 * - Create/update accounts with encrypted tokens
 * - Find accounts by user and provider
 * - Update tokens after refresh
 * - Find expiring tokens for refresh scheduler
 */

import { getPool } from '../index';
import { tokenEncryption } from '@/lib/services/tokenEncryption';

export interface OAuthAccount {
  id: number;
  userId: number;
  provider: string;
  openId: string;
  scope: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOAuthAccountParams {
  userId: number;
  provider: string;
  openId: string;
  scope: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface UpdateTokensParams {
  id: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

/**
 * OAuth Accounts Repository
 */
export class OAuthAccountsRepository {
  /**
   * Create or update OAuth account
   * Tokens are encrypted before storage
   * 
   * @param params - Account parameters
   * @returns Created/updated account
   */
  async create(params: CreateOAuthAccountParams): Promise<OAuthAccount> {
    const {
      userId,
      provider,
      openId,
      scope,
      accessToken,
      refreshToken,
      expiresAt,
      metadata,
    } = params;

    const pool = getPool();

    // Encrypt tokens
    const accessTokenEncrypted = tokenEncryption.encryptAccessToken(accessToken);
    const refreshTokenEncrypted = refreshToken
      ? tokenEncryption.encryptRefreshToken(refreshToken)
      : null;

    // Upsert (insert or update if exists)
    const result = await pool.query(
      `INSERT INTO oauth_accounts (
        user_id,
        provider,
        open_id,
        scope,
        access_token_encrypted,
        refresh_token_encrypted,
        expires_at,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (user_id, provider, open_id)
      DO UPDATE SET
        scope = EXCLUDED.scope,
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id, user_id, provider, open_id, scope, expires_at, metadata, created_at, updated_at`,
      [
        userId,
        provider,
        openId,
        scope,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    const row = result.rows[0];
    return this.mapRowToAccount(row);
  }

  /**
   * Find OAuth account by user and provider
   * 
   * @param userId - User ID
   * @param provider - Provider name (tiktok, instagram, etc.)
   * @returns Account or null if not found
   */
  async findByUserAndProvider(
    userId: number,
    provider: string
  ): Promise<OAuthAccount | null> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, provider, open_id, scope, expires_at, metadata, created_at, updated_at
       FROM oauth_accounts
       WHERE user_id = $1 AND provider = $2
       LIMIT 1`,
      [userId, provider]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Find OAuth account by ID
   * 
   * @param id - Account ID
   * @returns Account or null if not found
   */
  async findById(id: number): Promise<OAuthAccount | null> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, provider, open_id, scope, expires_at, metadata, created_at, updated_at
       FROM oauth_accounts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Update tokens for an account
   * Tokens are encrypted before storage
   * 
   * @param params - Update parameters
   */
  async updateTokens(params: UpdateTokensParams): Promise<void> {
    const { id, accessToken, refreshToken, expiresAt } = params;

    const pool = getPool();

    // Encrypt tokens
    const accessTokenEncrypted = tokenEncryption.encryptAccessToken(accessToken);
    const refreshTokenEncrypted = refreshToken
      ? tokenEncryption.encryptRefreshToken(refreshToken)
      : null;

    await pool.query(
      `UPDATE oauth_accounts
       SET access_token_encrypted = $1,
           refresh_token_encrypted = COALESCE($2, refresh_token_encrypted),
           expires_at = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [accessTokenEncrypted, refreshTokenEncrypted, expiresAt, id]
    );
  }

  /**
   * Find accounts expiring soon
   * Used by token refresh scheduler
   * 
   * @param minutes - Minutes until expiry
   * @returns List of accounts expiring within specified minutes
   */
  async findExpiringSoon(minutes: number = 60): Promise<OAuthAccount[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, provider, open_id, scope, expires_at, metadata, created_at, updated_at
       FROM oauth_accounts
       WHERE expires_at > NOW()
         AND expires_at <= NOW() + INTERVAL '${minutes} minutes'
       ORDER BY expires_at ASC`,
      []
    );

    return result.rows.map(row => this.mapRowToAccount(row));
  }

  /**
   * Get encrypted tokens for an account
   * Used by token refresh logic
   * 
   * @param id - Account ID
   * @returns Encrypted tokens or null
   */
  async getEncryptedTokens(id: number): Promise<{
    accessToken: string;
    refreshToken: string | null;
  } | null> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT access_token_encrypted, refresh_token_encrypted
       FROM oauth_accounts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      accessToken: result.rows[0].access_token_encrypted,
      refreshToken: result.rows[0].refresh_token_encrypted,
    };
  }

  /**
   * Delete OAuth account
   * 
   * @param id - Account ID
   * @returns True if deleted
   */
  async delete(id: number): Promise<boolean> {
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM oauth_accounts WHERE id = $1`,
      [id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete OAuth account by user and provider
   * 
   * @param userId - User ID
   * @param provider - Provider name
   * @returns True if deleted
   */
  async deleteByUserAndProvider(userId: number, provider: string): Promise<boolean> {
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get all accounts for a user
   * 
   * @param userId - User ID
   * @returns List of accounts
   */
  async findByUser(userId: number): Promise<OAuthAccount[]> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, provider, open_id, scope, expires_at, metadata, created_at, updated_at
       FROM oauth_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapRowToAccount(row));
  }

  /**
   * Map database row to OAuthAccount object
   */
  private mapRowToAccount(row: any): OAuthAccount {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      openId: row.open_id,
      scope: row.scope,
      expiresAt: new Date(row.expires_at),
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton instance
export const oauthAccountsRepository = new OAuthAccountsRepository();
