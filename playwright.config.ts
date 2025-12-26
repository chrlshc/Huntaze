import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL
  ?? process.env.STAGING_DATABASE_URL
  ?? process.env.DATABASE_URL;
const webServerEnv = {
  ...process.env,
  DATABASE_URL: e2eDatabaseUrl ?? '',
  API_MODE: process.env.API_MODE ?? 'real',
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE ?? process.env.API_MODE ?? 'real',
  E2E_TESTING: process.env.E2E_TESTING ?? '1',
  E2E_TEST_USER_ID: process.env.E2E_TEST_USER_ID ?? '1',
  E2E_TEST_EMAIL: process.env.E2E_TEST_EMAIL ?? 'e2e@huntaze.test',
  E2E_TEST_PASSWORD: process.env.E2E_TEST_PASSWORD ?? 'password123',
} as Record<string, string>;

export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'line',
  
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Visual regression test settings
  expect: {
    toHaveScreenshot: {
      // Maximum pixel difference threshold
      maxDiffPixels: 100,
      // Threshold for pixel color difference (0-1)
      threshold: 0.2,
      // Animations should be disabled for consistent screenshots
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Ensure consistent rendering
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        deviceScaleFactor: 1,
      },
    },
  ],

  // Web server configuration for local testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    env: webServerEnv,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
