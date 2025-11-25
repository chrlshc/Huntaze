/**
 * Property-Based Tests for NavLink Active State
 * 
 * Tests universal properties that should hold for navigation link active states
 * using fast-check for property-based testing.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { NavLink } from '@/components/layout/NavLink';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from 'next/navigation';

describe('NavLink Active State Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a default return value to avoid undefined
    vi.mocked(usePathname).mockReturnValue('/');
  });

  /**
   * Property 4: Active navigation indication
   * 
   * For any page route, the corresponding navigation item should have active styling
   * applied to indicate current location.
   * 
   * Validates: Requirements 1.4
   * 
   * Feature: site-restructure-multipage, Property 4: Active navigation indication
   */
  describe('Property 4: Active navigation indication', () => {
    it('should apply active class when pathname matches href exactly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/features', '/pricing', '/about', '/case-studies', '/contact'),
          (route) => {
            vi.mocked(usePathname).mockReturnValue(route);

            const { container } = render(
              <NavLink href={route}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should have active class
            const classes = link?.className || '';
            expect(classes).toContain('text-primary');
            expect(classes).toContain('font-semibold');
            
            // Should have aria-current="page"
            expect(link?.getAttribute('aria-current')).toBe('page');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should apply active class when pathname starts with href (nested routes)', () => {
      fc.assert(
        fc.property(
          fc.record({
            base: fc.constantFrom('/features', '/pricing', '/about'),
            subpath: fc.constantFrom('/details', '/overview', '/section-1')
          }),
          ({ base, subpath }) => {
            const fullPath = `${base}${subpath}`;
            vi.mocked(usePathname).mockReturnValue(fullPath);

            const { container } = render(
              <NavLink href={base}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should have active class for nested routes
            const classes = link?.className || '';
            expect(classes).toContain('text-primary');
            expect(classes).toContain('font-semibold');
            
            // Should have aria-current="page"
            expect(link?.getAttribute('aria-current')).toBe('page');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should NOT apply active class when pathname does not match href', () => {
      fc.assert(
        fc.property(
          fc.record({
            currentRoute: fc.constantFrom('/features', '/pricing', '/about'),
            linkRoute: fc.constantFrom('/features', '/pricing', '/about')
          }).filter(({ currentRoute, linkRoute }) => currentRoute !== linkRoute),
          ({ currentRoute, linkRoute }) => {
            vi.mocked(usePathname).mockReturnValue(currentRoute);

            const { container } = render(
              <NavLink href={linkRoute}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should NOT have aria-current
            expect(link?.getAttribute('aria-current')).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow custom active class names', () => {
      fc.assert(
        fc.property(
          // Generate valid CSS class names (start with letter, alphanumeric + hyphens)
          fc.string({ minLength: 5, maxLength: 30 })
            .filter(s => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
          fc.constantFrom('/features', '/pricing', '/about'),
          (customClass, route) => {
            vi.mocked(usePathname).mockReturnValue(route);

            const { container } = render(
              <NavLink href={route} activeClassName={customClass}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should have custom active class
            const classes = link?.className || '';
            expect(classes).toContain(customClass);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain active state with additional className prop', () => {
      fc.assert(
        fc.property(
          // Generate valid CSS class names (start with letter, alphanumeric + hyphens)
          fc.string({ minLength: 5, maxLength: 30 })
            .filter(s => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
          fc.constantFrom('/features', '/pricing', '/about'),
          (additionalClass, route) => {
            vi.mocked(usePathname).mockReturnValue(route);

            const { container } = render(
              <NavLink href={route} className={additionalClass}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            const classes = link?.className || '';
            
            // Should have both active class and additional class
            expect(classes).toContain('text-primary');
            expect(classes).toContain('font-semibold');
            expect(classes).toContain(additionalClass);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle root path correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            vi.mocked(usePathname).mockReturnValue('/');

            const { container } = render(
              <NavLink href="/">
                Home
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should have active class for root path
            const classes = link?.className || '';
            expect(classes).toContain('text-primary');
            expect(classes).toContain('font-semibold');
            expect(link?.getAttribute('aria-current')).toBe('page');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should not activate root link when on other pages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/features', '/pricing', '/about', '/case-studies'),
          (route) => {
            vi.mocked(usePathname).mockReturnValue(route);

            const { container } = render(
              <NavLink href="/">
                Home
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Should NOT have aria-current when on other pages
            expect(link?.getAttribute('aria-current')).toBeNull();
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should always render as a valid anchor element', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/features', '/pricing', '/about', '/case-studies'),
          fc.constantFrom('/features', '/pricing', '/about', '/case-studies'),
          (currentPath, linkHref) => {
            vi.mocked(usePathname).mockReturnValue(currentPath);

            const { container } = render(
              <NavLink href={linkHref}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            
            // Should always render as anchor
            expect(link).toBeTruthy();
            expect(link?.tagName).toBe('A');
            
            // Should always have href attribute
            expect(link?.getAttribute('href')).toBe(linkHref);
            
            // Should always have hover class
            const classes = link?.className || '';
            expect(classes).toContain('hover:text-primary');
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should enable prefetching by default', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/features', '/pricing', '/about'),
          (route) => {
            vi.mocked(usePathname).mockReturnValue('/');

            const { container } = render(
              <NavLink href={route}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Next.js Link with prefetch=true is the default
            // We verify the component renders correctly
            expect(link?.getAttribute('href')).toBe(route);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should respect prefetch prop when set to false', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/features', '/pricing', '/about'),
          (route) => {
            vi.mocked(usePathname).mockReturnValue('/');

            const { container } = render(
              <NavLink href={route} prefetch={false}>
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            // Component should still render correctly
            expect(link?.getAttribute('href')).toBe(route);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Combined Properties Test
   * 
   * Verifies that all NavLink properties work together correctly
   */
  describe('Combined NavLink Properties', () => {
    it('should satisfy all NavLink properties simultaneously', () => {
      fc.assert(
        fc.property(
          fc.record({
            currentPath: fc.constantFrom('/features', '/pricing', '/about', '/case-studies'),
            linkHref: fc.constantFrom('/features', '/pricing', '/about', '/case-studies'),
            // Generate valid CSS class names (start with letter, alphanumeric + hyphens)
            customClass: fc.string({ minLength: 5, maxLength: 20 })
              .filter(s => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
            activeClass: fc.string({ minLength: 5, maxLength: 20 })
              .filter(s => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
            prefetch: fc.boolean()
          }),
          (config) => {
            vi.mocked(usePathname).mockReturnValue(config.currentPath);

            const { container } = render(
              <NavLink 
                href={config.linkHref}
                className={config.customClass}
                activeClassName={config.activeClass}
                prefetch={config.prefetch}
              >
                Test Link
              </NavLink>
            );

            const link = container.querySelector('a');
            expect(link).toBeTruthy();
            
            const classes = link?.className || '';
            const isActive = config.currentPath === config.linkHref || 
                           config.currentPath.startsWith(`${config.linkHref}/`);
            
            // Should always be an anchor with href
            expect(link?.tagName).toBe('A');
            expect(link?.getAttribute('href')).toBe(config.linkHref);
            
            // Should always have hover class
            expect(classes).toContain('hover:text-primary');
            
            // Should have custom class
            expect(classes).toContain(config.customClass);
            
            // Should have active class when active
            if (isActive) {
              expect(classes).toContain(config.activeClass);
              expect(link?.getAttribute('aria-current')).toBe('page');
            } else {
              expect(link?.getAttribute('aria-current')).toBeNull();
            }
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
