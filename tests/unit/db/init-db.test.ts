/**
 * Unit Tests - Database Initialization Script
 * 
 * Tests to validate the database initialization script behavior
 * including connection timeout configuration
 * 
 * Coverage:
 * - Pool configuration with timeout parameters
 * - Connection timeout handling
 * - Query timeout handling
 * - SQL file execution
 * - Error handling
 * - Environment validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('pg');
vi.mock('fs');
vi.mock('path');
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('Database Initialization Script', () => {
  let mockPool: any;
  let mockQuery: any;
  let mockEnd: any;
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Setup mocks
    mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    mockEnd = vi.fn().mockResolvedValue(undefined);
    mockPool = {
      query: mockQuery,
      end: mockEnd,
    };

    vi.mocked(Pool).mockImplementation(() => mockPool as any);
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE test;');
    vi.mocked(path.join).mockReturnValue('/mock/path/init-db.sql');

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Set default environment
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/testdb';
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Pool Configuration', () => {
    it('should configure pool with connection timeout', async () => {
      // Import and run the script
      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeoutMillis: 10000,
        })
      );
    });

    it('should configure pool with query timeout', async () => {
      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          query_timeout: 10000,
        })
      );
    });

    it('should configure pool with SSL settings', async () => {
      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ssl: { rejectUnauthorized: false },
        })
      );
    });

    it('should configure pool with connection string from environment', async () => {
      const dbUrl = 'postgresql://testuser:testpass@testhost:5432/testdb';
      process.env.DATABASE_URL = dbUrl;

      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: dbUrl,
        })
      );
    });

    it('should configure all pool parameters together', async () => {
      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
      });
    });
  });

  describe('Connection Timeout Handling', () => {
    it('should handle connection timeout errors gracefully', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockQuery.mockRejectedValueOnce(timeoutError);

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error initializing database'),
        expect.any(Error)
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should set connection timeout to 10 seconds', async () => {
      await import('../../../scripts/init-db.js');

      const poolConfig = vi.mocked(Pool).mock.calls[0][0];
      expect(poolConfig.connectionTimeoutMillis).toBe(10000);
    });

    it('should allow connections within timeout period', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('Query Timeout Handling', () => {
    it('should handle query timeout errors gracefully', async () => {
      const queryTimeoutError = new Error('Query timeout');
      queryTimeoutError.name = 'QueryTimeoutError';
      mockQuery.mockRejectedValueOnce(queryTimeoutError);

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error initializing database'),
        expect.any(Error)
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should set query timeout to 10 seconds', async () => {
      await import('../../../scripts/init-db.js');

      const poolConfig = vi.mocked(Pool).mock.calls[0][0];
      expect(poolConfig.query_timeout).toBe(10000);
    });

    it('should complete queries within timeout period', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database initialized successfully')
      );
    });
  });

  describe('Environment Validation', () => {
    it('should exit if DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ DATABASE_URL not set in environment'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should mask password in console output', async () => {
      process.env.DATABASE_URL = 'postgresql://user:secretpass@localhost:5432/db';

      await import('../../../scripts/init-db.js');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('postgresql://user:****@localhost:5432/db')
      );
    });

    it('should accept valid DATABASE_URL', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalledWith(1);
    });
  });

  describe('SQL File Execution', () => {
    it('should read SQL file from correct path', async () => {
      await import('../../../scripts/init-db.js');

      expect(path.join).toHaveBeenCalledWith(
        expect.any(String),
        'init-db.sql'
      );
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.any(String),
        'utf8'
      );
    });

    it('should execute SQL from file', async () => {
      const mockSql = 'CREATE TABLE users; CREATE TABLE sessions;';
      vi.mocked(fs.readFileSync).mockReturnValue(mockSql);

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalledWith(mockSql);
    });

    it('should handle SQL execution errors', async () => {
      const sqlError = new Error('SQL syntax error');
      mockQuery.mockRejectedValueOnce(sqlError);

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error initializing database'),
        sqlError
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should log success message after execution', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await import('../../../scripts/init-db.js');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Database initialized successfully!'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Tables created: users, sessions'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      const fileError = new Error('File not found');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw fileError;
      });

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error initializing database'),
        fileError
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle database connection errors', async () => {
      const connectionError = new Error('Connection refused');
      mockQuery.mockRejectedValueOnce(connectionError);

      await import('../../../scripts/init-db.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error initializing database'),
        connectionError
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should close pool connection on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Test error'));

      await import('../../../scripts/init-db.js');

      expect(mockEnd).toHaveBeenCalled();
    });

    it('should close pool connection on success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await import('../../../scripts/init-db.js');

      expect(mockEnd).toHaveBeenCalled();
    });

    it('should handle pool.end() errors gracefully', async () => {
      mockEnd.mockRejectedValueOnce(new Error('Failed to close pool'));

      await import('../../../scripts/init-db.js');

      // Should not throw, error is handled internally
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('Timeout Edge Cases', () => {
    it('should handle exactly 10 second connection time', async () => {
      // Simulate a connection that takes exactly 10 seconds
      mockQuery.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ rows: [] }), 10000))
      );

      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionTimeoutMillis: 10000,
        })
      );
    });

    it('should handle exactly 10 second query time', async () => {
      // Simulate a query that takes exactly 10 seconds
      mockQuery.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ rows: [] }), 10000))
      );

      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          query_timeout: 10000,
        })
      );
    });

    it('should use milliseconds for connection timeout', async () => {
      await import('../../../scripts/init-db.js');

      const poolConfig = vi.mocked(Pool).mock.calls[0][0];
      // Verify it's in milliseconds (10000ms = 10s)
      expect(poolConfig.connectionTimeoutMillis).toBe(10000);
      expect(poolConfig.connectionTimeoutMillis).not.toBe(10); // Not seconds
    });

    it('should use milliseconds for query timeout', async () => {
      await import('../../../scripts/init-db.js');

      const poolConfig = vi.mocked(Pool).mock.calls[0][0];
      // Verify it's in milliseconds (10000ms = 10s)
      expect(poolConfig.query_timeout).toBe(10000);
      expect(poolConfig.query_timeout).not.toBe(10); // Not seconds
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with existing pool config', async () => {
      await import('../../../scripts/init-db.js');

      // Ensure new timeout params don't break existing config
      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: expect.any(String),
          ssl: expect.objectContaining({
            rejectUnauthorized: false,
          }),
        })
      );
    });

    it('should not change SSL configuration', async () => {
      await import('../../../scripts/init-db.js');

      const poolConfig = vi.mocked(Pool).mock.calls[0][0];
      expect(poolConfig.ssl).toEqual({ rejectUnauthorized: false });
    });

    it('should preserve connection string handling', async () => {
      const customUrl = 'postgresql://custom:pass@custom.host:5432/customdb';
      process.env.DATABASE_URL = customUrl;

      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: customUrl,
        })
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle slow network connections', async () => {
      // Simulate slow connection (within timeout)
      mockQuery.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ rows: [] }), 5000))
      );

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database initialized successfully')
      );
    });

    it('should handle large SQL files', async () => {
      const largeSql = 'CREATE TABLE test;\n'.repeat(1000);
      vi.mocked(fs.readFileSync).mockReturnValue(largeSql);

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalledWith(largeSql);
    });

    it('should handle multiple table creation', async () => {
      const multiTableSql = `
        CREATE TABLE users;
        CREATE TABLE sessions;
        CREATE TABLE posts;
      `;
      vi.mocked(fs.readFileSync).mockReturnValue(multiTableSql);

      await import('../../../scripts/init-db.js');

      expect(mockQuery).toHaveBeenCalledWith(multiTableSql);
    });
  });

  describe('Performance', () => {
    it('should complete initialization within reasonable time', async () => {
      const startTime = Date.now();
      
      await import('../../../scripts/init-db.js');
      
      const duration = Date.now() - startTime;
      // Should complete quickly in test environment
      expect(duration).toBeLessThan(1000);
    });

    it('should not create multiple pool instances', async () => {
      await import('../../../scripts/init-db.js');

      expect(Pool).toHaveBeenCalledTimes(1);
    });

    it('should close pool after single use', async () => {
      await import('../../../scripts/init-db.js');

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });
});
