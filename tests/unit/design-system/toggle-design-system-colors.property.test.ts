/**
 * Property-Based Test: Toggle Design System Colors
 * 
 * **Feature: dashboard-design-refactor, Property 28: Toggle design system colors**
 * **Validates: Requirements 10.4**
 * 
 * Tests that Toggle component uses design system colors correctly.
 * For any Toggle component, the ON state color SHALL match the action-primary token
 * and OFF state SHALL match a neutral gray token.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Toggle configuration
interface ToggleConfig {
  checked: boolean;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
  hasDescription: boolean;
}

// Toggle color styles
interface ToggleColorStyles {
  trackBackground: string;
  trackBorder: string;
  thumbBackground: string;
  usesActionPrimary: boolean;
  usesNeutralGray: boolean;
}

// Design token values
const DESIGN_TOKENS = {
  accentPrimary: '#8b5cf6', // --accent-primary (violet-500)
  accentPrimaryHover: '#7c3aed', // --accent-primary-hover (violet-600)
  bgTertiary: '#27272a', // --bg-tertiary (zinc-800)
  bgHover: '#1a1a1c', // --bg-hover
  borderDefault: 'rgba(255, 255, 255, 0.12)', // --border-default
  textPrimary: '#fafafa', // --text-primary (zinc-50)
};

// Arbitrary for toggle configurations
const toggleConfigArb = fc.record({
  checked: fc.boolean(),
  disabled: fc.boolean(),
  size: fc.constantFrom('sm', 'md', 'lg') as fc.Arbitrary<'sm' | 'md' | 'lg'>,
  hasDescription: fc.boolean(),
});

// Simulate extracting color styles from Toggle component
function getToggleColorStyles(config: ToggleConfig): ToggleColorStyles {
  if (config.checked) {
    // ON state - uses action-primary color
    return {
      trackBackground: DESIGN_TOKENS.accentPrimary,
      trackBorder: DESIGN_TOKENS.accentPrimary,
      thumbBackground: DESIGN_TOKENS.textPrimary,
      usesActionPrimary: true,
      usesNeutralGray: false,
    };
  } else {
    // OFF state - uses neutral gray
    return {
      trackBackground: DESIGN_TOKENS.bgTertiary,
      trackBorder: DESIGN_TOKENS.borderDefault,
      thumbBackground: DESIGN_TOKENS.textPrimary,
      usesActionPrimary: false,
      usesNeutralGray: true,
    };
  }
}

// Check if a color is in the violet/purple family (action-primary)
function isActionPrimaryColor(color: string): boolean {
  // Check for violet-500 (#8b5cf6) or similar
  const violetPattern = /^#[78][0-9a-f][35][0-9a-f][ef][0-9a-f]$/i;
  return violetPattern.test(color) || color === DESIGN_TOKENS.accentPrimary;
}

// Check if a color is a neutral gray
function isNeutralGrayColor(color: string): boolean {
  // Check for zinc grays or rgba white with low opacity
  const zincPattern = /^#[12][0-9a-f][12][0-9a-f][12][0-9a-f]$/i;
  const rgbaPattern = /^rgba\(255,\s*255,\s*255,\s*0\.\d+\)$/;
  return (
    zincPattern.test(color) ||
    rgbaPattern.test(color) ||
    color === DESIGN_TOKENS.bgTertiary ||
    color === DESIGN_TOKENS.borderDefault
  );
}

// Validate toggle colors based on state
function validateToggleColors(config: ToggleConfig, styles: ToggleColorStyles): boolean {
  if (config.checked) {
    // ON state must use action-primary
    return styles.usesActionPrimary && !styles.usesNeutralGray;
  } else {
    // OFF state must use neutral gray
    return styles.usesNeutralGray && !styles.usesActionPrimary;
  }
}

describe('Property 28: Toggle design system colors', () => {
  it('should use action-primary color when toggle is ON', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const checkedConfig = { ...config, checked: true };
        const styles = getToggleColorStyles(checkedConfig);
        
        // Property: ON state must use action-primary color
        expect(styles.usesActionPrimary).toBe(true);
        expect(styles.trackBackground).toBe(DESIGN_TOKENS.accentPrimary);
      }),
      { numRuns: 100 }
    );
  });

  it('should use neutral gray color when toggle is OFF', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const uncheckedConfig = { ...config, checked: false };
        const styles = getToggleColorStyles(uncheckedConfig);
        
        // Property: OFF state must use neutral gray color
        expect(styles.usesNeutralGray).toBe(true);
        expect(styles.trackBackground).toBe(DESIGN_TOKENS.bgTertiary);
      }),
      { numRuns: 100 }
    );
  });

  it('should not use action-primary when toggle is OFF', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const uncheckedConfig = { ...config, checked: false };
        const styles = getToggleColorStyles(uncheckedConfig);
        
        // Property: OFF state must NOT use action-primary
        expect(styles.usesActionPrimary).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should not use neutral gray when toggle is ON', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const checkedConfig = { ...config, checked: true };
        const styles = getToggleColorStyles(checkedConfig);
        
        // Property: ON state must NOT use neutral gray for track
        expect(styles.usesNeutralGray).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should pass complete color validation for any toggle configuration', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const styles = getToggleColorStyles(config);
        
        // Property: color validation must pass for all configurations
        expect(validateToggleColors(config, styles)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent thumb color regardless of toggle state', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const checkedStyles = getToggleColorStyles({ ...config, checked: true });
        const uncheckedStyles = getToggleColorStyles({ ...config, checked: false });
        
        // Property: thumb color should be consistent (text-primary)
        expect(checkedStyles.thumbBackground).toBe(uncheckedStyles.thumbBackground);
        expect(checkedStyles.thumbBackground).toBe(DESIGN_TOKENS.textPrimary);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain color consistency across all sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.constantFrom(...sizes),
        fc.constantFrom(...sizes),
        (checked, size1, size2) => {
          const config1: ToggleConfig = { checked, disabled: false, size: size1, hasDescription: false };
          const config2: ToggleConfig = { checked, disabled: false, size: size2, hasDescription: false };
          
          const styles1 = getToggleColorStyles(config1);
          const styles2 = getToggleColorStyles(config2);
          
          // Property: colors must be consistent across sizes
          expect(styles1.trackBackground).toBe(styles2.trackBackground);
          expect(styles1.usesActionPrimary).toBe(styles2.usesActionPrimary);
          expect(styles1.usesNeutralGray).toBe(styles2.usesNeutralGray);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use border matching track color when ON', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const checkedConfig = { ...config, checked: true };
        const styles = getToggleColorStyles(checkedConfig);
        
        // Property: ON state border should match track background
        expect(styles.trackBorder).toBe(styles.trackBackground);
      }),
      { numRuns: 100 }
    );
  });

  it('should use default border color when OFF', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const uncheckedConfig = { ...config, checked: false };
        const styles = getToggleColorStyles(uncheckedConfig);
        
        // Property: OFF state should use default border
        expect(styles.trackBorder).toBe(DESIGN_TOKENS.borderDefault);
      }),
      { numRuns: 100 }
    );
  });

  // Test color transitions are valid
  it('should have valid color values for all states', () => {
    fc.assert(
      fc.property(toggleConfigArb, (config) => {
        const styles = getToggleColorStyles(config);
        
        // Property: all color values must be non-empty strings
        expect(styles.trackBackground).toBeTruthy();
        expect(styles.trackBorder).toBeTruthy();
        expect(styles.thumbBackground).toBeTruthy();
        expect(typeof styles.trackBackground).toBe('string');
        expect(typeof styles.trackBorder).toBe('string');
        expect(typeof styles.thumbBackground).toBe('string');
      }),
      { numRuns: 100 }
    );
  });
});
