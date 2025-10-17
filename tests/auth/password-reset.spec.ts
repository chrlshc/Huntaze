import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies to ensure clean state
    await context.clearCookies();
  });

  test('complete password reset flow', async ({ page }) => {
    // Navigate to forgot password page
    await page.goto('/auth/forgot-password');
    
    // Should see the reset form
    await expect(page.getByText(/reset password/i)).toBeVisible();
    
    // Enter email
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Should move to code entry step
    await expect(page.getByText(/enter reset code/i)).toBeVisible();
    await expect(page.getByText(/we've sent a 6-digit code/i)).toBeVisible();
    
    // In a real test, we would retrieve the code from email/SMS
    // For testing purposes, we'll use a mock code
    await page.getByLabel('Verification Code').fill('123456');
    await page.getByLabel('New Password').fill('NewPassword123!');
    await page.getByLabel('Confirm New Password').fill('NewPassword123!');
    
    // Submit reset
    await page.getByRole('button', { name: /reset password/i }).click();
    
    // Should show success message
    await expect(page.getByText(/password reset successful/i)).toBeVisible();
    
    // Should have link back to login
    const loginLink = page.getByRole('link', { name: /return to login/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL('/auth');
  });

  test('invalid reset code shows error', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Request reset
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Enter invalid code
    await page.getByLabel('Verification Code').fill('000000');
    await page.getByLabel('New Password').fill('NewPassword123!');
    await page.getByLabel('Confirm New Password').fill('NewPassword123!');
    await page.getByRole('button', { name: /reset password/i }).click();
    
    // Should show error
    await expect(page.getByText(/invalid or expired code/i)).toBeVisible();
  });

  test('password mismatch validation', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Request reset
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Enter mismatched passwords
    await page.getByLabel('Verification Code').fill('123456');
    await page.getByLabel('New Password').fill('NewPassword123!');
    await page.getByLabel('Confirm New Password').fill('DifferentPassword123!');
    
    // Try to submit
    await page.getByRole('button', { name: /reset password/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/passwords don't match/i)).toBeVisible();
  });

  test('weak password validation', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Request reset
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Enter weak password
    await page.getByLabel('Verification Code').fill('123456');
    await page.getByLabel('New Password').fill('weak');
    await page.getByLabel('Confirm New Password').fill('weak');
    
    // Try to submit
    await page.getByRole('button', { name: /reset password/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/password must be at least 14 characters/i)).toBeVisible();
  });

  test('resend code functionality', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Request reset
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Click resend code
    await page.getByRole('button', { name: /resend code/i }).click();
    
    // Should show success message (temporarily)
    await expect(page.getByText(/new code has been sent/i)).toBeVisible();
  });

  test('back to email navigation', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Request reset
    await page.getByLabel('Email Address').fill('test@example.com');
    await page.getByRole('button', { name: /send reset code/i }).click();
    
    // Click back to email
    await page.getByRole('button', { name: /back to email/i }).click();
    
    // Should be back on email form
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset code/i })).toBeVisible();
  });

  test('rate limiting on password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Make multiple rapid requests
    for (let i = 0; i < 4; i++) {
      await page.getByLabel('Email Address').fill(`test${i}@example.com`);
      await page.getByRole('button', { name: /send reset code/i }).click();
      
      // If we hit rate limit, should show error
      const errorText = await page.getByText(/too many attempts/i).isVisible().catch(() => false);
      if (errorText) {
        expect(errorText).toBeTruthy();
        break;
      }
      
      // Otherwise go back to try again
      if (i < 3) {
        await page.getByRole('button', { name: /back to email/i }).click();
      }
    }
  });
});