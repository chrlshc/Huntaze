import { test, expect } from '@playwright/test'

test('OnlyFans Assisted CTAs route to app.huntaze.com paths', async ({ page }) => {
  await page.goto('/onlyfans-assisted')

  // 3 graph cards should expose Connect buttons to the OF connect flow
  const nodes = ['Smart replies', 'Mass messaging', 'Compliance']
  for (const title of nodes) {
    const a = page.locator(`a[aria-label="Connect ${title}"]`)
    await expect(a, `Missing Connect for ${title}`).toHaveAttribute('href', /\/platforms\/connect\/onlyfans$/)
  }

  // Section CTA points to the same OF connect flow
  const sectionCta = page.locator('a:has-text("Customize assistant flows")')
  await expect(sectionCta).toHaveAttribute('href', /\/platforms\/connect\/onlyfans$/)
})

