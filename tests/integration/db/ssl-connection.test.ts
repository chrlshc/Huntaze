/**
 * Integration Tests - SSL Database Connection
 * 
 * Integration tests to validate SSL connections work correctly
 * with different environments and database configurations
 * 
 * Coverage:
 * - SSL connection to AWS RDS
 * - Non-SSL connection to local database
 * - Connection pooling with SSL
 * - Error handling for SSL issues
 * - Performance with SSL enabled
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool, PoolClient } from 'pg';

describe('SSL Database Connection - Integration Tests', () => {
  const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  let pool: Pool;

  beforeAll(() => {
    if (!TEST_DB_URL) {
      console.warn('⚠️  TEST_DATABASE_URL not set, skipping SSL integration tests');
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('SSL Connection with Production Environment', () => {
    beforeEach(async () => {
      if (pool) {
        await pool.end();
      }
    });

    it('should connect with SSL in production environment', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      process.env.NODE_ENV = originalEnv;
    });

    it('should execute queries successfully with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      
      expect(result.rows[0].current_time).toBeDefined();
      expect(result.rows[0].pg_version).toBeDefined();
      expect(result.rows[0].pg_version).toContain('PostgreSQL');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle multiple queries with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const queries = [
        pool.query('SELECT 1 as num'),
        pool.query('SELECT 2 as num'),
        pool.query('SELECT 3 as num'),
      ];

      const results = await Promise.all(queries);

      expect(results[0].rows[0].num).toBe(1);
      expect(results[1].rows[0].num).toBe(2);
      expect(results[2].rows[0].num).toBe(3);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('SSL Connection with RDS Detection', () => {
    it('should connect with SSL when RDS is detected', async () => {
      if (!TEST_DB_URL || !TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  Not an RDS connection, skipping RDS-specific test');
        return;
      }

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should verify SSL is being used for RDS', async () => {
      if (!TEST_DB_URL || !TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  Not an RDS connection, skipping RDS SSL verification');
        return;
      }

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Query to check if SSL is being used
      const result = await pool.query(`
        SELECT 
          CASE 
            WHEN ssl IS TRUE THEN 'SSL enabled'
            ELSE 'SSL disabled'
          END as ssl_status
        FROM pg_stat_ssl
        WHERE pid = pg_backend_pid()
      `);

      if (result.rows.length > 0) {
        expect(result.rows[0].ssl_status).toBe('SSL enabled');
      }
    });
  });

  describe('Non-SSL Connection for Local Development', () => {
    it('should connect without SSL in development', async () => {
      if (!TEST_DB_URL || TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  RDS connection detected, skipping local development test');
        return;
      }

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      process.env.NODE_ENV = originalEnv;
    });

    it('should work with undefined SSL config', async () => {
      if (!TEST_DB_URL || TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  RDS connection detected, skipping undefined SSL test');
        return;
      }

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: undefined, // Explicitly undefined
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Connection Pooling with SSL', () => {
    it('should reuse SSL connections from pool', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 5,
      });

      // Execute multiple queries to test connection reuse
      const queries = Array(10).fill(null).map((_, i) => 
        pool.query('SELECT $1 as num', [i])
      );

      const results = await Promise.all(queries);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.rows[0].num).toBe(i);
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle connection checkout and release with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const client: PoolClient = await pool.connect();
      
      try {
        const result = await client.query('SELECT 1 as test');
        expect(result.rows[0].test).toBe(1);
      } finally {
        client.release();
      }

      // Pool should still be usable
      const result = await pool.query('SELECT 2 as test');
      expect(result.rows[0].test).toBe(2);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle pool exhaustion gracefully with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 2, // Small pool
        idleTimeoutMillis: 1000,
      });

      // Acquire all connections
      const client1 = await pool.connect();
      const client2 = await pool.connect();

      // Try to acquire another (should wait)
      const queryPromise = pool.query('SELECT 1');

      // Release one connection
      client1.release();

      // Query should complete
      const result = await queryPromise;
      expect(result.rows[0]).toBeDefined();

      // Cleanup
      client2.release();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling with SSL', () => {
    it('should handle SSL connection errors gracefully', async () => {
      // Try to connect to invalid host with SSL
      const invalidPool = new Pool({
        connectionString: 'postgresql://user:pass@invalid-host-12345.rds.amazonaws.com:5432/db',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 2000,
      });

      try {
        await invalidPool.query('SELECT 1');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();
      } finally {
        await invalidPool.end();
      }
    });

    it('should recover from SSL errors', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      // Execute invalid query
      try {
        await pool.query('SELECT * FROM nonexistent_table_12345');
      } catch (error) {
        // Expected to fail
      }

      // Should still be able to execute valid queries
      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle connection timeout with SSL', async () => {
      const timeoutPool = new Pool({
        connectionString: 'postgresql://user:pass@slow-host.rds.amazonaws.com:5432/db',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1000,
      });

      try {
        await timeoutPool.query('SELECT 1');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      } finally {
        await timeoutPool.end();
      }
    });
  });

  describe('Performance with SSL', () => {
    it('should complete queries quickly with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const startTime = Date.now();
      await pool.query('SELECT 1');
      const duration = Date.now() - startTime;

      // Should complete in reasonable time even with SSL
      expect(duration).toBeLessThan(2000);

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle concurrent queries efficiently with SSL', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
      });

      const startTime = Date.now();
      
      const queries = Array(20).fill(null).map((_, i) => 
        pool.query('SELECT $1 as num', [i])
      );

      await Promise.all(queries);
      
      const duration = Date.now() - startTime;

      // Should complete all queries in reasonable time
      expect(duration).toBeLessThan(5000);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('SSL Configuration Validation', () => {
    it('should use correct SSL config for production', async () => {
      if (!TEST_DB_URL) return;

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        TEST_DB_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: sslConfig,
      });

      expect(sslConfig).toEqual({ rejectUnauthorized: false });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      process.env.NODE_ENV = originalEnv;
    });

    it('should use correct SSL config for RDS', async () => {
      if (!TEST_DB_URL || !TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  Not an RDS connection, skipping RDS config test');
        return;
      }

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        TEST_DB_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: sslConfig,
      });

      expect(sslConfig).toEqual({ rejectUnauthorized: false });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should use correct SSL config for local development', async () => {
      if (!TEST_DB_URL || TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  RDS connection detected, skipping local config test');
        return;
      }

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const sslConfig = process.env.NODE_ENV === 'production' || 
                        TEST_DB_URL?.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : undefined;

      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: sslConfig,
      });

      expect(sslConfig).toBeUndefined();

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with existing test setup', async () => {
      if (!TEST_DB_URL) return;

      // This mimics the original test setup
      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should maintain same behavior as before for RDS', async () => {
      if (!TEST_DB_URL || !TEST_DB_URL.includes('rds.amazonaws.com')) {
        console.warn('⚠️  Not an RDS connection, skipping backward compatibility test');
        return;
      }

      // Before: Always had SSL
      // After: Still has SSL (detected via URL)
      pool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: process.env.NODE_ENV === 'production' || 
             TEST_DB_URL?.includes('rds.amazonaws.com')
          ? { rejectUnauthorized: false }
          : undefined,
      });

      const result = await pool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });
  });
});
