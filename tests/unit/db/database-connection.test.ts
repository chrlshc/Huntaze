/**
 * Unit Tests - Database Connection Module
 * 
 * Tests for lib/db.ts core functionality
 * 
 * Coverage:
 * - Pool creation and singleton pattern
 * - Query execution
 * - Client acquisition
 * - Error handling
 * - Connection configuration
 * - Performance logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';

// Mock pg module
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  const mockConnect = vi.fn();
  const mockOn = vi.fn();
  
  const MockPool = vi.fn().mockImplementation(() => ({
    query: mockQuery,
    connect: mockConnect,
    on: mockOn,
  }));

  return {
    Pool: MockPool,
  };
});

describe('Database Connection Module (lib/db.ts)', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset modules to clear singleton
    vi.resetModules();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getPool() - Pool Creation', () => {
    it('should create a pool instance', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      const pool = getPool();
      
      expect(pool).toBeDefined();
      expect(Pool).toHaveBeenCalled();
    });

    it('should create pool with DATABASE_URL', async () => {
      const testUrl = 'postgresql://user:pass@host:5432/db';
      process.env.DATABASE_URL = testUrl;
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: testUrl,
        })
      );
    });

    it('should configure SSL for production', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.NODE_ENV = 'production';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });

    it('should disable SSL for development', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      process.env.NODE_ENV = 'development';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: false,
        })
      );
    });

    it('should configure pool with max connections', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 20,
        })
      );
    });

    it('should configure idle timeout', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          idleTimeoutMillis: 30000,
        })
      );
    });

    it('should configure connection timeout', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeoutMillis: 2000,
        })
      );
    });

    it('should register error handler', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      const pool = getPool();
      
      expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('getPool() - Singleton Pattern', () => {
    it('should return the same pool instance on multiple calls', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      const pool1 = getPool();
      const pool2 = getPool();
      
      expect(pool1).toBe(pool2);
    });

    it('should create pool only once', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      getPool();
      getPool();
      getPool();
      
      expect(Pool).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing pool', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const { getPool } = await import('@/lib/db');
      const pool1 = getPool();
      
      // Clear mock to verify no new pool is created
      vi.mocked(Pool).mockClear();
      
      const pool2 = getPool();
      
      expect(Pool).not.toHaveBeenCalled();
      expect(pool1).toBe(pool2);
    });
  });

  describe('query() - Query Execution', () => {
    it('should execute query with text', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      await query('SELECT * FROM users');
      
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users', undefined);
    });

    it('should execute query with parameters', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      await query('SELECT * FROM users WHERE id = $1', [1]);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
    });

    it('should return query result', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = {
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1,
      };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      const result = await query('SELECT * FROM users');
      
      expect(result).toEqual(mockQueryResult);
      expect(result.rows).toHaveLength(1);
      expect(result.rowCount).toBe(1);
    });

    it('should log query execution', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      await query('SELECT * FROM users');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Executed query',
        expect.objectContaining({
          text: 'SELECT * FROM users',
          rows: 0,
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should measure query duration', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      await query('SELECT * FROM users');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Executed query',
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle query errors', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockError = new Error('Query failed');
      const mockPool = {
        query: vi.fn().mockRejectedValue(mockError),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      
      await expect(query('INVALID SQL')).rejects.toThrow('Query failed');
    });

    it('should log query errors', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockError = new Error('Query failed');
      const mockPool = {
        query: vi.fn().mockRejectedValue(mockError),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      
      try {
        await query('INVALID SQL');
      } catch (error) {
        // Expected error
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database query error:',
        mockError
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getClient() - Client Acquisition', () => {
    it('should acquire a client from pool', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockClient = { query: vi.fn(), release: vi.fn() };
      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getClient } = await import('@/lib/db');
      const client = await getClient();
      
      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockClient);
    });

    it('should return a connected client', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockClient = { query: vi.fn(), release: vi.fn() };
      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getClient } = await import('@/lib/db');
      const client = await getClient();
      
      expect(client).toHaveProperty('query');
      expect(client).toHaveProperty('release');
    });

    it('should handle connection errors', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockError = new Error('Connection failed');
      const mockPool = {
        connect: vi.fn().mockRejectedValue(mockError),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getClient } = await import('@/lib/db');
      
      await expect(getClient()).rejects.toThrow('Connection failed');
    });
  });

  describe('Error Handler', () => {
    it('should log idle client errors', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let errorHandler: Function;
      const mockPool = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            errorHandler = handler;
          }
        }),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      // Trigger error handler
      const testError = new Error('Idle client error');
      errorHandler!(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unexpected error on idle client',
        testError
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      
      const { getPool } = await import('@/lib/db');
      
      expect(() => getPool()).not.toThrow();
    });

    it('should use undefined for missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: undefined,
        })
      );
    });

    it('should default to development SSL settings', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      delete process.env.NODE_ENV;
      
      const { getPool } = await import('@/lib/db');
      getPool();
      
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: false,
        })
      );
    });
  });

  describe('Performance', () => {
    it('should execute queries efficiently', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      
      const start = Date.now();
      await query('SELECT 1');
      const duration = Date.now() - start;
      
      // Query should be fast (< 100ms in tests)
      expect(duration).toBeLessThan(100);
    });

    it('should reuse pool connections', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = { rows: [], rowCount: 0 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { query } = await import('@/lib/db');
      
      await query('SELECT 1');
      await query('SELECT 2');
      await query('SELECT 3');
      
      // Pool should be created only once
      expect(Pool).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('should work with repositories', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockQueryResult = { rows: [{ id: 1 }], rowCount: 1 };
      const mockPool = {
        query: vi.fn().mockResolvedValue(mockQueryResult),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getPool, query } = await import('@/lib/db');
      
      // Simulate repository usage
      const pool = getPool();
      expect(pool).toBeDefined();
      
      const result = await query('SELECT * FROM users WHERE id = $1', [1]);
      expect(result.rows).toHaveLength(1);
    });

    it('should support transactions with getClient', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: vi.fn(),
      };
      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        on: vi.fn(),
      };
      
      vi.mocked(Pool).mockImplementation(() => mockPool as any);
      
      const { getClient } = await import('@/lib/db');
      
      const client = await getClient();
      
      // Simulate transaction
      await client.query('BEGIN');
      await client.query('INSERT INTO users (name) VALUES ($1)', ['Test']);
      await client.query('COMMIT');
      client.release();
      
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
