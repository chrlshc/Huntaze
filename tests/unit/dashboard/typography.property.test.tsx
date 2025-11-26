/**
 * Property-Based Tests for Typography System
 * 
 * Feature: dashboard-shopify-migration
 * Phase: 7 - Typography System
 * 
 * These tests verify that the typography system maintains consistency
 * across all dashboard components, ensuring proper font hierarchy,
 * color usage, and avoidance of pure black.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

// Read the CSS tokens file
const cssTokensPath = path.join(process.cwd(), 'styles/dashboard-shopify-tokens.css');
const cssContent = fs.readFileSync(cssTokensPath, 'utf-8');

// Helper to extract CSS variable value
const extractCSSVariable = (varName: string): string | null => {
  const regex = new RegExp(`${varName}:\\s*([^;]+);`);
  const match = cssContent.match(regex);
  return match ? match[1].trim() : null;
};

// Helper to check if a color is pure black
const isPureBlack = (color: string): boolean => {
  const normalized = color.toLowerCase().trim();
  return (
    normalized === '#000' ||
    normalized === '#000000' ||
    normalized === 'rgb(0, 0, 0)' ||
    normalized === 'black'
  );
};

// Helper to parse font size to number
const parseFontSize = (fontSize: string): number => {
  return parseFloat(fontSize);
};

describe('Typography System - Property Tests', () => {
  describe('Property 32: Heading Typography Consistency', () => {
    // Feature: dashboard-shopify-migration, Property 32: Heading Typography Consistency
    it('should define Poppins or Inter font for headings with font-weight 600', () => {
      const fontHeading = extractCSSVariable('--font-heading');
      const fontWeightHeading = extractCSSVariable('--font-weight-heading');
      
      expect(fontHeading).toBeTruthy();
      expect(fontHeading).toMatch(/Poppins|Inter/);
      expect(fontWeightHeading).toBe('600');
    });

    it('should use #111827 color for heading text', () => {
      const colorTextHeading = extractCSSVariable('--color-text-heading');
      
      expect(colorTextHeading).toBeTruthy();
      expect(colorTextHeading).toBe('#111827');
    });

    it('should apply heading styles to all heading classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.huntaze-heading', '.huntaze-h1', '.huntaze-h2', '.huntaze-h3'),
          (selector) => {
            // Check that CSS contains the selector with proper styling
            const hasSelector = cssContent.includes(selector);
            expect(hasSelector).toBe(true);
            
            // Check that heading styles reference the correct variables
            if (hasSelector) {
              const selectorBlock = cssContent.substring(
                cssContent.indexOf(selector),
                cssContent.indexOf('}', cssContent.indexOf(selector))
              );
              
              // Should reference font-heading or font-weight-heading
              const hasTypographyVars = 
                selectorBlock.includes('--font-heading') ||
                selectorBlock.includes('--font-weight-heading') ||
                selectorBlock.includes('--color-text-heading');
              
              expect(hasTypographyVars).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply heading styles to HTML heading elements', () => {
      // Check that h1, h2, h3 elements have proper styling
      const headingElements = ['h1', 'h2', 'h3'];
      
      headingElements.forEach(tag => {
        // Look for the tag in a selector context (e.g., "h1, .h1" or "h1 {")
        const hasHeadingStyle = 
          cssContent.includes(`${tag},`) ||
          cssContent.includes(`${tag} {`) ||
          cssContent.includes(`${tag}.`);
        
        expect(hasHeadingStyle).toBe(true);
      });
    });
  });

  describe('Property 33: Body Text Typography Consistency', () => {
    // Feature: dashboard-shopify-migration, Property 33: Body Text Typography Consistency
    it('should define Inter or system font for body text', () => {
      const fontBody = extractCSSVariable('--font-body');
      
      expect(fontBody).toBeTruthy();
      expect(fontBody).toMatch(/Inter/);
    });

    it('should use #1F2937 color for main body text', () => {
      const colorTextMain = extractCSSVariable('--color-text-main');
      
      expect(colorTextMain).toBeTruthy();
      expect(colorTextMain).toBe('#1F2937');
    });

    it('should apply body styles to body text classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.huntaze-body', '.huntaze-body-small', 'p'),
          (selector) => {
            const hasSelector = cssContent.includes(selector);
            expect(hasSelector).toBe(true);
            
            if (hasSelector) {
              const selectorBlock = cssContent.substring(
                cssContent.indexOf(selector),
                cssContent.indexOf('}', cssContent.indexOf(selector))
              );
              
              const hasBodyVars = 
                selectorBlock.includes('--font-body') ||
                selectorBlock.includes('--color-text-main');
              
              expect(hasBodyVars).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 34: Pure Black Avoidance', () => {
    // Feature: dashboard-shopify-migration, Property 34: Pure Black Avoidance
    it('should never define pure black (#000000) in color variables', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '--color-text-main',
            '--color-text-sub',
            '--color-text-heading',
            '--color-text-inactive'
          ),
          (varName) => {
            const value = extractCSSVariable(varName);
            expect(value).toBeTruthy();
            
            if (value) {
              expect(isPureBlack(value)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use deep gray (#111827) instead of pure black for headings', () => {
      const colorTextHeading = extractCSSVariable('--color-text-heading');
      
      expect(colorTextHeading).toBe('#111827');
      expect(isPureBlack(colorTextHeading!)).toBe(false);
    });

    it('should override any pure black inline styles', () => {
      // Check for the override rule in CSS
      const hasBlackOverride = 
        cssContent.includes('color: #000') ||
        cssContent.includes('color: black') ||
        cssContent.includes('rgb(0, 0, 0)');
      
      // If there are any black references, they should be in override rules
      if (hasBlackOverride) {
        expect(cssContent).toMatch(/\*\[style.*color.*\]/);
      }
    });
  });

  describe('Property 35: Font Size Hierarchy', () => {
    // Feature: dashboard-shopify-migration, Property 35: Font Size Hierarchy
    it('should maintain clear font size hierarchy: h1 > h2 > h3 > body > label', () => {
      const h1Size = parseFontSize(extractCSSVariable('--font-size-h1')!);
      const h2Size = parseFontSize(extractCSSVariable('--font-size-h2')!);
      const h3Size = parseFontSize(extractCSSVariable('--font-size-h3')!);
      const bodySize = parseFontSize(extractCSSVariable('--font-size-body')!);
      const labelSize = parseFontSize(extractCSSVariable('--font-size-label')!);
      
      // Heading hierarchy
      expect(h1Size).toBeGreaterThan(h2Size);
      expect(h2Size).toBeGreaterThan(h3Size);
      
      // All headings larger than body
      expect(h1Size).toBeGreaterThan(bodySize);
      expect(h2Size).toBeGreaterThan(bodySize);
      expect(h3Size).toBeGreaterThan(bodySize);
      
      // Body larger than labels
      expect(bodySize).toBeGreaterThan(labelSize);
    });

    it('should verify font size hierarchy for all defined sizes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ['--font-size-h1', '--font-size-h2'],
            ['--font-size-h2', '--font-size-h3'],
            ['--font-size-h3', '--font-size-body'],
            ['--font-size-body', '--font-size-label']
          ),
          ([larger, smaller]) => {
            const largerSize = parseFontSize(extractCSSVariable(larger)!);
            const smallerSize = parseFontSize(extractCSSVariable(smaller)!);
            
            expect(largerSize).toBeGreaterThan(smallerSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Welcome Title Typography', () => {
    it('should use 24px font size with -0.5px letter spacing for welcome title', () => {
      const welcomeSize = extractCSSVariable('--font-size-welcome');
      const letterSpacing = extractCSSVariable('--letter-spacing-tight');
      
      expect(parseFontSize(welcomeSize!)).toBe(24);
      expect(parseFloat(letterSpacing!)).toBe(-0.5);
    });

    it('should have welcome title class with proper styling', () => {
      expect(cssContent).toContain('.huntaze-welcome-title');
      
      const welcomeTitleBlock = cssContent.substring(
        cssContent.indexOf('.huntaze-welcome-title'),
        cssContent.indexOf('}', cssContent.indexOf('.huntaze-welcome-title'))
      );
      
      expect(welcomeTitleBlock).toContain('--font-size-welcome');
      expect(welcomeTitleBlock).toContain('--letter-spacing-tight');
    });
  });

  describe('Secondary Text Color', () => {
    it('should use medium gray (#6B7280) for secondary text', () => {
      const colorTextSub = extractCSSVariable('--color-text-sub');
      
      expect(colorTextSub).toBe('#6B7280');
    });

    it('should apply secondary color to appropriate classes', () => {
      expect(cssContent).toContain('.huntaze-body-secondary');
      expect(cssContent).toContain('.huntaze-label');
      
      const secondaryBlock = cssContent.substring(
        cssContent.indexOf('.huntaze-body-secondary'),
        cssContent.indexOf('}', cssContent.indexOf('.huntaze-body-secondary'))
      );
      
      expect(secondaryBlock).toContain('--color-text-sub');
    });
  });

  describe('Line Height Consistency', () => {
    it('should define appropriate line heights for different text types', () => {
      // Check that line heights are defined in CSS classes
      const h1Block = cssContent.substring(
        cssContent.indexOf('.huntaze-h1'),
        cssContent.indexOf('}', cssContent.indexOf('.huntaze-h1'))
      );
      
      const bodyBlock = cssContent.substring(
        cssContent.indexOf('.huntaze-body'),
        cssContent.indexOf('}', cssContent.indexOf('.huntaze-body'))
      );
      
      // Headings should have tighter line height (1.2-1.4)
      expect(h1Block).toMatch(/line-height:\s*1\.[2-4]/);
      
      // Body should have comfortable line height (1.5)
      expect(bodyBlock).toMatch(/line-height:\s*1\.5/);
    });
  });

  describe('Font Weight Consistency', () => {
    it('should define consistent font weights', () => {
      const fontWeightHeading = extractCSSVariable('--font-weight-heading');
      const fontWeightBody = extractCSSVariable('--font-weight-body');
      const fontWeightMedium = extractCSSVariable('--font-weight-medium');
      
      expect(fontWeightHeading).toBe('600');
      expect(fontWeightBody).toBe('400');
      expect(fontWeightMedium).toBe('500');
    });
  });

  describe('Typography System Completeness', () => {
    it('should define all required typography variables', () => {
      const requiredVars = [
        '--font-heading',
        '--font-body',
        '--font-weight-heading',
        '--font-weight-body',
        '--font-size-h1',
        '--font-size-h2',
        '--font-size-h3',
        '--font-size-body',
        '--font-size-label',
        '--color-text-heading',
        '--color-text-main',
        '--color-text-sub',
        '--letter-spacing-tight'
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...requiredVars),
          (varName) => {
            const value = extractCSSVariable(varName);
            expect(value).toBeTruthy();
            expect(value).not.toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
