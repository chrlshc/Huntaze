import { test, expect } from '@playwright/test';

// E2E Tests for Critical User Journeys
test.describe('Critical E-commerce User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/');
  });

  test.describe('Merchant Onboarding Journey @smoke', () => {
    test('should complete merchant onboarding and create first product', async ({ page }) => {
      // Step 1: Navigate to merchant signup
      await page.click('[data-testid="merchant-signup"]');
      await expect(page).toHaveURL(/.*\/merchant\/signup/);
      
      // Step 2: Fill onboarding form
      await page.fill('[data-testid="store-name"]', 'E2E Test Store');
      await page.fill('[data-testid="merchant-email"]', 'e2e-merchant@test.com');
      await page.fill('[data-testid="merchant-password"]', 'SecurePass123!');
      
      // Step 3: Upload store logo
      await page.setInputFiles('[data-testid="logo-upload"]', 'tests/fixtures/test-logo.png');
      
      // Step 4: Select theme colors
      await page.fill('[data-testid="primary-color"]', '#007bff');
      await page.fill('[data-testid="secondary-color"]', '#6c757d');
      
      // Step 5: Complete onboarding
      await page.click('[data-testid="complete-onboarding"]');
      
      // Step 6: Verify redirect to admin dashboard
      await expect(page).toHaveURL(/.*\/admin\/dashboard/);
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome to E2E Test Store');
      
      // Step 7: Create first product
      await page.click('[data-testid="add-product-button"]');
      await expect(page).toHaveURL(/.*\/admin\/products\/new/);
      
      await page.fill('[data-testid="product-title"]', 'Premium Wireless Headphones');
      await page.fill('[data-testid="product-description"]', 'High-quality wireless headphones with noise cancellation');
      await page.fill('[data-testid="product-price"]', '199.99');
      await page.fill('[data-testid="product-inventory"]', '50');
      
      // Upload product images
      await page.setInputFiles('[data-testid="product-images"]', [
        'tests/fixtures/headphones-1.jpg',
        'tests/fixtures/headphones-2.jpg'
      ]);
      
      // Add product variants
      await page.click('[data-testid="add-variant"]');
      await page.selectOption('[data-testid="variant-size"]', 'One Size');
      await page.selectOption('[data-testid="variant-color"]', 'Black');
      
      // Save product
      await page.click('[data-testid="save-product"]');
      
      // Step 8: Verify product creation
      await expect(page).toHaveURL(/.*\/admin\/products/);
      await expect(page.locator('[data-testid="product-list"]')).toContainText('Premium Wireless Headphones');
      await expect(page.locator('[data-testid="products-count"]')).toContainText('1 product');
      
      // Step 9: Verify storefront generation
      await page.click('[data-testid="view-storefront"]');
      
      // Should open storefront in new tab
      const [storefrontPage] = await Promise.all([
        page.waitForEvent('popup'),
        page.click('[data-testid="view-storefront"]')
      ]);
      
      await expect(storefrontPage.locator('h1')).toContainText('E2E Test Store');
      await expect(storefrontPage.locator('[data-testid="product-grid"]')).toContainText('Premium Wireless Headphones');
      
      await storefrontPage.close();
    });

    test('should handle onboarding validation errors', async ({ page }) => {
      await page.click('[data-testid="merchant-signup"]');
      
      // Try to submit empty form
      await page.click('[data-testid="complete-onboarding"]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid="store-name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      
      // Fill invalid email
      await page.fill('[data-testid="merchant-email"]', 'invalid-email');
      await page.click('[data-testid="complete-onboarding"]');
      
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email');
    });
  });

  test.describe('Customer Purchase Journey @smoke', () => {
    test('should complete full purchase flow from product discovery to order confirmation', async ({ page }) => {
      // Setup: Assume merchant and products already exist
      await page.goto('/stores/test-store');
      
      // Step 1: Browse products
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
      
      // Step 2: Search for specific product
      await page.fill('[data-testid="search-input"]', 'headphones');
      await page.press('[data-testid="search-input"]', 'Enter');
      
      await expect(page.locator('[data-testid="search-results"]')).toContainText('headphones');
      
      // Step 3: Filter products
      await page.selectOption('[data-testid="category-filter"]', 'electronics');
      await page.fill('[data-testid="min-price"]', '100');
      await page.fill('[data-testid="max-price"]', '300');
      await page.click('[data-testid="apply-filters"]');
      
      // Step 4: View product details
      await page.click('[data-testid="product-card"]:first-child');
      await expect(page).toHaveURL(/.*\/products\/.+/);
      
      await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-images"]')).toBeVisible();
      
      // Step 5: Select product options
      await page.selectOption('[data-testid="product-size"]', 'Large');
      await page.selectOption('[data-testid="product-color"]', 'Black');
      
      // Step 6: Add to cart
      await page.click('[data-testid="add-to-cart"]');
      
      // Verify cart update
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
      await expect(page.locator('[data-testid="cart-notification"]')).toContainText('Added to cart');
      
      // Step 7: View cart
      await page.click('[data-testid="cart-icon"]');
      await expect(page.locator('[data-testid="cart-sidebar"]')).toBeVisible();
      
      // Verify cart contents
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
      
      // Step 8: Proceed to checkout
      await page.click('[data-testid="checkout-button"]');
      await expect(page).toHaveURL(/.*\/checkout/);
      
      // Step 9: Fill shipping information
      await page.fill('[data-testid="shipping-email"]', 'customer@test.com');
      await page.fill('[data-testid="shipping-first-name"]', 'John');
      await page.fill('[data-testid="shipping-last-name"]', 'Doe');
      await page.fill('[data-testid="shipping-address"]', '123 Main St');
      await page.fill('[data-testid="shipping-city"]', 'New York');
      await page.selectOption('[data-testid="shipping-state"]', 'NY');
      await page.fill('[data-testid="shipping-zip"]', '10001');
      
      // Step 10: Fill payment information
      // Note: Using Stripe test mode
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.fill('[name="cardnumber"]', '4242424242424242');
      await cardFrame.fill('[name="exp-date"]', '12/25');
      await cardFrame.fill('[name="cvc"]', '123');
      
      // Step 11: Complete purchase
      await page.click('[data-testid="complete-order"]');
      
      // Step 12: Verify order confirmation
      await expect(page).toHaveURL(/.*\/order\/confirmation/);
      await expect(page.locator('[data-testid="order-success"]')).toContainText('Order confirmed');
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
      
      // Step 13: Verify email confirmation (mock check)
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      expect(orderNumber).toMatch(/^ORD-\d+$/);
    });

    test('should handle cart persistence across sessions', async ({ page, context }) => {
      await page.goto('/stores/test-store');
      
      // Add item to cart
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart"]');
      
      // Verify cart count
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
      
      // Close and reopen browser
      await page.close();
      const newPage = await context.newPage();
      await newPage.goto('/stores/test-store');
      
      // Cart should persist
      await expect(newPage.locator('[data-testid="cart-count"]')).toContainText('1');
    });
  });

  test.describe('Order Management Journey @smoke', () => {
    test('should allow merchant to manage orders and send updates', async ({ page }) => {
      // Login as merchant
      await page.goto('/admin/login');
      await page.fill('[data-testid="email"]', 'merchant@test.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to orders
      await page.click('[data-testid="orders-nav"]');
      await expect(page).toHaveURL(/.*\/admin\/orders/);
      
      // Verify orders table
      await expect(page.locator('[data-testid="orders-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-row"]')).toHaveCount.greaterThan(0);
      
      // Filter orders by status
      await page.selectOption('[data-testid="status-filter"]', 'pending');
      await expect(page.locator('[data-testid="order-row"]')).toHaveCount.greaterThan(0);
      
      // Update order status
      await page.click('[data-testid="order-row"]:first-child [data-testid="order-actions"]');
      await page.selectOption('[data-testid="status-select"]', 'processing');
      await page.click('[data-testid="update-status"]');
      
      // Verify status update
      await expect(page.locator('[data-testid="order-row"]:first-child [data-testid="order-status"]'))
        .toContainText('processing');
      
      // Add tracking information
      await page.click('[data-testid="add-tracking"]');
      await page.fill('[data-testid="tracking-number"]', 'TRK123456789');
      await page.fill('[data-testid="tracking-url"]', 'https://tracking.example.com/TRK123456789');
      await page.click('[data-testid="save-tracking"]');
      
      // Verify tracking added
      await expect(page.locator('[data-testid="tracking-info"]')).toContainText('TRK123456789');
      
      // Send customer notification
      await page.click('[data-testid="send-notification"]');
      await expect(page.locator('[data-testid="notification-sent"]')).toBeVisible();
    });

    test('should display analytics dashboard with revenue metrics', async ({ page }) => {
      await page.goto('/admin/login');
      await page.fill('[data-testid="email"]', 'merchant@test.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to analytics
      await page.click('[data-testid="analytics-nav"]');
      await expect(page).toHaveURL(/.*\/admin\/analytics/);
      
      // Verify dashboard components
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="orders-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-summary"]')).toBeVisible();
      
      // Test time period filters
      await page.click('[data-testid="weekly-tab"]');
      await expect(page.locator('[data-testid="weekly-revenue"]')).toBeVisible();
      
      await page.click('[data-testid="monthly-tab"]');
      await expect(page.locator('[data-testid="monthly-revenue"]')).toBeVisible();
      
      // Verify metrics display
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-order-value"]')).toBeVisible();
    });
  });

  test.describe('Customer Account Management @smoke', () => {
    test('should allow customer to create account and manage profile', async ({ page }) => {
      // Customer registration
      await page.goto('/stores/test-store');
      await page.click('[data-testid="account-menu"]');
      await page.click('[data-testid="create-account"]');
      
      await page.fill('[data-testid="customer-email"]', 'customer@test.com');
      await page.fill('[data-testid="customer-password"]', 'CustomerPass123!');
      await page.fill('[data-testid="confirm-password"]', 'CustomerPass123!');
      await page.fill('[data-testid="first-name"]', 'Jane');
      await page.fill('[data-testid="last-name"]', 'Smith');
      
      await page.click('[data-testid="create-account-button"]');
      
      // Verify account creation
      await expect(page.locator('[data-testid="account-created"]')).toBeVisible();
      
      // Navigate to account dashboard
      await page.click('[data-testid="account-menu"]');
      await page.click('[data-testid="my-account"]');
      
      // Verify account sections
      await expect(page.locator('[data-testid="order-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="address-book"]')).toBeVisible();
      await expect(page.locator('[data-testid="profile-settings"]')).toBeVisible();
      
      // Update profile information
      await page.click('[data-testid="edit-profile"]');
      await page.fill('[data-testid="phone-number"]', '+1234567890');
      await page.click('[data-testid="save-profile"]');
      
      // Verify profile update
      await expect(page.locator('[data-testid="profile-updated"]')).toBeVisible();
      
      // Add shipping address
      await page.click('[data-testid="add-address"]');
      await page.fill('[data-testid="address-name"]', 'Home');
      await page.fill('[data-testid="address-line1"]', '456 Oak Ave');
      await page.fill('[data-testid="address-city"]', 'Brooklyn');
      await page.selectOption('[data-testid="address-state"]', 'NY');
      await page.fill('[data-testid="address-zip"]', '11201');
      await page.click('[data-testid="save-address"]');
      
      // Verify address added
      await expect(page.locator('[data-testid="address-list"]')).toContainText('456 Oak Ave');
    });

    test('should display order history with tracking information', async ({ page }) => {
      // Login as existing customer
      await page.goto('/stores/test-store/login');
      await page.fill('[data-testid="email"]', 'customer@test.com');
      await page.fill('[data-testid="password"]', 'CustomerPass123!');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to order history
      await page.click('[data-testid="account-menu"]');
      await page.click('[data-testid="order-history"]');
      
      // Verify order history display
      await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-item"]')).toHaveCount.greaterThan(0);
      
      // View order details
      await page.click('[data-testid="order-item"]:first-child [data-testid="view-order"]');
      
      // Verify order details
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
      
      // Track order if tracking available
      const trackingButton = page.locator('[data-testid="track-order"]');
      if (await trackingButton.isVisible()) {
        await trackingButton.click();
        await expect(page.locator('[data-testid="tracking-timeline"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility and Performance', () => {
    test('should meet accessibility standards', async ({ page }) => {
      await page.goto('/stores/test-store');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      // Test screen reader compatibility
      const productCards = page.locator('[data-testid="product-card"]');
      for (let i = 0; i < await productCards.count(); i++) {
        const card = productCards.nth(i);
        await expect(card.locator('img')).toHaveAttribute('alt');
      }
      
      // Test color contrast (would need axe-playwright for full testing)
      await expect(page.locator('body')).toBeVisible();
    });

    test('should meet performance budgets', async ({ page }) => {
      // Navigate to storefront
      const startTime = Date.now();
      await page.goto('/stores/test-store');
      
      // Wait for main content to load
      await page.waitForSelector('[data-testid="product-grid"]');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals (simplified)
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {};
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                metrics.LCP = entry.startTime;
              }
            });
            resolve(metrics);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
        });
      });
      
      // LCP should be under 2.5 seconds
      if (performanceMetrics.LCP) {
        expect(performanceMetrics.LCP).toBeLessThan(2500);
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate offline scenario
      await page.context().setOffline(true);
      
      await page.goto('/stores/test-store');
      
      // Should show offline message or cached content
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Restore connection
      await page.context().setOffline(false);
      await page.reload();
      
      // Should work normally
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    });

    test('should handle payment failures', async ({ page }) => {
      await page.goto('/stores/test-store');
      
      // Add item to cart and proceed to checkout
      await page.click('[data-testid="product-card"]:first-child');
      await page.click('[data-testid="add-to-cart"]');
      await page.click('[data-testid="cart-icon"]');
      await page.click('[data-testid="checkout-button"]');
      
      // Fill checkout form
      await page.fill('[data-testid="shipping-email"]', 'test@example.com');
      await page.fill('[data-testid="shipping-first-name"]', 'Test');
      await page.fill('[data-testid="shipping-last-name"]', 'User');
      await page.fill('[data-testid="shipping-address"]', '123 Test St');
      await page.fill('[data-testid="shipping-city"]', 'Test City');
      await page.fill('[data-testid="shipping-zip"]', '12345');
      
      // Use declined test card
      const cardFrame = page.frameLocator('[data-testid="stripe-card-element"] iframe');
      await cardFrame.fill('[name="cardnumber"]', '4000000000000002'); // Declined card
      await cardFrame.fill('[name="exp-date"]', '12/25');
      await cardFrame.fill('[name="cvc"]', '123');
      
      await page.click('[data-testid="complete-order"]');
      
      // Should show payment error
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('declined');
    });
  });
});