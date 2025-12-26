import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';
import fs from 'fs';

// Load .env.test for tests
config({ path: fs.existsSync('.env.test') ? '.env.test' : '.env.test.example' });

export default defineConfig(() => ({
  plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.vitest.json'] })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts', './tests/setup.tsx'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    // Optimize resource usage
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single process to reduce memory
      },
    },
    maxConcurrency: 2, // Limit concurrent tests
    isolate: false, // Reuse same context to save memory
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/.next',
      ],
    },
  },
}));
