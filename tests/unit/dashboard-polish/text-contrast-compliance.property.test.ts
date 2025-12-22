/**
 * Property Test: Text Contrast Compliance
 * Feature: dashboard-global-polish, Property 7: Text Contrast Compliance
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4
 * 
 * Property: For any text displayed on a background, the contrast ratio should be
 * at least 4.5:1 to meet WCAG AA standards.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateContrastRatio, validateContrast } from '../../../lib/design-system/contrast-validator';

describe('Property 7: Text Contrast Compliance', () => {
  // Test that our known good color combinations pass
  it('should pass for known accessible color combinations', () => {
    const accessibleCombinations = [
      { fg: '#000000', bg: '#FFFFFF', name: 'Black on White' },
      { fg: '#FFFFFF', bg: '#000000', name: 'White on Black' },
      { fg: '#333333', bg: '#FFFFFF', name: 'Dark Gray on White' },
      { fg: '#FFFFFF', bg: '#1a1a1a', name: 'White on Dark Background' },
      { fg: '#dc2626', bg: '#FFFFFF', name: 'Red on White (WCAG AA compliant)' },
    ];

    accessibleCombinations.forEach(({ fg, bg, name }) => {
      const result = validateContrast(fg, bg, 'AA', 'normal');
      expect(result.passes, `${name} should pass WCAG AA`).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Test that our known bad color combinations fail
  it('should fail for known inaccessible color combinations', () => {
    const inaccessibleCombinations = [
      { fg: '#cccccc', bg: '#ffffff', name: 'Light Gray on White' },
      { fg: '#8b5cf6', bg: '#d8b4fe', name: 'Violet on Light Purple' },
      { fg: '#6b7280', bg: '#9ca3af', name: 'Gray on Light Gray' },
    ];

    inaccessibleCombinations.forEach(({ fg, bg, name }) => {
      const result = validateContrast(fg, bg, 'AA', 'normal');
      expect(result.passes, `${name} should fail WCAG AA`).toBe(false);
      expect(result.ratio).toBeLessThan(4.5);
    });
  });

  // Property test: Contrast ratio calculation is symmetric
  it('contrast ratio should be symmetric (fg/bg order does not matter)', () => {
    // Generate random RGB values
    const hexColor = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([r, g, b]) => 
      '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    );

    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (color1, color2) => {
          const ratio1 = calculateContrastRatio(color1, color2);
          const ratio2 = calculateContrastRatio(color2, color1);

          return Math.abs(ratio1 - ratio2) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test: Contrast ratio is always between 1 and 21
  it('contrast ratio should always be between 1:1 and 21:1', () => {
    const hexColor = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([r, g, b]) => 
      '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    );

    fc.assert(
      fc.property(
        hexColor,
        hexColor,
        (color1, color2) => {
          const ratio = calculateContrastRatio(color1, color2);
          return ratio >= 1 && ratio <= 21;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test: Black and white have maximum contrast
  it('should calculate maximum contrast for black and white', () => {
    const ratio = calculateContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 1);
  });

  // Property test: Same colors have minimum contrast
  it('same color should have 1:1 contrast ratio', () => {
    const hexColor = fc.tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    ).map(([r, g, b]) => 
      '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    );

    fc.assert(
      fc.property(
        hexColor,
        (color) => {
          const ratio = calculateContrastRatio(color, color);
          return Math.abs(ratio - 1) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test: Dashboard-specific color combinations
  describe('Dashboard Color Combinations', () => {
    it('should identify contrast issues in current color palette', () => {
      // Document known contrast issues that need fixing
      const contrastIssues = [
        { fg: '#8b5cf6', bg: '#FFFFFF', name: 'Violet on White', ratio: 4.23 },
        { fg: '#10b981', bg: '#FFFFFF', name: 'Green on White', ratio: 2.54 },
        { fg: '#6b7280', bg: '#1a1a1a', name: 'Gray on Dark', ratio: 3.60 },
      ];

      contrastIssues.forEach(({ fg, bg, name, ratio: expectedRatio }) => {
        const result = validateContrast(fg, bg, 'AA', 'normal');
        expect(result.passes, `${name} currently fails WCAG AA`).toBe(false);
        expect(result.ratio).toBeCloseTo(expectedRatio, 1);
      });
    });

    it('should validate accessible button combinations', () => {
      const buttonCombinations = [
        { fg: '#FFFFFF', bg: '#dc2626', name: 'White on Red (Error) - WCAG AA compliant' },
      ];

      buttonCombinations.forEach(({ fg, bg, name }) => {
        const result = validateContrast(fg, bg, 'AA', 'normal');
        expect(result.passes, `${name} should pass WCAG AA`).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should validate tier chip color combinations on white', () => {
      const chipCombinations = [
        { fg: '#dc2626', name: 'Churned Chip (Red) - WCAG AA compliant' },
      ];

      // Note: These use semi-transparent backgrounds, so we test against white
      chipCombinations.forEach(({ fg, name }) => {
        const result = validateContrast(fg, '#FFFFFF', 'AA', 'normal');
        expect(result.passes, `${name} text should be readable on white`).toBe(true);
      });
    });

    it('should validate churn risk color indicators', () => {
      const churnColors = [
        { fg: '#dc2626', bg: '#FFFFFF', name: 'High Risk (Red) - WCAG AA compliant' },
      ];

      churnColors.forEach(({ fg, bg, name }) => {
        const result = validateContrast(fg, bg, 'AA', 'normal');
        expect(result.passes, `${name} should pass WCAG AA`).toBe(true);
      });
    });

    it('should validate secondary text on white background', () => {
      // Secondary text is typically gray (#6b7280 or similar)
      const secondaryText = '#6b7280';
      const result = validateContrast(secondaryText, '#FFFFFF', 'AA', 'normal');
      
      // This should pass on white
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // Property test: 3-digit hex codes work correctly
  it('should handle 3-digit hex codes correctly', () => {
    const hex3Color = fc.tuple(
      fc.integer({ min: 0, max: 15 }),
      fc.integer({ min: 0, max: 15 }),
      fc.integer({ min: 0, max: 15 })
    ).map(([r, g, b]) => 
      '#' + [r, g, b].map(v => v.toString(16)).join('')
    );

    fc.assert(
      fc.property(
        hex3Color,
        hex3Color,
        (color1, color2) => {
          const ratio = calculateContrastRatio(color1, color2);
          return ratio >= 1 && ratio <= 21;
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property test: Validation levels work correctly
  it('should apply different thresholds for AA vs AAA', () => {
    // A color combination that passes AA but fails AAA
    const fg = '#767676';
    const bg = '#FFFFFF';

    const resultAA = validateContrast(fg, bg, 'AA', 'normal');
    const resultAAA = validateContrast(fg, bg, 'AAA', 'normal');

    // This combination should pass AA (4.5:1) but fail AAA (7:1)
    expect(resultAA.ratio).toBeGreaterThanOrEqual(4.5);
    expect(resultAA.ratio).toBeLessThan(7);
    expect(resultAA.passes).toBe(true);
    expect(resultAAA.passes).toBe(false);
  });

  // Property test: Large text has lower requirements
  it('should apply lower threshold for large text', () => {
    // A color combination that passes for large text but fails for normal
    const fg = '#8a8a8a';
    const bg = '#FFFFFF';

    const resultNormal = validateContrast(fg, bg, 'AA', 'normal');
    const resultLarge = validateContrast(fg, bg, 'AA', 'large');

    // This combination should fail normal (4.5:1) but pass large (3:1)
    expect(resultNormal.ratio).toBeGreaterThanOrEqual(3);
    expect(resultNormal.ratio).toBeLessThan(4.5);
    expect(resultNormal.passes).toBe(false);
    expect(resultLarge.passes).toBe(true);
  });
});
