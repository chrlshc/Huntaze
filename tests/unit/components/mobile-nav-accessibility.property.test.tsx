/**
 * Property-Based Tests for MobileNav Accessibility
 * 
 * Tests that mobile navigation is accessible via keyboard and screen readers
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { MobileNav } from '@/components/layout/MobileNav';
import { navigationConfig } from '@/config/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileNav Accessibility Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOnClose = vi.fn();

  /**
   * Property 20: Mobile nav accessibility
   * 
   * For any mobile navigation drawer, it should be navigable via keyboard
   * and include proper ARIA attributes for screen readers.
   * 
   * Validates: Requirements 7.5
   * 
   * Feature: site-restructure-multipage, Property 20: Mobile nav accessibility
   */
  describe('Property 20: Mobile nav accessibility', () => {
    it('should have dialog role for screen readers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should have dialog role
            const dialog = container.querySelector('[role="dialog"]');
            expect(dialog).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have aria-modal attribute', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const dialog = container.querySelector('[role="dialog"]');
            expect(dialog?.getAttribute('aria-modal')).toBe('true');

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have aria-label for screen readers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const dialog = container.querySelector('[role="dialog"]');
            const ariaLabel = dialog?.getAttribute('aria-label');
            
            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel).toContain('navigation');

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have close button with aria-label', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const closeButton = container.querySelector('button[aria-label*="Close"]');
            expect(closeButton).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have navigation with aria-label', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const nav = container.querySelector('nav[aria-label]');
            expect(nav).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have focusable elements (buttons and links)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should have focusable elements
            const focusableElements = container.querySelectorAll('button, a');
            expect(focusableElements.length).toBeGreaterThan(0);

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have all links as keyboard accessible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // All navigation links should be anchor tags (keyboard accessible)
            const navLinks = container.querySelectorAll('nav a');
            expect(navLinks.length).toBe(navigationConfig.main.length);

            // Each link should have href
            navLinks.forEach((link) => {
              expect(link.getAttribute('href')).toBeTruthy();
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should hide decorative icons from screen readers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Icons should have aria-hidden
            const icons = container.querySelectorAll('svg');
            icons.forEach((icon) => {
              expect(icon.getAttribute('aria-hidden')).toBe('true');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain accessibility when closed', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isOpen) => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={isOpen}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const dialog = container.querySelector('[role="dialog"]');

            if (isOpen) {
              // Should have dialog when open
              expect(dialog).toBeTruthy();
              expect(dialog?.getAttribute('aria-modal')).toBe('true');
            } else {
              // Should not have dialog when closed
              expect(dialog).toBeNull();
            }

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have proper button type for close button', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            const closeButton = container.querySelector('button[aria-label*="Close"]');
            expect(closeButton?.getAttribute('type')).toBe('button');

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain accessibility attributes across renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const accessibilityFeatures: string[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(
                <MobileNav
                  isOpen={true}
                  onClose={mockOnClose}
                  navItems={navigationConfig.main}
                />
              );

              const dialog = container.querySelector('[role="dialog"]');
              const hasDialog = !!dialog;
              const hasAriaModal = dialog?.getAttribute('aria-modal') === 'true';
              const hasAriaLabel = !!dialog?.getAttribute('aria-label');
              const hasNav = !!container.querySelector('nav[aria-label]');
              const hasCloseButton = !!container.querySelector('button[aria-label*="Close"]');

              const features = `dialog:${hasDialog},modal:${hasAriaModal},label:${hasAriaLabel},nav:${hasNav},close:${hasCloseButton}`;
              accessibilityFeatures.push(features);

              unmount();
            }

            // All renders should have same accessibility features
            const firstFeatures = accessibilityFeatures[0];
            expect(accessibilityFeatures.every(f => f === firstFeatures)).toBe(true);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Keyboard Navigation Support
   * 
   * Verifies keyboard interaction capabilities
   */
  describe('Keyboard Navigation Support', () => {
    it('should have all interactive elements keyboard accessible', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Get all interactive elements
            const buttons = container.querySelectorAll('button');
            const links = container.querySelectorAll('a');

            // All should be keyboard accessible (no tabindex="-1")
            [...buttons, ...links].forEach((element) => {
              const tabindex = element.getAttribute('tabindex');
              expect(tabindex).not.toBe('-1');
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have CTA buttons as keyboard accessible links', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // CTA buttons should be anchor tags with href
            const ctaLinks = container.querySelectorAll('a[href*="/auth"]');
            expect(ctaLinks.length).toBeGreaterThan(0);

            ctaLinks.forEach((link) => {
              expect(link.getAttribute('href')).toBeTruthy();
            });

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Screen Reader Support
   * 
   * Verifies proper semantic HTML and ARIA attributes
   */
  describe('Screen Reader Support', () => {
    it('should use semantic HTML elements', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Should use semantic nav element
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();

            // Should use semantic list for navigation items
            const list = container.querySelector('ul');
            expect(list).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide context through ARIA labels', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container, unmount } = render(
              <MobileNav
                isOpen={true}
                onClose={mockOnClose}
                navItems={navigationConfig.main}
              />
            );

            // Dialog should have descriptive label
            const dialog = container.querySelector('[role="dialog"]');
            const dialogLabel = dialog?.getAttribute('aria-label');
            expect(dialogLabel).toBeTruthy();

            // Nav should have descriptive label
            const nav = container.querySelector('nav');
            const navLabel = nav?.getAttribute('aria-label');
            expect(navLabel).toBeTruthy();

            // Close button should have descriptive label
            const closeButton = container.querySelector('button');
            const buttonLabel = closeButton?.getAttribute('aria-label');
            expect(buttonLabel).toBeTruthy();

            unmount();
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
