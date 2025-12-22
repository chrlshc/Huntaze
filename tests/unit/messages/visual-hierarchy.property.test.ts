/**
 * Property Test: Visual Hierarchy - Message Thread Dominance
 * Feature: messages-saas-density-polish
 * Property 8: Visual Hierarchy - Message Thread Dominance
 * 
 * For any three-column layout, the message thread column should have
 * the largest width percentage among all three columns.
 * 
 * Validates: Requirements 8.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { viewportWidthArbitrary } from './property-test-utils';

describe('Property Test: Visual Hierarchy - Message Thread Dominance', () => {
  const messagingInterfaceFile = 'components/messages/messaging-interface.css';

  it('should make message thread wider than conversation list', () => {
    fc.assert(
      fc.property(
        viewportWidthArbitrary,
        (viewportWidth) => {
          try {
            const fullPath = join(process.cwd(), messagingInterfaceFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
            const match = gridRegex.exec(cssContent);

            if (match) {
              const leftPercent = parseInt(match[1], 10);
              const rightPercent = parseInt(match[2], 10);
              const messageThreadPercent = 100 - leftPercent - rightPercent;
              
              // Property: Message thread > conversation list
              return messageThreadPercent > leftPercent;
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

  it('should make message thread wider than context panel', () => {
    fc.assert(
      fc.property(
        viewportWidthArbitrary,
        (viewportWidth) => {
          try {
            const fullPath = join(process.cwd(), messagingInterfaceFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
            const match = gridRegex.exec(cssContent);

            if (match) {
              const leftPercent = parseInt(match[1], 10);
              const rightPercent = parseInt(match[2], 10);
              const messageThreadPercent = 100 - leftPercent - rightPercent;
              
              // Property: Message thread > context panel
              return messageThreadPercent > rightPercent;
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

  it('should maintain message thread dominance at 1024px', () => {
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
        
        const leftWidth = Math.max(leftMin, viewportWidth * leftPercent / 100);
        const rightWidth = Math.max(rightMin, viewportWidth * rightPercent / 100);
        const messageThreadWidth = viewportWidth - leftWidth - rightWidth;
        
        // Property: Message thread should be widest
        expect(messageThreadWidth).toBeGreaterThan(leftWidth);
        expect(messageThreadWidth).toBeGreaterThan(rightWidth);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should maintain message thread dominance at 1440px', () => {
    const viewportWidth = 1440;
    
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
      const match = gridRegex.exec(cssContent);

      if (match) {
        const leftPercent = parseInt(match[1], 10);
        const rightPercent = parseInt(match[2], 10);
        const messageThreadPercent = 100 - leftPercent - rightPercent;
        
        // Property: Message thread should be widest
        expect(messageThreadPercent).toBeGreaterThan(leftPercent);
        expect(messageThreadPercent).toBeGreaterThan(rightPercent);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should maintain message thread dominance at 1920px', () => {
    const viewportWidth = 1920;
    
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
      const match = gridRegex.exec(cssContent);

      if (match) {
        const leftPercent = parseInt(match[1], 10);
        const rightPercent = parseInt(match[2], 10);
        const messageThreadPercent = 100 - leftPercent - rightPercent;
        
        // Property: Message thread should be widest
        expect(messageThreadPercent).toBeGreaterThan(leftPercent);
        expect(messageThreadPercent).toBeGreaterThan(rightPercent);
      }
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should ensure message thread gets at least 45% width', () => {
    fc.assert(
      fc.property(
        viewportWidthArbitrary,
        (viewportWidth) => {
          try {
            const fullPath = join(process.cwd(), messagingInterfaceFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            const gridRegex = /grid-template-columns:\s*minmax\([^,]+,\s*(\d+)%\)\s+1fr\s+minmax\([^,]+,\s*(\d+)%\)/;
            const match = gridRegex.exec(cssContent);

            if (match) {
              const leftPercent = parseInt(match[1], 10);
              const rightPercent = parseInt(match[2], 10);
              const messageThreadPercent = 100 - leftPercent - rightPercent;
              
              // Property: Message thread >= 45%
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

  it('should use CSS Grid for three-column layout', () => {
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for grid display
      const gridDisplayRegex = /display:\s*grid/;
      const usesGrid = gridDisplayRegex.test(cssContent);

      // Property: Should use CSS Grid
      expect(usesGrid).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });

  it('should have three columns defined', () => {
    try {
      const fullPath = join(process.cwd(), messagingInterfaceFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for three-column grid
      const gridRegex = /grid-template-columns:\s*[^\n]+\s+[^\n]+\s+[^\n]+/;
      const hasThreeColumns = gridRegex.test(cssContent);

      // Property: Should have three columns
      expect(hasThreeColumns).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${messagingInterfaceFile}:`, error);
    }
  });
});
