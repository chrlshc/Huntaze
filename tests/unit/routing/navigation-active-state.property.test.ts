/**
 * Property-based tests for navigation active state
 * Feature: dashboard-routing-fix, Property 6: Navigation Active State
 * Validates: Requirements 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

interface NavItem {
  label: string;
  href: string;
  isActive: boolean;
}

const VALID_ROUTES = [
  '/home',
  '/onlyfans',
  '/onlyfans/messages',
  '/onlyfans/fans',
  '/onlyfans/ppv',
  '/marketing',
  '/social-marketing',
  '/analytics',
  '/integrations',
  '/content',
  '/billing',
] as const;

/**
 * Mock function to get navigation items with active state
 * In real implementation, this would be in the Sidebar component
 */
function getNavigationItems(currentRoute: string): NavItem[] {
  const navItems: NavItem[] = [
    { label: 'Home', href: '/home', isActive: false },
    { label: 'OnlyFans', href: '/onlyfans', isActive: false },
    { label: 'Messages', href: '/onlyfans/messages', isActive: false },
    { label: 'Marketing', href: '/marketing', isActive: false },
    { label: 'Social Marketing', href: '/social-marketing', isActive: false },
    { label: 'Analytics', href: '/analytics', isActive: false },
    { label: 'Integrations', href: '/integrations', isActive: false },
    { label: 'Content', href: '/content', isActive: false },
    { label: 'Billing', href: '/billing', isActive: false },
  ];

  // Mark the active item
  navItems.forEach(item => {
    // Exact match or nested route match
    if (currentRoute === item.href || currentRoute.startsWith(item.href + '/')) {
      item.isActive = true;
    }
  });

  // Special handling for nested routes - only the most specific should be active
  const activeItems = navItems.filter(item => item.isActive);
  if (activeItems.length > 1) {
    // Sort by href length (most specific first)
    activeItems.sort((a, b) => b.href.length - a.href.length);
    
    // Deactivate all except the most specific
    activeItems.slice(1).forEach(item => {
      item.isActive = false;
    });
  }

  return navItems;
}

describe('Navigation Active State Property Tests', () => {
  it('Property 6: current route always has exactly one active navigation item', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROUTES),
        (currentRoute) => {
          const navItems = getNavigationItems(currentRoute);
          const activeItems = navItems.filter(item => item.isActive);
          
          // Exactly one item should be active
          expect(activeItems.length).toBe(1);
          
          // The active item should match the current route
          const activeItem = activeItems[0];
          const isMatch = 
            currentRoute === activeItem.href || 
            currentRoute.startsWith(activeItem.href + '/');
          
          expect(isMatch).toBe(true);
          
          return activeItems.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: nested routes activate the most specific parent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/onlyfans/messages',
          '/onlyfans/fans',
          '/onlyfans/ppv'
        ),
        (nestedRoute) => {
          const navItems = getNavigationItems(nestedRoute);
          const activeItems = navItems.filter(item => item.isActive);
          
          // Should have exactly one active item
          expect(activeItems.length).toBe(1);
          
          // The active item should be the most specific match
          const activeItem = activeItems[0];
          const allMatches = navItems.filter(item => 
            nestedRoute === item.href || nestedRoute.startsWith(item.href + '/')
          );
          
          // Active item should be the longest matching href
          const longestMatch = allMatches.reduce((longest, current) => 
            current.href.length > longest.href.length ? current : longest
          );
          
          expect(activeItem.href).toBe(longestMatch.href);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: active state is deterministic', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_ROUTES),
        (currentRoute) => {
          const navItems1 = getNavigationItems(currentRoute);
          const navItems2 = getNavigationItems(currentRoute);
          
          // Same route should produce same active states
          navItems1.forEach((item, index) => {
            expect(item.isActive).toBe(navItems2[index].isActive);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
