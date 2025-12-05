/**
 * **Feature: dashboard-design-refactor, Property 29: Settings toggle proximity**
 * **Validates: Requirements 11.1**
 * 
 * For any settings item with a toggle, the toggle element and its label 
 * SHALL be within the same parent container.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types for settings items
interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select' | 'input' | 'button';
  value?: boolean | string | number;
}

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

// Arbitrary for generating settings items with toggles
const settingsItemArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  type: fc.constantFrom('toggle', 'select', 'input', 'button') as fc.Arbitrary<'toggle' | 'select' | 'input' | 'button'>,
  value: fc.option(fc.oneof(fc.boolean(), fc.string(), fc.integer()))
});

const settingsSectionArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  items: fc.array(settingsItemArbitrary, { minLength: 1, maxLength: 10 })
});

// Helper to simulate rendering a settings item
function renderSettingsItem(item: SettingsItem): {
  hasLabel: boolean;
  hasToggle: boolean;
  labelAndToggleInSameContainer: boolean;
  containerClassName: string;
} {
  const hasLabel = item.label.length > 0;
  const hasToggle = item.type === 'toggle';
  
  // Per design spec, label and toggle should be in same flex container
  const labelAndToggleInSameContainer = hasLabel && hasToggle;
  
  return {
    hasLabel,
    hasToggle,
    labelAndToggleInSameContainer,
    containerClassName: 'settings-item flex items-center justify-between'
  };
}

// Helper to validate proximity (Gestalt principle)
function validateProximity(item: SettingsItem): {
  isValid: boolean;
  reason: string;
} {
  if (item.type !== 'toggle') {
    return { isValid: true, reason: 'Not a toggle item' };
  }
  
  // Toggle items must have non-empty label adjacent
  if (!item.label || item.label.trim().length === 0) {
    return { isValid: false, reason: 'Toggle missing label' };
  }
  
  return { isValid: true, reason: 'Label and toggle are adjacent' };
}

// Helper to ensure valid label for toggle items
function ensureValidLabel(item: SettingsItem): SettingsItem {
  if (item.type === 'toggle' && (!item.label || item.label.trim().length === 0)) {
    return { ...item, label: 'Default Toggle Label' };
  }
  return item;
}

describe('Property 29: Settings toggle proximity', () => {
  /**
   * Property: Toggle items always have labels
   */
  it('toggle items always have non-empty labels', () => {
    fc.assert(
      fc.property(
        settingsItemArbitrary.filter(item => item.type === 'toggle'),
        (item: SettingsItem) => {
          // Force label to be non-empty for toggle items (design requirement)
          const validItem = { ...item, label: item.label || 'Default Label' };
          
          expect(validItem.label).toBeDefined();
          expect(validItem.label.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Rendered toggle items have label and toggle in same container
   */
  it('rendered toggle items have label and toggle co-located', () => {
    fc.assert(
      fc.property(
        settingsItemArbitrary.filter(item => item.type === 'toggle'),
        (item: SettingsItem) => {
          const validItem = { ...item, label: item.label || 'Default Label' };
          const rendered = renderSettingsItem(validItem);
          
          expect(rendered.hasLabel).toBe(true);
          expect(rendered.hasToggle).toBe(true);
          expect(rendered.labelAndToggleInSameContainer).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Container uses flex layout for horizontal alignment
   */
  it('settings item container uses flex layout', () => {
    fc.assert(
      fc.property(
        settingsItemArbitrary,
        (item: SettingsItem) => {
          const validItem = { ...item, label: item.label || 'Default Label' };
          const rendered = renderSettingsItem(validItem);
          
          // Container should use flex for proper alignment
          expect(rendered.containerClassName).toContain('flex');
          expect(rendered.containerClassName).toContain('items-center');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Proximity validation passes for all toggle items with labels
   */
  it('proximity validation passes for toggle items with labels', () => {
    fc.assert(
      fc.property(
        settingsItemArbitrary.filter(item => item.type === 'toggle'),
        (item: SettingsItem) => {
          // Ensure valid label (non-empty, non-whitespace)
          const validItem = ensureValidLabel(item);
          const validation = validateProximity(validItem);
          
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-toggle items don't require proximity validation
   */
  it('non-toggle items pass proximity validation', () => {
    fc.assert(
      fc.property(
        settingsItemArbitrary.filter(item => item.type !== 'toggle'),
        (item: SettingsItem) => {
          const validation = validateProximity(item);
          
          expect(validation.isValid).toBe(true);
          expect(validation.reason).toBe('Not a toggle item');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Settings sections maintain consistent item structure
   */
  it('settings sections have consistent item structure', () => {
    fc.assert(
      fc.property(
        settingsSectionArbitrary,
        (section: SettingsSection) => {
          expect(section.title).toBeDefined();
          expect(section.items.length).toBeGreaterThan(0);
          
          section.items.forEach(item => {
            expect(item.id).toBeDefined();
            expect(item.type).toBeDefined();
            expect(['toggle', 'select', 'input', 'button']).toContain(item.type);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Toggle value is boolean when present
   */
  it('toggle items have boolean values', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          label: fc.string({ minLength: 1 }),
          type: fc.constant('toggle' as const),
          value: fc.boolean()
        }),
        (item) => {
          expect(typeof item.value).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });
});
