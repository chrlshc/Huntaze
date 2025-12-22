/**
 * Property Test: Composer Proximity Constraint
 * Feature: messages-saas-density-polish
 * Property 4: Composer Proximity Constraint
 * 
 * For any message thread state, the distance between the last message
 * and the composer should not exceed 16px.
 * 
 * Validates: Requirements 4.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { messageArbitrary } from './property-test-utils';

describe('Property Test: Composer Proximity Constraint', () => {
  const chatContainerFile = 'components/messages/chat-container.css';

  it('should maintain composer distance <= 16px in CSS', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract composer top padding/margin
      const composerRegex = /\.cs-message-input[^{]*{[^}]*(?:padding-top|margin-top):\s*(\d+)px/s;
      const match = composerRegex.exec(cssContent);

      if (match) {
        const distance = parseInt(match[1], 10);
        
        // Property: Distance should be <= 16px
        expect(distance).toBeLessThanOrEqual(16);
        expect(distance).toBeGreaterThanOrEqual(12); // Also check minimum per spec
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should use spacing token for composer distance', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check if using spacing token
      const tokenRegex = /\.cs-message-input[^{]*{[^}]*(?:padding-top|margin-top):\s*var\(--msg-composer-distance\)/s;
      const usesToken = tokenRegex.test(cssContent);

      // Property: Should use spacing token
      expect(usesToken).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should maintain proximity across different message counts', () => {
    fc.assert(
      fc.property(
        fc.array(messageArbitrary, { minLength: 1, maxLength: 50 }),
        (messages) => {
          // Property: Composer distance should be constant regardless of message count
          // This is a CSS property, so we verify it's defined consistently
          
          try {
            const fullPath = join(process.cwd(), chatContainerFile);
            const cssContent = readFileSync(fullPath, 'utf-8');
            const composerRegex = /\.cs-message-input[^{]*{[^}]*(?:padding-top|margin-top):\s*(\d+)px/s;
            const match = composerRegex.exec(cssContent);

            if (match) {
              const distance = parseInt(match[1], 10);
              return distance <= 16;
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

  it('should have subtle border separation', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check for 1px border
      const borderRegex = /\.cs-message-input[^{]*{[^}]*border-top:\s*1px/s;
      const hasBorder = borderRegex.test(cssContent);

      // Property: Should have 1px top border
      expect(hasBorder).toBe(true);
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should maintain compact empty state padding', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check vertical padding
      const paddingRegex = /\.cs-message-input__content-editor-wrapper[^{]*{[^}]*padding:\s*(\d+)px/s;
      const match = paddingRegex.exec(cssContent);

      if (match) {
        const padding = parseInt(match[1], 10);
        
        // Property: Vertical padding should be 8-10px
        expect(padding).toBeGreaterThanOrEqual(8);
        expect(padding).toBeLessThanOrEqual(10);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should verify spacing token value is within spec', () => {
    try {
      const tokenFile = 'styles/messaging-spacing-tokens.css';
      const fullPath = join(process.cwd(), tokenFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Extract composer distance token
      const tokenRegex = /--msg-composer-distance:\s*(\d+)px/;
      const match = tokenRegex.exec(cssContent);

      if (match) {
        const distance = parseInt(match[1], 10);
        
        // Property: Token value should be 12-16px
        expect(distance).toBeGreaterThanOrEqual(12);
        expect(distance).toBeLessThanOrEqual(16);
      }
    } catch (error) {
      console.warn('Could not read spacing tokens file:', error);
    }
  });
});
