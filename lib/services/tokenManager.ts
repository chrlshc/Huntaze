/**
 * Token Manager
 * 
 * Manages OAuth token lifecycle:
 * - Store tokens (encrypted)
 * - Retrieve valid tokens (auto-refresh if needed)
 * - Refresh tokens (with rotation support)
 * 
 * Supports TikTok, Instagram, and other OAuth providers
 */

import { getPool } from '../db';
import { tokenEncryption } from './tokenEncryption';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
  metadata?: Record<string, any>;
}

export interface StoredOAuthAccount {
  id: number;
  userId: number;
  provider: string;
  openId: string;
  scope: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Token Manager Service
 */
export class TokenManager {
  /**
   * Store OAuth tokens for a user
   * Tokens are encrypted before storage
   */
  async storeTokens(params: {
    userId: number;
    provider: string;
    openId: string;
    tokens: OAuthTokens;
  }): Promise<StoredOAuthAccount> {
    const { userId, provider, openId, tokens } = params;
    const pool = getPool();

    // Encrypt tokens
    const accessTokenEncrypted = tokenEncryption.encryptAccessToken(tokens.accessToken);
    const refreshTokenEncrypted = tokens.refreshToken
      ? tokenEncryption.encryptRefreshToken(tokens.refreshToken)
      : null;

    // Upsert (insert or update if exists)
    const result = await pool.query(
      `INSERT INTO oauth_accounts (
        user_id, provider, open_id, scope,
        access_token_encrypted, refresh_token_encrypted,
        expires_at, metadata, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id, provider, open_id)
      DO UPDATE SET
        scope = EXCLUDED.scope,
        access_token_encrypted = EXCLUDED.access_token_encrypted,
        refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
        expires_at = EXCLUDED.expires_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING id, user_id, provider, open_id, scope, expires_at, metadata`,
      [
        userId,
        provider,
        openId,
        tokens.scope,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokens.expiresAt,
        tokens.metadata ? JSON.stringify(tokens.metadata) : null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get valid access token for a user
   * Automatically refreshes if expired (for providers that support it)
   */
  async getValidToken(params: {
    userId: number;
    provider: string;
    refreshCallback?: (refreshToken: string) => Promise<{
      accessToken: string;
      refreshToken?: string;
      expiresIn: number;
    }>;
  }): Promise<string | null> {
    const { userId, provider, refreshCallback } = params;
    const pool = getPool();

    // Get account
    const result = await pool.query(
      `SELECT id, open_id, access_token_encrypted, refresh_token_encrypted, expires_at
       FROM oauth_accounts
       WHERE user_id = $1 AND provider = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, provider]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const account = result.rows[0];
    const now = new Date();
    const expiresAt = new Date(account.expires_at);

    // Check if token is still valid (with 5 minute buffer)
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    if (expiresAt.getTime() > now.getTime() + bufferMs) {
      // Token is valid, decrypt and return
      return tokenEncryption.decryptAccessToken(account.access_token_encrypted);
    }

    // Token expired or expiring soon, try to refresh
    if (account.refresh_token_encrypted && refreshCallback) {
      try {
        const refreshToken = tokenEncryption.decryptRefreshToken(account.refresh_token_encrypted);
        const newTokens = await refreshCallback(refreshToken);

        // Store new tokens
        const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
        await this.updateTokens({
          accountId: account.id,
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken, // May be rotated
          expiresAt: newExpiresAt,
        });

        return newTokens.accessToken;
      } catch (error) {
        console.error(`Token refresh failed for ${provider}:`, error);
        // Return expired token anyway (API will reject and user can re-auth)
        return tokenEncryption.decryptAccessToken(account.access_token_encrypted);
      }
    }

    // No refresh token or callback, return expired token
    return tokenEncryption.decryptAccessToken(account.access_token_encrypted);
  }

  /**
   * Update tokens for an existing account
   * Used after token refresh
   */
  async updateTokens(params: {
    accountId: number;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }): Promise<void> {
    const { accountId, accessToken, refreshToken, expiresAt } = params;
    const pool = getPool();

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
      [accessTokenEncrypted, refreshTokenEncrypted, expiresAt, accountId]
    );
  }

  /**
   * Get account by user and provider
   */
  async getAccount(params: {
    userId: number;
    provider: string;
  }): Promise<StoredOAuthAccount | null> {
    const { userId, provider } = params;
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, user_id, provider, open_id, scope, expires_at, metadata
       FROM oauth_accounts
       WHERE user_id = $1 AND provider = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, provider]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Find accounts with tokens expiring soon
   * Used by refresh scheduler
   */
  async findExpiringSoon(params: {
    provider?: string;
    minutesUntilExpiry: number;
  }): Promise<Array<{
    id: number;
    userId: number;
    provider: string;
    openId: string;
    refreshToken: string;
    expiresAt: Date;
  }>> {
    const { provider, minutesUntilExpiry } = params;
    const pool = getPool();

    const expiryThreshold = new Date(Date.now() + minutesUntilExpiry * 60 * 1000);

    const query = provider
      ? `SELECT id, user_id, provider, open_id, refresh_token_encrypted, expires_at
         FROM oauth_accounts
         WHERE provider = $1
           AND expires_at < $2
           AND refresh_token_encrypted IS NOT NULL
         ORDER BY expires_at ASC`
      : `SELECT id, user_id, provider, open_id, refresh_token_encrypted, expires_at
         FROM oauth_accounts
         WHERE expires_at < $1
           AND refresh_token_encrypted IS NOT NULL
         ORDER BY expires_at ASC`;

    const params_array = provider ? [provider, expiryThreshold] : [expiryThreshold];
    const result = await pool.query(query, params_array);

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      openId: row.open_id,
      refreshToken: tokenEncryption.decryptRefreshToken(row.refresh_token_encrypted),
      expiresAt: new Date(row.expires_at),
    }));
  }

  /**
   * Delete account (disconnect)
   */
  async deleteAccount(params: { userId: number; provider: string }): Promise<boolean> {
    const { userId, provider } = params;
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM oauth_accounts
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );

    return (result.rowCount || 0) > 0;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
