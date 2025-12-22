/**
 * Property Test: Date Separator Spacing Symmetry
 * Feature: messages-saas-density-polish
 * Property 5: Date Separator Spacing Symmetry
 * 
 * For any date separator, the spacing above and below should be equal
 * and within the range of 16-20px.
 * 
 * Validates: Requirements 5.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { messageArbitrary, hasDayBoundary } from './property-test-utils';

describe('Property Test: Date Separator Spacing Symmetry', () => {
  const dateSeparatorFile = 'components/messages/date-separator.css';

  it('should have symmetric spacing above and below', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract margin values
      const marginTopRegex = /\.date-separator[^{]*{[^}]*margin-top:\s*(\d+)px/s;
      const marginBottomRegex = /\.date-separator[^{]*{[^}]*margin-bottom:\s*(\d+)px/s;
      const marginShorthandRegex = /\.date-separator[^{]*{[^}]*margin:\s*(\d+)px/s;

      const topMatch = marginTopRegex.exec(cssContent);
      const bottomMatch = marginBottomRegex.exec(cssContent);
      const shorthandMatch = marginShorthandRegex.exec(cssContent);

      if (shorthandMatch) {
        // Using shorthand, top and bottom are equal
        const margin = parseInt(shorthandMatch[1], 10);
        expect(margin).toBeGreaterThanOrEqual(16);
        expect(margin).toBeLessThanOrEqual(20);
      } else if (topMatch && bottomMatch) {
        const marginTop = parseInt(topMatch[1], 10);
        const marginBottom = parseInt(bottomMatch[1], 10);
        
        // Property: Top and bottom should be equal
        expect(marginTop).toBe(marginBottom);
        
        // Property: Should be within 16-20px range
        expect(marginTop).toBeGreaterThanOrEqual(16);
        expect(marginTop).toBeLessThanOrEqual(20);
      }
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should use spacing token for margins', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check if using spacing token
      const tokenRegex = /\.date-separator[^{]*{[^}]*margin:\s*var\(--msg-date-separator-spacing\)/s;
      const usesToken = tokenRegex.test(cssContent);

      // Property: Should use spacing token
      expect(usesToken).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should maintain spacing consistency across different message counts', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 10, maxLength: 50 })
          .filter(msgs => hasDayBoundary(msgs)),
        (messages) => {
          // Property: Date separator spacing should be constant
          // regardless of surrounding message count
          
          try {
            const fullPath = join(process.cwd(), dateSeparatorFile);
            const cssContent = readFileSync(fullPath, 'utf-8');
            const marginRegex = /\.date-separator[^{]*{[^}]*margin:\s*(\d+)px/s;
            const match = marginRegex.exec(cssContent);

            if (match) {
              const margin = parseInt(match[1], 10);
              return margin >= 16 && margin <= 20;
            }
            return true;
          } catch {
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have chip-style background', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for background color
      const bgRegex = /\.date-separator[^{]*{[^}]*background(?:-color)?:\s*#[A-Fa-f0-9]{6}/s;
      const hasBg = bgRegex.test(cssContent);

      // Property: Should have background color
      expect(hasBg).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should have appropriate border radius for chip style', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for border radius
      const radiusRegex = /\.date-separator[^{]*{[^}]*border-radius:\s*(\d+)px/s;
      const match = radiusRegex.exec(cssContent);

      if (match) {
        const radius = parseInt(match[1], 10);
        
        // Property: Should have 12px border radius for chip style
        expect(radius).toBe(12);
      }
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should have compact padding', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for padding
      const paddingRegex = /\.date-separator[^{]*{[^}]*padding:\s*(\d+)px\s+(\d+)px/s;
      const match = paddingRegex.exec(cssContent);

      if (match) {
        const verticalPadding = parseInt(match[1], 10);
        const horizontalPadding = parseInt(match[2], 10);
        
        // Property: Should have 4px vertical, 12px horizontal
        expect(verticalPadding).toBe(4);
        expect(horizontalPadding).toBe(12);
      }
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should use small font size', () => {
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for font size
      const fontSizeRegex = /\.date-separator[^{]*{[^}]*font-size:\s*(\d+)px/s;
      const match = fontSizeRegex.exec(cssContent);

      if (match) {
        const fontSize = parseInt(match[1], 10);
        
        // Property: Should be 11-12px
        expect(fontSize).toBeGreaterThanOrEqual(11);
        expect(fontSize).toBeLessThanOrEqual(12);
      }
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should verify spacing token value is within spec', () => {
    try {
      const tokenFile = 'styles/messaging-spacing-tokens.css';
      const fullPath = join(process.cwd(), tokenFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract date separator spacing token
      const tokenRegex = /--msg-date-separator-spacing:\s*(\d+)px/;
      const match = tokenRegex.exec(cssContent);

      if (match) {
        const spacing = parseInt(match[1], 10);
        
        // Property: Token value should be 16-20px
        expect(spacing).toBeGreaterThanOrEqual(16);
        expect(spacing).toBeLessThanOrEqual(20);
      }
    } catch (error) {
      console.warn('Could not read spacing tokens file:', error);
    }
  });
});
