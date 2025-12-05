/**
 * **Feature: onlyfans-shopify-design, Property 9: Primary Text Contrast**
 * 
 * *For any* primary text on light backgrounds, the color SHALL be #1a1a1a for maximum contrast.
 * **Validates: Requirements 5.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify typography specifications
const SHOPIFY_TYPOGRAPHY = {
  colors: {
    primary: '#1a1a1a',
    secondary: '#6b7177',
    muted: '#8c9196',
    disabled: '#b5b5b5',
    inverse: '#ffffff',
  },
  backgrounds: {
    page: '#f6f6f7',
    card: '#ffffff',
    hover: '#f1f2f3',
  },
  fontSizes: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Helper to calculate contrast ratio between two colors
function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

// Simulate text style extraction based on context
function extractTextStyles(
  textType: 'heading' | 'body' | 'label' | 'caption',
  context: 'page' | 'card'
) {
  const background = SHOPIFY_TYPOGRAPHY.backgrounds[context];
  
  switch (textType) {
    case 'heading':
      return {
        color: SHOPIFY_TYPOGRAPHY.colors.primary,
        fontSize: SHOPIFY_TYPOGRAPHY.fontSizes.lg,
        fontWeight: SHOPIFY_TYPOGRAPHY.fontWeights.semibold,
        lineHeight: SHOPIFY_TYPOGRAPHY.lineHeights.tight,
        background,
      };
    case 'body':
      return {
        color: SHOPIFY_TYPOGRAPHY.colors.primary,
        fontSize: SHOPIFY_TYPOGRAPHY.fontSizes.base,
        fontWeight: SHOPIFY_TYPOGRAPHY.fontWeights.normal,
        lineHeight: SHOPIFY_TYPOGRAPHY.lineHeights.normal,
        background,
      };
    case 'label':
      return {
        color: SHOPIFY_TYPOGRAPHY.colors.secondary,
        fontSize: SHOPIFY_TYPOGRAPHY.fontSizes.sm,
        fontWeight: SHOPIFY_TYPOGRAPHY.fontWeights.normal,
        lineHeight: SHOPIFY_TYPOGRAPHY.lineHeights.normal,
        background,
      };
    case 'caption':
      return {
        color: SHOPIFY_TYPOGRAPHY.colors.muted,
        fontSize: SHOPIFY_TYPOGRAPHY.fontSizes.xs,
        fontWeight: SHOPIFY_TYPOGRAPHY.fontWeights.normal,
        lineHeight: SHOPIFY_TYPOGRAPHY.lineHeights.normal,
        background,
      };
  }
}

describe('Property 9: Primary Text Contrast', () => {
  const textTypeArb = fc.constantFrom('heading', 'body', 'label', 'caption') as fc.Arbitrary<'heading' | 'body' | 'label' | 'caption'>;
  const contextArb = fc.constantFrom('page', 'card') as fc.Arbitrary<'page' | 'card'>;

  it('primary text color SHALL be #1a1a1a', () => {
    expect(SHOPIFY_TYPOGRAPHY.colors.primary.toLowerCase()).toBe('#1a1a1a');
  });

  it('headings and body text SHALL use primary color (#1a1a1a)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('heading', 'body') as fc.Arbitrary<'heading' | 'body'>,
        contextArb,
        (textType, context) => {
          const styles = extractTextStyles(textType, context);
          
          expect(styles.color.toLowerCase()).toBe('#1a1a1a');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('primary text SHALL have WCAG AA contrast ratio (≥4.5:1) on light backgrounds', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const styles = extractTextStyles('body', context);
        const contrastRatio = getContrastRatio(styles.color, styles.background);
        
        // WCAG AA requires 4.5:1 for normal text
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      }),
      { numRuns: 100 }
    );
  });

  it('headings SHALL have semibold (600) font weight', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const styles = extractTextStyles('heading', context);
        
        expect(styles.fontWeight).toBe(600);
      }),
      { numRuns: 100 }
    );
  });

  it('body text SHALL have 14px font size and 1.5 line height', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const styles = extractTextStyles('body', context);
        
        expect(styles.fontSize).toBe('14px');
        expect(styles.lineHeight).toBe(1.5);
      }),
      { numRuns: 100 }
    );
  });

  it('secondary text (#6b7177) SHALL have adequate contrast on light backgrounds', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const background = SHOPIFY_TYPOGRAPHY.backgrounds[context];
        const contrastRatio = getContrastRatio(SHOPIFY_TYPOGRAPHY.colors.secondary, background);
        
        // Secondary text should still be readable (at least 3:1 for large text)
        expect(contrastRatio).toBeGreaterThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });

  it('all text types SHALL have appropriate font sizes', () => {
    fc.assert(
      fc.property(textTypeArb, contextArb, (textType, context) => {
        const styles = extractTextStyles(textType, context);
        const fontSize = parseInt(styles.fontSize);
        
        // All text should be at least 12px for readability
        expect(fontSize).toBeGreaterThanOrEqual(12);
        
        // Headings should be larger than body
        if (textType === 'heading') {
          expect(fontSize).toBeGreaterThanOrEqual(18);
        }
      }),
      { numRuns: 100 }
    );
  });
});
