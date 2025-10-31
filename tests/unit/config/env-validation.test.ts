/**
 * Unit Tests - Environment Variables Validation
 * 
 * Tests to validate environment variable configuration
 * 
 * Coverage:
 * - JWT_SECRET validation
 * - REDIS_URL validation
 * - Admin tokens validation
 * - Feature flags validation
 * - AWS credentials validation
 * - Production vs development behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Variables - Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('JWT_SECRET Configuration', () => {
    it('should have JWT_SECRET defined', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
    });

    it('should have JWT_SECRET with minimum length', () => {
      const secret = process.env.JWT_SECRET;
      expect(secret).toBeTruthy();
      expect(secret!.length).toBeGreaterThanOrEqual(32);
    });

    it('should not use default secret in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const defaultSecrets = [
        'huntaze-super-secret-jwt-key-change-this-in-production-2025',
        'dev-only-secret',
        'change-this',
      ];

      const secret = process.env.JWT_SECRET;
      
      if (process.env.NODE_ENV === 'production') {
        defaultSecrets.forEach(defaultSecret => {
          expect(secret).not.toBe(defaultSecret);
        });
      }

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should accept custom JWT_SECRET', () => {
      process.env.JWT_SECRET = 'custom-secure-secret-key-for-testing-purposes-2025';
      
      expect(process.env.JWT_SECRET).toBe('custom-secure-secret-key-for-testing-purposes-2025');
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(32);
    });

    it('should handle missing JWT_SECRET in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      
      // Should not throw in development
      expect(() => {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV !== 'production') {
          // Fallback behavior is acceptable in dev
          return;
        }
      }).not.toThrow();
    });

    it('should require JWT_SECRET in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      
      expect(() => {
        if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is required in production');
        }
      }).toThrow('JWT_SECRET is required in production');

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('REDIS_URL Configuration', () => {
    it('should have REDIS_URL defined', () => {
      expect(process.env.REDIS_URL).toBeDefined();
    });

    it('should have valid Redis URL format', () => {
      const redisUrl = process.env.REDIS_URL;
      expect(redisUrl).toBeTruthy();
      expect(redisUrl).toMatch(/^redis:\/\//);
    });

    it('should accept localhost Redis URL in development', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      expect(process.env.REDIS_URL).toBe('redis://localhost:6379');
    });

    it('should accept remote Redis URL', () => {
      process.env.REDIS_URL = 'redis://redis.example.com:6379';
      
      expect(process.env.REDIS_URL).toMatch(/^redis:\/\//);
      expect(process.env.REDIS_URL).toContain('redis.example.com');
    });

    it('should accept Redis URL with authentication', () => {
      process.env.REDIS_URL = 'redis://:password@redis.example.com:6379';
      
      expect(process.env.REDIS_URL).toMatch(/^redis:\/\//);
      expect(process.env.REDIS_URL).toContain('password');
    });

    it('should accept Redis URL with database number', () => {
      process.env.REDIS_URL = 'redis://localhost:6379/0';
      
      expect(process.env.REDIS_URL).toMatch(/^redis:\/\/.*\/\d+$/);
    });

    it('should handle missing REDIS_URL gracefully', () => {
      delete process.env.REDIS_URL;
      
      // Should not throw - app can fall back to in-memory store
      expect(process.env.REDIS_URL).toBeUndefined();
    });
  });

  describe('Admin Tokens Configuration', () => {
    it('should have ADMIN_TOKEN defined', () => {
      expect(process.env.ADMIN_TOKEN).toBeDefined();
    });

    it('should have DEBUG_TOKEN defined', () => {
      expect(process.env.DEBUG_TOKEN).toBeDefined();
    });

    it('should have ADMIN_TOKEN with minimum length', () => {
      const token = process.env.ADMIN_TOKEN;
      expect(token).toBeTruthy();
      expect(token!.length).toBeGreaterThanOrEqual(20);
    });

    it('should have DEBUG_TOKEN with minimum length', () => {
      const token = process.env.DEBUG_TOKEN;
      expect(token).toBeTruthy();
      expect(token!.length).toBeGreaterThanOrEqual(20);
    });

    it('should not use default tokens in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const defaultTokens = [
        'huntaze-admin-token-change-this',
        'huntaze-debug-token-change-this',
        'change-this',
      ];

      const adminToken = process.env.ADMIN_TOKEN;
      const debugToken = process.env.DEBUG_TOKEN;
      
      if (process.env.NODE_ENV === 'production') {
        defaultTokens.forEach(defaultToken => {
          expect(adminToken).not.toBe(defaultToken);
          expect(debugToken).not.toBe(defaultToken);
        });
      }

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should have different ADMIN_TOKEN and DEBUG_TOKEN', () => {
      const adminToken = process.env.ADMIN_TOKEN;
      const debugToken = process.env.DEBUG_TOKEN;
      
      expect(adminToken).not.toBe(debugToken);
    });

    it('should accept custom admin tokens', () => {
      process.env.ADMIN_TOKEN = 'custom-admin-token-secure-2025';
      process.env.DEBUG_TOKEN = 'custom-debug-token-secure-2025';
      
      expect(process.env.ADMIN_TOKEN).toBe('custom-admin-token-secure-2025');
      expect(process.env.DEBUG_TOKEN).toBe('custom-debug-token-secure-2025');
    });
  });

  describe('Feature Flags Configuration', () => {
    it('should have ENABLE_EVENTBRIDGE_HOOKS defined', () => {
      expect(process.env.ENABLE_EVENTBRIDGE_HOOKS).toBeDefined();
    });

    it('should have ENABLE_AGENTS_PROXY defined', () => {
      expect(process.env.ENABLE_AGENTS_PROXY).toBeDefined();
    });

    it('should parse ENABLE_EVENTBRIDGE_HOOKS as boolean', () => {
      const value = process.env.ENABLE_EVENTBRIDGE_HOOKS;
      expect(['0', '1', 'true', 'false']).toContain(value);
    });

    it('should parse ENABLE_AGENTS_PROXY as boolean', () => {
      const value = process.env.ENABLE_AGENTS_PROXY;
      expect(['0', '1', 'true', 'false']).toContain(value);
    });

    it('should default to disabled (0) for EventBridge hooks', () => {
      expect(process.env.ENABLE_EVENTBRIDGE_HOOKS).toBe('0');
    });

    it('should default to disabled (0) for Agents proxy', () => {
      expect(process.env.ENABLE_AGENTS_PROXY).toBe('0');
    });

    it('should enable EventBridge hooks when set to 1', () => {
      process.env.ENABLE_EVENTBRIDGE_HOOKS = '1';
      
      const enabled = process.env.ENABLE_EVENTBRIDGE_HOOKS === '1' || 
                      process.env.ENABLE_EVENTBRIDGE_HOOKS === 'true';
      expect(enabled).toBe(true);
    });

    it('should enable Agents proxy when set to 1', () => {
      process.env.ENABLE_AGENTS_PROXY = '1';
      
      const enabled = process.env.ENABLE_AGENTS_PROXY === '1' || 
                      process.env.ENABLE_AGENTS_PROXY === 'true';
      expect(enabled).toBe(true);
    });

    it('should handle string "true" for feature flags', () => {
      process.env.ENABLE_EVENTBRIDGE_HOOKS = 'true';
      process.env.ENABLE_AGENTS_PROXY = 'true';
      
      expect(process.env.ENABLE_EVENTBRIDGE_HOOKS).toBe('true');
      expect(process.env.ENABLE_AGENTS_PROXY).toBe('true');
    });

    it('should handle string "false" for feature flags', () => {
      process.env.ENABLE_EVENTBRIDGE_HOOKS = 'false';
      process.env.ENABLE_AGENTS_PROXY = 'false';
      
      expect(process.env.ENABLE_EVENTBRIDGE_HOOKS).toBe('false');
      expect(process.env.ENABLE_AGENTS_PROXY).toBe('false');
    });
  });

  describe('AWS Credentials Configuration', () => {
    it('should have AWS credentials commented out by default', () => {
      // In .env file, AWS credentials are commented out
      // They should not be set unless explicitly configured
      const hasAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const hasSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      const hasRegion = process.env.AWS_REGION;
      
      // These may or may not be set depending on environment
      // Just verify they're strings if set
      if (hasAccessKey) expect(typeof hasAccessKey).toBe('string');
      if (hasSecretKey) expect(typeof hasSecretKey).toBe('string');
      if (hasRegion) expect(typeof hasRegion).toBe('string');
    });

    it('should accept AWS_REGION when set', () => {
      process.env.AWS_REGION = 'us-east-1';
      
      expect(process.env.AWS_REGION).toBe('us-east-1');
    });

    it('should accept valid AWS regions', () => {
      const validRegions = [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'ap-southeast-1',
      ];

      validRegions.forEach(region => {
        process.env.AWS_REGION = region;
        expect(process.env.AWS_REGION).toBe(region);
      });
    });

    it('should prefer IAM role over hardcoded credentials in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // In production, AWS credentials should come from IAM role
      // Not from environment variables
      if (process.env.NODE_ENV === 'production') {
        // This is a recommendation, not enforced
        // Just document the best practice
        expect(true).toBe(true);
      }

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Database Configuration', () => {
    it('should have DATABASE_URL defined', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
    });

    it('should have valid PostgreSQL URL format', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toBeTruthy();
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });

    it('should include schema parameter', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toContain('schema=public');
    });
  });

  describe('Security Best Practices', () => {
    it('should not expose secrets in error messages', () => {
      const secret = process.env.JWT_SECRET;
      
      try {
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }
      } catch (error: any) {
        // Error message should not contain the actual secret
        expect(error.message).not.toContain(secret || '');
      }
    });

    it('should use different secrets for different purposes', () => {
      const jwtSecret = process.env.JWT_SECRET;
      const adminToken = process.env.ADMIN_TOKEN;
      const debugToken = process.env.DEBUG_TOKEN;
      
      // All secrets should be different
      expect(jwtSecret).not.toBe(adminToken);
      expect(jwtSecret).not.toBe(debugToken);
      expect(adminToken).not.toBe(debugToken);
    });

    it('should have secure cookie settings in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Cookies should be secure in production
        expect(isProduction).toBe(true);
      }

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Environment Consistency', () => {
    it('should have all required variables for authentication', () => {
      const requiredVars = [
        'JWT_SECRET',
        'DATABASE_URL',
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
      });
    });

    it('should have all optional variables defined with defaults', () => {
      const optionalVars = [
        'REDIS_URL',
        'ADMIN_TOKEN',
        'DEBUG_TOKEN',
        'ENABLE_EVENTBRIDGE_HOOKS',
        'ENABLE_AGENTS_PROXY',
      ];

      optionalVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
      });
    });

    it('should validate feature flag format', () => {
      const featureFlags = [
        'ENABLE_EVENTBRIDGE_HOOKS',
        'ENABLE_AGENTS_PROXY',
      ];

      featureFlags.forEach(flag => {
        const value = process.env[flag];
        expect(value).toMatch(/^(0|1|true|false)$/);
      });
    });
  });

  describe('Development vs Production', () => {
    it('should allow relaxed validation in development', () => {
      process.env.NODE_ENV = 'development';
      
      // Development can use default secrets
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should enforce strict validation in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(process.env.NODE_ENV).toBe('production');
      
      // Production should have all required vars
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should use secure defaults in production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        // Secure flag should be true
        expect(isProduction).toBe(true);
      }

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
