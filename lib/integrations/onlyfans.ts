import crypto from 'crypto';
import { externalFetchJson } from '@/lib/services/external/http';
import { ExternalServiceError, isExternalServiceError } from '@/lib/services/external/errors';
import { decryptToken, encryptToken } from '@/lib/services/integrations/encryption';

interface OnlyFansConfig {
  userId: string;
  apiKey: string;
}

export class OnlyFansAPI {
  private config: OnlyFansConfig;
  
  constructor(config: OnlyFansConfig) {
    this.config = config;
  }

  /**
   * Get monthly earnings from OnlyFans
   */
  async getMonthlyEarnings(year: number, month: number): Promise<number> {
    // OnlyFans API endpoint for earnings
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    try {
      const data = await externalFetchJson<any>('https://onlyfans.com/api2/v2/earnings/chart', {
        service: 'onlyfans',
        operation: 'earnings.chart',
        method: 'POST',
        headers: {
          'User-Id': this.config.userId,
          'X-BC': this.generateAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          by: 'total',
        }),
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['POST'] },
      });

      // Sum all earnings for the month
      const totalEarnings =
        data.chart?.reduce((sum: number, day: any) => sum + (day.amount || 0), 0) || 0;

      return totalEarnings;
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw new ExternalServiceError({
          service: 'onlyfans',
          code: error.code,
          retryable: error.retryable,
          status: error.status,
          correlationId: error.correlationId,
          message: 'OnlyFans earnings request failed',
        });
      }
      throw error;
    }
  }

  /**
   * Get detailed transactions
   */
  async getTransactions(startDate: Date, endDate: Date) {
    try {
      return await externalFetchJson<any>(
        'https://onlyfans.com/api2/v2/earnings/transactions',
        {
          service: 'onlyfans',
          operation: 'earnings.transactions',
          method: 'POST',
          headers: {
            'User-Id': this.config.userId,
            'X-BC': this.generateAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 100,
            offset: 0,
          }),
          cache: 'no-store',
          timeoutMs: 10_000,
          retry: { maxRetries: 1, retryMethods: ['POST'] },
        }
      );
    } catch (error) {
      if (isExternalServiceError(error)) {
        throw new ExternalServiceError({
          service: 'onlyfans',
          code: error.code,
          retryable: error.retryable,
          status: error.status,
          correlationId: error.correlationId,
          message: 'OnlyFans transactions request failed',
        });
      }
      throw error;
    }
  }

  /**
   * Generate authentication header for OnlyFans API
   */
  private generateAuthHeader(): string {
    // OnlyFans uses a specific auth format
    // This is a simplified version - actual implementation depends on their current API
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${this.config.apiKey}${timestamp}`;
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    
    return hash;
  }
}

/**
 * Decrypt API key stored in database
 */
export function decryptApiKey(encryptedKey: string): string {
  return decryptToken(encryptedKey);
}

/**
 * Encrypt API key for storage
 */
export function encryptApiKey(apiKey: string): string {
  return encryptToken(apiKey);
}
