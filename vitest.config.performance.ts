import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: fs.existsSync('.env.test') ? '.env.test' : '.env.test.example' });

export default defineConfig({
  test: {
    name: 'performance',
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/performance/**/*.test.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    maxConcurrency: 1,
    isolate: false,
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
});
