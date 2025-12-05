/**
 * **Feature: dashboard-design-refactor, Property 33: Navigation item structure**
 * **Validates: Requirements 13.1**
 * 
 * For any sidebar navigation item, the rendered output SHALL contain 
 * both an icon element and a text label element.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SIDEBAR_SECTIONS, type SidebarSection, type SidebarItem } from '@/src/components/sidebar-config';

// Arbitrary for generating navigation items
const navItemArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  hasIcon: fc.boolean(),
  hasHref: fc.boolean(),
  hasItems: fc.boolean()
});

describe('Property 33: Navigation item structure', () => {
  /**
   * Property: All sidebar sections have both icon and label
   */
  it('all sidebar sections have icon and label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          // Every section must have an icon (LucideIcon component - can be function or forwardRef object)
          expect(section.icon).toBeDefined();
          // Lucide icons can be either functions or forwardRef objects
          const isValidIcon = typeof section.icon === 'function' || 
            (typeof section.icon === 'object' && section.icon !== null);
          expect(isValidIcon).toBe(true);
          
          // Every section must have a label
          expect(section.label).toBeDefined();
          expect(typeof section.label).toBe('string');
          expect(section.label.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All sub-items have labels
   */
  it('all sub-items have labels', () => {
    const allSubItems: SidebarItem[] = SIDEBAR_SECTIONS
      .filter(section => section.items)
      .flatMap(section => section.items!);

    fc.assert(
      fc.property(
        fc.constantFrom(...allSubItems),
        (item: SidebarItem) => {
          // Every sub-item must have a label
          expect(item.label).toBeDefined();
          expect(typeof item.label).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          
          // Every sub-item must have an href
          expect(item.href).toBeDefined();
          expect(typeof item.href).toBe('string');
          expect(item.href.startsWith('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Navigation structure is valid - sections have either href or items
   */
  it('sections have either direct href or sub-items', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          // A section must have either a direct href OR sub-items (or both)
          const hasDirectHref = section.href !== undefined;
          const hasSubItems = section.items !== undefined && section.items.length > 0;
          
          expect(hasDirectHref || hasSubItems).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Icon and label are co-located (both present together)
   */
  it('icon and label are always co-located in sections', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          // If icon exists, label must exist and vice versa
          const hasIcon = section.icon !== undefined;
          const hasLabel = section.label !== undefined && section.label.length > 0;
          
          // Both must be present together
          expect(hasIcon).toBe(true);
          expect(hasLabel).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Section IDs are unique
   */
  it('section IDs are unique', () => {
    const ids = SIDEBAR_SECTIONS.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  /**
   * Property: All hrefs are unique across the navigation
   */
  it('all navigation hrefs are unique', () => {
    const allHrefs: string[] = [];
    
    SIDEBAR_SECTIONS.forEach(section => {
      if (section.href) {
        allHrefs.push(section.href);
      }
      if (section.items) {
        section.items.forEach(item => {
          allHrefs.push(item.href);
        });
      }
    });
    
    const uniqueHrefs = new Set(allHrefs);
    expect(uniqueHrefs.size).toBe(allHrefs.length);
  });
});
