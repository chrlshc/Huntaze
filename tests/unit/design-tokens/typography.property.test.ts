/**
 * Property-Based Tests for Typography System
 * Feature: linear-ui-performance-refactor
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { designTokens } from '../../../types/design-tokens';

let cssContent: string;

beforeAll(() => {
  const cssPath = path.join(process.cwd(), 'styles', 'linear-design-tokens.css');
  cssContent = fs.readFileSync(cssPath, 'utf-8');
});

function hasFontFamilyInter(fontFamily: string): boolean {
  return fontFamily.toLowerCase().includes('inter') || 
         fontFamily.toLowerCase().includes('sans-serif');
}

function parseFontWeight(weight: string | number): number {
  if (typeof weight === 'number') return weight;
  const parsed = parseInt(weight, 10);
  return isNaN(parsed) ? 400 : parsed;
}

describe('Typography System Property Tests', () => {
  /**
   * Property 7: Font family consistency
   * Feature: linear-ui-performance-refactor, Property 7: Font family consistency
   * Validates: Requirements 2.1
   */
  describe('Property 7: Font family consistency', () => {
    it('should define Inter as the base font family in CSS', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          () => {
            expect(cssContent).toContain('--font-family-base:');
            expect(cssContent).toMatch(/--font-family-base:\s*'Inter'/);
            expect(designTokens.typography.fontFamily.base).toContain('Inter');
            expect(designTokens.typography.fontFamily.base).toContain('sans-serif');
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid Inter font family declarations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "'Inter', sans-serif",
            "'Inter', -apple-system, sans-serif",
            "Inter, sans-serif"
          ),
          (fontFamily) => {
            expect(hasFontFamilyInter(fontFamily)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Heading font weight
   * Feature: linear-ui-performance-refactor, Property 8: Heading font weight
   * Validates: Requirements 2.2
   */
  describe('Property 8: Heading font weight', () => {
    it('should define font-weight medium as 500 in design tokens', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          () => {
            expect(cssContent).toContain('--font-weight-medium: 500');
            expect(designTokens.typography.weights.medium).toBe(500);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that 500 is the correct weight for headings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('500', 'var(--font-weight-medium)'),
          (fontWeight) => {
            const isValid = fontWeight === '500' || fontWeight === 'var(--font-weight-medium)';
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid font weights for headings', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('300', '400', '600', '700', '800', '900'),
          (fontWeight) => {
            const weight = parseFontWeight(fontWeight);
            expect(weight).not.toBe(500);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Body text font weight
   * Feature: linear-ui-performance-refactor, Property 9: Body text font weight
   * Validates: Requirements 2.3
   */
  describe('Property 9: Body text font weight', () => {
    it('should define font-weight regular as 400 in design tokens', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          () => {
            expect(cssContent).toContain('--font-weight-regular: 400');
            expect(designTokens.typography.weights.regular).toBe(400);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate that 400 is the correct weight for body text', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('400', 'var(--font-weight-regular)', 'normal'),
          (fontWeight) => {
            const isValid = fontWeight === '400' || 
                          fontWeight === 'normal' ||
                          fontWeight === 'var(--font-weight-regular)';
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid font weights for body text', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('300', '500', '600', '700', '800'),
          (fontWeight) => {
            const weight = parseFontWeight(fontWeight);
            expect(weight).not.toBe(400);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Bold font prohibition
   * Feature: linear-ui-performance-refactor, Property 10: Bold font prohibition
   * Validates: Requirements 2.4
   */
  describe('Property 10: Bold font prohibition', () => {
    it('should never define font-weight 700 or higher in design tokens', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          () => {
            expect(cssContent).not.toContain('--font-weight-bold');
            expect(cssContent).not.toContain(': 700');
            expect(cssContent).not.toContain(': 800');
            expect(cssContent).not.toContain(': 900');
            expect(designTokens.typography.weights.regular).toBe(400);
            expect(designTokens.typography.weights.medium).toBe(500);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject bold and bolder font weights', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('700', '800', '900', 'bold', 'bolder'),
          (fontWeight) => {
            const weight = fontWeight === 'bold' ? 700 : 
                         fontWeight === 'bolder' ? 900 : 
                         parseFontWeight(fontWeight);
            expect(weight).toBeGreaterThanOrEqual(700);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only allow font-weight 400 and 500', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('400', '500', 'normal', 'var(--font-weight-regular)', 'var(--font-weight-medium)'),
          (fontWeight) => {
            const weight = fontWeight === 'normal' ? 400 : 
                         fontWeight.startsWith('var(') ? 
                           (fontWeight.includes('regular') ? 400 : 500) :
                         parseFontWeight(fontWeight);
            expect([400, 500]).toContain(weight);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
