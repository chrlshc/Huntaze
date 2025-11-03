import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    exclude: [
      'tests/smoke/**',
      'node_modules/**',
      'dist/**',
      '.next/**'
    ],
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './')
    },
    // Use different environments for different test types
    environmentMatchGlobs: [
      ['tests/unit/dependencies/dependency-validation.test.ts', 'node'],
      ['tests/unit/dependencies/threejs-components.test.tsx', 'jsdom'],
      ['tests/**/*.test.{ts,tsx}', 'jsdom']
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './')
    }
  }
});