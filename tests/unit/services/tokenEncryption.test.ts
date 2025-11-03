/**
 * Unit Tests - Token Encryption Service (Task 2.1)
 * 
 * Tests to validate AES-256-GCM token encryption implementation
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 2.1)
 * 
 * Coverage:
 * - AES-256-GCM encryption/decryption
 * - Key management and validation
 * - Error handling for invalid inputs
 * - Format validation (iv:authTag:ciphertext)
 * - Authentication tag verification
 * - Edge cases and security scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  encryptToken,
  decryptToken,
  generateEncryptionKey,
  validateEncryption,
  TokenEncryptionService,
  tokenEncryption,
} from '../../../lib/services/tokenEncryption';

describe('Token Encryption Service - AES-256-GCM (Task 2.1)', () => {
  const originalEnv = process.env.TOKEN_ENCRYPTION_KEY;
  let testKey: string;

  beforeEach(() => {
    // Generate a valid test key
    testKey = generateEncryptionKey();
    process.env.TOKEN_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    // Restore original environment
    process.env.TOKEN_ENCRYPTION_KEY = originalEnv;
  });

  describe('Requirement 2.1.1 - Key Generation', () => {
    it('should generate a valid 256-bit encryption key', () => {
      const key = generateEncryptionKey();
      
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
      
      // Decode and verify length
      const keyBuffer = Buffer.from(key, 'base64');
      expect(keyBuffer.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should generate unique keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });

    it('should generate base64-encoded keys', () => {
      const key = generateEncryptionKey();
      
      // Should be valid base64
      expect(() => Buffer.from(key, 'base64')).not.toThrow();
      
      // Should decode to 32 bytes
      const decoded = Buffer.from(key, 'base64');
      expect(decoded.length).toBe(32);
    });
  });

  describe('Requirement 2.1.2 - Environment Variable Configuration', () => {
    it('should throw error when TOKEN_ENCRYPTION_KEY is not set', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      
      expect(() => encryptToken('test_token')).toThrow(
        'TOKEN_ENCRYPTION_KEY environment variable is required'
      );
    });

    it('should throw error when key is invalid length', () => {
      // Set a key that's too short
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('short').toString('base64');
      
      expect(() => encryptToken('test_token')).toThrow(
        'Encryption key must be 32 bytes (256 bits)'
      );
    });

    it('should accept valid 32-byte key', () => {
      const validKey = generateEncryptionKey();
      process.env.TOKEN_ENCRYPTION_KEY = validKey;
      
      expect(() => encryptToken('test_token')).not.toThrow();
    });
  });

  describe('Requirement 2.1.3 - Encryption (encrypt method)', () => {
    it('should encrypt a token successfully', () => {
      const plaintext = 'oauth_access_token_12345';
      const encrypted = encryptToken(plaintext);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
    });

    it('should return encrypted token in correct format (iv:authTag:ciphertext)', () => {
      const plaintext = 'test_token';
      const encrypted = encryptToken(plaintext);
      
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      
      // Verify each part is valid base64
      parts.forEach(part => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });
    });

    it('should generate unique IV for each encryption', () => {
      const plaintext = 'same_token';
      
      const encrypted1 = encryptToken(plaintext);
      const encrypted2 = encryptToken(plaintext);
      
      // Same plaintext should produce different ciphertext (different IV)
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same plaintext
      expect(decryptToken(encrypted1)).toBe(plaintext);
      expect(decryptToken(encrypted2)).toBe(plaintext);
    });

    it('should encrypt tokens of various lengths', () => {
      const tokens = [
        'short',
        'medium_length_token_12345',
        'very_long_token_'.repeat(10),
        'a', // Single character
      ];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(encrypted).toBeTruthy();
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should encrypt tokens with special characters', () => {
      const tokens = [
        'token_with_underscore',
        'token-with-dash',
        'token.with.dots',
        'token/with/slashes',
        'token+with+plus',
        'token=with=equals',
        'token with spaces',
        'token\nwith\nnewlines',
        'token\twith\ttabs',
      ];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should encrypt Unicode characters correctly', () => {
      const tokens = [
        'token_émoji_🔐',
        'token_中文',
        'token_العربية',
        'token_עברית',
      ];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should throw error for empty token', () => {
      expect(() => encryptToken('')).toThrow('Cannot encrypt empty token');
    });

    it('should handle encryption errors gracefully', () => {
      // Corrupt the environment key
      process.env.TOKEN_ENCRYPTION_KEY = 'invalid_base64!!!';
      
      expect(() => encryptToken('test')).toThrow('Token encryption failed');
    });
  });

  describe('Requirement 2.1.4 - Decryption (decrypt method)', () => {
    it('should decrypt an encrypted token successfully', () => {
      const plaintext = 'oauth_refresh_token_67890';
      const encrypted = encryptToken(plaintext);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error for empty encrypted token', () => {
      expect(() => decryptToken('')).toThrow('Cannot decrypt empty token');
    });

    it('should throw error for invalid format (missing parts)', () => {
      expect(() => decryptToken('invalid')).toThrow('Token decryption failed');
      expect(() => decryptToken('part1:part2')).toThrow('Token decryption failed');
      expect(() => decryptToken('part1:part2:part3:part4')).toThrow('Token decryption failed');
    });

    it('should throw error for invalid IV length', () => {
      const encrypted = encryptToken('test');
      const parts = encrypted.split(':');
      
      // Replace IV with wrong length
      const invalidIV = Buffer.from('short').toString('base64');
      const corrupted = `${invalidIV}:${parts[1]}:${parts[2]}`;
      
      expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
    });

    it('should throw error for invalid auth tag length', () => {
      const encrypted = encryptToken('test');
      const parts = encrypted.split(':');
      
      // Replace auth tag with wrong length
      const invalidTag = Buffer.from('short').toString('base64');
      const corrupted = `${parts[0]}:${invalidTag}:${parts[2]}`;
      
      expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
    });

    it('should throw error for tampered ciphertext', () => {
      const encrypted = encryptToken('test');
      const parts = encrypted.split(':');
      
      // Tamper with ciphertext
      const tamperedCiphertext = Buffer.from('tampered').toString('base64');
      const corrupted = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;
      
      expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
    });

    it('should throw error for tampered auth tag (authentication failure)', () => {
      const encrypted = encryptToken('test');
      const parts = encrypted.split(':');
      
      // Generate a different auth tag (16 bytes)
      const tamperedTag = Buffer.from('0'.repeat(16)).toString('base64');
      const corrupted = `${parts[0]}:${tamperedTag}:${parts[2]}`;
      
      expect(() => decryptToken(corrupted)).toThrow('Token decryption failed');
    });

    it('should not expose internal error details', () => {
      const encrypted = encryptToken('test');
      const corrupted = encrypted.replace(/:/g, '|'); // Corrupt format
      
      try {
        decryptToken(corrupted);
        expect.fail('Should have thrown error');
      } catch (error) {
        // Error message should be generic for security
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Token decryption failed');
        expect((error as Error).message).not.toContain('crypto');
        expect((error as Error).message).not.toContain('cipher');
      }
    });
  });

  describe('Requirement 2.1.5 - Round-Trip Encryption', () => {
    it('should successfully encrypt and decrypt the same token', () => {
      const original = 'test_oauth_token_12345';
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should handle multiple round trips', () => {
      let token = 'original_token';
      
      // Encrypt and decrypt 10 times
      for (let i = 0; i < 10; i++) {
        const encrypted = encryptToken(token);
        const decrypted = decryptToken(encrypted);
        expect(decrypted).toBe(token);
        token = decrypted;
      }
      
      expect(token).toBe('original_token');
    });

    it('should handle concurrent encryptions', () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token_${i}`);
      
      const encrypted = tokens.map(token => encryptToken(token));
      const decrypted = encrypted.map(enc => decryptToken(enc));
      
      decrypted.forEach((dec, i) => {
        expect(dec).toBe(tokens[i]);
      });
    });
  });

  describe('Requirement 2.1.6 - Validation Function', () => {
    it('should validate encryption is working correctly', () => {
      const isValid = validateEncryption();
      expect(isValid).toBe(true);
    });

    it('should return false when encryption key is missing', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      
      const isValid = validateEncryption();
      expect(isValid).toBe(false);
    });

    it('should return false when encryption key is invalid', () => {
      process.env.TOKEN_ENCRYPTION_KEY = 'invalid';
      
      const isValid = validateEncryption();
      expect(isValid).toBe(false);
    });

    it('should validate with different keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      process.env.TOKEN_ENCRYPTION_KEY = key1;
      expect(validateEncryption()).toBe(true);
      
      process.env.TOKEN_ENCRYPTION_KEY = key2;
      expect(validateEncryption()).toBe(true);
    });
  });

  describe('Requirement 2.1.7 - TokenEncryptionService Class', () => {
    let service: TokenEncryptionService;

    beforeEach(() => {
      service = new TokenEncryptionService();
    });

    it('should create service instance', () => {
      expect(service).toBeInstanceOf(TokenEncryptionService);
    });

    it('should encrypt access token', () => {
      const token = 'access_token_12345';
      const encrypted = service.encryptAccessToken(token);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(token);
    });

    it('should decrypt access token', () => {
      const token = 'access_token_12345';
      const encrypted = service.encryptAccessToken(token);
      const decrypted = service.decryptAccessToken(encrypted);
      
      expect(decrypted).toBe(token);
    });

    it('should encrypt refresh token', () => {
      const token = 'refresh_token_67890';
      const encrypted = service.encryptRefreshToken(token);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(token);
    });

    it('should decrypt refresh token', () => {
      const token = 'refresh_token_67890';
      const encrypted = service.encryptRefreshToken(token);
      const decrypted = service.decryptRefreshToken(encrypted);
      
      expect(decrypted).toBe(token);
    });

    it('should validate encryption', () => {
      const isValid = service.validate();
      expect(isValid).toBe(true);
    });

    it('should handle both access and refresh tokens independently', () => {
      const accessToken = 'access_token_abc';
      const refreshToken = 'refresh_token_xyz';
      
      const encryptedAccess = service.encryptAccessToken(accessToken);
      const encryptedRefresh = service.encryptRefreshToken(refreshToken);
      
      expect(encryptedAccess).not.toBe(encryptedRefresh);
      
      expect(service.decryptAccessToken(encryptedAccess)).toBe(accessToken);
      expect(service.decryptRefreshToken(encryptedRefresh)).toBe(refreshToken);
    });
  });

  describe('Requirement 2.1.8 - Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(tokenEncryption).toBeInstanceOf(TokenEncryptionService);
    });

    it('should use singleton for encryption', () => {
      const token = 'test_token';
      const encrypted = tokenEncryption.encryptAccessToken(token);
      const decrypted = tokenEncryption.decryptAccessToken(encrypted);
      
      expect(decrypted).toBe(token);
    });

    it('should maintain state across calls', () => {
      const token1 = 'token_1';
      const token2 = 'token_2';
      
      const enc1 = tokenEncryption.encryptAccessToken(token1);
      const enc2 = tokenEncryption.encryptRefreshToken(token2);
      
      expect(tokenEncryption.decryptAccessToken(enc1)).toBe(token1);
      expect(tokenEncryption.decryptRefreshToken(enc2)).toBe(token2);
    });
  });

  describe('Security - AES-256-GCM Properties', () => {
    it('should use authenticated encryption (GCM mode)', () => {
      const token = 'test_token';
      const encrypted = encryptToken(token);
      
      // GCM provides authentication tag
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(3);
      
      // Auth tag should be 16 bytes (128 bits)
      const authTag = Buffer.from(parts[1], 'base64');
      expect(authTag.length).toBe(16);
    });

    it('should detect tampering with authentication tag', () => {
      const token = 'sensitive_token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');
      
      // Flip one bit in auth tag
      const authTag = Buffer.from(parts[1], 'base64');
      authTag[0] ^= 1; // XOR to flip bit
      const tamperedTag = authTag.toString('base64');
      
      const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;
      
      expect(() => decryptToken(tampered)).toThrow('Token decryption failed');
    });

    it('should use 96-bit IV (recommended for GCM)', () => {
      const token = 'test_token';
      const encrypted = encryptToken(token);
      const parts = encrypted.split(':');
      
      const iv = Buffer.from(parts[0], 'base64');
      expect(iv.length).toBe(12); // 96 bits = 12 bytes
    });

    it('should use 256-bit key', () => {
      const key = generateEncryptionKey();
      const keyBuffer = Buffer.from(key, 'base64');
      
      expect(keyBuffer.length).toBe(32); // 256 bits = 32 bytes
    });

    it('should prevent IV reuse attacks', () => {
      const token = 'test_token';
      
      // Encrypt same token multiple times
      const encrypted1 = encryptToken(token);
      const encrypted2 = encryptToken(token);
      const encrypted3 = encryptToken(token);
      
      // Extract IVs
      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];
      const iv3 = encrypted3.split(':')[0];
      
      // All IVs should be unique
      expect(iv1).not.toBe(iv2);
      expect(iv2).not.toBe(iv3);
      expect(iv1).not.toBe(iv3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long tokens', () => {
      const longToken = 'x'.repeat(10000);
      const encrypted = encryptToken(longToken);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(longToken);
    });

    it('should handle tokens with only whitespace', () => {
      const tokens = ['   ', '\t\t', '\n\n', '  \t\n  '];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should handle binary-like tokens', () => {
      const token = '\x00\x01\x02\x03\x04\x05';
      const encrypted = encryptToken(token);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(token);
    });

    it('should handle tokens that look like encrypted format', () => {
      const token = 'part1:part2:part3';
      const encrypted = encryptToken(token);
      const decrypted = decryptToken(encrypted);
      
      expect(decrypted).toBe(token);
    });

    it('should handle rapid successive encryptions', () => {
      const token = 'rapid_test';
      const results: string[] = [];
      
      for (let i = 0; i < 1000; i++) {
        results.push(encryptToken(token));
      }
      
      // All should be unique (different IVs)
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(1000);
      
      // All should decrypt correctly
      results.forEach(encrypted => {
        expect(decryptToken(encrypted)).toBe(token);
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error for missing key', () => {
      delete process.env.TOKEN_ENCRYPTION_KEY;
      
      try {
        encryptToken('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'TOKEN_ENCRYPTION_KEY environment variable is required'
        );
      }
    });

    it('should provide clear error for invalid key length', () => {
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from('short').toString('base64');
      
      try {
        encryptToken('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'Encryption key must be 32 bytes (256 bits)'
        );
      }
    });

    it('should provide generic error for decryption failures', () => {
      try {
        decryptToken('invalid:format:here');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Token decryption failed');
      }
    });
  });

  describe('Performance', () => {
    it('should encrypt tokens quickly', () => {
      const token = 'performance_test_token';
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        encryptToken(token);
      }
      
      const duration = Date.now() - start;
      
      // Should complete 100 encryptions in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should decrypt tokens quickly', () => {
      const token = 'performance_test_token';
      const encrypted = encryptToken(token);
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        decryptToken(encrypted);
      }
      
      const duration = Date.now() - start;
      
      // Should complete 100 decryptions in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Integration with Real OAuth Tokens', () => {
    it('should handle realistic OAuth access tokens', () => {
      const tokens = [
        'ya29.a0AfH6SMBx...',
        'EAABsbCS1iHgBAO...',
        'gho_16C7e42F292c6912E7710c838347Ae178B4a',
      ];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(decryptToken(encrypted)).toBe(token);
      });
    });

    it('should handle realistic OAuth refresh tokens', () => {
      const tokens = [
        '1//0gOZYhLXRqiNyCgYIARAAGBASNwF-L9Ir...',
        'def50200a1b2c3d4e5f6...',
      ];
      
      tokens.forEach(token => {
        const encrypted = encryptToken(token);
        expect(decryptToken(encrypted)).toBe(token);
      });
    });
  });
});

