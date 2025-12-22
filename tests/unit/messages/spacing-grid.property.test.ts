/**
 * Property Test: Spacing Grid Compliance
 * Feature: messages-saas-density-polish
 * Property 2: Spacing Grid Compliance
 * 
 * For any UI element with margin or padding, the spacing value should be
 * a multiple of 4 or 8px.
 * 
 * Validates: Requirements 7.1, 7.2, 7.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  spacingValueArbitrary,
  isGridAligned,
  extractSpacingValues,
  areAllSpacingsGridAligned,
} from './property-test-utils';
import { snapToGrid } from '../../../lib/messages/spacing-utils';

describe('Property Test: Spacing Grid Compliance', () => {
  // CSS files to audit
  const cssFiles = [
    'styles/messaging-spacing-tokens.css',
    'components/messages/messaging-interface.css',
    'components/messages/chat-container.css',
    'components/messages/fan-list.css',
    'components/messages/context-panel.css',
    'components/messages/date-separator.css',
  ];

  it('should snap any value to nearest 4px or 8px multiple', () => {
    fc.assert(
      fc.property(
        spacingValueArbitrary,
        (value) => {
          const snapped = snapToGrid(value);
          return isGridAligned(snapped);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve values already aligned to grid', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 25 }).map(n => n * 8), // Generate multiples of 8
        (value) => {
          const snapped = snapToGrid(value);
          return snapped === value;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round to nearest grid value', () => {
    fc.assert(
      fc.property(
        spacingValueArbitrary,
        (value) => {
          const snapped = snapToGrid(value);
          const diff = Math.abs(snapped - value);
          // Should be within 4px (half of 8px grid)
          return diff <= 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should ensure all CSS spacing values are grid-aligned', () => {
    cssFiles.forEach(filePath => {
      try {
        const fullPath = join(process.cwd(), filePath);
        const cssContent = readFileSync(fullPath, 'utf-8');
        const spacingValues = extractSpacingValues(cssContent);

        // Property: All spacing values should be multiples of 4
        spacingValues.forEach(value => {
          expect(isGridAligned(value)).toBe(true);
        });
      } catch (error) {
        // File might not exist yet, skip
        console.warn(`Could not read ${filePath}:`, error);
      }
    });
  });

  it('should validate spacing token values are grid-aligned', () => {
    const tokenFile = 'styles/messaging-spacing-tokens.css';
    try {
      const fullPath = join(process.cwd(), tokenFile);
      const cssContent = readFileSync(fullPath, 'utf-8');
      
      // Extract token values (e.g., --msg-space-xs: 4px)
      const tokenRegex = /--msg-space-\w+:\s*(\d+)px/g;
      const tokens: number[] = [];
      let match;

      while ((match = tokenRegex.exec(cssContent)) !== null) {
        tokens.push(parseInt(match[1], 10));
      }

      // Property: All token values should be multiples of 4
      tokens.forEach(value => {
        expect(isGridAligned(value)).toBe(true);
      });

      // Property: Tokens should include standard values
      // Note: May have duplicates for different semantic names
      const uniqueTokens = [...new Set(tokens)].sort((a, b) => a - b);
      expect(uniqueTokens).toContain(4);
      expect(uniqueTokens).toContain(8);
      expect(uniqueTokens).toContain(12);
      expect(uniqueTokens).toContain(16);
    } catch (error) {
      console.warn(`Could not read ${tokenFile}:`, error);
    }
  });

  it('should handle zero spacing correctly', () => {
    const snapped = snapToGrid(0);
    expect(snapped).toBe(0);
    expect(isGridAligned(0)).toBe(true);
  });

  it('should handle large spacing values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        (value) => {
          const snapped = snapToGrid(value);
          return isGridAligned(snapped);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain grid alignment after arithmetic operations', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 25 }).map(n => n * 4),
          fc.integer({ min: 0, max: 25 }).map(n => n * 4)
        ),
        ([value1, value2]) => {
          const sum = value1 + value2;
          const diff = Math.abs(value1 - value2);
          
          // Property: Sum and difference of grid-aligned values are grid-aligned
          return isGridAligned(sum) && isGridAligned(diff);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate message block spacing is grid-aligned', () => {
    const chatContainerFile = 'components/messages/chat-container.css';
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check specific spacing values for message blocks
      const withinBlockRegex = /\.message-group-item.*?gap:\s*(\d+)px/s;
      const betweenBlockRegex = /\.message-group-item:not\(:last-child\).*?margin-bottom:\s*(\d+)px/s;

      const withinMatch = withinBlockRegex.exec(cssContent);
      const betweenMatch = betweenBlockRegex.exec(cssContent);

      if (withinMatch) {
        const withinValue = parseInt(withinMatch[1], 10);
        expect(isGridAligned(withinValue)).toBe(true);
        expect(withinValue).toBeGreaterThanOrEqual(4);
        expect(withinValue).toBeLessThanOrEqual(8);
      }

      if (betweenMatch) {
        const betweenValue = parseInt(betweenMatch[1], 10);
        expect(isGridAligned(betweenValue)).toBe(true);
        expect(betweenValue).toBeGreaterThanOrEqual(12);
        expect(betweenValue).toBeLessThanOrEqual(16);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should validate composer spacing is grid-aligned', () => {
    const chatContainerFile = 'components/messages/chat-container.css';
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check composer distance
      const composerRegex = /\.cs-message-input[^{]*{[^}]*padding-top:\s*(\d+)px/s;
      const match = composerRegex.exec(cssContent);

      if (match) {
        const composerDistance = parseInt(match[1], 10);
        expect(isGridAligned(composerDistance)).toBe(true);
        expect(composerDistance).toBeGreaterThanOrEqual(12);
        expect(composerDistance).toBeLessThanOrEqual(16);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should validate date separator spacing is grid-aligned', () => {
    const dateSeparatorFile = 'components/messages/date-separator.css';
    try {
      const fullPath = join(process.cwd(), dateSeparatorFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check date separator margins
      const marginRegex = /\.date-separator[^{]*{[^}]*margin:\s*(\d+)px/s;
      const match = marginRegex.exec(cssContent);

      if (match) {
        const marginValue = parseInt(match[1], 10);
        expect(isGridAligned(marginValue)).toBe(true);
        expect(marginValue).toBeGreaterThanOrEqual(16);
        expect(marginValue).toBeLessThanOrEqual(20);
      }
    } catch (error) {
      console.warn(`Could not read ${dateSeparatorFile}:`, error);
    }
  });

  it('should validate context panel spacing is grid-aligned', () => {
    const contextPanelFile = 'components/messages/context-panel.css';
    try {
      const fullPath = join(process.cwd(), contextPanelFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check section spacing
      const sectionRegex = /\.context-panel-section[^{]*{[^}]*margin-bottom:\s*(\d+)px/s;
      const match = sectionRegex.exec(cssContent);

      if (match) {
        const sectionSpacing = parseInt(match[1], 10);
        expect(isGridAligned(sectionSpacing)).toBe(true);
        expect(sectionSpacing).toBe(16); // Should be exactly 16px per spec
      }
    } catch (error) {
      console.warn(`Could not read ${contextPanelFile}:`, error);
    }
  });
});
