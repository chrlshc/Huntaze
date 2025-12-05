/**
 * **Feature: dashboard-ux-overhaul, Property 2: Active Route Highlighting**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any valid dashboard route, the sidebar SHALL correctly highlight 
 * the matching section and item based on the current pathname.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  SIDEBAR_SECTIONS, 
  isRouteActive, 
  isSectionActive 
} from '@/src/components/sidebar-config';

// Generate all valid routes from sidebar config
function getAllRoutes(): string[] {
  const routes: string[] = [];
  
  for (const section of SIDEBAR_SECTIONS) {
    if (section.href) {
      routes.push(section.href);
    }
    if (section.items) {
      for (const item of section.items) {
        routes.push(item.href);
      }
    }
  }
  
  return routes;
}

// Generate nested routes (e.g., /onlyfans/messages/123)
function generateNestedRoute(baseRoute: string): fc.Arbitrary<string> {
  return fc.tuple(
    fc.constant(baseRoute),
    fc.stringOf(fc.constantFrom('a', 'b', 'c', '1', '2', '3', '-', '_'), { minLength: 1, maxLength: 10 })
  ).map(([base, suffix]) => `${base}/${suffix}`);
}

describe('Active Route Highlighting Property', () => {
  const allRoutes = getAllRoutes();

  /**
   * Property 2a: Exact route match should be active
   */
  it('should mark exact route matches as active', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoutes),
        (route) => {
          const isActive = isRouteActive(route, route);
          expect(isActive).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: Nested routes should activate parent
   */
  it('should mark nested routes as active for parent route', () => {
    // Test specific nested routes
    const nestedRouteTests = [
      { pathname: '/onlyfans/messages/123', parentHref: '/onlyfans/messages', expected: true },
      { pathname: '/analytics/revenue/details', parentHref: '/analytics/revenue', expected: true },
      { pathname: '/marketing/campaigns/new', parentHref: '/marketing/campaigns', expected: true },
      { pathname: '/automations/flows/edit', parentHref: '/automations/flows', expected: true },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...nestedRouteTests),
        (test) => {
          const isActive = isRouteActive(test.pathname, test.parentHref);
          expect(isActive).toBe(test.expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2c: Unrelated routes should not be active
   */
  it('should not mark unrelated routes as active', () => {
    const unrelatedTests = [
      { pathname: '/onlyfans/messages', href: '/analytics', expected: false },
      { pathname: '/dashboard', href: '/onlyfans', expected: false },
      { pathname: '/marketing/campaigns', href: '/content', expected: false },
      { pathname: '/settings', href: '/integrations', expected: false },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...unrelatedTests),
        (test) => {
          const isActive = isRouteActive(test.pathname, test.href);
          expect(isActive).toBe(test.expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2d: Section should be active when any of its items is active
   */
  it('should mark section as active when any item route matches', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS.filter(s => s.items && s.items.length > 0)),
        (section) => {
          // For each section with items, test that the section is active when on any item route
          for (const item of section.items!) {
            const sectionIsActive = isSectionActive(item.href, section);
            expect(sectionIsActive).toBe(true);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2e: Section with direct href should be active on exact match
   */
  it('should mark section with direct href as active on exact match', () => {
    const sectionsWithHref = SIDEBAR_SECTIONS.filter(s => s.href && !s.items);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...sectionsWithHref),
        (section) => {
          const isActive = isSectionActive(section.href!, section);
          expect(isActive).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2f: Null pathname should never be active
   */
  it('should return false for null pathname', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoutes),
        (href) => {
          const isActive = isRouteActive(null, href);
          expect(isActive).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2g: OnlyFans section should be active for all OnlyFans routes
   */
  it('should mark OnlyFans section as active for all OnlyFans routes', () => {
    const onlyfansSection = SIDEBAR_SECTIONS.find(s => s.id === 'onlyfans')!;
    const onlyfansRoutes = [
      '/onlyfans',
      '/onlyfans/messages',
      '/onlyfans/fans',
      '/onlyfans/ppv',
      '/onlyfans/settings',
      '/onlyfans/messages/123',
      '/onlyfans/fans/456',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...onlyfansRoutes),
        (route) => {
          const isActive = isSectionActive(route, onlyfansSection);
          expect(isActive).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2h: Analytics section should be active for all Analytics routes
   */
  it('should mark Analytics section as active for all Analytics routes', () => {
    const analyticsSection = SIDEBAR_SECTIONS.find(s => s.id === 'analytics')!;
    const analyticsRoutes = [
      '/analytics',
      '/analytics/revenue',
      '/analytics/fans',
      '/analytics/churn',
      '/analytics/pricing',
      '/analytics/forecast',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...analyticsRoutes),
        (route) => {
          const isActive = isSectionActive(route, analyticsSection);
          expect(isActive).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
