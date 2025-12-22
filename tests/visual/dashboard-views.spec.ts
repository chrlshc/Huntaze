import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Dashboard Views Unification
 * 
 * These tests capture visual snapshots of all dashboard views and components
 * to ensure visual consistency across the application.
 * 
 * Run with: npm run test:visual
 * Review snapshots in Percy/Chromatic dashboard
 */

test.describe('Dashboard Views - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Smart Messages View', () => {
    test('empty state - no rules configured', async ({ page }) => {
      await page.goto('/smart-messages');
      
      // Wait for empty state to render
      await page.waitForSelector('[data-testid="empty-state"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('smart-messages-empty.png');
    });

    test('with highlights and rules', async ({ page }) => {
      // Mock data with rules
      await page.route('**/api/smart-messages/rules', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            rules: [
              {
                id: '1',
                name: 'Welcome new subscribers',
                trigger: 'new_subscription',
                action: 'send_message',
                status: 'active',
                stats: { triggered: 45, sent: 45, replied: 23 }
              },
              {
                id: '2',
                name: 'Re-engage inactive fans',
                trigger: 'inactive_30_days',
                action: 'send_message',
                status: 'active',
                stats: { triggered: 12, sent: 12, replied: 5 }
              }
            ]
          })
        });
      });

      await page.goto('/smart-messages');
      
      // Wait for content to render
      await page.waitForSelector('[data-testid="info-card"]');
      await page.waitForSelector('[data-testid="rules-list"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('smart-messages-with-data.png');
    });

    test('highlights hover state', async ({ page }) => {
      await page.goto('/smart-messages');
      
      // Hover over first highlight card
      const firstCard = page.locator('[data-testid="info-card"]').first();
      await firstCard.hover();
      
      // Capture snapshot with hover state
      await expect(page).toHaveScreenshot('smart-messages-highlight-hover.png');
    });
  });

  test.describe('Fans View', () => {
    test('with all segments and fans table', async ({ page }) => {
      // Mock fan data
      await page.route('**/api/fans', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            segments: [
              { id: 'all', label: 'All Fans', value: 1234 },
              { id: 'vip', label: 'VIP', value: 127 },
              { id: 'active', label: 'Active', value: 856 },
              { id: 'at-risk', label: 'At-Risk', value: 189 },
              { id: 'churned', label: 'Churned', value: 62 }
            ],
            fans: [
              {
                id: '1',
                name: 'Sarah Johnson',
                username: '@sarah_j',
                avatar: '/avatars/1.jpg',
                tier: 'vip',
                churnRisk: 'low',
                ltv: 1250,
                lastActive: new Date('2024-01-10'),
                messageCount: 45
              },
              {
                id: '2',
                name: 'Mike Chen',
                username: '@mike_c',
                avatar: '/avatars/2.jpg',
                tier: 'active',
                churnRisk: 'low',
                ltv: 450,
                lastActive: new Date('2024-01-09'),
                messageCount: 23
              },
              {
                id: '3',
                name: 'Emma Davis',
                username: '@emma_d',
                avatar: '/avatars/3.jpg',
                tier: 'at-risk',
                churnRisk: 'high',
                ltv: 890,
                lastActive: new Date('2023-12-15'),
                messageCount: 67
              }
            ],
            totalCount: 1234
          })
        });
      });

      await page.goto('/fans');
      
      // Wait for segments and table to render
      await page.waitForSelector('[data-testid="stat-card"]');
      await page.waitForSelector('[data-testid="fans-table"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('fans-view-with-data.png');
    });

    test('segment cards hover state', async ({ page }) => {
      await page.goto('/fans');
      
      // Hover over VIP segment card
      const vipCard = page.locator('[data-testid="stat-card"]').nth(1);
      await vipCard.hover();
      
      // Capture snapshot with hover state
      await expect(page).toHaveScreenshot('fans-segment-hover.png');
    });

    test('table row hover state', async ({ page }) => {
      await page.goto('/fans');
      
      // Wait for table to render
      await page.waitForSelector('[data-testid="fans-table"]');
      
      // Hover over first table row
      const firstRow = page.locator('[data-testid="fan-row"]').first();
      await firstRow.hover();
      
      // Capture snapshot with hover state
      await expect(page).toHaveScreenshot('fans-table-row-hover.png');
    });

    test('with search and filters active', async ({ page }) => {
      await page.goto('/fans');
      
      // Type in search box
      await page.fill('[data-testid="search-input"]', 'Sarah');
      
      // Click filters button
      await page.click('[data-testid="filters-button"]');
      
      // Wait for filter pill to appear
      await page.waitForSelector('[data-testid="filter-pill"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('fans-with-search-filters.png');
    });
  });

  test.describe('PPV Content View', () => {
    test('with metrics and content cards', async ({ page }) => {
      // Mock PPV data
      await page.route('**/api/ppv/content', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            metrics: [
              {
                id: 'revenue',
                label: 'Total Revenue',
                value: '$4,196',
                delta: { value: '+12%', trend: 'up' }
              },
              {
                id: 'sent',
                label: 'Total Sent',
                value: '156'
              },
              {
                id: 'open-rate',
                label: 'Open Rate',
                value: '68%',
                delta: { value: '+5%', trend: 'up' }
              },
              {
                id: 'purchase-rate',
                label: 'Purchase Rate',
                value: '23%',
                delta: { value: '-2%', trend: 'down' }
              }
            ],
            content: [
              {
                id: '1',
                title: 'Exclusive Beach Photoshoot',
                thumbnail: '/thumbnails/1.jpg',
                price: 29.99,
                status: 'active',
                stats: { sent: 45, opened: 32, purchased: 12, revenue: 359.88 },
                createdAt: new Date('2024-01-08')
              },
              {
                id: '2',
                title: 'Behind the Scenes Video',
                thumbnail: '/thumbnails/2.jpg',
                price: 19.99,
                status: 'sent',
                stats: { sent: 78, opened: 56, purchased: 23, revenue: 459.77 },
                createdAt: new Date('2024-01-05')
              }
            ],
            tabs: { all: 5, active: 2, drafts: 0, sent: 3 }
          })
        });
      });

      await page.goto('/ppv');
      
      // Wait for metrics and content to render
      await page.waitForSelector('[data-testid="stat-card"]');
      await page.waitForSelector('[data-testid="content-card"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('ppv-view-with-data.png');
    });

    test('content card hover state', async ({ page }) => {
      await page.goto('/ppv');
      
      // Wait for content cards to render
      await page.waitForSelector('[data-testid="content-card"]');
      
      // Hover over first content card
      const firstCard = page.locator('[data-testid="content-card"]').first();
      await firstCard.hover();
      
      // Capture snapshot with hover state
      await expect(page).toHaveScreenshot('ppv-content-card-hover.png');
    });

    test('tabs navigation', async ({ page }) => {
      await page.goto('/ppv');
      
      // Click on "Active" tab
      await page.click('[data-testid="tab-active"]');
      
      // Wait for tab to be active
      await page.waitForSelector('[data-testid="tab-active"][aria-selected="true"]');
      
      // Capture snapshot with active tab
      await expect(page).toHaveScreenshot('ppv-active-tab.png');
    });
  });

  test.describe('Components - Isolated', () => {
    test('StatCard - default variant', async ({ page }) => {
      await page.goto('/test-components/stat-card');
      
      // Wait for component to render
      await page.waitForSelector('[data-testid="stat-card"]');
      
      // Capture snapshot
      await expect(page).toHaveScreenshot('component-stat-card-default.png');
    });

    test('StatCard - with positive delta', async ({ page }) => {
      await page.goto('/test-components/stat-card?delta=positive');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('component-stat-card-positive-delta.png');
    });

    test('StatCard - with negative delta', async ({ page }) => {
      await page.goto('/test-components/stat-card?delta=negative');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('component-stat-card-negative-delta.png');
    });

    test('InfoCard - default', async ({ page }) => {
      await page.goto('/test-components/info-card');
      
      await page.waitForSelector('[data-testid="info-card"]');
      await expect(page).toHaveScreenshot('component-info-card.png');
    });

    test('TagChip - all variants', async ({ page }) => {
      await page.goto('/test-components/tag-chip');
      
      // Wait for all variants to render
      await page.waitForSelector('[data-testid="tag-chip-vip"]');
      await page.waitForSelector('[data-testid="tag-chip-active"]');
      await page.waitForSelector('[data-testid="tag-chip-at-risk"]');
      await page.waitForSelector('[data-testid="tag-chip-churned"]');
      await page.waitForSelector('[data-testid="tag-chip-churn-low"]');
      await page.waitForSelector('[data-testid="tag-chip-churn-high"]');
      
      // Capture snapshot with all variants
      await expect(page).toHaveScreenshot('component-tag-chip-variants.png');
    });

    test('EmptyState - default', async ({ page }) => {
      await page.goto('/test-components/empty-state');
      
      await page.waitForSelector('[data-testid="empty-state"]');
      await expect(page).toHaveScreenshot('component-empty-state.png');
    });

    test('EmptyState - CTA hover', async ({ page }) => {
      await page.goto('/test-components/empty-state');
      
      await page.waitForSelector('[data-testid="empty-state"]');
      
      // Hover over CTA button
      const ctaButton = page.locator('[data-testid="empty-state-cta"]');
      await ctaButton.hover();
      
      // Capture snapshot with hover state
      await expect(page).toHaveScreenshot('component-empty-state-cta-hover.png');
    });
  });

  test.describe('Responsive Behavior', () => {
    test('Smart Messages - mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/smart-messages');
      
      await page.waitForSelector('[data-testid="info-card"]');
      await expect(page).toHaveScreenshot('smart-messages-mobile.png');
    });

    test('Fans - mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/fans');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('fans-mobile.png');
    });

    test('PPV - mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ppv');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('ppv-mobile.png');
    });

    test('Fans - tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/fans');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('fans-tablet.png');
    });

    test('PPV - tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/ppv');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('ppv-tablet.png');
    });
  });

  test.describe('Dark Mode (if applicable)', () => {
    test.beforeEach(async ({ page }) => {
      // Enable dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
    });

    test('Smart Messages - dark mode', async ({ page }) => {
      await page.goto('/smart-messages');
      
      await page.waitForSelector('[data-testid="info-card"]');
      await expect(page).toHaveScreenshot('smart-messages-dark.png');
    });

    test('Fans - dark mode', async ({ page }) => {
      await page.goto('/fans');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('fans-dark.png');
    });

    test('PPV - dark mode', async ({ page }) => {
      await page.goto('/ppv');
      
      await page.waitForSelector('[data-testid="stat-card"]');
      await expect(page).toHaveScreenshot('ppv-dark.png');
    });
  });
});
