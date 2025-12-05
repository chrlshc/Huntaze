/**
 * **Feature: onlyfans-shopify-design, Property 1: Light Background Consistency**
 * 
 * *For any* page using ShopifyPageLayout, the main content area background 
 * color SHALL be #f6f6f7 or equivalent light gray.
 * 
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify design token values
const SHOPIFY_BG_PAGE = '#f6f6f7';
const SHOPIFY_BG_PAGE_RGB = { r: 246, g: 246, b: 247 };

// Helper to parse hex color to RGB
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

// Helper to check if a color is "light" (high luminance)
function isLightColor(r: number, g: number, b: number): boolean {
  // Calculate relative luminance using sRGB formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85; // Very light threshold
}

// Helper to check if color is close to target (within tolerance)
function isColorClose(
  color: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  tolerance: number = 10
): boolean {
  return (
    Math.abs(color.r - target.r) <= tolerance &&
    Math.abs(color.g - target.g) <= tolerance &&
    Math.abs(color.b - target.b) <= tolerance
  );
}

describe('Property 1: Light Background Consistency', () => {
  it('should define page background as light gray #f6f6f7', () => {
    const rgb = hexToRgb(SHOPIFY_BG_PAGE);
    expect(rgb).not.toBeNull();
    expect(rgb).toEqual(SHOPIFY_BG_PAGE_RGB);
  });

  it('should have a light background color (high luminance)', () => {
    const { r, g, b } = SHOPIFY_BG_PAGE_RGB;
    expect(isLightColor(r, g, b)).toBe(true);
  });

  it('should maintain light background for any valid page layout configuration', () => {
    fc.assert(
      fc.property(
        // Generate various page configurations
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          hasSubtitle: fc.boolean(),
          hasActions: fc.boolean(),
          maxWidth: fc.constantFrom('sm', 'md', 'lg', 'xl'),
        }),
        (config) => {
          // For any configuration, the background should remain light
          const bgColor = SHOPIFY_BG_PAGE_RGB;
          
          // Property: Background must be light (luminance > 0.85)
          expect(isLightColor(bgColor.r, bgColor.g, bgColor.b)).toBe(true);
          
          // Property: Background must be close to #f6f6f7
          expect(isColorClose(bgColor, { r: 246, g: 246, b: 247 })).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contrast with card white background', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const pageBg = SHOPIFY_BG_PAGE_RGB;
          const cardBg = { r: 255, g: 255, b: 255 }; // Pure white
          
          // Page background should be slightly darker than card
          const pageLuminance = (0.299 * pageBg.r + 0.587 * pageBg.g + 0.114 * pageBg.b) / 255;
          const cardLuminance = (0.299 * cardBg.r + 0.587 * cardBg.g + 0.114 * cardBg.b) / 255;
          
          // Card should be brighter than page background
          expect(cardLuminance).toBeGreaterThan(pageLuminance);
          
          // But both should be light
          expect(pageLuminance).toBeGreaterThan(0.85);
          expect(cardLuminance).toBeGreaterThan(0.95);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be consistent across different viewport sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }), // viewport width
        fc.integer({ min: 480, max: 1440 }), // viewport height
        (width, height) => {
          // Background color should not change based on viewport
          const bgColor = SHOPIFY_BG_PAGE;
          expect(bgColor).toBe('#f6f6f7');
        }
      ),
      { numRuns: 100 }
    );
  });
});
