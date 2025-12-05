/**
 * **Feature: dashboard-design-refactor, Property 14: Banner WCAG contrast**
 * **Validates: Requirements 5.4**
 * 
 * For any Banner component, the contrast ratio between text color and 
 * background color SHALL be at least 4.5:1.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Banner status types
type BannerStatus = 'info' | 'warning' | 'critical' | 'success';

// Color definitions for each status
// These are the actual colors used in the Banner component
const statusColors: Record<BannerStatus, {
  background: { r: number; g: number; b: number };
  text: { r: number; g: number; b: number };
}> = {
  info: {
    background: { r: 235, g: 245, b: 255 }, // #EBF5FF
    text: { r: 30, g: 58, b: 95 },          // #1E3A5F
  },
  warning: {
    background: { r: 255, g: 248, b: 230 }, // #FFF8E6
    text: { r: 92, g: 72, b: 19 },          // #5C4813
  },
  critical: {
    background: { r: 255, g: 244, b: 244 }, // #FFF4F4
    text: { r: 92, g: 26, b: 26 },          // #5C1A1A
  },
  success: {
    background: { r: 240, g: 253, b: 244 }, // #F0FDF4
    text: { r: 20, g: 83, b: 45 },          // #14532D
  },
};

// Calculate relative luminance according to WCAG 2.1
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio according to WCAG 2.1
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

// WCAG AA minimum contrast ratio for normal text
const WCAG_AA_MINIMUM = 4.5;

// Arbitraries
const statusArb = fc.constantFrom('info', 'warning', 'critical', 'success') as fc.Arbitrary<BannerStatus>;

describe('Property 14: Banner WCAG contrast', () => {
  it('all status variants should meet WCAG AA contrast ratio (4.5:1)', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const colors = statusColors[status];
        const contrastRatio = getContrastRatio(colors.background, colors.text);
        
        expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
      }),
      { numRuns: 100 }
    );
  });

  it('info status should have sufficient contrast', () => {
    const colors = statusColors.info;
    const contrastRatio = getContrastRatio(colors.background, colors.text);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    // Log actual ratio for documentation
    console.log(`Info banner contrast ratio: ${contrastRatio.toFixed(2)}:1`);
  });

  it('warning status should have sufficient contrast', () => {
    const colors = statusColors.warning;
    const contrastRatio = getContrastRatio(colors.background, colors.text);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    console.log(`Warning banner contrast ratio: ${contrastRatio.toFixed(2)}:1`);
  });

  it('critical status should have sufficient contrast', () => {
    const colors = statusColors.critical;
    const contrastRatio = getContrastRatio(colors.background, colors.text);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    console.log(`Critical banner contrast ratio: ${contrastRatio.toFixed(2)}:1`);
  });

  it('success status should have sufficient contrast', () => {
    const colors = statusColors.success;
    const contrastRatio = getContrastRatio(colors.background, colors.text);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
    console.log(`Success banner contrast ratio: ${contrastRatio.toFixed(2)}:1`);
  });

  it('contrast calculation should be symmetric', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const colors = statusColors[status];
        const ratio1 = getContrastRatio(colors.background, colors.text);
        const ratio2 = getContrastRatio(colors.text, colors.background);
        
        // Contrast ratio should be the same regardless of order
        expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.001);
      }),
      { numRuns: 100 }
    );
  });

  it('all backgrounds should be light (high luminance)', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const colors = statusColors[status];
        const bgLuminance = getRelativeLuminance(
          colors.background.r,
          colors.background.g,
          colors.background.b
        );
        
        // Background should be light (luminance > 0.5)
        expect(bgLuminance).toBeGreaterThan(0.5);
      }),
      { numRuns: 100 }
    );
  });

  it('all text colors should be dark (low luminance)', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const colors = statusColors[status];
        const textLuminance = getRelativeLuminance(
          colors.text.r,
          colors.text.g,
          colors.text.b
        );
        
        // Text should be dark (luminance < 0.3)
        expect(textLuminance).toBeLessThan(0.3);
      }),
      { numRuns: 100 }
    );
  });
});
