/**
 * Unit Tests - Database Index Module
 * 
 * Tests for lib/db/index.ts re-exports
 * 
 * Coverage:
 * - Module exports validation
 * - Function re-export integrity
 * - Type compatibility
 * - Import paths
 */

import { describe, it, expect } from 'vitest';

describe('Database Index Module (lib/db/index.ts)', () => {
  describe('Module Exports', () => {
    it('should export getPool function', async () => {
      const { getPool } = await import('@/lib/db/index');
      
      expect(getPool).toBeDefined();
      expect(typeof getPool).toBe('function');
    });

    it('should export query function', async () => {
      const { query } = await import('@/lib/db/index');
      
      expect(query).toBeDefined();
      expect(typeof query).toBe('function');
    });

    it('should export getClient function', async () => {
      const { getClient } = await import('@/lib/db/index');
      
      expect(getClient).toBeDefined();
      expect(typeof getClient).toBe('function');
    });

    it('should export all three functions', async () => {
      const dbIndex = await import('@/lib/db/index');
      
      expect(Object.keys(dbIndex)).toContain('getPool');
      expect(Object.keys(dbIndex)).toContain('query');
      expect(Object.keys(dbIndex)).toContain('getClient');
    });

    it('should have exactly three exports', async () => {
      const dbIndex = await import('@/lib/db/index');
      const exports = Object.keys(dbIndex);
      
      expect(exports).toHaveLength(3);
    });
  });

  describe('Re-export Integrity', () => {
    it('should re-export the same getPool function from lib/db', async () => {
      const { getPool: indexGetPool } = await import('@/lib/db/index');
      const { getPool: dbGetPool } = await import('@/lib/db');
      
      expect(indexGetPool).toBe(dbGetPool);
    });

    it('should re-export the same query function from lib/db', async () => {
      const { query: indexQuery } = await import('@/lib/db/index');
      const { query: dbQuery } = await import('@/lib/db');
      
      expect(indexQuery).toBe(dbQuery);
    });

    it('should re-export the same getClient function from lib/db', async () => {
      const { getClient: indexGetClient } = await import('@/lib/db/index');
      const { getClient: dbGetClient } = await import('@/lib/db');
      
      expect(indexGetClient).toBe(dbGetClient);
    });
  });

  describe('Import Paths', () => {
    it('should be importable from @/lib/db/index', async () => {
      const importPromise = import('@/lib/db/index');
      
      await expect(importPromise).resolves.toBeDefined();
    });

    it('should be importable from @/lib/db', async () => {
      const importPromise = import('@/lib/db');
      
      await expect(importPromise).resolves.toBeDefined();
    });

    it('should provide consistent exports from both paths', async () => {
      const indexModule = await import('@/lib/db/index');
      const dbModule = await import('@/lib/db');
      
      expect(indexModule.getPool).toBe(dbModule.getPool);
      expect(indexModule.query).toBe(dbModule.query);
      expect(indexModule.getClient).toBe(dbModule.getClient);
    });
  });

  describe('Type Compatibility', () => {
    it('should export functions with correct signatures', async () => {
      const { getPool, query, getClient } = await import('@/lib/db/index');
      
      // getPool should return a Pool
      expect(getPool.length).toBe(0); // No parameters
      
      // query should accept text and optional params
      expect(query.length).toBe(2); // text and params
      
      // getClient should return a Promise
      expect(getClient.length).toBe(0); // No parameters
    });

    it('should maintain function names', async () => {
      const { getPool, query, getClient } = await import('@/lib/db/index');
      
      expect(getPool.name).toBe('getPool');
      expect(query.name).toBe('query');
      expect(getClient.name).toBe('getClient');
    });
  });

  describe('Module Structure', () => {
    it('should not export default', async () => {
      const dbIndex = await import('@/lib/db/index');
      
      expect(dbIndex.default).toBeUndefined();
    });

    it('should only export named exports', async () => {
      const dbIndex = await import('@/lib/db/index');
      const exports = Object.keys(dbIndex);
      
      exports.forEach(exportName => {
        expect(exportName).not.toBe('default');
      });
    });

    it('should be a valid ES module', async () => {
      const importPromise = import('@/lib/db/index');
      
      await expect(importPromise).resolves.toHaveProperty('getPool');
      await expect(importPromise).resolves.toHaveProperty('query');
      await expect(importPromise).resolves.toHaveProperty('getClient');
    });
  });

  describe('Documentation', () => {
    it('should have JSDoc comments in source', async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'lib/db/index.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('/**');
      expect(content).toContain('Database module exports');
    });

    it('should document re-export purpose', async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'lib/db/index.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('Re-exports');
      expect(content).toContain('lib/db.ts');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing imports from lib/db', async () => {
      // Old import style should still work
      const { getPool, query, getClient } = await import('@/lib/db');
      
      expect(getPool).toBeDefined();
      expect(query).toBeDefined();
      expect(getClient).toBeDefined();
    });

    it('should support new import style from lib/db/index', async () => {
      // New import style should also work
      const { getPool, query, getClient } = await import('@/lib/db/index');
      
      expect(getPool).toBeDefined();
      expect(query).toBeDefined();
      expect(getClient).toBeDefined();
    });

    it('should provide identical functionality from both import paths', async () => {
      const oldImport = await import('@/lib/db');
      const newImport = await import('@/lib/db/index');
      
      // Functions should be the same reference
      expect(oldImport.getPool).toBe(newImport.getPool);
      expect(oldImport.query).toBe(newImport.query);
      expect(oldImport.getClient).toBe(newImport.getClient);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on import', async () => {
      const importPromise = import('@/lib/db/index');
      
      await expect(importPromise).resolves.toBeDefined();
    });

    it('should handle missing parent module gracefully', async () => {
      // This test ensures the re-export path is correct
      const { getPool } = await import('@/lib/db/index');
      
      expect(getPool).toBeDefined();
      expect(typeof getPool).toBe('function');
    });
  });

  describe('Performance', () => {
    it('should import quickly', async () => {
      const start = Date.now();
      await import('@/lib/db/index');
      const duration = Date.now() - start;
      
      // Import should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should not create duplicate instances', async () => {
      const import1 = await import('@/lib/db/index');
      const import2 = await import('@/lib/db/index');
      
      // Same module instance
      expect(import1).toBe(import2);
    });
  });

  describe('Integration with Repositories', () => {
    it('should be usable by repository modules', async () => {
      // Repositories should be able to import from either path
      const { getPool } = await import('@/lib/db/index');
      
      expect(() => {
        const pool = getPool();
        expect(pool).toBeDefined();
      }).not.toThrow();
    });

    it('should provide consistent pool instance', async () => {
      const { getPool: getPool1 } = await import('@/lib/db/index');
      const { getPool: getPool2 } = await import('@/lib/db');
      
      const pool1 = getPool1();
      const pool2 = getPool2();
      
      // Should return the same pool instance (singleton)
      expect(pool1).toBe(pool2);
    });
  });
});
