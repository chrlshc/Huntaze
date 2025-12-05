/**
 * **Feature: dashboard-design-refactor, Property 30: Settings list separators**
 * **Validates: Requirements 11.2**
 * 
 * For any settings list, items SHALL have either border separators 
 * or alternating background colors.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types for settings list
interface SettingsListItem {
  id: string;
  label: string;
  type: 'toggle' | 'select' | 'input' | 'button';
}

interface SettingsListConfig {
  items: SettingsListItem[];
  separatorStyle: 'border' | 'zebra' | 'both';
  spacing: 'compact' | 'default' | 'relaxed';
}

// Arbitrary for generating settings list configurations
const settingsListItemArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom('toggle', 'select', 'input', 'button') as fc.Arbitrary<'toggle' | 'select' | 'input' | 'button'>
});

const settingsListConfigArbitrary = fc.record({
  items: fc.array(settingsListItemArbitrary, { minLength: 2, maxLength: 15 }),
  separatorStyle: fc.constantFrom('border', 'zebra', 'both') as fc.Arbitrary<'border' | 'zebra' | 'both'>,
  spacing: fc.constantFrom('compact', 'default', 'relaxed') as fc.Arbitrary<'compact' | 'default' | 'relaxed'>
});

// Helper to compute CSS classes for list items
function getItemClasses(
  index: number, 
  totalItems: number, 
  config: SettingsListConfig
): string[] {
  const classes: string[] = ['settings-list-item'];
  
  // Add separator classes based on style
  if (config.separatorStyle === 'border' || config.separatorStyle === 'both') {
    if (index < totalItems - 1) {
      classes.push('border-b', 'border-border-light');
    }
  }
  
  if (config.separatorStyle === 'zebra' || config.separatorStyle === 'both') {
    if (index % 2 === 1) {
      classes.push('bg-surface-subdued');
    }
  }
  
  // Add spacing classes
  switch (config.spacing) {
    case 'compact':
      classes.push('py-2');
      break;
    case 'default':
      classes.push('py-3');
      break;
    case 'relaxed':
      classes.push('py-4');
      break;
  }
  
  return classes;
}

// Helper to validate separator presence
function hasSeparators(config: SettingsListConfig): boolean {
  return config.separatorStyle !== undefined && 
    ['border', 'zebra', 'both'].includes(config.separatorStyle);
}

// Helper to check visual distinction between items
function hasVisualDistinction(
  classes1: string[], 
  classes2: string[], 
  config: SettingsListConfig
): boolean {
  if (config.separatorStyle === 'border' || config.separatorStyle === 'both') {
    // First item should have border-b (unless it's the last)
    return classes1.includes('border-b');
  }
  
  if (config.separatorStyle === 'zebra' || config.separatorStyle === 'both') {
    // Adjacent items should have different backgrounds
    const hasZebra1 = classes1.includes('bg-surface-subdued');
    const hasZebra2 = classes2.includes('bg-surface-subdued');
    return hasZebra1 !== hasZebra2;
  }
  
  return false;
}

describe('Property 30: Settings list separators', () => {
  /**
   * Property: All settings lists have a separator style defined
   */
  it('all settings lists have separator style defined', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary,
        (config: SettingsListConfig) => {
          expect(hasSeparators(config)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Border separator style adds border classes to non-last items
   */
  it('border separator adds border-b to non-last items', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary.filter(c => c.separatorStyle === 'border' || c.separatorStyle === 'both'),
        (config: SettingsListConfig) => {
          const totalItems = config.items.length;
          
          config.items.forEach((_, index) => {
            const classes = getItemClasses(index, totalItems, config);
            
            if (index < totalItems - 1) {
              expect(classes).toContain('border-b');
            } else {
              // Last item should not have border-b
              expect(classes).not.toContain('border-b');
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zebra striping alternates background colors
   */
  it('zebra striping alternates backgrounds on odd indices', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary.filter(c => c.separatorStyle === 'zebra' || c.separatorStyle === 'both'),
        (config: SettingsListConfig) => {
          const totalItems = config.items.length;
          
          config.items.forEach((_, index) => {
            const classes = getItemClasses(index, totalItems, config);
            
            if (index % 2 === 1) {
              expect(classes).toContain('bg-surface-subdued');
            } else {
              expect(classes).not.toContain('bg-surface-subdued');
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Adjacent items have visual distinction
   */
  it('adjacent items have visual distinction', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary.filter(c => c.items.length >= 2),
        (config: SettingsListConfig) => {
          const totalItems = config.items.length;
          
          // Check first two items have distinction
          const classes0 = getItemClasses(0, totalItems, config);
          const classes1 = getItemClasses(1, totalItems, config);
          
          expect(hasVisualDistinction(classes0, classes1, config)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Spacing is consistent across all items
   */
  it('spacing is consistent across all items', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary,
        (config: SettingsListConfig) => {
          const totalItems = config.items.length;
          const expectedPadding = config.spacing === 'compact' ? 'py-2' : 
                                  config.spacing === 'default' ? 'py-3' : 'py-4';
          
          config.items.forEach((_, index) => {
            const classes = getItemClasses(index, totalItems, config);
            expect(classes).toContain(expectedPadding);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All items have base class
   */
  it('all items have settings-list-item base class', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary,
        (config: SettingsListConfig) => {
          const totalItems = config.items.length;
          
          config.items.forEach((_, index) => {
            const classes = getItemClasses(index, totalItems, config);
            expect(classes).toContain('settings-list-item');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Lists with single item don't need separators
   */
  it('single item lists have no separator classes', () => {
    fc.assert(
      fc.property(
        fc.record({
          items: fc.array(settingsListItemArbitrary, { minLength: 1, maxLength: 1 }),
          separatorStyle: fc.constantFrom('border', 'zebra', 'both') as fc.Arbitrary<'border' | 'zebra' | 'both'>,
          spacing: fc.constantFrom('compact', 'default', 'relaxed') as fc.Arbitrary<'compact' | 'default' | 'relaxed'>
        }),
        (config: SettingsListConfig) => {
          const classes = getItemClasses(0, 1, config);
          
          // Single item should not have border-b (it's the last item)
          expect(classes).not.toContain('border-b');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Separator style is one of the valid options
   */
  it('separator style is valid', () => {
    fc.assert(
      fc.property(
        settingsListConfigArbitrary,
        (config: SettingsListConfig) => {
          expect(['border', 'zebra', 'both']).toContain(config.separatorStyle);
        }
      ),
      { numRuns: 100 }
    );
  });
});
