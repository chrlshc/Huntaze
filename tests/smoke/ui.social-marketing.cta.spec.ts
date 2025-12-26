import { test, expect } from '@playwright/test'

test('Social Marketing CTAs route correctly', async ({ page }) => {
  await page.goto('/social-marketing')

  await expect(page.locator('a[aria-label="Connect Instagram"]')).toHaveAttribute('href', /\/auth\/instagram$/)
  await expect(page.locator('a[aria-label="Connect TikTok"]')).toHaveAttribute('href', /\/auth\/tiktok$/)
  await expect(page.locator('a[aria-label="Connect Reddit"]')).toHaveAttribute('href', /\/auth\/reddit$/)

  const planCta = page.locator('a:has-text("Plan my next campaign")')
  await expect(planCta).toHaveAttribute('href', /\/campaigns\/new$/)
})

