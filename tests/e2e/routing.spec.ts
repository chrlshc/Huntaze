/**
 * End-to-end tests for dashboard routing
 * Tests navigation, redirects, and page accessibility
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Dashboard Routing E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In real implementation, you'd need to handle authentication
    // For now, we'll assume the user is authenticated
  });

  test('should navigate to home page', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);
    await expect(page).toHaveURL(/\/home/);
    
    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to OnlyFans dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/onlyfans`);
    await expect(page).toHaveURL(/\/onlyfans/);
    
    // Check for OnlyFans dashboard content
    // This will be implemented once the page is created
  });

  test('should redirect /messages to /onlyfans/messages', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`);
    
    // Should redirect to OnlyFans messages
    await expect(page).toHaveURL(/\/onlyfans\/messages/);
  });

  test('should navigate to marketing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketing`);
    await expect(page).toHaveURL(/\/marketing/);
  });

  test('should navigate to social marketing page', async ({ page }) => {
    await page.goto(`${BASE_URL}/social-marketing`);
    await expect(page).toHaveURL(/\/social-marketing/);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`);
    await expect(page).toHaveURL(/\/analytics/);
  });

  test('should navigate to integrations page', async ({ page }) => {
    await page.goto(`${BASE_URL}/integrations`);
    await expect(page).toHaveURL(/\/integrations/);
  });

  test('should navigate to content page', async ({ page }) => {
    await page.goto(`${BASE_URL}/content`);
    await expect(page).toHaveURL(/\/content/);
  });
});

test.describe('Navigation Menu Tests', () => {
  test('should highlight active navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);
    
    // Check that home nav item is active
    // This will need to be updated based on actual implementation
    const homeNavItem = page.locator('[data-testid="nav-home"]');
    await expect(homeNavItem).toHaveAttribute('data-active', 'true');
  });

  test('should navigate using sidebar menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);
    
    // Click on analytics in sidebar
    await page.click('[data-testid="nav-analytics"]');
    
    // Should navigate to analytics page
    await expect(page).toHaveURL(/\/analytics/);
  });
});

test.describe('Layout Tests', () => {
  test('should not have overlapping elements on content page', async ({ page }) => {
    await page.goto(`${BASE_URL}/content`);
    
    // Check that main content area is visible
    const mainContent = page.locator('.huntaze-main');
    await expect(mainContent).toBeVisible();
    
    // Check that header doesn't overlap content
    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    const contentBox = await mainContent.boundingBox();
    
    if (headerBox && contentBox) {
      // Header should be above content (lower y value)
      expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(contentBox.y);
    }
  });

  test('should maintain proper z-index hierarchy', async ({ page }) => {
    await page.goto(`${BASE_URL}/content`);
    
    // Open a modal (if available)
    // Check that modal appears above other content
    // This will be implemented based on actual modal implementation
  });
});
