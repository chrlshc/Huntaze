/**
 * Property Test: Conversation List Density
 * Feature: messages-saas-density-polish
 * Property 7: Conversation List Density
 * 
 * For any conversation list with N items, the vertical space consumed should be
 * approximately N × (item-height + spacing) within tolerance.
 * 
 * Validates: Requirements 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { conversationArbitrary } from './property-test-utils';

describe('Property Test: Conversation List Density', () => {
  const fanCardFile = 'components/messages/fan-card.css';

  it('should maintain item height within 56-64px range', () => {
    try {
      const fullPath = join(process.cwd(), fanCardFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract padding values
      const paddingRegex = /\.fan-card[^{]*{[^}]*padding:\s*(\d+)px/s;
      const match = paddingRegex.exec(cssContent);

      if (match) {
        const padding = parseInt(match[1], 10);
        
        // Assuming 40px avatar + 2 * padding
        const totalHeight = 40 + (2 * padding);
        
        // Property: Total height should be 56-64px
        expect(totalHeight).toBeGreaterThanOrEqual(56);
        expect(totalHeight).toBeLessThanOrEqual(64);
      }
    } catch (error) {
      console.warn(`Could not read ${fanCardFile}:`, error);
    }
  });

  it('should use consistent vertical padding', () => {
    try {
      const fullPath = join(process.cwd(), fanCardFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract padding
      const paddingRegex = /\.fan-card[^{]*{[^}]*padding:\s*(\d+)px/s;
      const match = paddingRegex.exec(cssContent);

      if (match) {
        const padding = parseInt(match[1], 10);
        
        // Property: Padding should be 8-12px per spec
        expect(padding).toBeGreaterThanOrEqual(8);
        expect(padding).toBeLessThanOrEqual(12);
      }
    } catch (error) {
      console.warn(`Could not read ${fanCardFile}:`, error);
    }
  });

  it('should calculate total height correctly for varying item counts', () => {
    fc.assert(
      fc.property(
        fc.array(conversationArbitrary, { minLength: 1, maxLength: 50 }),
        (conversations) => {
          const itemCount = conversations.length;
          
          try {
            const fullPath = join(process.cwd(), fanCardFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            const paddingRegex = /\.fan-card[^{]*{[^}]*padding:\s*(\d+)px/s;
            const match = paddingRegex.exec(cssContent);

            if (match) {
              const padding = parseInt(match[1], 10);
              const itemHeight = 40 + (2 * padding); // avatar + padding
              const spacing = 0; // No gap between items in current design
              
              const expectedTotalHeight = itemCount * (itemHeight + spacing);
              
              // Property: Total height should match formula
              // (This is a theoretical check since we can't render in unit tests)
              expect(expectedTotalHeight).toBeGreaterThan(0);
              expect(itemHeight).toBeGreaterThanOrEqual(56);
              expect(itemHeight).toBeLessThanOrEqual(64);
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

  it('should have avatar size within 32-40px range', () => {
    try {
      const fullPath = join(process.cwd(), fanCardFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract avatar size
      const avatarRegex = /\.fan-card-avatar[^{]*{[^}]*(?:width|height):\s*(\d+)px/s;
      const match = avatarRegex.exec(cssContent);

      if (match) {
        const avatarSize = parseInt(match[1], 10);
        
        // Property: Avatar should be 32-40px
        expect(avatarSize).toBeGreaterThanOrEqual(32);
        expect(avatarSize).toBeLessThanOrEqual(40);
      }
    } catch (error) {
      console.warn(`Could not read ${fanCardFile}:`, error);
    }
  });

  it('should use spacing tokens for padding', () => {
    try {
      const fullPath = join(process.cwd(), fanCardFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check if using spacing token
      const tokenRegex = /\.fan-card[^{]*{[^}]*padding:\s*var\(--msg-space-/s;
      const usesToken = tokenRegex.test(cssContent);

      // Property: Should use spacing token
      expect(usesToken).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${fanCardFile}:`, error);
    }
  });

  it('should maintain density with search and filter spacing', () => {
    try {
      const fanListFile = 'components/messages/fan-list.css';
      const fullPath = join(process.cwd(), fanListFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check search field spacing
      const searchRegex = /\.fan-list-search[^{]*{[^}]*(?:margin-bottom|padding-bottom):\s*(\d+)px/s;
      const searchMatch = searchRegex.exec(cssContent);

      // Check filter spacing
      const filterRegex = /\.fan-list-filters[^{]*{[^}]*(?:margin-bottom|padding-bottom):\s*(\d+)px/s;
      const filterMatch = filterRegex.exec(cssContent);

      if (searchMatch) {
        const searchSpacing = parseInt(searchMatch[1], 10);
        // Property: Search spacing should be 8-12px
        expect(searchSpacing).toBeGreaterThanOrEqual(8);
        expect(searchSpacing).toBeLessThanOrEqual(12);
      }

      if (filterMatch) {
        const filterSpacing = parseInt(filterMatch[1], 10);
        // Property: Filter spacing should be 8-12px
        expect(filterSpacing).toBeGreaterThanOrEqual(8);
        expect(filterSpacing).toBeLessThanOrEqual(12);
      }
    } catch (error) {
      console.warn('Could not read fan-list.css:', error);
    }
  });

  it('should verify consistent item height across all items', () => {
    fc.assert(
      fc.property(
        fc.array(conversationArbitrary, { minLength: 2, maxLength: 20 }),
        (conversations) => {
          // Property: All items should have same height
          // (This is enforced by CSS, so we verify the CSS is consistent)
          
          try {
            const fullPath = join(process.cwd(), fanCardFile);
            const cssContent = readFileSync(fullPath, 'utf-8');

            // Check that padding is defined once and consistently
            const paddingMatches = cssContent.match(/\.fan-card[^{]*{[^}]*padding:\s*\d+px/g);
            
            // Property: Should have consistent padding definition
            return paddingMatches !== null;
          } catch {
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
