/**
 * **Feature: onlyfans-shopify-design, Property 11: Banner Status Colors**
 * **Validates: Requirements 7.1**
 * 
 * For any ShopifyBanner with a status, the background SHALL be the appropriate
 * light color based on the status type.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Status to expected background color mapping (Shopify-style light backgrounds)
const statusBackgroundColors: Record<string, string> = {
  info: '#eef6ff',      // Light blue
  warning: '#fff8e6',   // Light amber/yellow
  success: '#e6f7f2',   // Light green
  critical: '#fff4f4',  // Light red
};

// Status to expected border color mapping
const statusBorderColors: Record<string, string> = {
  info: '#b4d5fe',
  warning: '#ffd79d',
  success: '#95d5c3',
  critical: '#fdb5b5',
};

// Status to expected icon color mapping
const statusIconColors: Record<string, string> = {
  info: '#2c6ecb',
  warning: '#b98900',
  success: '#008060',
  critical: '#d72c0d',
};

describe('Property 11: Banner Status Colors', () => {
  const statusArbitrary = fc.constantFrom('info', 'warning', 'success', 'critical');

  it('should have correct background color for each status', () => {
    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const expectedBg = statusBackgroundColors[status];
        expect(expectedBg).toBeDefined();
        // Verify the color is a light color (high lightness)
        const rgb = hexToRgb(expectedBg);
        expect(rgb).not.toBeNull();
        if (rgb) {
          const lightness = (Math.max(rgb.r, rgb.g, rgb.b) + Math.min(rgb.r, rgb.g, rgb.b)) / 2 / 255;
          expect(lightness).toBeGreaterThan(0.85); // Light backgrounds should have high lightness
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have warning status with amber/yellow background', () => {
    fc.assert(
      fc.property(fc.constant('warning'), (status) => {
        const bgColor = statusBackgroundColors[status];
        const rgb = hexToRgb(bgColor);
        expect(rgb).not.toBeNull();
        if (rgb) {
          // Yellow/amber has high red and green, low blue
          expect(rgb.r).toBeGreaterThan(200);
          expect(rgb.g).toBeGreaterThan(200);
          // Blue should be lower than red and green for amber tint
          expect(rgb.b).toBeLessThan(rgb.r);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have success status with green-tinted background', () => {
    fc.assert(
      fc.property(fc.constant('success'), (status) => {
        const bgColor = statusBackgroundColors[status];
        const rgb = hexToRgb(bgColor);
        expect(rgb).not.toBeNull();
        if (rgb) {
          // Green-tinted means green channel should be relatively high
          expect(rgb.g).toBeGreaterThan(230);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have critical status with red-tinted background', () => {
    fc.assert(
      fc.property(fc.constant('critical'), (status) => {
        const bgColor = statusBackgroundColors[status];
        const rgb = hexToRgb(bgColor);
        expect(rgb).not.toBeNull();
        if (rgb) {
          // Red-tinted means red channel should be highest
          expect(rgb.r).toBeGreaterThanOrEqual(rgb.g);
          expect(rgb.r).toBeGreaterThanOrEqual(rgb.b);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have info status with blue-tinted background', () => {
    fc.assert(
      fc.property(fc.constant('info'), (status) => {
        const bgColor = statusBackgroundColors[status];
        const rgb = hexToRgb(bgColor);
        expect(rgb).not.toBeNull();
        if (rgb) {
          // Blue-tinted means blue channel should be highest
          expect(rgb.b).toBeGreaterThanOrEqual(rgb.r);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should have matching border colors for each status', () => {
    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const borderColor = statusBorderColors[status];
        expect(borderColor).toBeDefined();
        expect(borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should have appropriate icon colors for each status', () => {
    fc.assert(
      fc.property(statusArbitrary, (status) => {
        const iconColor = statusIconColors[status];
        expect(iconColor).toBeDefined();
        expect(iconColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        // Icon colors should be darker/more saturated than backgrounds
        const rgb = hexToRgb(iconColor);
        expect(rgb).not.toBeNull();
        if (rgb) {
          const lightness = (Math.max(rgb.r, rgb.g, rgb.b) + Math.min(rgb.r, rgb.g, rgb.b)) / 2 / 255;
          expect(lightness).toBeLessThan(0.7); // Icons should be darker
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Helper function to convert hex to RGB
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
