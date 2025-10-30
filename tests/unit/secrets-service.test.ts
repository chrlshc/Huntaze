import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Tests unitaires pour SecretsService
 * Valide la récupération et le cache des secrets AWS
 */

// Mock AWS SDK
vi.mock('@aws-sdk/client-secrets-manager', () => ({
  SecretsManagerClient: vi.fn(),
  GetSecretValueCommand: vi.fn()
}));

// Mock du service (sera importé après création)
class SecretsService {
  private client: any;
  private cache: Map<string, { value: string; expiresAt: number }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async getSecret(secretName: string): Promise<string> {
    const cached = this.cache.get(secretName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      const secretValue = response.SecretString || '';

      this.cache.set(secretName, {
        value: secretValue,
        expiresAt: Date.now() + this.cacheDuration
      });

      return secretValue;
    } catch (error) {
      const envFallback = process.env[secretName.replace('huntaze/', '').toUpperCase()];
      if (envFallback) {
        return envFallback;
      }
      throw error;
    }
  }

  async getStripeKey(): Promise<string> {
    const secret = await this.getSecret('huntaze/stripe');
    const parsed = JSON.parse(secret);
    return parsed.STRIPE_SECRET_KEY;
  }

  async getAzureKey(): Promise<string> {
    const secret = await this.getSecret('huntaze/azure');
    const parsed = JSON.parse(secret);
    return parsed.AZURE_OPENAI_API_KEY;
  }

  clearCache() {
    this.cache.clear();
  }
}

describe('SecretsService', () => {
  let secretsService: SecretsService;
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSend = vi.fn();
    (SecretsManagerClient as any).mockImplementation(() => ({
      send: mockSend
    }));

    secretsService = new SecretsService();
  });

  afterEach(() => {
    secretsService.clearCache();
    delete process.env.STRIPE;
    delete process.env.AZURE;
  });

  describe('getSecret', () => {
    it('should fetch secret from AWS Secrets Manager', async () => {
      mockSend.mockResolvedValue({
        SecretString: 'test-secret-value'
      });

      const result = await secretsService.getSecret('huntaze/test');

      expect(result).toBe('test-secret-value');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should cache secret for 5 minutes', async () => {
      mockSend.mockResolvedValue({
        SecretString: 'cached-secret'
      });

      // First call
      const result1 = await secretsService.getSecret('huntaze/test');
      expect(result1).toBe('cached-secret');
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await secretsService.getSecret('huntaze/test');
      expect(result2).toBe('cached-secret');
      expect(mockSend).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should refresh cache after expiration', async () => {
      vi.useFakeTimers();

      mockSend.mockResolvedValue({
        SecretString: 'initial-secret'
      });

      // First call
      await secretsService.getSecret('huntaze/test');
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Advance time by 6 minutes (past cache duration)
      vi.advanceTimersByTime(6 * 60 * 1000);

      mockSend.mockResolvedValue({
        SecretString: 'refreshed-secret'
      });

      // Second call should fetch again
      const result = await secretsService.getSecret('huntaze/test');
      expect(result).toBe('refreshed-secret');
      expect(mockSend).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should fallback to environment variable if AWS fails', async () => {
      process.env.STRIPE = 'env-fallback-value';
      
      mockSend.mockRejectedValue(new Error('AWS error'));

      const result = await secretsService.getSecret('huntaze/stripe');

      expect(result).toBe('env-fallback-value');
    });

    it('should throw error if AWS fails and no env fallback', async () => {
      mockSend.mockRejectedValue(new Error('AWS error'));

      await expect(
        secretsService.getSecret('huntaze/nonexistent')
      ).rejects.toThrow('AWS error');
    });

    it('should handle empty SecretString', async () => {
      mockSend.mockResolvedValue({
        SecretString: ''
      });

      const result = await secretsService.getSecret('huntaze/empty');

      expect(result).toBe('');
    });

    it('should handle missing SecretString field', async () => {
      mockSend.mockResolvedValue({});

      const result = await secretsService.getSecret('huntaze/missing');

      expect(result).toBe('');
    });
  });

  describe('getStripeKey', () => {
    it('should extract Stripe key from JSON secret', async () => {
      const stripeSecret = JSON.stringify({
        STRIPE_SECRET_KEY: 'sk_test_123456',
        STRIPE_PRO_MONTHLY_PRICE_ID: 'price_pro_monthly'
      });

      mockSend.mockResolvedValue({
        SecretString: stripeSecret
      });

      const result = await secretsService.getStripeKey();

      expect(result).toBe('sk_test_123456');
    });

    it('should throw error if JSON is invalid', async () => {
      mockSend.mockResolvedValue({
        SecretString: 'invalid-json'
      });

      await expect(
        secretsService.getStripeKey()
      ).rejects.toThrow();
    });

    it('should cache Stripe key', async () => {
      const stripeSecret = JSON.stringify({
        STRIPE_SECRET_KEY: 'sk_test_cached'
      });

      mockSend.mockResolvedValue({
        SecretString: stripeSecret
      });

      // First call
      await secretsService.getStripeKey();
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await secretsService.getStripeKey();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAzureKey', () => {
    it('should extract Azure key from JSON secret', async () => {
      const azureSecret = JSON.stringify({
        AZURE_OPENAI_API_KEY: 'azure-key-123',
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com'
      });

      mockSend.mockResolvedValue({
        SecretString: azureSecret
      });

      const result = await secretsService.getAzureKey();

      expect(result).toBe('azure-key-123');
    });

    it('should throw error if Azure key missing', async () => {
      const azureSecret = JSON.stringify({
        AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com'
      });

      mockSend.mockResolvedValue({
        SecretString: azureSecret
      });

      await expect(
        secretsService.getAzureKey()
      ).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('should maintain separate caches for different secrets', async () => {
      mockSend
        .mockResolvedValueOnce({ SecretString: 'secret1' })
        .mockResolvedValueOnce({ SecretString: 'secret2' });

      await secretsService.getSecret('huntaze/test1');
      await secretsService.getSecret('huntaze/test2');

      expect(mockSend).toHaveBeenCalledTimes(2);

      // Both should be cached
      await secretsService.getSecret('huntaze/test1');
      await secretsService.getSecret('huntaze/test2');

      expect(mockSend).toHaveBeenCalledTimes(2); // Still 2
    });

    it('should clear all caches', async () => {
      mockSend.mockResolvedValue({ SecretString: 'test' });

      await secretsService.getSecret('huntaze/test1');
      await secretsService.getSecret('huntaze/test2');

      secretsService.clearCache();

      // Should fetch again after clear
      await secretsService.getSecret('huntaze/test1');
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeout', async () => {
      mockSend.mockRejectedValue(new Error('Network timeout'));

      await expect(
        secretsService.getSecret('huntaze/test')
      ).rejects.toThrow('Network timeout');
    });

    it('should handle access denied error', async () => {
      mockSend.mockRejectedValue(new Error('AccessDeniedException'));

      await expect(
        secretsService.getSecret('huntaze/test')
      ).rejects.toThrow('AccessDeniedException');
    });

    it('should handle secret not found', async () => {
      mockSend.mockRejectedValue(new Error('ResourceNotFoundException'));

      await expect(
        secretsService.getSecret('huntaze/nonexistent')
      ).rejects.toThrow('ResourceNotFoundException');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      mockSend.mockResolvedValue({ SecretString: 'concurrent-test' });

      const promises = Array.from({ length: 10 }, () =>
        secretsService.getSecret('huntaze/test')
      );

      const results = await Promise.all(promises);

      // All should return same value
      results.forEach(result => {
        expect(result).toBe('concurrent-test');
      });

      // Should only call AWS once due to caching
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle large secret values', async () => {
      const largeSecret = 'x'.repeat(10000);
      mockSend.mockResolvedValue({ SecretString: largeSecret });

      const result = await secretsService.getSecret('huntaze/large');

      expect(result).toBe(largeSecret);
      expect(result.length).toBe(10000);
    });
  });
});
