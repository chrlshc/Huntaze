import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Workers on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: 'html',
  
  // Global test timeout
  timeout: 30000,
  
  // Global expect timeout
  expect: {
    timeout: 10000,
  },
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // Setup project for authentication state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Branded browsers
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: process.env.PLAYWRIGHT_WEB_COMMAND ?? 'npm --prefix huntaze-new run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
