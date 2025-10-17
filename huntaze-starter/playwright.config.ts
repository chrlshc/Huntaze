import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
}

export default config

