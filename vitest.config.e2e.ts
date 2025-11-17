import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';

// Load .env.test for tests
config({ path: '.env.test' });

export default defineConfig(() => ({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.e2e.ts'],
    include: ['tests/e2e/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    testTimeout: 120000, // 2 minutes for e2e tests
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}));
