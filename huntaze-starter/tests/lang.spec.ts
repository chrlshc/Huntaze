import { test, expect } from '@playwright/test'

// Add/remove routes as needed
const routes = ['/', '/analytics', '/marketing/planner']

test.describe('html lang', () => {
  for (const route of routes) {
    test(`lang=en on ${route} @lang`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      const lang = await page.evaluate(() => document.documentElement.getAttribute('lang'))
      expect.soft(lang, `Missing or unexpected <html lang> on ${route}`).toBe('en')
    })
  }
})

