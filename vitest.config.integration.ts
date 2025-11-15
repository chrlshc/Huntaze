/**
 * Vitest Configuration - Integration Tests
 * 
 * Enhanced configuration for integration tests
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/integration/setup/**',
      'tests/integration/fixtures/**',
    ],
    globals: true,
    environment: 'node',
    globalSetup: ['tests/integration/setup/global-setup.ts'],
    testTimeout: 15000, // 15 seconds per test
    hookTimeout: 30000, // 30 seconds for setup/teardown
    pool: 'forks', // Run tests in separate processes
    maxConcurrency: 4, // Parallel execution with 4 workers
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'app/api/**/*.ts',
        'lib/services/**/*.ts',
        'lib/auth/**/*.ts',
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/integration-results.json',
      html: './test-results/integration-results.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
