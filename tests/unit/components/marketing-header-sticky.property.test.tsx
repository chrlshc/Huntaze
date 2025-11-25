/**
 * Property-Based Tests for MarketingHeader Sticky Positioning
 * 
 * Tests that the header maintains sticky positioning at the top of the viewport
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

describe('MarketingHeader Sticky Positioning Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 5: Sticky header positioning
   * 
   * For any scroll position on a marketing page, the header should remain visible
   * at the top of the viewport.
   * 
   * Validates: Requirements 1.5
   * 
   * Feature: site-restructure-multipage, Property 5: Sticky header positioning
   */
  describe('Property 5: Sticky header positioning', () => {
    it('should have sticky positioning CSS class', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have sticky positioning
            expect(classes).toContain('sticky');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should be positioned at top-0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should be positioned at top
            expect(classes).toContain('top-0');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have high z-index for layering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have z-index for proper layering
            expect(classes).toMatch(/z-\d+/);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should span full width', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should span full width
            expect(classes).toContain('w-full');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have backdrop blur for visual effect', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have backdrop blur
            expect(classes).toContain('backdrop-blur');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain sticky positioning with custom className', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')),
          (customClass) => {
            const { container } = render(<MarketingHeader className={customClass} />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should still have sticky positioning
            expect(classes).toContain('sticky');
            expect(classes).toContain('top-0');
            
            // Should also have custom class
            expect(classes).toContain(customClass);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have consistent positioning across multiple renders', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (renderCount) => {
            const positioningClasses: string[] = [];

            for (let i = 0; i < renderCount; i++) {
              const { container, unmount } = render(<MarketingHeader />);
              
              const header = container.querySelector('header');
              const classes = header?.className || '';
              
              // Extract positioning-related classes
              const hasSticky = classes.includes('sticky');
              const hasTop0 = classes.includes('top-0');
              const hasZIndex = /z-\d+/.test(classes);
              const hasFullWidth = classes.includes('w-full');
              
              const positioning = `sticky:${hasSticky},top:${hasTop0},z:${hasZIndex},w:${hasFullWidth}`;
              positioningClasses.push(positioning);
              
              unmount();
            }

            // All positioning should be identical
            const firstPositioning = positioningClasses[0];
            expect(positioningClasses.every(p => p === firstPositioning)).toBe(true);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should combine sticky with border for visual separation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have border for visual separation
            expect(classes).toMatch(/border/);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should have background with transparency for sticky effect', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have background with transparency
            expect(classes).toMatch(/bg-background/);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain all sticky-related properties together', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes(' ')), { nil: undefined }),
          (customClass) => {
            const { container } = render(<MarketingHeader className={customClass} />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // All sticky-related properties should be present
            expect(classes).toContain('sticky');
            expect(classes).toContain('top-0');
            expect(classes).toMatch(/z-\d+/);
            expect(classes).toContain('w-full');
            expect(classes).toContain('backdrop-blur');
            expect(classes).toMatch(/bg-background/);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Sticky Header Visual Properties
   * 
   * Verifies visual properties that support sticky positioning
   */
  describe('Sticky Header Visual Properties', () => {
    it('should have proper height for consistent header size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            // Should have a container with defined height
            const innerContainer = header?.querySelector('.container');
            expect(innerContainer).toBeTruthy();
            
            const classes = innerContainer?.className || '';
            expect(classes).toMatch(/h-\d+/);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain visual consistency when sticky', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const { container } = render(<MarketingHeader />);

            const header = container.querySelector('header');
            expect(header).toBeTruthy();

            const classes = header?.className || '';
            
            // Should have all visual properties for sticky state
            const hasSticky = classes.includes('sticky');
            const hasBackdrop = classes.includes('backdrop-blur');
            const hasBorder = /border/.test(classes);
            const hasBackground = /bg-background/.test(classes);
            
            // All should be present together
            expect(hasSticky && hasBackdrop && hasBorder && hasBackground).toBe(true);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
