import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies to ensure clean state for each test
    await context.clearCookies();
  });

  test('successful login flow', async ({ page }) => {
    await page.goto('/auth');
    
    // Check we're on the login page
    await expect(page.getByText(/sign in to your account/i)).toBeVisible();
    
    // Fill in credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should see dashboard content
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in wrong credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('WrongPassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL('/auth');
  });

  test('email validation', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('TestPassword123!');
    
    // Try to submit
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
  });

  test('password validation', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in short password
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('short');
    
    // Try to submit
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/password must be at least/i)).toBeVisible();
  });

  test('forgot password link works', async ({ page }) => {
    await page.goto('/auth');
    
    // Click forgot password link
    await page.getByRole('link', { name: /forgot password/i }).click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.getByText(/reset password/i)).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page, context }) => {
    // Ensure we're not authenticated
    await context.clearCookies();
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login with next parameter
    await expect(page).toHaveURL(/\/auth\?next=.*dashboard/);
  });

  test('session persists across page reloads', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test('logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout
    await page.getByRole('button', { name: /sign out/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth');
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    
    // Should redirect back to login
    await expect(page).toHaveURL(/\/auth/);
  });
});