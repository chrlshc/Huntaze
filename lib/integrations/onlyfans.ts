import crypto from 'crypto';

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
    try {
      // OnlyFans API endpoint for earnings
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
      
      const response = await fetch(`https://onlyfans.com/api2/v2/earnings/chart`, {
        method: 'GET',
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
      });

      if (!response.ok) {
        throw new Error(`OnlyFans API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Sum all earnings for the month
      const totalEarnings = data.chart?.reduce((sum: number, day: any) => {
        return sum + (day.amount || 0);
      }, 0) || 0;

      return totalEarnings;
    } catch (error) {
      console.error('Failed to fetch OnlyFans earnings:', error);
      throw error;
    }
  }

  /**
   * Get detailed transactions
   */
  async getTransactions(startDate: Date, endDate: Date) {
    try {
      const response = await fetch(`https://onlyfans.com/api2/v2/earnings/transactions`, {
        method: 'GET',
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
      });

      if (!response.ok) {
        throw new Error(`OnlyFans API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch OnlyFans transactions:', error);
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
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY!, 'base64');
  
  // Parse the encrypted data
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  // Decrypt
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt API key for storage
 */
export function encryptApiKey(apiKey: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY!, 'base64');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}