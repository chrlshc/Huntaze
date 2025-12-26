import { test, expect } from '@playwright/test'

test('Home quick CTAs and graph links are wired', async ({ page }) => {
  await page.goto('/home')

  await expect(page.locator('a:has-text("Connect Analytics")')).toHaveAttribute('href', /\/analytics$/)
  await expect(page.locator('a:has-text("Open Queue")')).toHaveAttribute('href', /\/dashboard\/onlyfans$/)

  await expect(page.locator('a[aria-label="Connect Campaigns"]')).toHaveAttribute('href', /\/campaigns$/)
  await expect(page.locator('a[aria-label="Connect Payments"]')).toHaveAttribute('href', /\/billing$/)
})

