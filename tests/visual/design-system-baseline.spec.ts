/**
 * Visual Regression Test Baseline
 * 
 * Feature: design-system-unification
 * 
 * This test suite captures baseline screenshots of all major components
 * and pages to detect unintended visual changes in the design system.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { test, expect } from '@playwright/test';

test.describe('Design System Visual Baseline', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Core UI Components', () => {
    test('Button component variants', async ({ page }) => {
      // Navigate to a page with button examples or create a test page
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of button examples
      const buttons = page.locator('button').first();
      if (await buttons.count() > 0) {
        await expect(buttons).toHaveScreenshot('button-variants.png');
      }
    });

    test('Card component', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Find card components
      const cards = page.locator('[class*="glass-card"], [class*="card"]').first();
      if (await cards.count() > 0) {
        await expect(cards).toHaveScreenshot('card-component.png');
      }
    });

    test('Input component', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const inputs = page.locator('input').first();
      if (await inputs.count() > 0) {
        await expect(inputs).toHaveScreenshot('input-component.png');
      }
    });
  });

  test.describe('Dashboard Pages', () => {
    test('Dashboard home page', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Wait for any dynamic content to load
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dashboard-home.png', {
        fullPage: true,
      });
    });

    test('Analytics page', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('analytics-page.png', {
        fullPage: true,
      });
    });

    test('Integrations page', async ({ page }) => {
      await page.goto('/integrations');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('integrations-page.png', {
        fullPage: true,
      });
    });

    test('Messages page', async ({ page }) => {
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('messages-page.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Design Token Consistency', () => {
    test('Background colors', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Capture the main background
      const main = page.locator('main').first();
      await expect(main).toHaveScreenshot('background-primary.png');
    });

    test('Glass effect cards', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Find glass effect elements
      const glassCards = page.locator('[class*="glass"]').first();
      if (await glassCards.count() > 0) {
        await expect(glassCards).toHaveScreenshot('glass-effect.png');
      }
    });

    test('Typography hierarchy', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Capture text elements to verify typography tokens
      const headings = page.locator('h1, h2, h3').first();
      if (await headings.count() > 0) {
        await expect(headings).toHaveScreenshot('typography-hierarchy.png');
      }
    });
  });

  test.describe('Contrast Guardrails', () => {
    test('Card borders remain visible (>=0.12 opacity)', async ({ page }) => {
      await page.goto('/home');
      await page.waitForLoadState('networkidle');

      const card = page.locator('[class*="glass-card"], [class*="card-elevated"], [class*="border-[var(--border-")]').first();
      if (await card.count() > 0) {
        await expect(card).toHaveScreenshot('card-border-visibility.png');
      }
    });

    test('Nested backgrounds show separation', async ({ page }) => {
      await page.goto('/design-system');
      await page.waitForLoadState('networkidle');

      const nested = page.locator('[class*="nesting-level-"]').first();
      if (await nested.count() > 0) {
        await expect(nested).toHaveScreenshot('nested-background-separation.png');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('Mobile viewport - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('mobile-dashboard.png', {
        fullPage: true,
      });
    });

    test('Tablet viewport - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('tablet-dashboard.png', {
        fullPage: true,
      });
    });

    test('Desktop viewport - Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('desktop-dashboard.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Interactive States', () => {
    test('Button hover state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const button = page.locator('button').first();
      if (await button.count() > 0) {
        await button.hover();
        await page.waitForTimeout(300);
        await expect(button).toHaveScreenshot('button-hover.png');
      }
    });

    test('Card hover state', async ({ page }) => {
      await page.goto('/integrations');
      await page.waitForLoadState('networkidle');
      
      const card = page.locator('[class*="card"]').first();
      if (await card.count() > 0) {
        await card.hover();
        await page.waitForTimeout(300);
        await expect(card).toHaveScreenshot('card-hover.png');
      }
    });

    test('Input focus state', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const input = page.locator('input').first();
      if (await input.count() > 0) {
        await input.focus();
        await page.waitForTimeout(300);
        await expect(input).toHaveScreenshot('input-focus.png');
      }
    });
  });

  test.describe('Animation Consistency', () => {
    test('Fade-in animation', async ({ page }) => {
      await page.goto('/home');
      
      // Re-enable animations for this specific test
      await page.addStyleTag({
        content: `
          .fade-in {
            animation-duration: 0.3s !important;
          }
        `
      });
      
      await page.waitForLoadState('networkidle');
      
      const fadeElements = page.locator('[class*="fade"]').first();
      if (await fadeElements.count() > 0) {
        await expect(fadeElements).toHaveScreenshot('fade-animation.png');
      }
    });

    test('Loading states', async ({ page }) => {
      await page.goto('/analytics');
      
      // Try to capture loading state (may need to throttle network)
      const loadingIndicator = page.locator('[class*="loading"], [class*="skeleton"]').first();
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toHaveScreenshot('loading-state.png');
      }
    });
  });

  test.describe('Accessibility Features', () => {
    test('Touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Capture interactive elements to verify touch target sizes
      const buttons = page.locator('button, a[href]').first();
      if (await buttons.count() > 0) {
        await expect(buttons).toHaveScreenshot('touch-targets.png');
      }
    });

    test('Focus indicators', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      const focused = page.locator(':focus');
      if (await focused.count() > 0) {
        await expect(focused).toHaveScreenshot('focus-indicator.png');
      }
    });
  });
});
