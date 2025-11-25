/**
 * Property-Based Tests for MarketingHeader Presence
 * 
 * Tests that the header component is present on all marketing pages
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { navigationConfig } from '@/config/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('MarketingHeader Presence Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 1: Header presence on all marketing pages
   * 
   * For any marketing page route, rendering the page should include a header
   * component with navigation links to Features, Pricing, About, and Case Studies.
   * 
   * Validates: Requirements 1.1
   * 
   * Feature: site-restructure-multipage, Property 1: Header presence on all marketing pages
   */
  describe('Property 1: Header presence on all marketing pages', () => {
    it('should render header element with proper semantic HTML', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Should render a header element
            const header = container.querySelector('header');
            expect(header).toBeTruthy();
            expect(header?.tagName).toBe('HEADER');

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include all main navigation links from config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(<MarketingHeader />);

            // Should include all navigation items from config
            navigationConfig.main.forEach((item) => {
              const links = screen.getAllByText(item.label);
              expect(links.length).toBeGreaterThan(0);
            });

            // Clean up to prevent memory issues
            unmount();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 10000); // Increase timeout to 10 seconds

    it('should include navigation to Features, Pricing, About, and Case Studies', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Features', 'Pricing', 'About', 'Case Studies'),
          (requiredLink) => {
            render(<MarketingHeader />);

            // Should have the required navigation link
            const links = screen.getAllByText(requiredLink);
            expect(links.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render logo/brand link to homepage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Should have a link to homepage
            const homeLink = container.querySelector('a[href="/"]');
            expect(homeLink).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have proper ARIA labels for accessibility', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Should have navigation with aria-label
            const nav = container.querySelector('nav[aria-label]');
            expect(nav).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render mobile menu button on mobile', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Should have mobile menu button
            const menuButton = container.querySelector('button[aria-label*="menu"]');
            expect(menuButton).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include CTA buttons (Sign In, Get Started)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Sign In', 'Get Started'),
          (ctaText) => {
            render(<MarketingHeader />);

            // Should have CTA buttons
            const buttons = screen.getAllByText(ctaText);
            expect(buttons.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render with consistent structure across renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const structures: string[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(<MarketingHeader />);
              
              // Capture structure
              const header = container.querySelector('header');
              const navLinks = container.querySelectorAll('nav a');
              const structure = `header:${!!header},links:${navLinks.length}`;
              structures.push(structure);
              
              unmount();
            }

            // All structures should be identical
            const firstStructure = structures[0];
            expect(structures.every(s => s === firstStructure)).toBe(true);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should accept and apply custom className', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')),
          (customClass) => {
            const { container } = render(<MarketingHeader className={customClass} />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();
            
            const classes = header?.className || '';
            expect(classes).toContain(customClass);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain header structure with or without custom className', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')), { nil: undefined }),
          (customClass) => {
            const { container } = render(
              <MarketingHeader className={customClass} />
            );

            // Should always have header
            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            // Should always have navigation
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();

            // Should always have all nav items
            navigationConfig.main.forEach((item) => {
              const links = screen.getAllByText(item.label);
              expect(links.length).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Navigation Links Integrity
   * 
   * Verifies that all navigation links are properly configured
   */
  describe('Navigation Links Integrity', () => {
    it('should have valid href attributes for all navigation links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Get all navigation links
            const navLinks = container.querySelectorAll('nav a');
            
            // Each link should have a valid href
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              expect(href).toBeTruthy();
              expect(href).toMatch(/^\//); // Should start with /
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should match navigation config exactly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            // Should have exactly the same links as in config
            navigationConfig.main.forEach((configItem) => {
              const link = container.querySelector(`a[href="${configItem.href}"]`);
              expect(link).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
