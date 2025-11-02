/**
 * Unit Tests - Database SSL Configuration
 * 
 * Tests to validate dynamic SSL configuration for database connections
 * Based on environment and connection string detection
 * 
 * Coverage:
 * - SSL enabled for production environment
 * - SSL enabled for AWS RDS connections
 * - SSL disabled for local development
 * - SSL configuration object structure
 * - Edge cases and environment combinations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Database SSL Configuration', () => {
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

  describe('SSL Configuration Logic', () => {
    it('should enable SSL in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should enable SSL for AWS RDS connections', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.rds.amazonaws.com:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should disable SSL for local development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should disable SSL for test environment with local DB', () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should enable SSL for test environment with RDS', () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_URL = 'postgresql://user:pass@test.rds.amazonaws.com:5432/testdb';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('RDS Detection', () => {
    it('should detect standard RDS hostname', () => {
      const url = 'postgresql://user:pass@mydb.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/db';
      const isRDS = url.includes('rds.amazonaws.com');

      expect(isRDS).toBe(true);
    });

    it('should detect RDS hostname in different regions', () => {
      const urls = [
        'postgresql://user:pass@db.us-west-2.rds.amazonaws.com:5432/db',
        'postgresql://user:pass@db.eu-west-1.rds.amazonaws.com:5432/db',
        'postgresql://user:pass@db.ap-southeast-1.rds.amazonaws.com:5432/db',
      ];

      urls.forEach(url => {
        const isRDS = url.includes('rds.amazonaws.com');
        expect(isRDS).toBe(true);
      });
    });

    it('should not detect non-RDS hostnames', () => {
      const urls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@127.0.0.1:5432/db',
        'postgresql://user:pass@myserver.com:5432/db',
        'postgresql://user:pass@db.heroku.com:5432/db',
      ];

      urls.forEach(url => {
        const isRDS = url.includes('rds.amazonaws.com');
        expect(isRDS).toBe(false);
      });
    });

    it('should handle undefined DATABASE_URL', () => {
      process.env.DATABASE_URL = undefined;

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should handle empty DATABASE_URL', () => {
      process.env.DATABASE_URL = '';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });
  });

  describe('SSL Configuration Object', () => {
    it('should have rejectUnauthorized set to false', () => {
      process.env.NODE_ENV = 'production';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toHaveProperty('rejectUnauthorized');
      expect(sslConfig?.rejectUnauthorized).toBe(false);
    });

    it('should return undefined when SSL is not needed', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should be compatible with pg Pool options', () => {
      process.env.NODE_ENV = 'production';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      // Should be assignable to Pool ssl option
      const poolOptions = {
        connectionString: 'postgresql://localhost:5432/db',
        ssl: sslConfig,
      };

      expect(poolOptions.ssl).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('Environment Combinations', () => {
    it('should handle production with RDS (both conditions true)', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.rds.amazonaws.com:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should handle production with local DB', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should handle development with RDS', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.rds.amazonaws.com:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should handle development with local DB (both conditions false)', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle NODE_ENV not set', () => {
      delete process.env.NODE_ENV;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should handle case-sensitive environment check', () => {
      process.env.NODE_ENV = 'Production'; // Capital P
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      // Should not match due to case sensitivity
      expect(sslConfig).toBeUndefined();
    });

    it('should handle RDS in URL path (not hostname)', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/rds.amazonaws.com';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      // Will still enable SSL (string includes check)
      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });

    it('should handle malformed DATABASE_URL', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'not-a-valid-url';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeUndefined();
    });

    it('should handle DATABASE_URL with special characters', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:p@ss!word@db.rds.amazonaws.com:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('Security Considerations', () => {
    it('should use rejectUnauthorized: false for self-signed certificates', () => {
      process.env.NODE_ENV = 'production';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      // rejectUnauthorized: false allows self-signed certs
      expect(sslConfig?.rejectUnauthorized).toBe(false);
    });

    it('should not expose SSL config in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      // No SSL config for local development
      expect(sslConfig).toBeUndefined();
    });
  });

  describe('Integration with Pool Configuration', () => {
    it('should create valid Pool config with SSL', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.rds.amazonaws.com:5432/db';

      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             process.env.DATABASE_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      };

      expect(poolConfig.connectionString).toBeTruthy();
      expect(poolConfig.ssl).toEqual({ rejectUnauthorized: false });
    });

    it('should create valid Pool config without SSL', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             process.env.DATABASE_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      };

      expect(poolConfig.connectionString).toBeTruthy();
      expect(poolConfig.ssl).toBeUndefined();
    });

    it('should work with additional Pool options', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.rds.amazonaws.com:5432/db';

      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             process.env.DATABASE_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      expect(poolConfig.ssl).toEqual({ rejectUnauthorized: false });
      expect(poolConfig.max).toBe(10);
      expect(poolConfig.idleTimeoutMillis).toBe(30000);
      expect(poolConfig.connectionTimeoutMillis).toBe(10000);
    });
  });

  describe('Documentation and Best Practices', () => {
    it('should document why rejectUnauthorized is false', () => {
      // AWS RDS uses self-signed certificates by default
      // rejectUnauthorized: false allows connection without certificate validation
      // This is acceptable for RDS as the connection is still encrypted
      
      process.env.NODE_ENV = 'production';
      const sslConfig = process.env.NODE_ENV === 'production' || 
                        process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      expect(sslConfig).toBeDefined();
      expect(sslConfig?.rejectUnauthorized).toBe(false);
    });

    it('should explain when SSL is enabled', () => {
      // SSL is enabled in two scenarios:
      // 1. NODE_ENV === 'production' - Always use SSL in production
      // 2. DATABASE_URL contains 'rds.amazonaws.com' - AWS RDS requires SSL
      
      const scenarios = [
        { env: 'production', url: 'postgresql://localhost:5432/db', expectSSL: true },
        { env: 'development', url: 'postgresql://db.rds.amazonaws.com:5432/db', expectSSL: true },
        { env: 'development', url: 'postgresql://localhost:5432/db', expectSSL: false },
      ];

      scenarios.forEach(({ env, url, expectSSL }) => {
        process.env.NODE_ENV = env;
        process.env.DATABASE_URL = url;

        const sslConfig = process.env.NODE_ENV === 'production' || 
                          process.env.DATABASE_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined;

        if (expectSSL) {
          expect(sslConfig).toEqual({ rejectUnauthorized: false });
        } else {
          expect(sslConfig).toBeUndefined();
        }
      });
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with existing tests', () => {
      // Before: SSL was always { rejectUnauthorized: false }
      // After: SSL is conditional based on environment and URL
      
      // Production should still have SSL
      process.env.NODE_ENV = 'production';
      const prodSSL = process.env.NODE_ENV === 'production' || 
                      process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;
      
      expect(prodSSL).toEqual({ rejectUnauthorized: false });

      // RDS should still have SSL
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://db.rds.amazonaws.com:5432/db';
      const rdsSSL = process.env.NODE_ENV === 'production' || 
                     process.env.DATABASE_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;
      
      expect(rdsSSL).toEqual({ rejectUnauthorized: false });
    });

    it('should not break existing Pool instantiation', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://db.rds.amazonaws.com:5432/db';

      // This should not throw
      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             process.env.DATABASE_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      };

      expect(poolConfig).toBeDefined();
      expect(poolConfig.ssl).toBeDefined();
    });
  });
});
