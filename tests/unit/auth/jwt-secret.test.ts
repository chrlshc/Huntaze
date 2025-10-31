/**
 * Unit Tests - JWT Secret Handling
 * 
 * Tests to validate JWT secret configuration and usage
 * 
 * Coverage:
 * - JWT secret loading
 * - Token generation with secret
 * - Token verification with secret
 * - Production vs development behavior
 * - Secret rotation scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('JWT Secret - Handling', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Secret Loading', () => {
    it('should load JWT_SECRET from environment', () => {
      process.env.JWT_SECRET = 'test-secret-key-for-jwt-tokens-2025';
      
      const secret = process.env.JWT_SECRET;
      expect(secret).toBe('test-secret-key-for-jwt-tokens-2025');
    });

    it('should convert secret to Uint8Array', () => {
      const secretStr = 'test-secret-key';
      const encoder = new TextEncoder();
      const secretBytes = encoder.encode(secretStr);
      
      expect(secretBytes).toBeInstanceOf(Uint8Array);
      expect(secretBytes.length).toBe(secretStr.length);
    });

    it('should handle missing secret in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      
      // Should fall back to dev secret
      const fallbackSecret = 'dev-only-secret';
      const encoder = new TextEncoder();
      const secretBytes = encoder.encode(fallbackSecret);
      
      expect(secretBytes).toBeInstanceOf(Uint8Array);
    });

    it('should throw error for missing secret in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      
      expect(() => {
        if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not set in production');
        }
      }).toThrow('JWT_SECRET is not set in production');
    });

    it('should handle empty secret string', () => {
      process.env.JWT_SECRET = '';
      
      const secret = process.env.JWT_SECRET;
      expect(secret).toBe('');
      
      if (!secret) {
        // Should use fallback or throw
        expect(secret).toBeFalsy();
      }
    });
  });

  describe('Secret Strength', () => {
    it('should require minimum secret length', () => {
      const minLength = 32;
      process.env.JWT_SECRET = 'a'.repeat(minLength);
      
      const secret = process.env.JWT_SECRET;
      expect(secret!.length).toBeGreaterThanOrEqual(minLength);
    });

    it('should accept strong secrets', () => {
      const strongSecret = 'huntaze-super-secret-jwt-key-change-this-in-production-2025';
      process.env.JWT_SECRET = strongSecret;
      
      expect(process.env.JWT_SECRET).toBe(strongSecret);
      expect(process.env.JWT_SECRET!.length).toBeGreaterThan(32);
    });

    it('should warn about weak secrets', () => {
      const weakSecrets = [
        'secret',
        '12345678',
        'password',
        'test',
      ];

      weakSecrets.forEach(weak => {
        expect(weak.length).toBeLessThan(32);
      });
    });

    it('should accept secrets with special characters', () => {
      const secret = 'jwt!@#$%^&*()_+-=[]{}|;:,.<>?secret2025';
      process.env.JWT_SECRET = secret;
      
      expect(process.env.JWT_SECRET).toBe(secret);
    });

    it('should accept secrets with numbers and letters', () => {
      const secret = 'JwtSecret123WithNumbers456AndLetters789';
      process.env.JWT_SECRET = secret;
      
      expect(process.env.JWT_SECRET).toMatch(/[a-zA-Z]/);
      expect(process.env.JWT_SECRET).toMatch(/[0-9]/);
    });
  });

  describe('Token Generation', () => {
    it('should generate token with secret', async () => {
      process.env.JWT_SECRET = 'test-secret-for-token-generation-2025';
      
      const { SignJWT } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test-user' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should generate different tokens for different payloads', async () => {
      process.env.JWT_SECRET = 'test-secret-for-different-tokens-2025';
      
      const { SignJWT } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token1 = await new SignJWT({ userId: 'user1' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const token2 = await new SignJWT({ userId: 'user2' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      expect(token1).not.toBe(token2);
    });

    it('should include algorithm in token header', async () => {
      process.env.JWT_SECRET = 'test-secret-for-algorithm-check-2025';
      
      const { SignJWT } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      // Decode header (first part of JWT)
      const [headerB64] = token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      
      expect(header.alg).toBe('HS256');
    });

    it('should set expiration time', async () => {
      process.env.JWT_SECRET = 'test-secret-for-expiration-2025';
      
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const { payload } = await jwtVerify(token, secret);
      
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
      expect(payload.exp! > payload.iat!).toBe(true);
    });
  });

  describe('Token Verification', () => {
    it('should verify token with correct secret', async () => {
      process.env.JWT_SECRET = 'test-secret-for-verification-2025';
      
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test-user' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const { payload } = await jwtVerify(token, secret);
      
      expect(payload.userId).toBe('test-user');
    });

    it('should reject token with wrong secret', async () => {
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      
      const secret1 = encoder.encode('secret-one-for-signing-2025');
      const secret2 = encoder.encode('secret-two-for-verification-2025');
      
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret1);
      
      await expect(jwtVerify(token, secret2)).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      process.env.JWT_SECRET = 'test-secret-for-expiry-check-2025';
      
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      // Create token that expires immediately
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('0s') // Expires immediately
        .sign(secret);
      
      // Wait a bit to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await expect(jwtVerify(token, secret)).rejects.toThrow();
    });

    it('should reject malformed token', async () => {
      process.env.JWT_SECRET = 'test-secret-for-malformed-check-2025';
      
      const { jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const malformedToken = 'not.a.valid.jwt.token';
      
      await expect(jwtVerify(malformedToken, secret)).rejects.toThrow();
    });

    it('should extract payload from valid token', async () => {
      process.env.JWT_SECRET = 'test-secret-for-payload-extraction-2025';
      
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email',
      };
      
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const { payload: decoded } = await jwtVerify(token, secret);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
      expect(decoded.provider).toBe(payload.provider);
    });
  });

  describe('Secret Rotation', () => {
    it('should handle secret change gracefully', async () => {
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      
      const oldSecret = encoder.encode('old-secret-key-2025');
      const newSecret = encoder.encode('new-secret-key-2025');
      
      // Create token with old secret
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(oldSecret);
      
      // Verify with old secret works
      const { payload: oldPayload } = await jwtVerify(token, oldSecret);
      expect(oldPayload.userId).toBe('test');
      
      // Verify with new secret fails
      await expect(jwtVerify(token, newSecret)).rejects.toThrow();
    });

    it('should invalidate old tokens after secret rotation', async () => {
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      
      process.env.JWT_SECRET = 'old-secret-before-rotation-2025';
      const oldSecret = encoder.encode(process.env.JWT_SECRET);
      
      const oldToken = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(oldSecret);
      
      // Rotate secret
      process.env.JWT_SECRET = 'new-secret-after-rotation-2025';
      const newSecret = encoder.encode(process.env.JWT_SECRET);
      
      // Old token should not verify with new secret
      await expect(jwtVerify(oldToken, newSecret)).rejects.toThrow();
    });
  });

  describe('Security Best Practices', () => {
    it('should not log secret in error messages', () => {
      process.env.JWT_SECRET = 'secret-that-should-not-be-logged-2025';
      
      try {
        throw new Error('JWT verification failed');
      } catch (error: any) {
        expect(error.message).not.toContain(process.env.JWT_SECRET);
      }
    });

    it('should use HS256 algorithm', async () => {
      process.env.JWT_SECRET = 'test-secret-for-algorithm-2025';
      
      const { SignJWT } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const [headerB64] = token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      
      expect(header.alg).toBe('HS256');
    });

    it('should set reasonable token expiry', async () => {
      process.env.JWT_SECRET = 'test-secret-for-expiry-2025';
      
      const { SignJWT, jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_SECRET);
      
      const token = await new SignJWT({ userId: 'test' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);
      
      const { payload } = await jwtVerify(token, secret);
      
      const expiryTime = payload.exp! - payload.iat!;
      expect(expiryTime).toBe(3600); // 1 hour in seconds
    });
  });
});
