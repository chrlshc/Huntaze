/**
 * Vitest Configuration - Beta Launch UI System Tests
 * 
 * Ultra-optimized configuration for beta-launch-ui-system spec tests
 * Designed to minimize RAM usage and prevent IDE crashes
 */

import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';

// Load .env.test for tests
config({ path: '.env.test' });

export default defineConfig(() => ({
  plugins: [react()],
  test: {
    name: 'beta-ui-system',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.tsx'],
    // Only include beta-related tests
    include: [
      'tests/unit/beta-landing-page.test.tsx',
      'tests/unit/responsive-layout.property.test.tsx',
      'tests/unit/animation-performance.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
    ],
    // Ultra-optimized resource usage
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Single process only
      },
    },
    maxConcurrency: 1, // Run tests one at a time
    isolate: false, // Reuse context
    testTimeout: 10000, // 10 seconds max per test
    // Minimal coverage to save memory
    coverage: {
      enabled: false, // Disable coverage by default
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}));
