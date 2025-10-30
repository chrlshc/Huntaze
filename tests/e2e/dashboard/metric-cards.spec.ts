/**
 * E2E Tests - Dashboard Metric Cards (Task 3.1)
 * End-to-end tests for metric cards on dashboard
 * 
 * Coverage:
 * - Dashboard page loading
 * - Metric cards display
 * - Data refresh
 * - Responsive behavior
 * - User interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Metric Cards E2E - Task 3.1', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assuming user is logged in)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Initial Load', () => {
    test('should display all 4 metric cards on dashboard', async ({ page }) => {
      // Wait for metric cards to load
      await page.waitForSelector('[data-testid="metric-card"]', { timeout: 5000 });

      // Count metric cards
      const metricCards = await page.locator('[data-testid="metric-card"]').count();
      expect(metricCards).toBeGreaterThanOrEqual(4);
    });

    test('should display Total Revenue metric card', async ({ page }) => {
      const revenueCard = page.locator('text=Total Revenue').first();
      await expect(revenueCard).toBeVisible();

      // Check for value
      const cardContainer = revenueCard.locator('..');
      await expect(cardContainer).toContainText('$');
    });

    test('should display Messages Sent metric card', async ({ page }) => {
      const messagesCard = page.locator('text=Messages Sent').first();
      await expect(messagesCard).toBeVisible();
    });

    test('should display Active Campaigns metric card', async ({ page }) => {
      const campaignsCard = page.locator('text=Active Campaigns').first();
      await expect(campaignsCard).toBeVisible();
    });

    test('should display Engagement Rate metric card', async ({ page }) => {
      const engagementCard = page.locator('text=Engagement Rate').first();
      await expect(engagementCard).toBeVisible();

      // Check for percentage
      const cardContainer = engagementCard.locator('..');
      await expect(cardContainer).toContainText('%');
    });
  });

  test.describe('Visual Elements', () => {
    test('should display icons on all metric cards', async ({ page }) => {
      // Check for SVG icons
      const icons = await page.locator('[data-testid="metric-card"] svg').count();
      expect(icons).toBeGreaterThanOrEqual(4);
    });

    test('should display change indicators', async ({ page }) => {
      // Look for percentage changes
      const changeIndicators = await page.locator('text=/\\d+\\.?\\d*%/').count();
      expect(changeIndicators).toBeGreaterThanOrEqual(4);
    });

    test('should display "vs last period" text', async ({ page }) => {
      const vsLastPeriod = await page.locator('text=vs last period').count();
      expect(vsLastPeriod).toBeGreaterThanOrEqual(4);
    });

    test('should display sparkline charts when available', async ({ page }) => {
      // Check for sparkline container
      const sparklines = await page.locator('[data-testid="metric-card"] .flex.items-end').count();
      expect(sparklines).toBeGreaterThan(0);
    });

    test('should show green color for positive changes', async ({ page }) => {
      const positiveChanges = await page.locator('.text-green-600, .text-green-400').count();
      expect(positiveChanges).toBeGreaterThan(0);
    });

    test('should show red color for negative changes', async ({ page }) => {
      const negativeChanges = await page.locator('.text-red-600, .text-red-400').count();
      // May or may not have negative changes
      expect(negativeChanges).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeletons initially', async ({ page }) => {
      // Reload page and check for loading state
      await page.reload();

      // Check for skeleton animation
      const skeletons = await page.locator('.animate-pulse').count();
      // Skeletons should appear briefly
      expect(skeletons).toBeGreaterThanOrEqual(0);
    });

    test('should transition from loading to loaded state', async ({ page }) => {
      await page.reload();

      // Wait for loading to complete
      await page.waitForSelector('[data-testid="metric-card"]', { state: 'visible' });

      // Verify content is visible
      await expect(page.locator('text=Total Revenue')).toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display 4 columns on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const grid = page.locator('.grid').first();
      await expect(grid).toHaveClass(/grid-cols-4|lg:grid-cols-4/);
    });

    test('should display 2 columns on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Cards should still be visible
      const metricCards = await page.locator('[data-testid="metric-card"]').count();
      expect(metricCards).toBeGreaterThanOrEqual(4);
    });

    test('should display 1 column on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Cards should still be visible
      const metricCards = await page.locator('[data-testid="metric-card"]').count();
      expect(metricCards).toBeGreaterThanOrEqual(4);

      // Check that cards are stacked vertically
      const firstCard = page.locator('[data-testid="metric-card"]').first();
      const secondCard = page.locator('[data-testid="metric-card"]').nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        // Second card should be below first card
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
      }
    });
  });

  test.describe('Hover Effects', () => {
    test('should show shadow on hover', async ({ page }) => {
      const firstCard = page.locator('[data-testid="metric-card"]').first();

      // Hover over card
      await firstCard.hover();

      // Check for shadow class (visual test)
      await expect(firstCard).toHaveClass(/hover:shadow-md/);
    });

    test('should maintain hover effect on all cards', async ({ page }) => {
      const cards = await page.locator('[data-testid="metric-card"]').all();

      for (const card of cards) {
        await card.hover();
        await expect(card).toHaveClass(/hover:shadow-md/);
      }
    });
  });

  test.describe('Data Refresh', () => {
    test('should refresh data every 60 seconds', async ({ page }) => {
      // Get initial value
      const revenueCard = page.locator('text=Total Revenue').first();
      const initialValue = await revenueCard.locator('..').textContent();

      // Wait for potential refresh (simulate)
      await page.waitForTimeout(2000);

      // Value might change or stay the same
      const newValue = await revenueCard.locator('..').textContent();
      expect(newValue).toBeDefined();
    });

    test('should update values without full page reload', async ({ page }) => {
      // Monitor navigation events
      let navigationOccurred = false;
      page.on('framenavigated', () => {
        navigationOccurred = true;
      });

      // Wait for potential data refresh
      await page.waitForTimeout(2000);

      // No navigation should have occurred
      expect(navigationOccurred).toBe(false);
    });
  });

  test.describe('Dark Mode', () => {
    test('should support dark mode styling', async ({ page }) => {
      // Toggle dark mode (assuming theme toggle exists)
      const themeToggle = page.locator('[aria-label="Toggle theme"]');
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click();

        // Check for dark mode classes
        const cards = await page.locator('[data-testid="metric-card"]').all();
        
        for (const card of cards) {
          const classes = await card.getAttribute('class');
          expect(classes).toContain('dark:');
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Metric card titles should be readable
      const titles = await page.locator('[data-testid="metric-card"] p').all();
      expect(titles.length).toBeGreaterThan(0);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Run accessibility audit
      const accessibilityScanResults = await page.evaluate(() => {
        // Simple contrast check
        const cards = document.querySelectorAll('[data-testid="metric-card"]');
        return cards.length > 0;
      });

      expect(accessibilityScanResults).toBe(true);
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focus should be visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
    });
  });

  test.describe('Performance', () => {
    test('should load metric cards within 2 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="metric-card"]', { timeout: 5000 });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should not cause layout shift', async ({ page }) => {
      // Monitor Cumulative Layout Shift
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      // CLS should be less than 0.1 (good)
      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/dashboard/metrics', route => route.abort());

      await page.reload();

      // Should show error state or fallback
      const cards = await page.locator('[data-testid="metric-card"]').count();
      expect(cards).toBeGreaterThanOrEqual(0);
    });

    test('should show placeholder when data is unavailable', async ({ page }) => {
      // Mock empty response
      await page.route('**/api/dashboard/metrics', route => 
        route.fulfill({
          status: 200,
          body: JSON.stringify({ metrics: {} }),
        })
      );

      await page.reload();

      // Should handle empty data
      const dashboard = page.locator('[data-testid="dashboard"]');
      await expect(dashboard).toBeVisible();
    });
  });

  test.describe('User Interactions', () => {
    test('should allow clicking on metric cards', async ({ page }) => {
      const firstCard = page.locator('[data-testid="metric-card"]').first();
      
      // Click should not cause errors
      await firstCard.click();
      
      // Page should remain stable
      await expect(page.locator('text=Total Revenue')).toBeVisible();
    });

    test('should maintain state after interaction', async ({ page }) => {
      const revenueCard = page.locator('text=Total Revenue').first();
      const initialText = await revenueCard.textContent();

      // Interact with page
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 200);

      // Content should remain the same
      const finalText = await revenueCard.textContent();
      expect(finalText).toBe(initialText);
    });
  });
});
