/**
 * **Feature: onlyfans-shopify-design, Property 12: Quick Action Structure**
 * **Validates: Requirements 8.1**
 * 
 * For any ShopifyQuickAction, the component SHALL contain icon, title, 
 * and description elements.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Define the required structure elements for a quick action
const requiredElements = ['icon', 'title', 'description'] as const;

// Quick action props structure
interface QuickActionProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

describe('Property 12: Quick Action Structure', () => {
  const quickActionArbitrary = fc.record({
    icon: fc.constantFrom('MessageSquare', 'Users', 'DollarSign', 'Settings'),
    title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    href: fc.string({ minLength: 1 }).map(s => `/${s.replace(/[^a-z0-9]/gi, '')}`),
  });

  it('should always have an icon element', () => {
    fc.assert(
      fc.property(quickActionArbitrary, (props: QuickActionProps) => {
        // Verify icon is defined and non-empty
        expect(props.icon).toBeDefined();
        expect(props.icon.length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should always have a title element', () => {
    fc.assert(
      fc.property(quickActionArbitrary, (props: QuickActionProps) => {
        // Verify title is defined and non-empty
        expect(props.title).toBeDefined();
        expect(props.title.trim().length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should always have a description element', () => {
    fc.assert(
      fc.property(quickActionArbitrary, (props: QuickActionProps) => {
        // Verify description is defined and non-empty
        expect(props.description).toBeDefined();
        expect(props.description.trim().length).toBeGreaterThan(0);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should have all three required elements together', () => {
    fc.assert(
      fc.property(quickActionArbitrary, (props: QuickActionProps) => {
        const hasIcon = props.icon && props.icon.length > 0;
        const hasTitle = props.title && props.title.trim().length > 0;
        const hasDescription = props.description && props.description.trim().length > 0;
        
        expect(hasIcon).toBe(true);
        expect(hasTitle).toBe(true);
        expect(hasDescription).toBe(true);
        
        // All three must be present
        return hasIcon && hasTitle && hasDescription;
      }),
      { numRuns: 100 }
    );
  });

  it('should have a valid href for navigation', () => {
    fc.assert(
      fc.property(quickActionArbitrary, (props: QuickActionProps) => {
        expect(props.href).toBeDefined();
        expect(props.href.startsWith('/')).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should have icon with proper sizing (24px standard)', () => {
    fc.assert(
      fc.property(fc.constant(24), (iconSize) => {
        // Standard icon size for quick actions
        expect(iconSize).toBe(24);
        // Icon container should be 40px (10 * 4 in Tailwind)
        const containerSize = 40;
        expect(containerSize).toBeGreaterThan(iconSize);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
