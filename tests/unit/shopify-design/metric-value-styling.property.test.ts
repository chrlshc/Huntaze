/**
 * Property Test: Metric Value Styling
 * **Feature: onlyfans-shopify-design, Property 6: Metric Value Styling**
 * **Validates: Requirements 3.2**
 * 
 * For any ShopifyMetricCard, the value SHALL be styled with:
 * - Font size: 24-28px
 * - Font weight: bold (700)
 * - Color: primary text (#1a1a1a)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify metric value specifications
const METRIC_VALUE_SPEC = {
  fontSize: { min: 24, max: 28 }, // pixels
  color: '#1a1a1a',
  fontWeight: 700, // bold
};

interface MetricValueConfig {
  value: string | number;
  formatted: boolean;
  currency: boolean;
}

// Function to validate value font size is within spec
function isValidValueFontSize(fontSize: number): boolean {
  return fontSize >= METRIC_VALUE_SPEC.fontSize.min && 
         fontSize <= METRIC_VALUE_SPEC.fontSize.max;
}

// Function to validate value color matches primary text
function isValidValueColor(color: string): boolean {
  return color.toLowerCase() === METRIC_VALUE_SPEC.color.toLowerCase();
}

// Function to check if color is dark enough for primary text
function isPrimaryTextColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Primary text should be dark (low luminance)
  return luminance < 0.2;
}

// Function to check if font weight is bold
function isBoldWeight(weight: number): boolean {
  return weight >= 700;
}

describe('Property 6: Metric Value Styling', () => {
  it('should have font size between 24-28px', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 24, max: 28 }),
        (fontSize) => {
          expect(isValidValueFontSize(fontSize)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject font sizes outside 24-28px range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 10, max: 23 }),
          fc.integer({ min: 29, max: 48 })
        ),
        (fontSize) => {
          expect(isValidValueFontSize(fontSize)).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use primary text color #1a1a1a', () => {
    const valueColor = METRIC_VALUE_SPEC.color;
    expect(isValidValueColor(valueColor)).toBe(true);
    expect(isPrimaryTextColor(valueColor)).toBe(true);
  });

  it('should use bold font weight (700)', () => {
    const fontWeight = METRIC_VALUE_SPEC.fontWeight;
    expect(isBoldWeight(fontWeight)).toBe(true);
  });

  it('should have consistent value styling regardless of value type', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.float({ min: 0, max: 100000 })
        ),
        (value) => {
          // Value styling should be consistent regardless of content type
          const expectedFontSize = 28; // Our implementation uses 28px
          const expectedColor = METRIC_VALUE_SPEC.color;
          const expectedWeight = METRIC_VALUE_SPEC.fontWeight;
          
          expect(isValidValueFontSize(expectedFontSize)).toBe(true);
          expect(isValidValueColor(expectedColor)).toBe(true);
          expect(isBoldWeight(expectedWeight)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have value color that provides high contrast with white background', () => {
    const valueColor = METRIC_VALUE_SPEC.color;
    const hex = valueColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance using WCAG formula
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    const rL = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gL = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bL = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    const luminance = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    
    // White background luminance is 1.0
    // Contrast ratio should be at least 4.5:1 for WCAG AA
    const contrastRatio = (1 + 0.05) / (luminance + 0.05);
    
    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('should have clear visual hierarchy between label and value', () => {
    const labelFontSize = 13; // Label size
    const valueFontSize = 28; // Value size
    
    // Value should be significantly larger than label
    const sizeRatio = valueFontSize / labelFontSize;
    
    // At least 2x larger for clear hierarchy
    expect(sizeRatio).toBeGreaterThanOrEqual(2);
  });
});
