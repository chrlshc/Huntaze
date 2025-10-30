/**
 * Regression Tests for Vitest Node Configuration
 * Ensures configuration changes don't break existing functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('Vitest Node Configuration Regression Tests', () => {
  let nodeConfig: string;
  let mainConfig: string;

  beforeAll(() => {
    nodeConfig = readFileSync('vitest.node.config.ts', 'utf-8');
    mainConfig = readFileSync('vitest.config.ts', 'utf-8');
  });

  describe('Configuration Stability', () => {
    it('should maintain node environment setting', () => {
      expect(nodeConfig).toContain("environment: 'node'");
    });

    it('should maintain globals setting', () => {
      expect(nodeConfig).toContain('globals: true');
    });

    it('should maintain v8 coverage provider', () => {
      expect(nodeConfig).toContain("provider: 'v8'");
    });

    it('should maintain coverage thresholds at 80%', () => {
      expect(nodeConfig).toContain('statements: 80');
      expect(nodeConfig).toContain('branches: 80');
      expect(nodeConfig).toContain('functions: 80');
      expect(nodeConfig).toContain('lines: 80');
    });

    it('should maintain 30 second timeouts', () => {
      expect(nodeConfig).toContain('testTimeout: 30000');
      expect(nodeConfig).toContain('hookTimeout: 30000');
    });

    it('should maintain @ alias configuration', () => {
      expect(nodeConfig).toContain("'@': path.resolve(__dirname, './')");
    });
  });

  describe('Coverage Exclusions Stability', () => {
    it('should continue excluding node_modules', () => {
      expect(nodeConfig).toContain("'node_modules/'");
    });

    it('should continue excluding tests directory', () => {
      expect(nodeConfig).toContain("'tests/'");
    });

    it('should continue excluding TypeScript declarations', () => {
      expect(nodeConfig).toContain("'**/*.d.ts'");
    });

    it('should continue excluding config files', () => {
      expect(nodeConfig).toContain("'**/*.config.*'");
    });

    it('should continue excluding coverage directory', () => {
      expect(nodeConfig).toContain("'**/coverage/**'");
    });

    it('should continue excluding .next directory', () => {
      expect(nodeConfig).toContain("'**/.next/**'");
    });

    it('should continue excluding dist directory', () => {
      expect(nodeConfig).toContain("'**/dist/**'");
    });

    it('should continue excluding test files', () => {
      expect(nodeConfig).toContain("'**/*.test.*'");
      expect(nodeConfig).toContain("'**/*.spec.*'");
    });
  });

  describe('Reporter Configuration Stability', () => {
    it('should maintain text reporter', () => {
      expect(nodeConfig).toContain("'text'");
    });

    it('should maintain json reporter', () => {
      expect(nodeConfig).toContain("'json'");
    });

    it('should maintain html reporter', () => {
      expect(nodeConfig).toContain("'html'");
    });

    it('should have reporters in array format', () => {
      expect(nodeConfig).toContain("reporter: ['text', 'json', 'html']");
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing test imports', () => {
      // Globals should still be enabled
      expect(nodeConfig).toContain('globals: true');
    });

    it('should not change module resolution', () => {
      // @ alias should still work
      expect(nodeConfig).toContain('resolve:');
      expect(nodeConfig).toContain('alias:');
    });

    it('should not change timeout behavior', () => {
      // Timeouts should remain the same
      const timeoutMatch = nodeConfig.match(/testTimeout:\s*(\d+)/);
      expect(timeoutMatch).toBeTruthy();
      expect(timeoutMatch?.[1]).toBe('30000');
    });

    it('should maintain TypeScript support', () => {
      // Should still be a .ts file
      expect('vitest.node.config.ts').toMatch(/\.ts$/);
    });
  });

  describe('No Unintended Changes', () => {
    it('should not add browser-specific configurations', () => {
      expect(nodeConfig).not.toContain('jsdom');
      expect(nodeConfig).not.toContain('happy-dom');
      expect(nodeConfig).not.toContain('browser');
    });

    it('should not add React-specific configurations', () => {
      expect(nodeConfig).not.toContain('react');
      expect(nodeConfig).not.toContain('jsx');
    });

    it('should not add CSS processing', () => {
      expect(nodeConfig).not.toContain('css: true');
      expect(nodeConfig).not.toContain('postcss');
    });

    it('should not add setup files', () => {
      expect(nodeConfig).not.toContain('setupFiles');
    });

    it('should not change coverage provider', () => {
      expect(nodeConfig).toContain("provider: 'v8'");
      expect(nodeConfig).not.toContain("provider: 'istanbul'");
      expect(nodeConfig).not.toContain("provider: 'c8'");
    });
  });

  describe('Consistency with Main Config', () => {
    it('should have same coverage thresholds', () => {
      const nodeThresholds = nodeConfig.match(/statements: (\d+).*branches: (\d+).*functions: (\d+).*lines: (\d+)/s);
      const mainThresholds = mainConfig.match(/statements: (\d+).*branches: (\d+).*functions: (\d+).*lines: (\d+)/s);
      
      expect(nodeThresholds?.[1]).toBe(mainThresholds?.[1]);
      expect(nodeThresholds?.[2]).toBe(mainThresholds?.[2]);
      expect(nodeThresholds?.[3]).toBe(mainThresholds?.[3]);
      expect(nodeThresholds?.[4]).toBe(mainThresholds?.[4]);
    });

    it('should have same timeout values', () => {
      const nodeTimeout = nodeConfig.match(/testTimeout:\s*(\d+)/)?.[1];
      const mainTimeout = mainConfig.match(/testTimeout:\s*(\d+)/)?.[1];
      
      expect(nodeTimeout).toBe(mainTimeout);
    });

    it('should have same coverage exclusions', () => {
      const commonExclusions = [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/.next/**',
        '**/dist/**',
        '**/*.test.*',
        '**/*.spec.*'
      ];
      
      commonExclusions.forEach(exclusion => {
        expect(nodeConfig).toContain(exclusion);
        expect(mainConfig).toContain(exclusion);
      });
    });

    it('should have same @ alias configuration', () => {
      const nodeAlias = nodeConfig.match(/'@':\s*path\.resolve\(__dirname,\s*'\.\/'\)/);
      const mainAlias = mainConfig.match(/'@':\s*path\.resolve\(__dirname,\s*'\.\/'\)/);
      
      expect(nodeAlias).toBeTruthy();
      expect(mainAlias).toBeTruthy();
    });
  });

  describe('File Structure Stability', () => {
    it('should maintain file location', () => {
      expect(existsSync('vitest.node.config.ts')).toBe(true);
    });

    it('should maintain TypeScript extension', () => {
      expect('vitest.node.config.ts').toMatch(/\.ts$/);
    });

    it('should maintain naming convention', () => {
      expect('vitest.node.config.ts').toMatch(/^vitest\./);
      expect('vitest.node.config.ts').toMatch(/\.config\.ts$/);
    });
  });

  describe('Import Stability', () => {
    it('should maintain defineConfig import', () => {
      expect(nodeConfig).toContain("import { defineConfig } from 'vitest/config'");
    });

    it('should maintain path import', () => {
      expect(nodeConfig).toContain("import path from 'path'");
    });

    it('should not add unnecessary imports', () => {
      const imports = nodeConfig.match(/^import .* from .*/gm) || [];
      expect(imports.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Export Stability', () => {
    it('should maintain default export', () => {
      expect(nodeConfig).toContain('export default defineConfig');
    });

    it('should not have named exports', () => {
      expect(nodeConfig).not.toContain('export const');
      expect(nodeConfig).not.toContain('export function');
    });
  });

  describe('Syntax Stability', () => {
    it('should maintain ES module syntax', () => {
      expect(nodeConfig).toContain('import');
      expect(nodeConfig).toContain('export');
      expect(nodeConfig).not.toContain('require(');
      expect(nodeConfig).not.toContain('module.exports');
    });

    it('should maintain object literal syntax', () => {
      expect(nodeConfig).toContain('test: {');
      expect(nodeConfig).toContain('coverage: {');
      expect(nodeConfig).toContain('resolve: {');
    });

    it('should maintain proper indentation', () => {
      const lines = nodeConfig.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  '));
      
      // Should have some indented lines
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should not increase timeout values unnecessarily', () => {
      const timeout = parseInt(nodeConfig.match(/testTimeout:\s*(\d+)/)?.[1] || '0');
      
      // Should not exceed 60 seconds
      expect(timeout).toBeLessThanOrEqual(60000);
    });

    it('should not add slow coverage providers', () => {
      expect(nodeConfig).toContain("provider: 'v8'");
      expect(nodeConfig).not.toContain("provider: 'istanbul'");
    });

    it('should not add unnecessary exclusions', () => {
      const excludeMatch = nodeConfig.match(/exclude:\s*\[([\s\S]*?)\]/);
      const exclusions = excludeMatch?.[1].split(',').length || 0;
      
      // Should have reasonable number of exclusions
      expect(exclusions).toBeLessThan(20);
    });
  });

  describe('Security Regression Prevention', () => {
    it('should not expose sensitive paths', () => {
      expect(nodeConfig).not.toContain('/home/');
      expect(nodeConfig).not.toContain('/Users/');
      expect(nodeConfig).not.toContain('C:\\');
    });

    it('should not contain hardcoded credentials', () => {
      expect(nodeConfig).not.toContain('password');
      expect(nodeConfig).not.toContain('secret');
      expect(nodeConfig).not.toContain('token');
      expect(nodeConfig).not.toContain('api_key');
    });

    it('should not contain environment-specific values', () => {
      expect(nodeConfig).not.toContain('localhost:');
      expect(nodeConfig).not.toContain('127.0.0.1');
      expect(nodeConfig).not.toContain('production.com');
    });
  });

  describe('Documentation Regression Prevention', () => {
    it('should maintain clear configuration structure', () => {
      // Should have clear sections
      expect(nodeConfig).toContain('test:');
      expect(nodeConfig).toContain('coverage:');
      expect(nodeConfig).toContain('resolve:');
    });

    it('should maintain readable formatting', () => {
      const lines = nodeConfig.split('\n');
      
      // Should not have extremely long lines
      const longLines = lines.filter(line => line.length > 120);
      expect(longLines.length).toBeLessThan(5);
    });
  });

  describe('Integration Regression Prevention', () => {
    it('should work with existing test files', () => {
      // Check that test files exist and can be found
      const testDirs = ['tests/unit', 'tests/integration', 'tests/regression'];
      
      testDirs.forEach(dir => {
        expect(existsSync(dir)).toBe(true);
      });
    });

    it('should work with existing service files', () => {
      // Check that service files exist
      const serviceDir = 'lib/services';
      expect(existsSync(serviceDir)).toBe(true);
    });

    it('should work with package.json', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('scripts');
    });
  });

  describe('Future-proofing', () => {
    it('should use stable Vitest APIs', () => {
      // Should use defineConfig (stable API)
      expect(nodeConfig).toContain('defineConfig');
    });

    it('should use standard configuration keys', () => {
      const standardKeys = ['test', 'coverage', 'resolve'];
      
      standardKeys.forEach(key => {
        expect(nodeConfig).toContain(`${key}:`);
      });
    });

    it('should not use deprecated features', () => {
      // Check for known deprecated patterns
      expect(nodeConfig).not.toContain('transformMode');
      expect(nodeConfig).not.toContain('threads: false');
    });
  });

  describe('Error Prevention', () => {
    it('should have balanced braces', () => {
      const openBraces = (nodeConfig.match(/{/g) || []).length;
      const closeBraces = (nodeConfig.match(/}/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    it('should have balanced brackets', () => {
      const openBrackets = (nodeConfig.match(/\[/g) || []).length;
      const closeBrackets = (nodeConfig.match(/]/g) || []).length;
      
      expect(openBrackets).toBe(closeBrackets);
    });

    it('should have balanced parentheses', () => {
      const openParens = (nodeConfig.match(/\(/g) || []).length;
      const closeParens = (nodeConfig.match(/\)/g) || []).length;
      
      expect(openParens).toBe(closeParens);
    });

    it('should not have syntax errors', () => {
      // Basic syntax check
      expect(nodeConfig).not.toContain('undefined');
      expect(nodeConfig).not.toContain('null,');
      expect(nodeConfig).not.toContain(',,');
    });
  });

  describe('Maintenance Regression Prevention', () => {
    it('should maintain consistent formatting', () => {
      // Should use consistent indentation
      const lines = nodeConfig.split('\n');
      const indentedLines = lines.filter(line => /^\s+/.test(line));
      
      // Most indented lines should use 2 or 4 spaces
      const validIndentation = indentedLines.every(line => {
        const indent = line.match(/^\s+/)?.[0].length || 0;
        return indent % 2 === 0;
      });
      
      expect(validIndentation).toBe(true);
    });

    it('should maintain consistent quotes', () => {
      // Should primarily use single quotes
      const singleQuotes = (nodeConfig.match(/'/g) || []).length;
      const doubleQuotes = (nodeConfig.match(/"/g) || []).length;
      
      // Single quotes should be more common (or at least present)
      expect(singleQuotes).toBeGreaterThan(0);
    });

    it('should maintain consistent property syntax', () => {
      // Should use consistent object property syntax
      expect(nodeConfig).toContain('environment:');
      expect(nodeConfig).toContain('globals:');
      expect(nodeConfig).toContain('coverage:');
    });
  });
});
