/**
 * Vitest Configuration for API Integration Tests
 * 
 * Specialized configuration for testing API endpoints with real HTTP requests.
 * 
 * Feature: production-critical-fixes
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'api-integration',
    
    // Test files
    include: ['tests/integration/api/**/*.integration.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/fixtures/**',
    ],
    
    // Environment
    environment: 'node',
    
    // Globals
    globals: true,
    
    // Timeouts
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    
    // Concurrency
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // Retry failed tests
    retry: 2, // Retry flaky integration tests
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration/api',
      include: [
        'app/api/csrf/token/**/*.ts',
        'lib/middleware/csrf.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    
    // Reporters
    reporters: [
      'default',
      'json',
      'html',
    ],
    
    // Output
    outputFile: {
      json: './test-results/integration-api.json',
      html: './test-results/integration-api.html',
    },
    
    // Setup files
    setupFiles: ['./tests/integration/api/setup.ts'],
    
    // Teardown
    globalSetup: './tests/integration/api/global-setup.ts',
    globalTeardown: './tests/integration/api/global-teardown.ts',
    
    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Logging
    silent: false,
    logHeapUsage: true,
    
    // Watch mode
    watch: false,
    
    // Bail on first failure (useful for CI)
    bail: process.env.CI ? 1 : 0,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/app': path.resolve(__dirname, './app'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
});
