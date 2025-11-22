/**
 * Vitest Configuration - End-to-End Tests
 * 
 * Configuration for comprehensive E2E tests of the AI system
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'e2e',
    include: ['tests/integration/e2e/**/*.e2e.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
    ],
    globals: true,
    environment: 'node',
    globalSetup: ['tests/integration/setup/global-setup.ts'],
    setupFiles: ['./vitest.setup.integration.ts'],
    testTimeout: 120000, // 2 minutes per test (E2E tests can be slow)
    hookTimeout: 120000, // 2 minutes for setup/teardown
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single process to reduce memory
      },
    },
    maxConcurrency: 1, // Sequential execution to avoid conflicts
    isolate: false, // Reuse same context to save memory
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'app/api/ai/**/*.ts',
        'lib/ai/**/*.ts',
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.examples.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/e2e-results.json',
      html: './test-results/e2e-results.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
