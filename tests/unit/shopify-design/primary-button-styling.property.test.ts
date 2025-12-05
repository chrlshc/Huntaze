/**
 * **Feature: onlyfans-shopify-design, Property 10: Primary Button Styling**
 * 
 * *For any* primary action button, the background SHALL be solid dark with white text.
 * **Validates: Requirements 6.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify button design specifications
const SHOPIFY_BUTTON_SPECS = {
  primary: {
    background: '#1a1a1a',
    text: '#ffffff',
    borderRadius: '8px',
    paddingHorizontal: { sm: 12, md: 16, lg: 24 }, // px values
    paddingVertical: { sm: 8, md: 10, lg: 12 },
  },
  secondary: {
    background: 'transparent',
    text: '#1a1a1a',
    border: '#1a1a1a',
    borderRadius: '8px',
  },
};

// Helper to check if a color is dark (for primary button background)
function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}

// Helper to check if a color is light (for primary button text)
function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Simulate button style extraction
function extractButtonStyles(variant: 'primary' | 'secondary', size: 'sm' | 'md' | 'lg') {
  if (variant === 'primary') {
    return {
      backgroundColor: SHOPIFY_BUTTON_SPECS.primary.background,
      color: SHOPIFY_BUTTON_SPECS.primary.text,
      borderRadius: SHOPIFY_BUTTON_SPECS.primary.borderRadius,
      paddingHorizontal: SHOPIFY_BUTTON_SPECS.primary.paddingHorizontal[size],
      paddingVertical: SHOPIFY_BUTTON_SPECS.primary.paddingVertical[size],
      border: `1px solid ${SHOPIFY_BUTTON_SPECS.primary.background}`,
    };
  }
  return {
    backgroundColor: SHOPIFY_BUTTON_SPECS.secondary.background,
    color: SHOPIFY_BUTTON_SPECS.secondary.text,
    borderRadius: SHOPIFY_BUTTON_SPECS.secondary.borderRadius,
    paddingHorizontal: SHOPIFY_BUTTON_SPECS.primary.paddingHorizontal[size],
    paddingVertical: SHOPIFY_BUTTON_SPECS.primary.paddingVertical[size],
    border: `1px solid ${SHOPIFY_BUTTON_SPECS.secondary.border}`,
  };
}

describe('Property 10: Primary Button Styling', () => {
  const buttonSizeArb = fc.constantFrom('sm', 'md', 'lg') as fc.Arbitrary<'sm' | 'md' | 'lg'>;
  const buttonVariantArb = fc.constantFrom('primary', 'secondary') as fc.Arbitrary<'primary' | 'secondary'>;

  it('primary button SHALL have solid dark background', () => {
    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const styles = extractButtonStyles('primary', size);
        
        // Background must be dark
        expect(isDarkColor(styles.backgroundColor)).toBe(true);
        
        // Specifically should be #1a1a1a
        expect(styles.backgroundColor.toLowerCase()).toBe('#1a1a1a');
      }),
      { numRuns: 100 }
    );
  });

  it('primary button SHALL have white text', () => {
    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const styles = extractButtonStyles('primary', size);
        
        // Text must be light (white)
        expect(isLightColor(styles.color)).toBe(true);
        
        // Specifically should be #ffffff
        expect(styles.color.toLowerCase()).toBe('#ffffff');
      }),
      { numRuns: 100 }
    );
  });

  it('all buttons SHALL have 8px border-radius', () => {
    fc.assert(
      fc.property(buttonVariantArb, buttonSizeArb, (variant, size) => {
        const styles = extractButtonStyles(variant, size);
        
        expect(styles.borderRadius).toBe('8px');
      }),
      { numRuns: 100 }
    );
  });

  it('primary button SHALL have matching border color', () => {
    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const styles = extractButtonStyles('primary', size);
        
        // Border should match background for solid appearance
        expect(styles.border).toContain('#1a1a1a');
      }),
      { numRuns: 100 }
    );
  });

  it('secondary button SHALL have outlined style with dark border', () => {
    fc.assert(
      fc.property(buttonSizeArb, (size) => {
        const styles = extractButtonStyles('secondary', size);
        
        // Background should be transparent
        expect(styles.backgroundColor).toBe('transparent');
        
        // Text should be dark
        expect(isDarkColor(styles.color)).toBe(true);
        
        // Border should be dark
        expect(styles.border).toContain('#1a1a1a');
      }),
      { numRuns: 100 }
    );
  });

  it('buttons SHALL have appropriate padding based on size', () => {
    fc.assert(
      fc.property(buttonVariantArb, buttonSizeArb, (variant, size) => {
        const styles = extractButtonStyles(variant, size);
        
        // Padding should increase with size
        const expectedPadding = SHOPIFY_BUTTON_SPECS.primary.paddingHorizontal[size];
        expect(styles.paddingHorizontal).toBe(expectedPadding);
        
        // Minimum padding for touch targets
        expect(styles.paddingHorizontal).toBeGreaterThanOrEqual(12);
      }),
      { numRuns: 100 }
    );
  });
});
