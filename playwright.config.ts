import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL,
    headless: true,
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

