/**
 * Smoke test: login -> home -> key action
 *
 * Requires E2E_TESTING=1 on the Next.js server so credentials login is accepted.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_TEST_EMAIL || 'e2e@huntaze.test';
const PASSWORD = process.env.E2E_TEST_PASSWORD || 'password123';

test.describe('Auth smoke flow', () => {
  test.skip(!process.env.E2E_TESTING, 'Requires E2E_TESTING=1 to enable credentials login.');

  test('login and navigate to a primary action', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    await page.fill('input#email', EMAIL);
    await page.fill('input#password', PASSWORD);

    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/home/);

    const integrationsCta = page.getByRole('button', { name: /go to integrations/i });
    if (await integrationsCta.count()) {
      await integrationsCta.click();
      await expect(page).toHaveURL(/\/integrations/);
      return;
    }

    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    await analyticsLink.first().click();
    await expect(page).toHaveURL(/\/analytics/);
  });
});
