import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { BuildValidator } from '../../../scripts/layout-cleanup/build-validator';
import { Logger } from '../../../scripts/layout-cleanup/utils/logger';

describe('BuildValidator', () => {
  const testLogDir = path.join(process.cwd(), 'tests/fixtures/build-logs');
  let validator: BuildValidator;
  let logger: Logger;

  beforeEach(async () => {
    // Create test log directory
    await fs.mkdir(testLogDir, { recursive: true });
    
    // Create logger with minimal output
    logger = new Logger(testLogDir, false);
    validator = new BuildValidator(testLogDir, logger, 100);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Error Extraction', () => {
    it('should extract TypeScript errors with file, line, and column', () => {
      const output = `
app/layout.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
app/components/Header.tsx(25,12): error TS2304: Cannot find name 'undefined'.
`;
      
      // Access private method through type assertion for testing
      const errors = (validator as any).extractErrors(output);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toMatchObject({
        file: 'app/layout.tsx',
        line: 10,
        column: 5,
        type: 'layout',
      });
      expect(errors[0].message).toContain('Type \'string\' is not assignable');
      
      expect(errors[1]).toMatchObject({
        file: 'app/components/Header.tsx',
        line: 25,
        column: 12,
        type: 'component',
      });
    });

    it('should extract Next.js build errors', () => {
      const output = `
./app/dashboard/layout.tsx:15:8 - Type error: Property 'children' does not exist
./app/api/route.ts:42:3 - Syntax error: Unexpected token
`;
      
      const errors = (validator as any).extractErrors(output);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toMatchObject({
        file: './app/dashboard/layout.tsx',
        line: 15,
        column: 8,
        type: 'layout',
      });
      expect(errors[0].message).toContain('Property \'children\' does not exist');
    });

    it('should categorize layout errors correctly', () => {
      const output = `
app/(app)/analytics/layout.tsx(5,10): error TS2322: Type error in layout
app/components/Button.tsx(12,3): error TS2304: Component error
app/types/index.ts(8,1): error TS2307: Type definition error
app/utils/helper.ts(20,5): error TS2345: Other error
`;
      
      const errors = (validator as any).extractErrors(output);

      expect(errors).toHaveLength(4);
      expect(errors[0].type).toBe('layout');
      expect(errors[1].type).toBe('component');
      expect(errors[2].type).toBe('type');
      expect(errors[3].type).toBe('other');
    });

    it('should handle generic error messages', () => {
      const output = `
Error: Failed to compile app/layout.tsx
Build failed due to errors in app/components/Sidebar.tsx
`;
      
      const errors = (validator as any).extractErrors(output);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.file.includes('layout.tsx'))).toBe(true);
    });

    it('should handle empty output', () => {
      const output = '';
      
      const errors = (validator as any).extractErrors(output);

      expect(errors).toHaveLength(0);
    });

    it('should handle output with no errors', () => {
      const output = `
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
`;
      
      const errors = (validator as any).extractErrors(output);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Warning Extraction', () => {
    it('should extract and count warnings', () => {
      const output = `
warning: Fast Refresh had to perform a full reload
warning: Fast Refresh had to perform a full reload
warning: Deprecated API usage detected
`;
      
      const warnings = (validator as any).extractWarnings(output);

      expect(warnings).toHaveLength(2);
      
      const fastRefreshWarning = warnings.find(w => w.message.includes('Fast Refresh'));
      expect(fastRefreshWarning).toBeDefined();
      expect(fastRefreshWarning?.count).toBe(2);
      
      const deprecatedWarning = warnings.find(w => w.message.includes('Deprecated'));
      expect(deprecatedWarning).toBeDefined();
      expect(deprecatedWarning?.count).toBe(1);
    });

    it('should handle warnings with different formats', () => {
      const output = `
Warning: React does not recognize prop
warning: Module not found
WARNING: Build optimization disabled
`;
      
      const warnings = (validator as any).extractWarnings(output);

      expect(warnings.length).toBeGreaterThanOrEqual(2);
      expect(warnings.some(w => w.message.includes('React') || w.message.includes('Module') || w.message.includes('Build'))).toBe(true);
    });

    it('should remove ANSI color codes from warnings', () => {
      const output = `
\x1b[33mwarning:\x1b[0m This is a colored warning
`;
      
      const warnings = (validator as any).extractWarnings(output);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).not.toContain('\x1b');
      expect(warnings[0].message).toContain('This is a colored warning');
    });

    it('should handle empty output', () => {
      const output = '';
      
      const warnings = (validator as any).extractWarnings(output);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('Stats Extraction', () => {
    it('should extract route statistics', () => {
      const output = `
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /about                               3.1 kB         93.2 kB
├ λ /dashboard                           8.5 kB        102.6 kB
├ λ /api/users                           2.3 kB         90.4 kB
└ ƒ /edge-function                       1.2 kB         89.3 kB
`;
      
      const stats = (validator as any).extractStats(output);

      expect(stats.routes).toBe(5);
      expect(stats.staticPages).toBe(2);
      expect(stats.serverPages).toBe(2);
      expect(stats.edgePages).toBe(1);
    });

    it('should extract page count', () => {
      const output = `
✓ Compiled successfully
✓ Generating static pages (45/45)
✓ Finalizing page optimization
`;
      
      const stats = (validator as any).extractStats(output);

      expect(stats.pages).toBe(45);
    });

    it('should extract bundle size in MB', () => {
      const output = `
First Load JS shared by all              85.2 kB
Total bundle size                        2.4 MB
`;
      
      const stats = (validator as any).extractStats(output);

      expect(stats.bundleSize).toBeGreaterThan(0);
      expect(stats.bundleSize).toBeCloseTo(2.4, 1);
    });

    it('should extract bundle size in KB and convert to MB', () => {
      const output = `
Total bundle size                        512 KB
`;
      
      const stats = (validator as any).extractStats(output);

      expect(stats.bundleSize).toBeCloseTo(0.5, 1);
    });

    it('should handle output with no stats', () => {
      const output = 'Build failed';
      
      const stats = (validator as any).extractStats(output);

      expect(stats).toMatchObject({
        pages: 0,
        routes: 0,
        staticPages: 0,
        serverPages: 0,
        edgePages: 0,
        bundleSize: 0,
      });
    });

    it('should use routes as pages if pages not found', () => {
      const output = `
Route (app)
┌ ○ /page1
├ ○ /page2
└ λ /page3
`;
      
      const stats = (validator as any).extractStats(output);

      expect(stats.routes).toBe(3);
      expect(stats.pages).toBe(3);
    });
  });

  describe('Output Parsing', () => {
    it('should parse successful build output', () => {
      const stdout = `
✓ Compiled successfully
Route (app)
┌ ○ /                                    5.2 kB         95.3 kB
└ λ /dashboard                           8.5 kB        102.6 kB
Total bundle size                        2.4 MB
`;
      const stderr = '';
      
      const result = (validator as any).parseOutput(stdout, stderr, 45.2, true);

      expect(result.success).toBe(true);
      expect(result.duration).toBe(45.2);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.routes).toBe(2);
      expect(result.timestamp).toBeDefined();
    });

    it('should parse failed build output', () => {
      const stdout = `
Failed to compile
`;
      const stderr = `
app/layout.tsx(10,5): error TS2322: Type error
`;
      
      const result = (validator as any).parseOutput(stdout, stderr, 12.5, false);

      expect(result.success).toBe(false);
      expect(result.duration).toBe(12.5);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should combine stdout and stderr for error extraction', () => {
      const stdout = 'Build output';
      const stderr = 'app/layout.tsx(5,1): error TS2322: Error message';
      
      const result = (validator as any).parseOutput(stdout, stderr, 10, false);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.stdout).toBe(stdout);
      expect(result.stderr).toBe(stderr);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize layout errors', () => {
      const type = (validator as any).categorizeError(
        'app/dashboard/layout.tsx',
        'Type error in layout component'
      );

      expect(type).toBe('layout');
    });

    it('should categorize type errors', () => {
      const type = (validator as any).categorizeError(
        'app/utils/helper.ts',
        'TypeScript type mismatch error'
      );

      expect(type).toBe('type');
    });

    it('should categorize component errors', () => {
      const type = (validator as any).categorizeError(
        'app/components/Button.tsx',
        'Component rendering error'
      );

      expect(type).toBe('component');
    });

    it('should categorize other errors', () => {
      const type = (validator as any).categorizeError(
        'app/utils/api.ts',
        'Network request failed'
      );

      expect(type).toBe('other');
    });

    it('should prioritize layout categorization', () => {
      const type = (validator as any).categorizeError(
        'app/layout.tsx',
        'Type error in component'
      );

      expect(type).toBe('layout');
    });
  });

  describe('Logging System', () => {
    it('should create log directory on initialization', async () => {
      await validator.getLogger().initialize();

      const exists = await fs.access(testLogDir)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should return correct log directory path', () => {
      const logDir = validator.getLogDir();

      expect(logDir).toBe(testLogDir);
    });

    it('should provide access to logger instance', () => {
      const loggerInstance = validator.getLogger();

      expect(loggerInstance).toBeDefined();
      expect(loggerInstance).toBeInstanceOf(Logger);
    });
  });

  describe('Build Result Structure', () => {
    it('should create valid BuildResult structure', () => {
      const stdout = 'Build output';
      const stderr = '';
      
      const result = (validator as any).parseOutput(stdout, stderr, 30, true);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('stdout');
      expect(result).toHaveProperty('stderr');

      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.duration).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should include all required stats fields', () => {
      const stdout = '';
      const stderr = '';
      
      const result = (validator as any).parseOutput(stdout, stderr, 10, true);

      expect(result.stats).toHaveProperty('pages');
      expect(result.stats).toHaveProperty('routes');
      expect(result.stats).toHaveProperty('staticPages');
      expect(result.stats).toHaveProperty('serverPages');
      expect(result.stats).toHaveProperty('edgePages');
      expect(result.stats).toHaveProperty('bundleSize');

      expect(typeof result.stats.pages).toBe('number');
      expect(typeof result.stats.routes).toBe('number');
      expect(typeof result.stats.staticPages).toBe('number');
      expect(typeof result.stats.serverPages).toBe('number');
      expect(typeof result.stats.edgePages).toBe('number');
      expect(typeof result.stats.bundleSize).toBe('number');
    });

    it('should include error details with all required fields', () => {
      const output = 'app/layout.tsx(10,5): error TS2322: Type error message';
      
      const errors = (validator as any).extractErrors(output);

      expect(errors.length).toBeGreaterThan(0);
      
      const error = errors[0];
      expect(error).toHaveProperty('file');
      expect(error).toHaveProperty('line');
      expect(error).toHaveProperty('column');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('type');

      expect(typeof error.file).toBe('string');
      expect(typeof error.line).toBe('number');
      expect(typeof error.column).toBe('number');
      expect(typeof error.message).toBe('string');
      expect(['layout', 'component', 'type', 'other']).toContain(error.type);
    });

    it('should include warning details with all required fields', () => {
      const output = 'warning: Test warning message';
      
      const warnings = (validator as any).extractWarnings(output);

      expect(warnings.length).toBeGreaterThan(0);
      
      const warning = warnings[0];
      expect(warning).toHaveProperty('message');
      expect(warning).toHaveProperty('count');

      expect(typeof warning.message).toBe('string');
      expect(typeof warning.count).toBe('number');
      expect(warning.count).toBeGreaterThan(0);
    });
  });

  describe('Complex Build Output', () => {
    it('should handle real-world Next.js build output', () => {
      const output = `
> next build

   ▲ Next.js 14.0.0

   Creating an optimized production build ...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (127/127)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /about                               3.1 kB         93.2 kB
├ ○ /pricing                             4.5 kB         94.6 kB
├ λ /dashboard                           8.5 kB        102.6 kB
├ λ /api/users                           2.3 kB         90.4 kB
└ ƒ /edge-function                       1.2 kB         89.3 kB

○  (Static)  prerendered as static content
λ  (Server)  server-side renders at runtime
ƒ  (Dynamic) server-side renders at runtime

First Load JS shared by all              85.2 kB
  ├ chunks/framework.js                  45.2 kB
  ├ chunks/main.js                       32.1 kB
  └ chunks/webpack.js                     7.9 kB

warning: Fast Refresh had to perform a full reload
warning: Fast Refresh had to perform a full reload

✓ Build completed in 45.2s
`;
      
      const result = (validator as any).parseOutput(output, '', 45.2, true);

      expect(result.success).toBe(true);
      expect(result.stats.routes).toBe(6);
      expect(result.stats.staticPages).toBe(3);
      expect(result.stats.serverPages).toBe(2);
      expect(result.stats.edgePages).toBe(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle build output with multiple error types', () => {
      const output = `
Failed to compile.

app/layout.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'
app/components/Header.tsx(25,12): error TS2304: Cannot find name 'undefined'
./app/dashboard/layout.tsx:15:8 - Type error: Property 'children' does not exist
app/types/index.ts(8,1): error TS2307: Cannot find module '@/utils/helper'

Build failed with 4 errors
`;
      
      const errors = (validator as any).extractErrors(output);

      expect(errors.length).toBeGreaterThanOrEqual(4);
      
      const layoutErrors = errors.filter(e => e.type === 'layout');
      expect(layoutErrors.length).toBeGreaterThan(0);
      
      const typeErrors = errors.filter(e => e.type === 'type');
      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });
});
