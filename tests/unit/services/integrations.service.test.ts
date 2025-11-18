/**
 * Integrations Service Tests
 * 
 * Basic unit tests for the integrations service
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { encryptToken, decryptToken, isEncrypted } from '../../../lib/services/integrations/encryption';

describe('Token Encryption', () => {
  const testToken = 'test-access-token-12345';

  beforeAll(() => {
    // Set up encryption key for tests
    if (!process.env.TOKEN_ENCRYPTION_KEY && !process.env.DATA_ENCRYPTION_KEY) {
      process.env.TOKEN_ENCRYPTION_KEY = 'test-encryption-key-for-unit-tests-32-bytes-long';
    }
  });

  it('should encrypt a token', () => {
    const encrypted = encryptToken(testToken);
    
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testToken);
    expect(encrypted.split(':')).toHaveLength(3);
  });

  it('should decrypt a token', () => {
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(testToken);
  });

  it('should detect encrypted tokens', () => {
    const encrypted = encryptToken(testToken);
    
    expect(isEncrypted(encrypted)).toBe(true);
    expect(isEncrypted(testToken)).toBe(false);
    expect(isEncrypted('')).toBe(false);
  });

  it('should handle round-trip encryption', () => {
    const tokens = [
      'short',
      'a-longer-token-with-special-chars-!@#$%',
      'very-long-token-'.repeat(10),
    ];

    tokens.forEach(token => {
      const encrypted = encryptToken(token);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(token);
    });
  });

  it('should throw on invalid encrypted format', () => {
    expect(() => decryptToken('invalid')).toThrow();
    expect(() => decryptToken('invalid:format')).toThrow();
  });

  it('should throw on empty token', () => {
    expect(() => encryptToken('')).toThrow();
    expect(() => decryptToken('')).toThrow();
  });
});

describe('IntegrationsService', () => {
  it('should be importable', async () => {
    const { IntegrationsService } = await import('../../../lib/services/integrations');
    expect(IntegrationsService).toBeDefined();
  });

  it('should export adapters', async () => {
    const { InstagramAdapter, TikTokAdapter, RedditAdapter, OnlyFansAdapter } = 
      await import('../../../lib/services/integrations');
    
    expect(InstagramAdapter).toBeDefined();
    expect(TikTokAdapter).toBeDefined();
    expect(RedditAdapter).toBeDefined();
    expect(OnlyFansAdapter).toBeDefined();
  });
});
