/**
 * Property-Based Tests for MobileNav Link Parity
 * 
 * Tests that mobile navigation contains the same links as desktop navigation
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { MobileNav } from '@/components/layout/MobileNav';
import { navigationConfig, NavItem } from '@/config/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileNav Link Parity Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnClose = vi.fn();

  /**
   * Property 18: Mobile nav link parity
   * 
   * For any navigation configuration, the mobile navigation drawer should contain
   * the same links as the desktop navigation.
   * 
   * Validates: Requirements 7.3
   * 
   * Feature: site-restructure-multipage, Property 18: Mobile nav link parity
   */
  describe('Property 18: Mobile nav link parity', () => {
    it('should render all navigation items from config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should include all navigation items
            navigationConfig.main.forEach((item) => {
              const links = screen.getAllByText(item.label);
              expect(links.length).toBeGreaterThan(0);
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have same number of links as provided navItems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Count navigation links (excluding CTA buttons)
            const navLinks = container.querySelectorAll('nav a');
            
            // Should have exactly the same number of links as config
            expect(navLinks.length).toBe(navigationConfig.main.length);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include all hrefs from navigation config', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should have all hrefs from config
            navigationConfig.main.forEach((item) => {
              const link = container.querySelector(`nav a[href="${item.href}"]`);
              expect(link).toBeTruthy();
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain link parity with custom navItems array', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.record({
              label: fc.constantFrom('Features', 'Pricing', 'About', 'Contact'),
              href: fc.constantFrom('/features', '/pricing', '/about', '/contact'),
            }),
            { minLength: 1, maxLength: 4, selector: (item) => item.href }
          ),
          (customNavItems) => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={customNavItems as NavItem[]}
              />
            );

            // Should render exactly the provided items
            const navLinks = container.querySelectorAll('nav a');
            expect(navLinks.length).toBe(customNavItems.length);

            // Each custom item should be present
            customNavItems.forEach((item) => {
              const link = container.querySelector(`nav a[href="${item.href}"]`);
              expect(link).toBeTruthy();
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render links in the same order as navItems array', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const navLinks = Array.from(container.querySelectorAll('nav a'));
            
            // Links should be in same order as config
            navigationConfig.main.forEach((item, index) => {
              const link = navLinks[index];
              expect(link?.getAttribute('href')).toBe(item.href);
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not render when isOpen is false', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={false}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should not render drawer when closed
            const drawer = container.querySelector('[role="dialog"]');
            expect(drawer).toBeNull();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render all links when isOpen is true', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isOpen) => {
            const { container } = render(
              <MobileNav
                isOpen={isOpen}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const navLinks = container.querySelectorAll('nav a');

            if (isOpen) {
              // Should have all links when open
              expect(navLinks.length).toBe(navigationConfig.main.length);
            } else {
              // Should have no links when closed
              expect(navLinks.length).toBe(0);
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should include link labels exactly as provided', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Each label should appear exactly as in config
            navigationConfig.main.forEach((item) => {
              const elements = screen.getAllByText(item.label);
              expect(elements.length).toBeGreaterThan(0);
              expect(elements[0].textContent).toBe(item.label);
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render descriptions when provided in navItems', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should render descriptions for items that have them
            navigationConfig.main.forEach((item) => {
              if (item.description) {
                const descriptions = screen.getAllByText(item.description);
                expect(descriptions.length).toBeGreaterThan(0);
              }
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain parity across multiple renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const linkCounts: number[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(
                <MobileNav
                  isOpen={true}
                  onClose={mockOnClose}
                  navItems={navigationConfig.main}
                />
              );

              const navLinks = container.querySelectorAll('nav a');
              linkCounts.push(navLinks.length);

              unmount();
            }

            // All renders should have same number of links
            const firstCount = linkCounts[0];
            expect(linkCounts.every(count => count === firstCount)).toBe(true);
            expect(firstCount).toBe(navigationConfig.main.length);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Navigation Completeness
   * 
   * Verifies that mobile nav includes all necessary navigation elements
   */
  describe('Navigation Completeness', () => {
    it('should include CTA buttons in addition to nav links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should have Sign In and Get Started buttons
            const signIn = screen.getAllByText('Sign In');
            const getStarted = screen.getAllByText('Get Started');
            
            expect(signIn.length).toBeGreaterThan(0);
            expect(getStarted.length).toBeGreaterThan(0);

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have close button for accessibility', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should have close button
            const closeButton = container.querySelector('button[aria-label*="Close"]');
            expect(closeButton).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should render as dialog with proper ARIA attributes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should be a dialog
            const dialog = container.querySelector('[role="dialog"]');
            expect(dialog).toBeTruthy();
            expect(dialog?.getAttribute('aria-modal')).toBe('true');
            expect(dialog?.getAttribute('aria-label')).toBeTruthy();

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
