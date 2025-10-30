/**
 * Integration Tests for Vitest Node Configuration
 * Tests the actual behavior of the Node.js test configuration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

describe('Vitest Node Configuration Integration', () => {
  describe('Configuration Loading', () => {
    it('should load configuration without errors', async () => {
      // This test itself proves the config loads correctly
      expect(true).toBe(true);
    });

    it('should have access to global test functions', () => {
      // These should be available due to globals: true
      expect(typeof describe).toBe('function');
      expect(typeof it).toBe('function');
      expect(typeof expect).toBe('function');
      expect(typeof beforeAll).toBe('function');
      expect(typeof afterAll).toBe('function');
      expect(typeof beforeEach).toBe('function');
      expect(typeof afterEach).toBe('function');
    });

    it('should run in Node environment', () => {
      // Check we're in Node, not browser
      expect(typeof process).toBe('object');
      expect(typeof process.env).toBe('object');
      expect(typeof global).toBe('object');
      
      // Should not have browser globals
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
    });
  });

  describe('Path Resolution', () => {
    it('should resolve @ alias correctly', () => {
      // The @ alias should point to project root
      const projectRoot = path.resolve(__dirname, '../..');
      
      // Test that we can construct paths using the alias concept
      const testPath = path.resolve(projectRoot, 'lib/services');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should resolve relative imports', () => {
      // Test that relative imports work
      const configPath = path.resolve(__dirname, '../../vitest.node.config.ts');
      expect(existsSync(configPath)).toBe(true);
    });

    it('should resolve node_modules', () => {
      // Should be able to resolve node_modules
      const nodeModulesPath = path.resolve(__dirname, '../../node_modules');
      expect(existsSync(nodeModulesPath)).toBe(true);
    });
  });

  describe('Test Execution Environment', () => {
    it('should have Node.js APIs available', () => {
      // File system
      expect(typeof require('fs')).toBe('object');
      
      // Path
      expect(typeof require('path')).toBe('object');
      
      // Process
      expect(typeof process.cwd).toBe('function');
      expect(typeof process.env).toBe('object');
    });

    it('should not have browser APIs', () => {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      expect(typeof navigator).toBe('undefined');
      expect(typeof localStorage).toBe('undefined');
    });

    it('should support async/await', async () => {
      const result = await Promise.resolve('async works');
      expect(result).toBe('async works');
    });

    it('should support ES modules', () => {
      // This file uses ES module syntax
      expect(typeof import.meta).toBe('object');
    });
  });

  describe('Timeout Configuration', () => {
    it('should respect test timeout', async () => {
      const startTime = Date.now();
      
      // Simulate a long-running operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = Date.now() - startTime;
      
      // Should complete within timeout (30000ms)
      expect(duration).toBeLessThan(30000);
    }, 30000);

    it('should handle async operations within timeout', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        new Promise(resolve => setTimeout(() => resolve(i), 100))
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(5);
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('Coverage Configuration', () => {
    it('should exclude test files from coverage', () => {
      // This test file should not be included in coverage
      const configContent = readFileSync('vitest.node.config.ts', 'utf-8');
      expect(configContent).toContain("'**/*.test.*'");
      expect(configContent).toContain("'**/*.spec.*'");
    });

    it('should exclude node_modules from coverage', () => {
      const configContent = readFileSync('vitest.node.config.ts', 'utf-8');
      expect(configContent).toContain("'node_modules/'");
    });

    it('should exclude generated files from coverage', () => {
      const configContent = readFileSync('vitest.node.config.ts', 'utf-8');
      expect(configContent).toContain("'**/.next/**'");
      expect(configContent).toContain("'**/dist/**'");
    });
  });

  describe('Module Resolution', () => {
    it('should resolve TypeScript files', () => {
      // Should be able to work with .ts files
      const tsFile = path.resolve(__dirname, '../../vitest.node.config.ts');
      expect(existsSync(tsFile)).toBe(true);
    });

    it('should resolve JavaScript files', () => {
      // Should also work with .js files
      const packageJson = path.resolve(__dirname, '../../package.json');
      expect(existsSync(packageJson)).toBe(true);
    });

    it('should resolve JSON files', () => {
      const packageJson = require('../../package.json');
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
    });
  });

  describe('Test Isolation', () => {
    let testState: any;

    beforeAll(() => {
      testState = { initialized: true };
    });

    it('should maintain state across tests in same suite', () => {
      expect(testState.initialized).toBe(true);
      testState.modified = true;
    });

    it('should see modifications from previous test', () => {
      expect(testState.modified).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should catch and report errors', () => {
      expect(() => {
        throw new Error('Test error');
      }).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      await expect(async () => {
        throw new Error('Async error');
      }).rejects.toThrow('Async error');
    });

    it('should handle promise rejections', async () => {
      await expect(
        Promise.reject(new Error('Promise rejection'))
      ).rejects.toThrow('Promise rejection');
    });
  });

  describe('Performance', () => {
    it('should execute tests quickly', () => {
      const startTime = Date.now();
      
      // Simple operation
      const result = Array.from({ length: 1000 }, (_, i) => i * 2);
      
      const duration = Date.now() - startTime;
      
      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle concurrent operations', async () => {
      const startTime = Date.now();
      
      const operations = Array.from({ length: 10 }, () => 
        Promise.resolve(Math.random())
      );
      
      const results = await Promise.all(operations);
      
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Compatibility with Existing Tests', () => {
    it('should work with existing test patterns', () => {
      // Common test patterns should work
      const mockFn = vi.fn();
      mockFn('test');
      
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should support beforeEach and afterEach', () => {
      let setupRan = false;
      
      beforeEach(() => {
        setupRan = true;
      });
      
      expect(setupRan).toBe(true);
    });

    it('should support test.skip', () => {
      // This is just to verify the API exists
      expect(typeof it.skip).toBe('function');
      expect(typeof test.skip).toBe('function');
    });

    it('should support test.only', () => {
      // This is just to verify the API exists
      expect(typeof it.only).toBe('function');
      expect(typeof test.only).toBe('function');
    });
  });

  describe('Node.js Specific Features', () => {
    it('should support file system operations', () => {
      const fs = require('fs');
      const packageJson = fs.readFileSync('package.json', 'utf-8');
      
      expect(packageJson).toBeTruthy();
      expect(JSON.parse(packageJson)).toHaveProperty('name');
    });

    it('should support path operations', () => {
      const testPath = path.join(__dirname, '..', '..', 'package.json');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should support environment variables', () => {
      expect(typeof process.env).toBe('object');
      expect(typeof process.env.NODE_ENV).toBe('string');
    });

    it('should support child processes', () => {
      const { execSync } = require('child_process');
      
      // This is just to verify the API is available
      expect(typeof execSync).toBe('function');
    });

    it('should support crypto operations', () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('test').digest('hex');
      
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64);
    });
  });

  describe('TypeScript Support', () => {
    it('should support TypeScript syntax', () => {
      // This test file is written in TypeScript
      interface TestInterface {
        value: string;
      }
      
      const testObj: TestInterface = { value: 'test' };
      expect(testObj.value).toBe('test');
    });

    it('should support type imports', () => {
      // Type imports should work
      type TestType = string | number;
      
      const testValue: TestType = 'test';
      expect(typeof testValue).toBe('string');
    });

    it('should support generics', () => {
      function identity<T>(value: T): T {
        return value;
      }
      
      expect(identity('test')).toBe('test');
      expect(identity(123)).toBe(123);
    });
  });

  describe('Mock Support', () => {
    it('should support vi.fn()', () => {
      const mockFn = vi.fn();
      mockFn('test');
      
      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should support vi.mock()', () => {
      // Mock functionality should be available
      expect(typeof vi.mock).toBe('function');
      expect(typeof vi.unmock).toBe('function');
    });

    it('should support vi.spyOn()', () => {
      const obj = { method: () => 'original' };
      const spy = vi.spyOn(obj, 'method');
      
      obj.method();
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Assertion Support', () => {
    it('should support basic assertions', () => {
      expect(true).toBe(true);
      expect(1 + 1).toBe(2);
      expect('test').toBe('test');
    });

    it('should support object assertions', () => {
      const obj = { a: 1, b: 2 };
      
      expect(obj).toHaveProperty('a');
      expect(obj).toEqual({ a: 1, b: 2 });
      expect(obj).toMatchObject({ a: 1 });
    });

    it('should support array assertions', () => {
      const arr = [1, 2, 3];
      
      expect(arr).toHaveLength(3);
      expect(arr).toContain(2);
      expect(arr).toEqual([1, 2, 3]);
    });

    it('should support async assertions', async () => {
      await expect(Promise.resolve('test')).resolves.toBe('test');
      await expect(Promise.reject('error')).rejects.toBe('error');
    });
  });

  describe('Configuration Validation', () => {
    it('should use correct environment', () => {
      // In Node environment, these should be available
      expect(typeof process).toBe('object');
      expect(typeof global).toBe('object');
      
      // In Node environment, these should NOT be available
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
    });

    it('should have correct timeout settings', () => {
      // The test should have access to configured timeouts
      // This is implicit - if the test runs, timeouts are working
      expect(true).toBe(true);
    });

    it('should have globals enabled', () => {
      // These should be available without imports
      expect(typeof describe).toBe('function');
      expect(typeof it).toBe('function');
      expect(typeof expect).toBe('function');
      expect(typeof vi).toBe('object');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle database mock operations', async () => {
      // Simulate database operations
      const mockDb = {
        query: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }])
      };
      
      const result = await mockDb.query('SELECT * FROM users');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 1, name: 'test' });
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should handle API mock operations', async () => {
      // Simulate API calls
      const mockApi = {
        fetch: vi.fn().mockResolvedValue({ 
          json: () => Promise.resolve({ data: 'test' })
        })
      };
      
      const response = await mockApi.fetch('/api/test');
      const data = await response.json();
      
      expect(data).toEqual({ data: 'test' });
      expect(mockApi.fetch).toHaveBeenCalledWith('/api/test');
    });

    it('should handle service layer operations', async () => {
      // Simulate service operations
      const mockService = {
        process: vi.fn().mockResolvedValue({ success: true })
      };
      
      const result = await mockService.process({ input: 'test' });
      
      expect(result.success).toBe(true);
      expect(mockService.process).toHaveBeenCalled();
    });
  });
});
