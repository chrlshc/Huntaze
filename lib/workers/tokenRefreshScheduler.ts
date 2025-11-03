/**
 * Token Refresh Scheduler
 * 
 * Background worker that refreshes expiring OAuth tokens:
 * - Finds tokens expiring within 1 hour
 * - Refreshes tokens using provider-specific logic
 * - Updates database with new tokens
 * - Handles refresh failures (notify user)
 * - Supports token rotation
 * 
 * Can be run as:
 * - Cron job (every 30 minutes)
 * - AWS Lambda scheduled function
 * - Node.js background process
 */

import { oauthAccountsRepository } from '@/lib/db/repositories/oauthAccountsRepository';
import { tiktokOAuth } from '@/lib/services/tiktokOAuth';
import { tokenEncryption } from '@/lib/services/tokenEncryption';

export interface TokenRefreshConfig {
  expiryWindowMinutes?: number;
  batchSize?: number;
}

export interface RefreshResult {
  total: number;
  refreshed: number;
  failed: number;
  errors: Array<{
    accountId: number;
    provider: string;
    error: string;
  }>;
}

/**
 * Token Refresh Scheduler
 */
export class TokenRefreshScheduler {
  private config: Required<TokenRefreshConfig>;
  private isRunning: boolean = false;

  constructor(config: TokenRefreshConfig = {}) {
    this.config = {
      expiryWindowMinutes: config.expiryWindowMinutes || 60,
      batchSize: config.batchSize || 50,
    };
  }

  /**
   * Refresh expiring tokens
   * 
   * @returns Refresh result summary
   */
  async refreshExpiringTokens(): Promise<RefreshResult> {
    if (this.isRunning) {
      console.log('Token refresh scheduler already running, skipping');
      return {
        total: 0,
        refreshed: 0,
        failed: 0,
        errors: [],
      };
    }

    this.isRunning = true;

    const result: RefreshResult = {
      total: 0,
      refreshed: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log('Token refresh scheduler started');

      // Find accounts expiring soon
      const accounts = await oauthAccountsRepository.findExpiringSoon(
        this.config.expiryWindowMinutes
      );

      result.total = accounts.length;

      if (accounts.length === 0) {
        console.log('No tokens expiring soon');
        return result;
      }

      console.log(`Found ${accounts.length} tokens expiring within ${this.config.expiryWindowMinutes} minutes`);

      // Refresh each account
      for (const account of accounts) {
        try {
          await this.refreshAccount(account);
          result.refreshed++;
          console.log(`Refreshed token for account ${account.id} (${account.provider})`);
        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            accountId: account.id,
            provider: account.provider,
            error: errorMessage,
          });
          console.error(`Failed to refresh token for account ${account.id}:`, error);
        }
      }

      console.log(
        `Token refresh completed: ${result.refreshed}/${result.total} refreshed, ${result.failed} failed`
      );

      return result;
    } catch (error) {
      console.error('Token refresh scheduler error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Refresh tokens for a single account
   */
  private async refreshAccount(account: any): Promise<void> {
    // Get encrypted tokens
    const encryptedTokens = await oauthAccountsRepository.getEncryptedTokens(account.id);

    if (!encryptedTokens || !encryptedTokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Decrypt refresh token
    const refreshToken = tokenEncryption.decryptRefreshToken(encryptedTokens.refreshToken);

    // Refresh based on provider
    switch (account.provider) {
      case 'tiktok':
        await this.refreshTikTokAccount(account.id, refreshToken);
        break;

      case 'instagram':
        await this.refreshInstagramAccount(account.id, refreshToken);
        break;

      default:
        throw new Error(`Unsupported provider: ${account.provider}`);
    }
  }

  /**
   * Refresh TikTok account tokens
   */
  private async refreshTikTokAccount(accountId: number, refreshToken: string): Promise<void> {
    // Refresh using TikTok OAuth service
    const refreshed = await tiktokOAuth.refreshAccessToken(refreshToken);

    // Calculate new expiry
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    // Update database with new tokens
    await oauthAccountsRepository.updateTokens({
      id: accountId,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token, // May be rotated
      expiresAt,
    });
  }

  /**
   * Refresh Instagram account tokens
   * Instagram uses long-lived tokens (60 days) that can be refreshed
   */
  private async refreshInstagramAccount(accountId: number, refreshToken: string): Promise<void> {
    // TODO: Implement Instagram token refresh
    // Instagram long-lived tokens can be refreshed before expiry
    console.log(`Instagram token refresh not yet implemented for account ${accountId}`);
    throw new Error('Instagram token refresh not yet implemented');
  }

  /**
   * Run scheduler continuously with interval
   * Useful for development or standalone process
   * 
   * @param intervalMs - Interval between runs (default: 1800000ms = 30 minutes)
   */
  async runContinuously(intervalMs: number = 1800000): Promise<void> {
    console.log(`Token refresh scheduler running continuously (interval: ${intervalMs}ms)`);

    while (true) {
      try {
        await this.refreshExpiringTokens();
      } catch (error) {
        console.error('Token refresh scheduler run failed:', error);
      }

      // Wait before next run
      await this.sleep(intervalMs);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if scheduler is currently running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const tokenRefreshScheduler = new TokenRefreshScheduler();

/**
 * Run token refresh scheduler once
 * Can be called from API endpoint or cron job
 */
export async function runTokenRefresh(): Promise<RefreshResult> {
  return tokenRefreshScheduler.refreshExpiringTokens();
}

/**
 * Start token refresh scheduler as continuous process
 * For development or standalone deployment
 */
export async function startTokenRefreshScheduler(intervalMs?: number): Promise<void> {
  return tokenRefreshScheduler.runContinuously(intervalMs);
}
