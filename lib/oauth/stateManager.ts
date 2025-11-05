/**
 * OAuth State Manager
 * 
 * Manages OAuth state parameters for CSRF protection
 * Stores state securely in database with expiry
 */

import crypto from 'crypto';
import { getPool } from '../db';

export interface OAuthState {
  state: string;
  userId: number;
  provider: string;
  expiresAt: Date;
}

/**
 * OAuth State Manager Class
 */
export class OAuthStateManager {
  /**
   * Generate secure state parameter
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store state in database
   * 
   * @param userId - User ID
   * @param provider - OAuth provider (tiktok, instagram, etc.)
   * @param expiryMinutes - Minutes until expiry (default: 10)
   * @returns Generated state string
   */
  static async storeState(
    userId: number,
    provider: string,
    expiryMinutes: number = 10
  ): Promise<string> {
    const pool = getPool();
    const state = this.generateState();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    try {
      await pool.query(
        `INSERT INTO oauth_states (state, user_id, provider, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [state, userId, provider, expiresAt]
      );

      return state;
    } catch (error) {
      console.error('Failed to store OAuth state:', error);
      throw new Error('Failed to generate OAuth state');
    }
  }

  /**
   * Validate and consume state
   * State is deleted after validation to prevent reuse
   * 
   * @param state - State parameter to validate
   * @param userId - Expected user ID
   * @param provider - Expected provider
   * @returns True if state is valid
   */
  static async validateAndConsumeState(
    state: string,
    userId: number,
    provider: string
  ): Promise<boolean> {
    const pool = getPool();

    try {
      // Find and delete the state in one query
      const result = await pool.query(
        `DELETE FROM oauth_states
         WHERE state = $1 
           AND user_id = $2 
           AND provider = $3 
           AND expires_at > NOW()
         RETURNING id`,
        [state, userId, provider]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Failed to validate OAuth state:', error);
      return false;
    }
  }

  /**
   * Validate state without consuming (for read-only validation)
   * 
   * @param state - State parameter to validate
   * @param userId - Expected user ID
   * @param provider - Expected provider
   * @returns OAuth state object if valid, null otherwise
   */
  static async validateState(
    state: string,
    userId: number,
    provider: string
  ): Promise<OAuthState | null> {
    const pool = getPool();

    try {
      const result = await pool.query(
        `SELECT state, user_id, provider, expires_at
         FROM oauth_states
         WHERE state = $1 
           AND user_id = $2 
           AND provider = $3 
           AND expires_at > NOW()`,
        [state, userId, provider]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        state: row.state,
        userId: row.user_id,
        provider: row.provider,
        expiresAt: new Date(row.expires_at),
      };
    } catch (error) {
      console.error('Failed to validate OAuth state:', error);
      return null;
    }
  }

  /**
   * Clean up expired states
   * Should be called periodically
   * 
   * @returns Number of expired states cleaned up
   */
  static async cleanupExpiredStates(): Promise<number> {
    const pool = getPool();

    try {
      const result = await pool.query(
        `DELETE FROM oauth_states WHERE expires_at < NOW()`
      );

      const deletedCount = result.rowCount || 0;
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired OAuth states`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired OAuth states:', error);
      return 0;
    }
  }

  /**
   * Get state statistics for monitoring
   */
  static async getStateStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byProvider: Record<string, number>;
  }> {
    const pool = getPool();

    try {
      // Get overall stats
      const overallResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active,
          COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired
        FROM oauth_states
      `);

      // Get stats by provider
      const providerResult = await pool.query(`
        SELECT provider, COUNT(*) as count
        FROM oauth_states
        WHERE expires_at > NOW()
        GROUP BY provider
      `);

      const overall = overallResult.rows[0];
      const byProvider: Record<string, number> = {};
      
      providerResult.rows.forEach(row => {
        byProvider[row.provider] = parseInt(row.count, 10);
      });

      return {
        total: parseInt(overall.total, 10),
        active: parseInt(overall.active, 10),
        expired: parseInt(overall.expired, 10),
        byProvider,
      };
    } catch (error) {
      console.error('Failed to get OAuth state stats:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        byProvider: {},
      };
    }
  }

  /**
   * Delete all states for a user (useful for logout)
   * 
   * @param userId - User ID
   * @returns Number of states deleted
   */
  static async deleteUserStates(userId: number): Promise<number> {
    const pool = getPool();

    try {
      const result = await pool.query(
        `DELETE FROM oauth_states WHERE user_id = $1`,
        [userId]
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to delete user OAuth states:', error);
      return 0;
    }
  }

  /**
   * Delete states for a specific provider (useful for maintenance)
   * 
   * @param provider - Provider name
   * @returns Number of states deleted
   */
  static async deleteProviderStates(provider: string): Promise<number> {
    const pool = getPool();

    try {
      const result = await pool.query(
        `DELETE FROM oauth_states WHERE provider = $1`,
        [provider]
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to delete provider OAuth states:', error);
      return 0;
    }
  }
}

// Export singleton-style functions for convenience
export const oauthStateManager = {
  generateState: () => OAuthStateManager.generateState(),
  storeState: (userId: number, provider: string, expiryMinutes?: number) =>
    OAuthStateManager.storeState(userId, provider, expiryMinutes),
  validateAndConsumeState: (state: string, userId: number, provider: string) =>
    OAuthStateManager.validateAndConsumeState(state, userId, provider),
  validateState: (state: string, userId: number, provider: string) =>
    OAuthStateManager.validateState(state, userId, provider),
  cleanupExpiredStates: () => OAuthStateManager.cleanupExpiredStates(),
  getStateStats: () => OAuthStateManager.getStateStats(),
  deleteUserStates: (userId: number) => OAuthStateManager.deleteUserStates(userId),
  deleteProviderStates: (provider: string) => OAuthStateManager.deleteProviderStates(provider),
};