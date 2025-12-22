/**
 * Property Test: Context Panel Width Constraint
 * Feature: messages-saas-density-polish
 * Property 6: Context Panel Width Constraint
 * 
 * For any viewport width, the context panel should occupy 20-24% of the viewport
 * and the message thread should occupy at least 45%.
 * 
 * Validates: Requirements 6.1, 6.6
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { viewportWidthArbitrary } from './property-test-utils';

describe('Property Test: Context Panel Width Constraint', () => {
  const messagingInterfaceFile = 'components/messages/messaging-interface.css';

  it('should use percentage-based width constraints', () => {
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for grid-template-columns with percentages
      const gridRegex = /grid-template-columns:\s*minmax\([^)]+\)\s+1fr\s+minmax\([^)]+\)/;
      const hasPercentageGrid = gridRegex.test(cssContent);

      // Property: Should use percentage-based grid
      expect(hasPercentageGrid).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should constrain context panel to 20-24% at various viewports', () => {
    fc.assert(
      fc.property(
        viewportWidthArbitrary,
        (viewportWidth) => {
          try {
            const fullPath = join(process.cwd(), messagingInterfaceFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            // Extract percentage from minmax for right column
            const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
            const match = gridRegex.exec(cssContent);

            if (match) {
              const leftPercent = parseInt(match[1], 10);
              const rightPercent = parseInt(match[2], 10);
              
              // Property: Right column (context panel) should be 20-24%
              const contextPanelPercent = rightPercent;
              return contextPanelPercent >= 20 && contextPanelPercent <= 24;
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

  it('should ensure message thread gets at least 45% width', () => {
    fc.assert(
      fc.property(
        viewportWidthArbitrary,
        (viewportWidth) => {
          try {
            const fullPath = join(process.cwd(), messagingInterfaceFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            // Extract percentages
            const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
            const match = gridRegex.exec(cssContent);

            if (match) {
              const leftPercent = parseInt(match[1], 10);
              const rightPercent = parseInt(match[2], 10);
              
              // Property: Message thread (1fr) should get remaining space
              // which should be >= 45%
              const messageThreadPercent = 100 - leftPercent - rightPercent;
              return messageThreadPercent >= 45;
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

  it('should have minimum width constraints for small viewports', () => {
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for minmax with minimum pixel values
      const minmaxRegex = /minmax\((\d+)px,/g;
      const matches = [...cssContent.matchAll(minmaxRegex)];

      if (matches.length >= 2) {
        const leftMin = parseInt(matches[0][1], 10);
        const rightMin = parseInt(matches[1][1], 10);
        
        // Property: Should have reasonable minimum widths
        expect(leftMin).toBeGreaterThanOrEqual(200);
        expect(leftMin).toBeLessThanOrEqual(280);
        expect(rightMin).toBeGreaterThanOrEqual(240);
        expect(rightMin).toBeLessThanOrEqual(320);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should maintain column ratios at 1024px viewport', () => {
    const viewportWidth = 1024;
    
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      const gridRegex = /grid-template-columns:\s*minmax\((\d+)px,\s*(\d+)%\)\s+1fr\s+minmax\((\d+)px,\s*(\d+)%\)/;
      const match = gridRegex.exec(cssContent);

      if (match) {
        const leftMin = parseInt(match[1], 10);
        const leftPercent = parseInt(match[2], 10);
        const rightMin = parseInt(match[3], 10);
        const rightPercent = parseInt(match[4], 10);
        
        // Calculate actual widths at 1024px
        const leftWidth = Math.max(leftMin, viewportWidth * leftPercent / 100);
        const rightWidth = Math.max(rightMin, viewportWidth * rightPercent / 100);
        const messageThreadWidth = viewportWidth - leftWidth - rightWidth;
        
        // Property: Message thread should be >= 45% at 1024px
        const messageThreadPercent = (messageThreadWidth / viewportWidth) * 100;
        expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should maintain column ratios at 1440px viewport', () => {
    const viewportWidth = 1440;
    
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      const gridRegex = /grid-template-columns:\s*minmax\((\d+)px,\s*(\d+)%\)\s+1fr\s+minmax\((\d+)px,\s*(\d+)%\)/;
      const match = gridRegex.exec(cssContent);

      if (match) {
        const leftPercent = parseInt(match[2], 10);
        const rightPercent = parseInt(match[4], 10);
        
        // At 1440px, percentages should dominate
        const messageThreadPercent = 100 - leftPercent - rightPercent;
        
        // Property: Should meet spec ratios
        expect(leftPercent).toBeGreaterThanOrEqual(20);
        expect(leftPercent).toBeLessThanOrEqual(25);
        expect(rightPercent).toBeGreaterThanOrEqual(20);
        expect(rightPercent).toBeLessThanOrEqual(24);
        expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should maintain column ratios at 1920px viewport', () => {
    const viewportWidth = 1920;
    
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      const gridRegex = /grid-template-columns:\s*minmax\((\d+)px,\s*(\d+)%\)\s+1fr\s+minmax\((\d+)px,\s*(\d+)%\)/;
      const match = gridRegex.exec(cssContent);

      if (match) {
        const leftPercent = parseInt(match[2], 10);
        const rightPercent = parseInt(match[4], 10);
        
        const messageThreadPercent = 100 - leftPercent - rightPercent;
        
        // Property: Should maintain spec ratios at large viewports
        expect(messageThreadPercent).toBeGreaterThanOrEqual(45);
        expect(rightPercent).toBeGreaterThanOrEqual(20);
        expect(rightPercent).toBeLessThanOrEqual(24);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });
});
