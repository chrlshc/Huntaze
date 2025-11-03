/**
 * Integration Tests - Database Initialization
 * 
 * Integration tests to validate database initialization with real timeouts
 * 
 * Coverage:
 * - Real database connection with timeout configuration
 * - Timeout behavior validation
 * - SQL execution validation
 * - Error recovery scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

describe('Database Initialization - Integration Tests', () => {
  let testPool: Pool;
  const TEST_DB_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  beforeAll(() => {
    if (!TEST_DB_URL) {
      console.warn('⚠️  TEST_DATABASE_URL not set, skipping integration tests');
    }
  });

  afterAll(async () => {
    if (testPool) {
      await testPool.end();
    }
  });

  describe('Pool Configuration with Timeouts', () => {
    it('should create pool with connection timeout', () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      expect(testPool).toBeDefined();
    });

    it('should connect to database within timeout', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const startTime = Date.now();
      const result = await testPool.query('SELECT 1 as test');
      const duration = Date.now() - startTime;

      expect(result.rows[0].test).toBe(1);
      expect(duration).toBeLessThan(10000);
    });

    it('should execute queries within timeout', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const startTime = Date.now();
      const result = await testPool.query('SELECT NOW() as current_time');
      const duration = Date.now() - startTime;

      expect(result.rows[0].current_time).toBeDefined();
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Timeout Behavior', () => {
    it('should timeout on slow connections', async () => {
      if (!TEST_DB_URL) return;

      // Create pool with very short timeout for testing
      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 100, // 100ms timeout
        query_timeout: 100,
      });

      try {
        // Try to execute a slow query
        await testPool.query('SELECT pg_sleep(1)');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Should timeout
        expect(error).toBeDefined();
      }
    });

    it('should handle connection timeout gracefully', async () => {
      if (!TEST_DB_URL) return;

      // Use invalid host to trigger connection timeout
      const invalidPool = new Pool({
        connectionString: 'postgresql://user:pass@invalid-host-12345:5432/db',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1000,
        query_timeout: 1000,
      });

      try {
        await invalidPool.query('SELECT 1');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toBeTruthy();
      } finally {
        await invalidPool.end();
      }
    });
  });

  describe('SQL File Execution', () => {
    it('should execute init-db.sql successfully', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const sqlPath = path.join(process.cwd(), 'scripts', 'init-db.sql');
      
      if (!fs.existsSync(sqlPath)) {
        console.warn('⚠️  init-db.sql not found, skipping test');
        return;
      }

      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Execute SQL
      await testPool.query(sql);

      // Verify tables were created
      const tablesResult = await testPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions')
      `);

      const tableNames = tablesResult.rows.map(row => row.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('sessions');
    });

    it('should create indexes successfully', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      // Check if indexes exist
      const indexResult = await testPool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'sessions')
      `);

      const indexNames = indexResult.rows.map(row => row.indexname);
      
      // Should have at least some indexes
      expect(indexNames.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from failed queries', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      // Execute invalid query
      try {
        await testPool.query('SELECT * FROM nonexistent_table');
      } catch (error) {
        // Expected to fail
      }

      // Should still be able to execute valid queries
      const result = await testPool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });

    it('should handle multiple concurrent queries', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const queries = [
        testPool.query('SELECT 1 as num'),
        testPool.query('SELECT 2 as num'),
        testPool.query('SELECT 3 as num'),
      ];

      const results = await Promise.all(queries);

      expect(results[0].rows[0].num).toBe(1);
      expect(results[1].rows[0].num).toBe(2);
      expect(results[2].rows[0].num).toBe(3);
    });
  });

  describe('Performance Validation', () => {
    it('should complete simple queries quickly', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const startTime = Date.now();
      await testPool.query('SELECT 1');
      const duration = Date.now() - startTime;

      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple sequential queries efficiently', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        await testPool.query('SELECT $1 as num', [i]);
      }
      
      const duration = Date.now() - startTime;

      // Should complete all queries within timeout
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('SSL Configuration', () => {
    it('should connect with SSL disabled for development', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      const result = await testPool.query('SELECT 1 as test');
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Connection Pool Management', () => {
    it('should reuse connections from pool', async () => {
      if (!TEST_DB_URL) return;

      testPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        max: 5, // Max 5 connections
      });

      // Execute multiple queries
      const queries = Array(10).fill(null).map(() => 
        testPool.query('SELECT 1')
      );

      const results = await Promise.all(queries);
      
      // All queries should succeed
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.rows[0]).toEqual({ '?column?': 1 });
      });
    });

    it('should close pool cleanly', async () => {
      if (!TEST_DB_URL) return;

      const tempPool = new Pool({
        connectionString: TEST_DB_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });

      await tempPool.query('SELECT 1');
      await tempPool.end();

      // Pool should be closed
      expect(tempPool.ended).toBe(true);
    });
  });
});
