/**
 * Visual Regression Testing for Marketing Pages
 * 
 * This test suite captures screenshots of all marketing pages
 * in both desktop and mobile viewports, including interactive states.
 * 
 * Requirements: 1.2 (hover feedback), 1.4 (active states)
 */

import { test, expect, Page } from '@playwright/test';

// Marketing pages to test
const MARKETING_PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/features', name: 'features' },
  { path: '/pricing', name: 'pricing' },
  { path: '/about', name: 'about' },
  { path: '/case-studies', name: 'case-studies' },
];

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
};

/**
 * Wait for page to be fully loaded and stable
 */
async function waitForPageStable(page: Page) {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
  
  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Hide dynamic content that changes between runs
 */
async function hideDynamicContent(page: Page) {
  await page.addStyleTag({
    content: `
      /* Hide elements that change between runs */
      [data-testid="timestamp"],
      .timestamp,
      time {
        visibility: hidden !important;
      }
    `
  });
}

test.describe('Visual Regression - Desktop', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  for (const { path, name } of MARKETING_PAGES) {
    test(`${name} - desktop viewport`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture full page screenshot
      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test(`${name} - desktop header hover states`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Find navigation links in header
      const navLinks = page.locator('header nav a, header nav button');
      const count = await navLinks.count();

      if (count > 0) {
        // Hover over the first navigation link
        await navLinks.first().hover();
        await page.waitForTimeout(200); // Wait for hover animation

        // Capture header with hover state
        const header = page.locator('header');
        await expect(header).toHaveScreenshot(`${name}-desktop-header-hover.png`, {
          animations: 'disabled',
        });
      }
    });

    test(`${name} - desktop active navigation state`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture header showing active navigation state
      const header = page.locator('header');
      await expect(header).toHaveScreenshot(`${name}-desktop-header-active.png`, {
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  for (const { path, name } of MARKETING_PAGES) {
    test(`${name} - mobile viewport`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture full page screenshot
      await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test(`${name} - mobile navigation drawer`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Find and click hamburger menu
      const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], header button:has(svg)').first();
      
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(300); // Wait for drawer animation

        // Capture page with open mobile navigation
        await expect(page).toHaveScreenshot(`${name}-mobile-nav-open.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test(`${name} - mobile header`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture just the mobile header
      const header = page.locator('header');
      await expect(header).toHaveScreenshot(`${name}-mobile-header.png`, {
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Tablet', () => {
  test.use({ viewport: VIEWPORTS.tablet });

  for (const { path, name } of MARKETING_PAGES) {
    test(`${name} - tablet viewport`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture full page screenshot
      await expect(page).toHaveScreenshot(`${name}-tablet.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Interactive Elements', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('homepage - CTA button hover states', async ({ page }) => {
    await page.goto('/');
    await waitForPageStable(page);
    await hideDynamicContent(page);

    // Find primary CTA buttons
    const ctaButtons = page.locator('a[href*="signup"], a[href*="register"], button:has-text("Get Started"), button:has-text("Sign Up")');
    const count = await ctaButtons.count();

    if (count > 0) {
      const firstCta = ctaButtons.first();
      
      // Scroll into view
      await firstCta.scrollIntoViewIfNeeded();
      
      // Hover over CTA
      await firstCta.hover();
      await page.waitForTimeout(200);

      // Capture CTA with hover state
      await expect(firstCta).toHaveScreenshot('homepage-cta-hover.png', {
        animations: 'disabled',
      });
    }
  });

  test('features page - feature card hover states', async ({ page }) => {
    await page.goto('/features');
    await waitForPageStable(page);
    await hideDynamicContent(page);

    // Find feature cards
    const featureCards = page.locator('[data-testid*="feature"], .feature-card, article').first();
    
    if (await featureCards.isVisible()) {
      await featureCards.scrollIntoViewIfNeeded();
      await featureCards.hover();
      await page.waitForTimeout(200);

      // Capture feature card with hover state
      await expect(featureCards).toHaveScreenshot('features-card-hover.png', {
        animations: 'disabled',
      });
    }
  });

  test('pricing page - pricing card hover states', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageStable(page);
    await hideDynamicContent(page);

    // Find pricing cards
    const pricingCards = page.locator('[data-testid*="pricing"], .pricing-card, article').first();
    
    if (await pricingCards.isVisible()) {
      await pricingCards.scrollIntoViewIfNeeded();
      await pricingCards.hover();
      await page.waitForTimeout(200);

      // Capture pricing card with hover state
      await expect(pricingCards).toHaveScreenshot('pricing-card-hover.png', {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Footer', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('footer consistency across pages', async ({ page }) => {
    for (const { path, name } of MARKETING_PAGES) {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      // Capture footer
      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot(`${name}-footer.png`, {
        animations: 'disabled',
      });
    }
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test.use({ 
    viewport: VIEWPORTS.desktop,
    colorScheme: 'dark',
  });

  for (const { path, name } of MARKETING_PAGES) {
    test(`${name} - dark mode`, async ({ page }) => {
      await page.goto(path);
      await waitForPageStable(page);
      await hideDynamicContent(page);

      // Capture full page in dark mode
      await expect(page).toHaveScreenshot(`${name}-dark-mode.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
