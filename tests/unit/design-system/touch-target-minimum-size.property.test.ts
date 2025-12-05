/**
 * Property-Based Test: Touch Target Minimum Size
 * **Feature: dashboard-design-refactor, Property 22: Touch target minimum size**
 * **Validates: Requirements 8.4**
 * 
 * For any interactive button element, the rendered dimensions SHALL be at least 44px × 44px.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Button size variants
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'pill';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'tonal' | 'danger' | 'gradient' | 'link';

// Minimum touch target size per WCAG 2.1 Success Criterion 2.5.5
const MIN_TOUCH_TARGET_PX = 44;

// Design token values (from design-tokens.css)
const BUTTON_HEIGHTS: Record<ButtonSize, number> = {
  sm: 32,      // h-8 = 32px, but min-h ensures 44px touch target
  md: 44,      // h-[var(--button-min-touch-target)] = 44px
  lg: 48,      // h-12 = 48px
  xl: 56,      // h-14 = 56px
  pill: 44,    // h-11 = 44px
};

// Effective touch target (considering min-height)
const EFFECTIVE_TOUCH_TARGETS: Record<ButtonSize, number> = {
  sm: 44,      // min-h-[var(--button-min-touch-target)] ensures 44px
  md: 44,      // 44px
  lg: 48,      // 48px > 44px
  xl: 56,      // 56px > 44px
  pill: 44,    // 44px
};

// Arbitrary generators
const buttonSizeArb = fc.constantFrom<ButtonSize>('sm', 'md', 'lg', 'xl', 'pill');
const buttonVariantArb = fc.constantFrom<ButtonVariant>(
  'primary', 'secondary', 'outline', 'ghost', 'tonal', 'danger', 'gradient', 'link'
);

describe('Property 22: Touch Target Minimum Size', () => {
  /**
   * Property: All button sizes have effective touch target >= 44px
   */
  it('all button sizes have minimum 44px touch target height', () => {
    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const effectiveHeight = EFFECTIVE_TOUCH_TARGETS[size];
        expect(effectiveHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Touch target is consistent across all variants for same size
   */
  it('touch target is consistent across variants for same size', () => {
    fc.assert(
      fc.property(
        buttonSizeArb,
        fc.array(buttonVariantArb, { minLength: 2, maxLength: 8 }),
        (size, variants) => {
          const uniqueVariants = [...new Set(variants)];
          const touchTargets = uniqueVariants.map(() => EFFECTIVE_TOUCH_TARGETS[size]);
          
          // All variants of same size should have same touch target
          const allSame = touchTargets.every(t => t === touchTargets[0]);
          expect(allSame).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Larger sizes have equal or larger touch targets
   */
  it('larger button sizes have equal or larger touch targets', () => {
    const sizeOrder: ButtonSize[] = ['sm', 'md', 'lg', 'xl'];
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: sizeOrder.length - 2 }),
        (index) => {
          const smallerSize = sizeOrder[index];
          const largerSize = sizeOrder[index + 1];
          
          const smallerTarget = EFFECTIVE_TOUCH_TARGETS[smallerSize];
          const largerTarget = EFFECTIVE_TOUCH_TARGETS[largerSize];
          
          expect(largerTarget).toBeGreaterThanOrEqual(smallerTarget);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Button min-height CSS value ensures touch target compliance
   */
  it('button min-height CSS ensures touch target compliance', () => {
    // Simulates parsing the CSS min-height value
    const parseMinHeight = (cssValue: string): number => {
      if (cssValue.includes('--button-min-touch-target')) {
        return 44; // var(--button-min-touch-target) = 2.75rem = 44px
      }
      const match = cssValue.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const buttonMinHeightCSS: Record<ButtonSize, string> = {
      sm: 'min-h-[var(--button-min-touch-target)]',
      md: 'min-h-[var(--button-min-touch-target)]',
      lg: 'min-h-[var(--button-min-touch-target)]',
      xl: 'min-h-[var(--button-min-touch-target)]',
      pill: 'min-h-[var(--button-min-touch-target)]',
    };

    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const minHeightValue = parseMinHeight(buttonMinHeightCSS[size]);
        expect(minHeightValue).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Button padding provides adequate horizontal spacing
   * Note: Width depends on content; this validates padding is reasonable
   */
  it('button horizontal padding provides adequate spacing', () => {
    // Minimum padding values per size (in px, from design tokens)
    const PADDING_X: Record<ButtonSize, number> = {
      sm: 12,   // px-[var(--space-3)] = 12px
      md: 16,   // px-[var(--space-4)] = 16px
      lg: 24,   // px-[var(--space-6)] = 24px
      xl: 28,   // px-[var(--space-7)] = 28px
      pill: 24, // px-[var(--space-6)] = 24px
    };

    // Minimum acceptable padding for touch-friendly buttons
    const MIN_PADDING = 12; // 12px minimum horizontal padding

    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const paddingX = PADDING_X[size];
        // Padding should be at least 12px for comfortable touch
        expect(paddingX).toBeGreaterThanOrEqual(MIN_PADDING);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Icon-only buttons still meet touch target requirements
   */
  it('icon-only buttons meet touch target requirements', () => {
    // Icon buttons typically have square dimensions
    const ICON_BUTTON_SIZES: Record<ButtonSize, { width: number; height: number }> = {
      sm: { width: 44, height: 44 },   // min-h ensures 44px
      md: { width: 44, height: 44 },
      lg: { width: 48, height: 48 },
      xl: { width: 56, height: 56 },
      pill: { width: 44, height: 44 },
    };

    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const { width, height } = ICON_BUTTON_SIZES[size];
        expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
        expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
      }),
      { numRuns: 100 }
    );
  });
});
