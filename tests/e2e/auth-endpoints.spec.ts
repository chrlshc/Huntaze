import { test, expect } from '@playwright/test';
import { cleanupDatabase, seedTestData } from '../setup/database-helpers';

test.describe('Authentication Endpoints E2E', () => {
  test.beforeEach(async () => {
    await cleanupDatabase();
  });

  test.afterEach(async () => {
    await cleanupDatabase();
  });

  test.describe('Signup Flow', () => {
    test('should complete signup flow with form validation', async ({ page }) => {
      await page.goto('/signup');

      // Test form validation
      await page.click('[data-testid="signup-submit"]');
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

      // Fill form with invalid data
      await page.fill('[data-testid="name-input"]', 'A'); // Too short
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'weak'); // Too weak
      await page.click('[data-testid="signup-submit"]');

      await expect(page.locator('[data-testid="name-error"]')).toContainText('at least 2 characters');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('at least 8 characters');

      // Fill form with valid data
      await page.fill('[data-testid="name-input"]', 'John Doe');
      await page.fill('[data-testid="email-input"]', 'john@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123');
      await page.check('[data-testid="terms-checkbox"]');

      // Intercept signup API call
      const signupPromise = page.waitForResponse('/api/auth/signup');
      await page.click('[data-testid="signup-submit"]');
      const signupResponse = await signupPromise;

      expect(signupResponse.status()).toBe(201);

      // Should redirect to verification page
      await expect(page).toHaveURL('/verify-email');
      await expect(page.locator('[data-testid="verification-message"]')).toContainText('check your email');
    });

    test('should handle signup errors gracefully', async ({ page }) => {
      await page.goto('/signup');

      // Fill form with existing email
      await page.fill('[data-testid="name-input"]', 'Jane Doe');
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123');
      await page.check('[data-testid="terms-checkbox"]');

      // Mock existing user response
      await page.route('/api/auth/signup', route => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'User already exists' }),
        });
      });

      await page.click('[data-testid="signup-submit"]');

      // Should show error message
      await expect(page.locator('[data-testid="signup-error"]')).toContainText('User already exists');
      await expect(page).toHaveURL('/signup'); // Should stay on signup page
    });

    test('should show loading state during signup', async ({ page }) => {
      await page.goto('/signup');

      // Fill form
      await page.fill('[data-testid="name-input"]', 'Loading Test');
      await page.fill('[data-testid="email-input"]', 'loading@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123');
      await page.check('[data-testid="terms-checkbox"]');

      // Mock slow response
      await page.route('/api/auth/signup', route => {
        setTimeout(() => {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'User created successfully',
              user: { id: '123', name: 'Loading Test', email: 'loading@example.com' },
            }),
          });
        }, 2000);
      });

      await page.click('[data-testid="signup-submit"]');

      // Should show loading state
      await expect(page.locator('[data-testid="signup-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="signup-submit"]')).toBeDisabled();

      // Wait for completion
      await expect(page).toHaveURL('/verify-email', { timeout: 5000 });
    });
  });

  test.describe('Signin Flow', () => {
    test.beforeEach(async () => {
      // Seed test user
      await seedTestData({
        users: [
          {
            id: 'e2e-user-1',
            name: 'E2E Test User',
            email: 'e2e@example.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka', // 'password123'
            isActive: true,
            subscription: 'premium',
          },
        ],
      });
    });

    test('should complete signin flow successfully', async ({ page }) => {
      await page.goto('/signin');

      // Fill signin form
      await page.fill('[data-testid="email-input"]', 'e2e@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');

      // Intercept signin API call
      const signinPromise = page.waitForResponse('/api/auth/signin');
      await page.click('[data-testid="signin-submit"]');
      const signinResponse = await signinPromise;

      expect(signinResponse.status()).toBe(200);

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Should show user info
      await expect(page.locator('[data-testid="user-name"]')).toContainText('E2E Test User');
      await expect(page.locator('[data-testid="user-email"]')).toContainText('e2e@example.com');
    });

    test('should handle remember me functionality', async ({ page }) => {
      await page.goto('/signin');

      await page.fill('[data-testid="email-input"]', 'e2e@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.check('[data-testid="remember-me-checkbox"]');

      await page.click('[data-testid="signin-submit"]');

      // Should set longer-lasting cookies
      const cookies = await page.context().cookies();
      const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');
      
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie?.httpOnly).toBe(true);
      expect(refreshTokenCookie?.secure).toBe(true);
    });

    test('should handle signin errors', async ({ page }) => {
      await page.goto('/signin');

      // Test with invalid credentials
      await page.fill('[data-testid="email-input"]', 'wrong@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="signin-submit"]');

      await expect(page.locator('[data-testid="signin-error"]')).toContainText('Invalid credentials');
      await expect(page).toHaveURL('/signin');

      // Test with correct email but wrong password
      await page.fill('[data-testid="email-input"]', 'e2e@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="signin-submit"]');

      await expect(page.locator('[data-testid="signin-error"]')).toContainText('Invalid credentials');
    });

    test('should validate form inputs', async ({ page }) => {
      await page.goto('/signin');

      // Test empty form
      await page.click('[data-testid="signin-submit"]');
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', 'short');
      await page.click('[data-testid="signin-submit"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('at least 8 characters');
    });

    test('should show loading state during signin', async ({ page }) => {
      await page.goto('/signin');

      await page.fill('[data-testid="email-input"]', 'e2e@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');

      // Mock slow response
      await page.route('/api/auth/signin', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: { id: 'e2e-user-1', name: 'E2E Test User', email: 'e2e@example.com' },
              accessToken: 'mock-token',
            }),
          });
        }, 1500);
      });

      await page.click('[data-testid="signin-submit"]');

      // Should show loading state
      await expect(page.locator('[data-testid="signin-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="signin-submit"]')).toBeDisabled();

      // Wait for completion
      await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist authentication across page reloads', async ({ page }) => {
      // Seed test user
      await seedTestData({
        users: [
          {
            id: 'persist-user',
            name: 'Persist Test User',
            email: 'persist@example.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: true,
            subscription: 'free',
          },
        ],
      });

      // Sign in
      await page.goto('/signin');
      await page.fill('[data-testid="email-input"]', 'persist@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signin-submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Persist Test User');
    });

    test('should redirect unauthenticated users to signin', async ({ page }) => {
      // Try to access protected page without authentication
      await page.goto('/dashboard');

      // Should redirect to signin
      await expect(page).toHaveURL('/signin');
      await expect(page.locator('[data-testid="signin-form"]')).toBeVisible();
    });

    test('should handle token expiration gracefully', async ({ page }) => {
      // Seed test user
      await seedTestData({
        users: [
          {
            id: 'expire-user',
            name: 'Expire Test User',
            email: 'expire@example.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: true,
            subscription: 'free',
          },
        ],
      });

      // Sign in
      await page.goto('/signin');
      await page.fill('[data-testid="email-input"]', 'expire@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signin-submit"]');

      await expect(page).toHaveURL('/dashboard');

      // Mock expired token response
      await page.route('/api/**', route => {
        if (route.request().headers()['authorization']) {
          route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' }),
          });
        } else {
          route.continue();
        }
      });

      // Try to access API endpoint
      await page.click('[data-testid="profile-button"]');

      // Should redirect to signin due to expired token
      await expect(page).toHaveURL('/signin');
      await expect(page.locator('[data-testid="signin-message"]')).toContainText('session expired');
    });
  });

  test.describe('Security Features', () => {
    test('should handle rate limiting on signin attempts', async ({ page }) => {
      await page.goto('/signin');

      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');
        await page.click('[data-testid="signin-submit"]');
        
        await expect(page.locator('[data-testid="signin-error"]')).toContainText('Invalid credentials');
        
        // Clear form for next attempt
        await page.fill('[data-testid="email-input"]', '');
        await page.fill('[data-testid="password-input"]', '');
      }

      // Next attempt should be rate limited
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="signin-submit"]');

      await expect(page.locator('[data-testid="signin-error"]')).toContainText('Too many attempts');
      await expect(page.locator('[data-testid="signin-submit"]')).toBeDisabled();
    });

    test('should validate CSRF protection', async ({ page }) => {
      // This test would verify CSRF token handling
      await page.goto('/signin');

      // Remove CSRF token from form
      await page.evaluate(() => {
        const csrfInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
        if (csrfInput) csrfInput.remove();
      });

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signin-submit"]');

      // Should show CSRF error
      await expect(page.locator('[data-testid="signin-error"]')).toContainText('Invalid request');
    });

    test('should handle XSS attempts in form inputs', async ({ page }) => {
      await page.goto('/signup');

      // Try XSS in name field
      await page.fill('[data-testid="name-input"]', '<script>alert("xss")</script>');
      await page.fill('[data-testid="email-input"]', 'xss@example.com');
      await page.fill('[data-testid="password-input"]', 'SecurePass123');
      await page.check('[data-testid="terms-checkbox"]');

      await page.click('[data-testid="signup-submit"]');

      // Should sanitize input and not execute script
      const nameValue = await page.inputValue('[data-testid="name-input"]');
      expect(nameValue).not.toContain('<script>');
      
      // Should not show alert
      page.on('dialog', dialog => {
        expect(dialog.type()).not.toBe('alert');
      });
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible with keyboard navigation', async ({ page }) => {
      await page.goto('/signin');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="remember-me-checkbox"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="signin-submit"]')).toBeFocused();

      // Should be able to submit with Enter
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.keyboard.press('Enter');

      // Form should submit
      await expect(page.locator('[data-testid="signin-loading"]')).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('/signin');

      // Check form has proper role
      await expect(page.locator('[data-testid="signin-form"]')).toHaveAttribute('role', 'form');

      // Check inputs have proper labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', 'Email address');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', 'Password');

      // Check error messages are properly associated
      await page.click('[data-testid="signin-submit"]');
      await expect(page.locator('[data-testid="email-error"]')).toHaveAttribute('role', 'alert');
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-describedby', 'email-error');
    });

    test('should work with screen readers', async ({ page }) => {
      await page.goto('/signup');

      // Check that form has proper heading structure
      await expect(page.locator('h1')).toContainText('Create Account');
      
      // Check that required fields are marked
      await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute('required');
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('required');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('required');

      // Check that form has proper fieldset/legend structure
      await expect(page.locator('fieldset legend')).toContainText('Account Information');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/signin');

      // Form should be properly sized
      const form = page.locator('[data-testid="signin-form"]');
      const formBox = await form.boundingBox();
      expect(formBox?.width).toBeLessThanOrEqual(375);

      // Inputs should be touch-friendly
      const emailInput = page.locator('[data-testid="email-input"]');
      const inputBox = await emailInput.boundingBox();
      expect(inputBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target

      // Should be able to complete signin on mobile
      await page.fill('[data-testid="email-input"]', 'mobile@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.tap('[data-testid="signin-submit"]');

      // Should handle mobile keyboard
      await expect(page.locator('[data-testid="signin-loading"]')).toBeVisible();
    });

    test('should handle orientation changes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/signup');

      // Fill form in portrait
      await page.fill('[data-testid="name-input"]', 'Orientation Test');
      await page.fill('[data-testid="email-input"]', 'orientation@example.com');

      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });

      // Form should still be usable
      await expect(page.locator('[data-testid="name-input"]')).toHaveValue('Orientation Test');
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('orientation@example.com');

      // Should be able to complete form
      await page.fill('[data-testid="password-input"]', 'SecurePass123');
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="signup-submit"]');
    });
  });
});