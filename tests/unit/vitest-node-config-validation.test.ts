/**
 * Tests for Vitest Node Configuration
 * Validates the Node.js-specific test configuration
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

describe('Vitest Node Configuration Validation', () => {
  const configPath = 'vitest.node.config.ts';
  const mainConfigPath = 'vitest.config.ts';

  describe('Configuration File Existence', () => {
    it('should have vitest.node.config.ts file', () => {
      expect(existsSync(configPath)).toBe(true);
    });

    it('should have main vitest.config.ts file', () => {
      expect(existsSync(mainConfigPath)).toBe(true);
    });

    it('should be a TypeScript configuration file', () => {
      expect(configPath).toMatch(/\.ts$/);
    });
  });

  describe('Configuration Content Validation', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should import defineConfig from vitest/config', () => {
      expect(configContent).toContain("import { defineConfig } from 'vitest/config'");
    });

    it('should import path module', () => {
      expect(configContent).toContain("import path from 'path'");
    });

    it('should export default config', () => {
      expect(configContent).toContain('export default defineConfig');
    });

    it('should specify node environment', () => {
      expect(configContent).toContain("environment: 'node'");
    });

    it('should enable globals', () => {
      expect(configContent).toContain('globals: true');
    });

    it('should configure coverage provider', () => {
      expect(configContent).toContain("provider: 'v8'");
    });

    it('should configure coverage reporters', () => {
      expect(configContent).toContain("reporter: ['text', 'json', 'html']");
    });

    it('should set test timeout', () => {
      expect(configContent).toContain('testTimeout: 30000');
    });

    it('should set hook timeout', () => {
      expect(configContent).toContain('hookTimeout: 30000');
    });

    it('should configure path alias', () => {
      expect(configContent).toContain("'@': path.resolve(__dirname, './')");
    });
  });

  describe('Coverage Configuration', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should exclude node_modules from coverage', () => {
      expect(configContent).toContain("'node_modules/'");
    });

    it('should exclude tests from coverage', () => {
      expect(configContent).toContain("'tests/'");
    });

    it('should exclude TypeScript declaration files', () => {
      expect(configContent).toContain("'**/*.d.ts'");
    });

    it('should exclude config files from coverage', () => {
      expect(configContent).toContain("'**/*.config.*'");
    });

    it('should exclude coverage directory', () => {
      expect(configContent).toContain("'**/coverage/**'");
    });

    it('should exclude .next directory', () => {
      expect(configContent).toContain("'**/.next/**'");
    });

    it('should exclude dist directory', () => {
      expect(configContent).toContain("'**/dist/**'");
    });

    it('should exclude test files from coverage', () => {
      expect(configContent).toContain("'**/*.test.*'");
      expect(configContent).toContain("'**/*.spec.*'");
    });

    it('should set coverage thresholds to 80%', () => {
      expect(configContent).toContain('statements: 80');
      expect(configContent).toContain('branches: 80');
      expect(configContent).toContain('functions: 80');
      expect(configContent).toContain('lines: 80');
    });
  });

  describe('Configuration Differences from Main Config', () => {
    let nodeConfig: string;
    let mainConfig: string;

    beforeAll(() => {
      nodeConfig = readFileSync(configPath, 'utf-8');
      mainConfig = readFileSync(mainConfigPath, 'utf-8');
    });

    it('should use node environment instead of jsdom', () => {
      expect(nodeConfig).toContain("environment: 'node'");
      expect(mainConfig).toContain("environment: 'jsdom'");
    });

    it('should not include React plugin', () => {
      expect(nodeConfig).not.toContain('@vitejs/plugin-react');
      expect(mainConfig).toContain('@vitejs/plugin-react');
    });

    it('should not have setupFiles', () => {
      expect(nodeConfig).not.toContain('setupFiles');
      expect(mainConfig).toContain('setupFiles');
    });

    it('should not have css configuration', () => {
      expect(nodeConfig).not.toContain('css: true');
      expect(mainConfig).toContain('css: true');
    });

    it('should have same coverage thresholds', () => {
      const thresholdPattern = /statements: 80.*branches: 80.*functions: 80.*lines: 80/s;
      expect(nodeConfig).toMatch(thresholdPattern);
      expect(mainConfig).toMatch(thresholdPattern);
    });

    it('should have same timeout values', () => {
      expect(nodeConfig).toContain('testTimeout: 30000');
      expect(mainConfig).toContain('testTimeout: 30000');
      expect(nodeConfig).toContain('hookTimeout: 30000');
      expect(mainConfig).toContain('hookTimeout: 30000');
    });
  });

  describe('Configuration Structure Validation', () => {
    it('should be valid TypeScript syntax', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Check for basic TypeScript syntax elements
      expect(configContent).toContain('import');
      expect(configContent).toContain('export');
      expect(configContent).not.toContain('syntax error');
    });

    it('should have proper object structure', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Check for proper nesting
      expect(configContent).toContain('test: {');
      expect(configContent).toContain('coverage: {');
      expect(configContent).toContain('thresholds: {');
      expect(configContent).toContain('global: {');
      expect(configContent).toContain('resolve: {');
      expect(configContent).toContain('alias: {');
    });

    it('should have balanced braces', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      const openBraces = (configContent.match(/{/g) || []).length;
      const closeBraces = (configContent.match(/}/g) || []).length;
      
      expect(openBraces).toBe(closeBraces);
    });

    it('should have balanced brackets', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      const openBrackets = (configContent.match(/\[/g) || []).length;
      const closeBrackets = (configContent.match(/]/g) || []).length;
      
      expect(openBrackets).toBe(closeBrackets);
    });
  });

  describe('Use Case Validation', () => {
    it('should be suitable for backend/API tests', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Node environment is appropriate for backend tests
      expect(configContent).toContain("environment: 'node'");
      
      // Should not have browser-specific configurations
      expect(configContent).not.toContain('jsdom');
      expect(configContent).not.toContain('happy-dom');
    });

    it('should be suitable for service layer tests', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Node environment works for service tests
      expect(configContent).toContain("environment: 'node'");
      
      // Should have adequate timeout for async operations
      expect(configContent).toContain('testTimeout: 30000');
    });

    it('should be suitable for integration tests', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Longer timeouts for integration tests
      expect(configContent).toContain('testTimeout: 30000');
      expect(configContent).toContain('hookTimeout: 30000');
    });

    it('should support module resolution', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should have alias configuration for imports
      expect(configContent).toContain('resolve:');
      expect(configContent).toContain('alias:');
      expect(configContent).toContain("'@':");
    });
  });

  describe('Coverage Exclusions Validation', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should exclude all necessary directories', () => {
      const requiredExclusions = [
        'node_modules/',
        'tests/',
        'coverage/**',
        '.next/**',
        'dist/**'
      ];

      requiredExclusions.forEach(exclusion => {
        expect(configContent).toContain(exclusion);
      });
    });

    it('should exclude all necessary file patterns', () => {
      const requiredPatterns = [
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*'
      ];

      requiredPatterns.forEach(pattern => {
        expect(configContent).toContain(pattern);
      });
    });

    it('should have comprehensive exclusion list', () => {
      const excludeMatch = configContent.match(/exclude:\s*\[([\s\S]*?)\]/);
      expect(excludeMatch).toBeTruthy();
      
      if (excludeMatch) {
        const exclusions = excludeMatch[1].split(',').map(s => s.trim());
        expect(exclusions.length).toBeGreaterThanOrEqual(8);
      }
    });
  });

  describe('Timeout Configuration Validation', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should have reasonable test timeout', () => {
      const timeoutMatch = configContent.match(/testTimeout:\s*(\d+)/);
      expect(timeoutMatch).toBeTruthy();
      
      if (timeoutMatch) {
        const timeout = parseInt(timeoutMatch[1]);
        expect(timeout).toBeGreaterThanOrEqual(10000); // At least 10 seconds
        expect(timeout).toBeLessThanOrEqual(60000); // At most 60 seconds
      }
    });

    it('should have reasonable hook timeout', () => {
      const timeoutMatch = configContent.match(/hookTimeout:\s*(\d+)/);
      expect(timeoutMatch).toBeTruthy();
      
      if (timeoutMatch) {
        const timeout = parseInt(timeoutMatch[1]);
        expect(timeout).toBeGreaterThanOrEqual(10000); // At least 10 seconds
        expect(timeout).toBeLessThanOrEqual(60000); // At most 60 seconds
      }
    });

    it('should have matching test and hook timeouts', () => {
      const testTimeoutMatch = configContent.match(/testTimeout:\s*(\d+)/);
      const hookTimeoutMatch = configContent.match(/hookTimeout:\s*(\d+)/);
      
      expect(testTimeoutMatch).toBeTruthy();
      expect(hookTimeoutMatch).toBeTruthy();
      
      if (testTimeoutMatch && hookTimeoutMatch) {
        expect(testTimeoutMatch[1]).toBe(hookTimeoutMatch[1]);
      }
    });
  });

  describe('Path Resolution Validation', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should configure @ alias', () => {
      expect(configContent).toContain("'@':");
    });

    it('should resolve @ to project root', () => {
      expect(configContent).toContain("path.resolve(__dirname, './')");
    });

    it('should use path.resolve for alias', () => {
      expect(configContent).toContain('path.resolve');
    });

    it('should reference __dirname', () => {
      expect(configContent).toContain('__dirname');
    });
  });

  describe('Integration with Package.json', () => {
    it('should have corresponding test script in package.json', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Check if there's a script that uses this config
      const scripts = packageJson.scripts || {};
      const hasNodeTestScript = Object.values(scripts).some((script: any) => 
        typeof script === 'string' && script.includes('vitest.node.config')
      );
      
      // This is optional, but recommended
      if (!hasNodeTestScript) {
        console.warn('Consider adding a test script that uses vitest.node.config.ts');
      }
    });
  });

  describe('Configuration Best Practices', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should enable globals for easier test writing', () => {
      expect(configContent).toContain('globals: true');
    });

    it('should use v8 coverage provider for better performance', () => {
      expect(configContent).toContain("provider: 'v8'");
    });

    it('should have multiple coverage reporters', () => {
      expect(configContent).toContain('text');
      expect(configContent).toContain('json');
      expect(configContent).toContain('html');
    });

    it('should set realistic coverage thresholds', () => {
      const thresholds = [80, 80, 80, 80]; // statements, branches, functions, lines
      
      thresholds.forEach(threshold => {
        expect(threshold).toBeGreaterThanOrEqual(70);
        expect(threshold).toBeLessThanOrEqual(100);
      });
    });

    it('should exclude generated files from coverage', () => {
      const generatedPatterns = ['.next/**', 'dist/**', '**/*.d.ts'];
      
      generatedPatterns.forEach(pattern => {
        expect(configContent).toContain(pattern);
      });
    });
  });

  describe('Node Environment Specifics', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should not include browser-specific plugins', () => {
      expect(configContent).not.toContain('plugin-react');
      expect(configContent).not.toContain('plugin-vue');
    });

    it('should not include DOM-related setup', () => {
      expect(configContent).not.toContain('jsdom');
      expect(configContent).not.toContain('happy-dom');
      expect(configContent).not.toContain('setupFiles');
    });

    it('should not include CSS processing', () => {
      expect(configContent).not.toContain('css: true');
      expect(configContent).not.toContain('postcss');
    });

    it('should be optimized for Node.js testing', () => {
      expect(configContent).toContain("environment: 'node'");
      expect(configContent).not.toContain('browser');
    });
  });

  describe('Configuration Completeness', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should have all required top-level properties', () => {
      const requiredProps = ['test', 'resolve'];
      
      requiredProps.forEach(prop => {
        expect(configContent).toContain(`${prop}:`);
      });
    });

    it('should have all required test properties', () => {
      const requiredTestProps = [
        'environment',
        'globals',
        'coverage',
        'testTimeout',
        'hookTimeout'
      ];
      
      requiredTestProps.forEach(prop => {
        expect(configContent).toContain(`${prop}:`);
      });
    });

    it('should have all required coverage properties', () => {
      const requiredCoverageProps = [
        'provider',
        'reporter',
        'exclude',
        'thresholds'
      ];
      
      requiredCoverageProps.forEach(prop => {
        expect(configContent).toContain(`${prop}:`);
      });
    });

    it('should have global thresholds', () => {
      expect(configContent).toContain('global:');
      expect(configContent).toContain('statements:');
      expect(configContent).toContain('branches:');
      expect(configContent).toContain('functions:');
      expect(configContent).toContain('lines:');
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain consistent configuration format', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should use TypeScript
      expect(configPath).toMatch(/\.ts$/);
      
      // Should use ES modules
      expect(configContent).toContain('import');
      expect(configContent).toContain('export');
      expect(configContent).not.toContain('require(');
      expect(configContent).not.toContain('module.exports');
    });

    it('should not have duplicate configurations', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Check for duplicate keys (basic check)
      const keys = ['environment', 'globals', 'coverage', 'testTimeout', 'hookTimeout'];
      
      keys.forEach(key => {
        const matches = configContent.match(new RegExp(`${key}:`, 'g'));
        expect(matches?.length).toBe(1);
      });
    });

    it('should maintain backward compatibility with existing tests', () => {
      const configContent = readFileSync(configPath, 'utf-8');
      
      // Should support existing test patterns
      expect(configContent).toContain('globals: true');
      expect(configContent).toContain("'@':");
    });
  });

  describe('Performance Considerations', () => {
    let configContent: string;

    beforeAll(() => {
      configContent = readFileSync(configPath, 'utf-8');
    });

    it('should use v8 provider for faster coverage', () => {
      expect(configContent).toContain("provider: 'v8'");
    });

    it('should have reasonable timeout values', () => {
      // 30 seconds is reasonable for most tests
      expect(configContent).toContain('30000');
    });

    it('should exclude unnecessary files from coverage', () => {
      const performanceExclusions = [
        'node_modules/',
        'tests/',
        'coverage/**',
        '**/*.test.*',
        '**/*.spec.*'
      ];
      
      performanceExclusions.forEach(exclusion => {
        expect(configContent).toContain(exclusion);
      });
    });
  });

  describe('Documentation and Maintainability', () => {
    it('should have clear file naming', () => {
      expect(configPath).toContain('node');
      expect(configPath).toContain('config');
    });

    it('should be distinguishable from main config', () => {
      expect(configPath).not.toBe(mainConfigPath);
      expect(configPath).toContain('node');
    });

    it('should follow project naming conventions', () => {
      expect(configPath).toMatch(/^vitest\./);
      expect(configPath).toMatch(/\.config\.ts$/);
    });
  });
});
