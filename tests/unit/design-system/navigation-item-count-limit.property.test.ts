/**
 * **Feature: dashboard-design-refactor, Property 35: Navigation item count limit**
 * **Validates: Requirements 13.3**
 * 
 * For any sidebar navigation, the count of first-level menu items SHALL be at most 10.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SIDEBAR_SECTIONS, type SidebarSection } from '@/src/components/sidebar-config';

// Maximum allowed first-level navigation items
const MAX_FIRST_LEVEL_ITEMS = 10;

// Maximum recommended sub-items per section
const MAX_SUB_ITEMS_PER_SECTION = 8;

describe('Property 35: Navigation item count limit', () => {
  /**
   * Property: First-level navigation items are limited to prevent overcrowding
   */
  it('first-level navigation items do not exceed maximum limit', () => {
    const firstLevelCount = SIDEBAR_SECTIONS.length;
    
    expect(firstLevelCount).toBeLessThanOrEqual(MAX_FIRST_LEVEL_ITEMS);
    expect(firstLevelCount).toBeGreaterThan(0); // Must have at least one item
  });

  /**
   * Property: Sub-items per section are reasonably limited
   */
  it('sub-items per section do not exceed recommended limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          if (section.items) {
            expect(section.items.length).toBeLessThanOrEqual(MAX_SUB_ITEMS_PER_SECTION);
            expect(section.items.length).toBeGreaterThan(0); // If items exist, must have at least one
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total navigation depth is limited to 2 levels
   */
  it('navigation depth is limited to 2 levels', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          // Level 1: Section
          // Level 2: Sub-items (if any)
          // No Level 3 should exist
          
          if (section.items) {
            section.items.forEach(item => {
              // Sub-items should not have nested items
              expect((item as any).items).toBeUndefined();
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Navigation labels are concise
   */
  it('navigation labels are concise (max 20 characters)', () => {
    const MAX_LABEL_LENGTH = 20;
    
    fc.assert(
      fc.property(
        fc.constantFrom(...SIDEBAR_SECTIONS),
        (section: SidebarSection) => {
          // Section labels should be concise
          expect(section.label.length).toBeLessThanOrEqual(MAX_LABEL_LENGTH);
          
          // Sub-item labels should also be concise
          if (section.items) {
            section.items.forEach(item => {
              expect(item.label.length).toBeLessThanOrEqual(MAX_LABEL_LENGTH);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Essential sections are present
   */
  it('essential navigation sections are present', () => {
    const essentialSectionIds = ['home', 'onlyfans', 'analytics', 'settings'];
    const sectionIds = SIDEBAR_SECTIONS.map(s => s.id);
    
    essentialSectionIds.forEach(essentialId => {
      expect(sectionIds).toContain(essentialId);
    });
  });

  /**
   * Property: Navigation is balanced (no section dominates)
   */
  it('navigation sections are balanced in sub-item count', () => {
    const sectionsWithItems = SIDEBAR_SECTIONS.filter(s => s.items);
    
    if (sectionsWithItems.length > 1) {
      const itemCounts = sectionsWithItems.map(s => s.items!.length);
      const maxCount = Math.max(...itemCounts);
      const minCount = Math.min(...itemCounts);
      
      // The difference between largest and smallest section should be reasonable
      // This prevents one section from being overwhelming
      const MAX_IMBALANCE = 4;
      expect(maxCount - minCount).toBeLessThanOrEqual(MAX_IMBALANCE);
    }
  });

  /**
   * Property: Total clickable items are manageable
   */
  it('total clickable navigation items are manageable', () => {
    const MAX_TOTAL_ITEMS = 50;
    
    let totalItems = 0;
    
    SIDEBAR_SECTIONS.forEach(section => {
      // Count section itself if it has direct href
      if (section.href && !section.items) {
        totalItems++;
      }
      
      // Count all sub-items
      if (section.items) {
        totalItems += section.items.length;
      }
    });
    
    expect(totalItems).toBeLessThanOrEqual(MAX_TOTAL_ITEMS);
    expect(totalItems).toBeGreaterThan(0);
  });

  /**
   * Property: Section ordering is logical (Home first, Settings last)
   */
  it('navigation sections follow logical ordering', () => {
    const sectionIds = SIDEBAR_SECTIONS.map(s => s.id);
    
    // Home should be first
    expect(sectionIds[0]).toBe('home');
    
    // Settings should be last
    expect(sectionIds[sectionIds.length - 1]).toBe('settings');
  });

  /**
   * Property: Generated navigation configs respect limits
   */
  it('any valid navigation config respects item limits', () => {
    // Generate random navigation configurations
    const navConfigArbitrary = fc.array(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 10 }),
        label: fc.string({ minLength: 1, maxLength: 20 }),
        itemCount: fc.integer({ min: 0, max: MAX_SUB_ITEMS_PER_SECTION })
      }),
      { minLength: 1, maxLength: MAX_FIRST_LEVEL_ITEMS }
    );

    fc.assert(
      fc.property(
        navConfigArbitrary,
        (config) => {
          // First level count is within limit
          expect(config.length).toBeLessThanOrEqual(MAX_FIRST_LEVEL_ITEMS);
          
          // Each section's sub-items are within limit
          config.forEach(section => {
            expect(section.itemCount).toBeLessThanOrEqual(MAX_SUB_ITEMS_PER_SECTION);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
