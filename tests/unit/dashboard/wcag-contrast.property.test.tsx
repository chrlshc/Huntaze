// Feature: dashboard-shopify-migration, Property 46: WCAG Color Contrast
// For any interactive element, the system should ensure sufficient color contrast ratios to meet WCAG compliance standards

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// WCAG 2.1 Level AA Requirements:
// - Normal text (< 18pt or < 14pt bold): 4.5:1 contrast ratio
// - Large text (≥ 18pt or ≥ 14pt bold): 3:1 contrast ratio
// - UI components and graphical objects: 3:1 contrast ratio

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

describe('Dashboard WCAG Color Contrast Compliance', () => {
  // Design system colors from requirements
  const designColors = {
    bgApp: '#F8F9FB',
    bgSurface: '#FFFFFF',
    colorIndigo: '#6366f1',
    colorTextMain: '#1F2937',
    colorTextSub: '#6B7280',
    colorInactiveIcon: '#6B7280', // Updated to meet WCAG 3:1 for UI components
    colorHeading: '#111827',
    borderColor: '#6B7280', // Updated to meet WCAG 3:1 for UI components
  };

  describe('Property 46: WCAG Color Contrast', () => {
    it('should ensure main text on surface background meets 4.5:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColor = hexToRgb(designColors.colorTextMain);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(textColor, bgColor);

          // Normal text requires 4.5:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure main text on app background meets 4.5:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColor = hexToRgb(designColors.colorTextMain);
          const bgColor = hexToRgb(designColors.bgApp);
          const ratio = getContrastRatio(textColor, bgColor);

          // Normal text requires 4.5:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure secondary text on surface background meets 4.5:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColor = hexToRgb(designColors.colorTextSub);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(textColor, bgColor);

          // Normal text requires 4.5:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure heading text on surface background meets 4.5:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColor = hexToRgb(designColors.colorHeading);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(textColor, bgColor);

          // Normal text requires 4.5:1 minimum (even though headings are larger)
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure Electric Indigo on white background meets 3:1 ratio for UI components', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const indigoColor = hexToRgb(designColors.colorIndigo);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(indigoColor, bgColor);

          // UI components require 3:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure inactive icon color on surface background meets 3:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const iconColor = hexToRgb(designColors.colorInactiveIcon);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(iconColor, bgColor);

          // UI components require 3:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure border color on surface background meets 3:1 ratio', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const borderColor = hexToRgb(designColors.borderColor);
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(borderColor, bgColor);

          // UI components require 3:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(3.0);
        }),
        { numRuns: 100 }
      );
    });

    it('should verify all text colors avoid pure black', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColors = [
            designColors.colorTextMain,
            designColors.colorTextSub,
            designColors.colorHeading,
          ];

          textColors.forEach((color) => {
            expect(color.toLowerCase()).not.toBe('#000000');
            expect(color.toLowerCase()).not.toBe('#000');
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure sufficient contrast for active navigation items', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Active nav: Darker indigo text on fade indigo background
          // Using #4f46e5 (darker indigo) instead of #6366f1 for better contrast
          const textColor = { r: 79, g: 70, b: 229 }; // #4f46e5
          // rgba(99, 102, 241, 0.08) on white ≈ #F5F5FE
          const bgColor = { r: 245, g: 245, b: 254 };
          const ratio = getContrastRatio(textColor, bgColor);

          // Text on background requires 4.5:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure sufficient contrast for inactive navigation items', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Inactive nav: gray text on white background
          const textColor = { r: 75, g: 85, b: 99 }; // #4B5563
          const bgColor = hexToRgb(designColors.bgSurface);
          const ratio = getContrastRatio(textColor, bgColor);

          // Text on background requires 4.5:1 minimum
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Contrast Ratio Calculations', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      const ratio = getContrastRatio(black, white);

      // Black on white should be 21:1 (maximum contrast)
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const color = { r: 128, g: 128, b: 128 };
      const ratio = getContrastRatio(color, color);

      // Same color should be 1:1 (no contrast)
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('should be symmetric (order should not matter)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          (r1, g1, b1, r2, g2, b2) => {
            const color1 = { r: r1, g: g1, b: b1 };
            const color2 = { r: r2, g: g2, b: b2 };
            const ratio1 = getContrastRatio(color1, color2);
            const ratio2 = getContrastRatio(color2, color1);

            expect(ratio1).toBeCloseTo(ratio2, 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Design System Validation', () => {
    it('should validate all design system colors are valid hex codes', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          Object.entries(designColors).forEach(([key, value]) => {
            expect(() => hexToRgb(value)).not.toThrow();
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure design system maintains consistent contrast across all text/background combinations', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const textColors = [
            designColors.colorTextMain,
            designColors.colorTextSub,
            designColors.colorHeading,
          ];
          const backgrounds = [designColors.bgSurface, designColors.bgApp];

          textColors.forEach((textColor) => {
            backgrounds.forEach((bgColor) => {
              const text = hexToRgb(textColor);
              const bg = hexToRgb(bgColor);
              const ratio = getContrastRatio(text, bg);

              // All text should meet 4.5:1 minimum
              expect(ratio).toBeGreaterThanOrEqual(4.5);
            });
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});
