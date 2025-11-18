/**
 * E2E Tests for Integrations Management System
 * 
 * Tests complete user journeys for connecting, disconnecting, and managing integrations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 12.1
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2
};

// Helper utilities for integration tests
class IntegrationTestUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to integrations page
   */
  async navigateToIntegrations(): Promise<void> {
    await this.page.goto(`${TEST_CONFIG.baseURL}/integrations`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for integration cards to load
   */
  async waitForIntegrationCards(): Promise<void> {
    await this.page.waitForSelector('[data-testid="integration-card"]', { timeout: 10000 });
  }

  /**
   * Find integration card by provider
   */
  async findIntegrationCard(provider: string): Promise<any> {
    return this.page.locator(`[data-testid="integration-card-${provider}"]`);
  }

  /**
   * Check if integration is connected
   */
  async isIntegrationConnected(provider: string): Promise<boolean> {
    const card = await this.findIntegrationCard(provider);
    const connectedBadge = card.locator('[data-testid="status-connected"]');
    return await connectedBadge.isVisible().catch(() => false);
  }

  /**
   * Click connect button for a provider
   */
  async clickConnect(provider: string): Promise<void> {
    const card = await this.findIntegrationCard(provider);
    const connectButton = card.locator('button:has-text("Add app"), button:has-text("Connect")');
    await connectButton.click();
  }

  /**
   * Click disconnect button for a provider
   */
  async clickDisconnect(provider: string): Promise<void> {
    const card = await this.findIntegrationCard(provider);
    const disconnectButton = card.locator('button:has-text("Disconnect")');
    await disconnectButton.click();
  }

  /**
   * Click reconnect button for a provider
   */
  async clickReconnect(provider: string): Promise<void> {
    const card = await this.findIntegrationCard(provider);
    const reconnectButton = card.locator('button:has-text("Reconnect")');
    await reconnectButton.click();
  }

  /**
   * Confirm disconnect in modal
   */
  async confirmDisconnect(): Promise<void> {
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    await confirmButton.click();
  }

  /**
   * Wait for success toast
   */
  async waitForSuccessToast(): Promise<void> {
    await this.page.waitForSelector('[role="alert"]:has-text("Success"), [data-testid="toast-success"]', {
      timeout: 5000
    });
  }

  /**
   * Wait for error toast
   */
  async waitForErrorToast(): Promise<void> {
    await this.page.waitForSelector('[role="alert"]:has-text("Error"), [data-testid="toast-error"]', {
      timeout: 5000
    });
  }

  /**
   * Get account switcher for multi-account support
   */
  async getAccountSwitcher(provider: string): Promise<any> {
    const card = await this.findIntegrationCard(provider);
    return card.locator('[data-testid="account-switcher"]');
  }

  /**
   * Select account from switcher
   */
  async selectAccount(provider: string, accountIndex: number): Promise<void> {
    const switcher = await this.getAccountSwitcher(provider);
    await switcher.click();
    
    const accountOption = this.page.locator(`[data-testid="account-option-${accountIndex}"]`);
    await accountOption.click();
  }

  /**
   * Mock OAuth callback success
   */
  async mockOAuthSuccess(provider: string): Promise<void> {
    // Intercept OAuth callback
    await this.page.route(`**/api/integrations/callback/${provider}*`, async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${TEST_CONFIG.baseURL}/integrations?success=true&provider=${provider}`
        }
      });
    });
  }

  /**
   * Mock OAuth callback failure
   */
  async mockOAuthFailure(provider: string): Promise<void> {
    await this.page.route(`**/api/integrations/callback/${provider}*`, async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `${TEST_CONFIG.baseURL}/integrations?error=oauth_failed&provider=${provider}`
        }
      });
    });
  }
}

test.describe('Integrations Management E2E Tests', () => {
  let utils: IntegrationTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new IntegrationTestUtils(page);
    
    // Mock authentication - assume user is logged in
    await page.addInitScript(() => {
      // Set up mock session
      localStorage.setItem('next-auth.session-token', 'mock-session-token');
    });
  });

  test.describe('Connect Instagram Flow', () => {
    test('should complete Instagram connection flow successfully', async ({ page }) => {
      // Navigate to integrations page
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Find Instagram card
      const instagramCard = await utils.findIntegrationCard('instagram');
      await expect(instagramCard).toBeVisible();

      // Verify initial state is disconnected
      const isConnected = await utils.isIntegrationConnected('instagram');
      if (isConnected) {
        // Disconnect first to test from clean state
        await utils.clickDisconnect('instagram');
        await utils.confirmDisconnect();
        await utils.waitForSuccessToast();
      }

      // Mock successful OAuth flow
      await utils.mockOAuthSuccess('instagram');

      // Click connect button
      await utils.clickConnect('instagram');

      // Wait for OAuth redirect (in real test, this would open OAuth window)
      // For E2E, we're mocking the callback
      await page.waitForURL(/.*integrations.*success=true.*/);

      // Verify success toast appears
      await utils.waitForSuccessToast();

      // Verify card now shows connected state
      await page.reload();
      await utils.waitForIntegrationCards();
      
      const isNowConnected = await utils.isIntegrationConnected('instagram');
      expect(isNowConnected).toBe(true);

      // Verify connected badge is visible
      const connectedBadge = instagramCard.locator('[data-testid="status-connected"]');
      await expect(connectedBadge).toBeVisible();

      // Verify disconnect button is available
      const disconnectButton = instagramCard.locator('button:has-text("Disconnect")');
      await expect(disconnectButton).toBeVisible();
    });

    test('should handle OAuth cancellation gracefully', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock OAuth failure
      await utils.mockOAuthFailure('instagram');

      // Click connect button
      await utils.clickConnect('instagram');

      // Wait for error redirect
      await page.waitForURL(/.*integrations.*error=oauth_failed.*/);

      // Verify error toast appears
      await utils.waitForErrorToast();

      // Verify card remains in disconnected state
      const isConnected = await utils.isIntegrationConnected('instagram');
      expect(isConnected).toBe(false);
    });

    test('should show loading state during connection', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      const instagramCard = await utils.findIntegrationCard('instagram');

      // Click connect button
      await utils.clickConnect('instagram');

      // Verify loading state appears
      const loadingIndicator = instagramCard.locator('[data-testid="loading-spinner"]');
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('Disconnect Integration Flow', () => {
    test('should disconnect integration successfully', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Ensure Instagram is connected first
      const isConnected = await utils.isIntegrationConnected('instagram');
      if (!isConnected) {
        test.skip();
      }

      // Click disconnect button
      await utils.clickDisconnect('instagram');

      // Verify confirmation modal appears
      const confirmModal = page.locator('[role="dialog"], [data-testid="confirm-modal"]');
      await expect(confirmModal).toBeVisible();

      // Confirm disconnection
      await utils.confirmDisconnect();

      // Verify success toast
      await utils.waitForSuccessToast();

      // Verify card shows disconnected state
      await page.reload();
      await utils.waitForIntegrationCards();
      
      const isNowConnected = await utils.isIntegrationConnected('instagram');
      expect(isNowConnected).toBe(false);

      // Verify connect button is available again
      const instagramCard = await utils.findIntegrationCard('instagram');
      const connectButton = instagramCard.locator('button:has-text("Add app"), button:has-text("Connect")');
      await expect(connectButton).toBeVisible();
    });

    test('should cancel disconnection when user clicks cancel', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      const isConnected = await utils.isIntegrationConnected('instagram');
      if (!isConnected) {
        test.skip();
      }

      // Click disconnect button
      await utils.clickDisconnect('instagram');

      // Verify confirmation modal appears
      const confirmModal = page.locator('[role="dialog"]');
      await expect(confirmModal).toBeVisible();

      // Click cancel
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")');
      await cancelButton.click();

      // Verify modal closes
      await expect(confirmModal).not.toBeVisible();

      // Verify integration remains connected
      const isStillConnected = await utils.isIntegrationConnected('instagram');
      expect(isStillConnected).toBe(true);
    });
  });

  test.describe('Reconnect Expired Integration Flow', () => {
    test('should reconnect expired integration successfully', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock expired token state
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'test-account',
                isConnected: true,
                expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
                metadata: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      // Verify expired status is shown
      const instagramCard = await utils.findIntegrationCard('instagram');
      const expiredBadge = instagramCard.locator('[data-testid="status-expired"]');
      await expect(expiredBadge).toBeVisible();

      // Verify reconnect button is available
      const reconnectButton = instagramCard.locator('button:has-text("Reconnect")');
      await expect(reconnectButton).toBeVisible();

      // Mock successful OAuth flow
      await utils.mockOAuthSuccess('instagram');

      // Click reconnect button
      await utils.clickReconnect('instagram');

      // Wait for OAuth redirect
      await page.waitForURL(/.*integrations.*success=true.*/);

      // Verify success toast
      await utils.waitForSuccessToast();

      // Verify card shows connected state again
      await page.reload();
      await utils.waitForIntegrationCards();
      
      const isConnected = await utils.isIntegrationConnected('instagram');
      expect(isConnected).toBe(true);
    });

    test('should show clear expired token message', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock expired token state
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'test-account',
                isConnected: true,
                expiresAt: new Date(Date.now() - 86400000).toISOString(),
                metadata: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      const instagramCard = await utils.findIntegrationCard('instagram');
      
      // Verify expired message is shown
      const expiredMessage = instagramCard.locator('text=/token.*expired|connection.*expired/i');
      await expect(expiredMessage).toBeVisible();
    });
  });

  test.describe('Multi-Account Switching', () => {
    test('should display multiple accounts for same provider', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock multiple Instagram accounts
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'account-1',
                isConnected: true,
                metadata: { username: 'test_account_1' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                provider: 'instagram',
                providerAccountId: 'account-2',
                isConnected: true,
                metadata: { username: 'test_account_2' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      const instagramCard = await utils.findIntegrationCard('instagram');

      // Verify account switcher is visible
      const accountSwitcher = await utils.getAccountSwitcher('instagram');
      await expect(accountSwitcher).toBeVisible();

      // Verify both accounts are listed
      await accountSwitcher.click();
      
      const account1 = page.locator('text=test_account_1');
      const account2 = page.locator('text=test_account_2');
      
      await expect(account1).toBeVisible();
      await expect(account2).toBeVisible();
    });

    test('should switch between accounts successfully', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock multiple accounts
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'account-1',
                isConnected: true,
                metadata: { username: 'test_account_1', followersCount: 1000 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                provider: 'instagram',
                providerAccountId: 'account-2',
                isConnected: true,
                metadata: { username: 'test_account_2', followersCount: 2000 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      // Select first account
      await utils.selectAccount('instagram', 0);

      // Verify first account details are shown
      const instagramCard = await utils.findIntegrationCard('instagram');
      await expect(instagramCard.locator('text=test_account_1')).toBeVisible();

      // Switch to second account
      await utils.selectAccount('instagram', 1);

      // Verify second account details are shown
      await expect(instagramCard.locator('text=test_account_2')).toBeVisible();
    });

    test('should allow disconnecting individual accounts', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock multiple accounts
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'account-1',
                isConnected: true,
                metadata: { username: 'test_account_1' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              {
                provider: 'instagram',
                providerAccountId: 'account-2',
                isConnected: true,
                metadata: { username: 'test_account_2' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      // Select first account
      await utils.selectAccount('instagram', 0);

      // Disconnect first account
      await utils.clickDisconnect('instagram');
      await utils.confirmDisconnect();
      await utils.waitForSuccessToast();

      // Verify second account is still connected
      await page.reload();
      await utils.waitForIntegrationCards();
      
      const accountSwitcher = await utils.getAccountSwitcher('instagram');
      await accountSwitcher.click();
      
      // Should only see account 2 now
      const account2 = page.locator('text=test_account_2');
      await expect(account2).toBeVisible();
    });
  });

  test.describe('Integration Status Display', () => {
    test('should show all available integrations', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Verify all supported platforms are shown
      const providers = ['instagram', 'tiktok', 'reddit', 'onlyfans'];
      
      for (const provider of providers) {
        const card = await utils.findIntegrationCard(provider);
        await expect(card).toBeVisible();
      }
    });

    test('should display connection metadata', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      // Mock connected Instagram with metadata
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'test-account',
                isConnected: true,
                metadata: {
                  username: 'test_user',
                  followersCount: 5000,
                  profilePictureUrl: 'https://example.com/avatar.jpg'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      const instagramCard = await utils.findIntegrationCard('instagram');

      // Verify metadata is displayed
      await expect(instagramCard.locator('text=test_user')).toBeVisible();
      await expect(instagramCard.locator('text=/5,?000|5000/')).toBeVisible();
    });

    test('should show connection date', async ({ page }) => {
      await utils.navigateToIntegrations();
      await utils.waitForIntegrationCards();

      const yesterday = new Date(Date.now() - 86400000);

      // Mock connected integration
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            integrations: [
              {
                provider: 'instagram',
                providerAccountId: 'test-account',
                isConnected: true,
                metadata: {},
                createdAt: yesterday.toISOString(),
                updatedAt: new Date().toISOString()
              }
            ]
          })
        });
      });

      await page.reload();
      await utils.waitForIntegrationCards();

      const instagramCard = await utils.findIntegrationCard('instagram');

      // Verify connection date is shown
      const dateText = instagramCard.locator('text=/connected|added/i');
      await expect(dateText).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await utils.navigateToIntegrations();

      // Mock network error
      await page.route('**/api/integrations/status', async (route) => {
        await route.abort('failed');
      });

      await page.reload();

      // Verify error message is shown
      const errorMessage = page.locator('text=/error|failed to load/i');
      await expect(errorMessage).toBeVisible();

      // Verify retry button is available
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")');
      await expect(retryButton).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await utils.navigateToIntegrations();

      // Mock API error
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        });
      });

      await page.reload();

      // Verify error message is shown
      const errorMessage = page.locator('text=/error|something went wrong/i');
      await expect(errorMessage).toBeVisible();
    });

    test('should handle unauthorized access', async ({ page }) => {
      await utils.navigateToIntegrations();

      // Mock unauthorized response
      await page.route('**/api/integrations/status', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized'
          })
        });
      });

      await page.reload();

      // Verify redirect to login or error message
      await page.waitForURL(/.*auth.*|.*login.*/);
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(`should display correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await utils.navigateToIntegrations();
        await utils.waitForIntegrationCards();

        // Verify cards are visible
        const instagramCard = await utils.findIntegrationCard('instagram');
        await expect(instagramCard).toBeVisible();

        // Verify layout is responsive
        const cardBounds = await instagramCard.boundingBox();
        expect(cardBounds).toBeTruthy();
        expect(cardBounds!.width).toBeLessThanOrEqual(viewport.width);
      });
    });
  });
});

/**
 * Manual Testing Checklist
 * 
 * Connect Flow:
 * ✓ Can navigate to integrations page
 * ✓ All integration cards are visible
 * ✓ Connect button initiates OAuth flow
 * ✓ OAuth success shows success message
 * ✓ OAuth failure shows error message
 * ✓ Connected state persists after refresh
 * 
 * Disconnect Flow:
 * ✓ Disconnect button shows confirmation modal
 * ✓ Confirming disconnection removes integration
 * ✓ Canceling keeps integration connected
 * ✓ Success message appears after disconnect
 * 
 * Reconnect Flow:
 * ✓ Expired integrations show expired badge
 * ✓ Reconnect button initiates OAuth flow
 * ✓ Successful reconnect restores connection
 * ✓ Expired message is clear and actionable
 * 
 * Multi-Account:
 * ✓ Multiple accounts are listed
 * ✓ Account switcher works correctly
 * ✓ Can disconnect individual accounts
 * ✓ Account metadata displays correctly
 * 
 * Error Handling:
 * ✓ Network errors show retry option
 * ✓ API errors show user-friendly messages
 * ✓ Unauthorized access redirects to login
 * ✓ Loading states are shown appropriately
 * 
 * Responsive:
 * ✓ Mobile layout works (< 640px)
 * ✓ Tablet layout works (640px-1024px)
 * ✓ Desktop layout works (> 1024px)
 * ✓ Touch targets are adequate on mobile
 */
