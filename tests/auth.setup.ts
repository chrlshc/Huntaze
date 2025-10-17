import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  const response = await page.goto('/auth/signin');
  expect(response, 'Navigation returned no response for /auth/signin').toBeTruthy();
  expect(response!.status(), 'Non-success status code when loading /auth/signin').toBeLessThan(400);

  // Web-first assertions before interacting with the page
  await expect(page).toHaveURL(/\/auth\/signin$/i);
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText(/sign in/i);

  const email = page.getByLabel(/email/i);
  const password = page.getByLabel(/password/i);

  await expect(email).toBeVisible();
  await expect(password).toBeVisible();

  // Fill in credentials
  await email.fill(process.env.TEST_USER_EMAIL ?? 'test@example.com');
  await password.fill(process.env.TEST_USER_PASSWORD ?? 'TestPassword123!');

  // Click login button
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard - indicates successful login
  await expect(page).toHaveURL('/dashboard', { timeout: 10_000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
