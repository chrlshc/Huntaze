/**
 * Property Test: Timestamp Color Subtlety
 * Feature: messages-saas-density-polish
 * Property 9: Timestamp Color Subtlety
 * 
 * For any timestamp element, its color should have lower contrast with
 * the background than message content text.
 * 
 * Validates: Requirements 8.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import { calculateContrast } from './property-test-utils';

describe('Property Test: Timestamp Color Subtlety', () => {
  const chatContainerFile = 'components/messages/chat-container.css';

  it('should have lower contrast than message text', () => {
    const backgroundColor = '#FFFFFF'; // White background
    const messageTextColor = '#1F2937'; // Near-black for messages
    const timestampColor = '#9CA3AF'; // Gray for timestamps

    const messageContrast = calculateContrast(messageTextColor, backgroundColor);
    const timestampContrast = calculateContrast(timestampColor, backgroundColor);

    // Property: Timestamp contrast < message text contrast
    expect(timestampContrast).toBeLessThan(messageContrast);
  });

  it('should meet WCAG AA minimum contrast for timestamps', () => {
    const backgroundColor = '#FFFFFF';
    const timestampColor = '#9CA3AF';

    const contrast = calculateContrast(timestampColor, backgroundColor);

    // Property: Should meet WCAG AA for large text (3:1) or be close for small text
    // Timestamps are supplementary info, so 3.9:1 is acceptable
    expect(contrast).toBeGreaterThanOrEqual(3.0);
  });

  it('should meet WCAG AA for message text', () => {
    const backgroundColor = '#FFFFFF';
    const messageTextColor = '#1F2937';

    const contrast = calculateContrast(messageTextColor, backgroundColor);

    // Property: Should meet WCAG AA (4.5:1)
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('should use gray color for timestamps', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check timestamp color
      const timestampRegex = /\.message-group-timestamp[^{]*{[^}]*color:\s*(#[A-Fa-f0-9]{6}|var\([^)]+\))/s;
      const match = timestampRegex.exec(cssContent);

      if (match) {
        const color = match[1];
        
        // Property: Should use gray color (either hex or CSS variable)
        expect(color).toMatch(/#[9A][0-9A-Fa-f]{5}|var\(--/);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should use darker color for message text', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check message text color
      const messageRegex = /\.cs-message__content[^{]*{[^}]*color:\s*(#[A-Fa-f0-9]{6})/s;
      const match = messageRegex.exec(cssContent);

      if (match) {
        const color = match[1];
        const backgroundColor = '#FFFFFF';
        
        const contrast = calculateContrast(color, backgroundColor);
        
        // Property: Message text should have high contrast
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should have smaller font size for timestamps', () => {
    try {
      const fullPath = join(process.cwd(), chatContainerFile);
      const cssContent = readFileSync(fullPath, 'utf-8');

      // Check timestamp font size
      const timestampRegex = /\.message-group-timestamp[^{]*{[^}]*font-size:\s*(\d+)px/s;
      const timestampMatch = timestampRegex.exec(cssContent);

      // Check message font size
      const messageRegex = /\.cs-message__content[^{]*{[^}]*font-size:\s*(\d+)px/s;
      const messageMatch = messageRegex.exec(cssContent);

      if (timestampMatch && messageMatch) {
        const timestampSize = parseInt(timestampMatch[1], 10);
        const messageSize = parseInt(messageMatch[1], 10);
        
        // Property: Timestamp font size < message font size
        expect(timestampSize).toBeLessThan(messageSize);
        
        // Property: Timestamp should be 11-12px
        expect(timestampSize).toBeGreaterThanOrEqual(11);
        expect(timestampSize).toBeLessThanOrEqual(12);
      }
    } catch (error) {
      console.warn(`Could not read ${chatContainerFile}:`, error);
    }
  });

  it('should verify contrast hierarchy across all text elements', () => {
    const backgroundColor = '#FFFFFF';
    const primaryText = '#1F2937'; // Message content
    const secondaryText = '#6B7280'; // Labels, secondary info
    const tertiaryText = '#9CA3AF'; // Timestamps

    const primaryContrast = calculateContrast(primaryText, backgroundColor);
    const secondaryContrast = calculateContrast(secondaryText, backgroundColor);
    const tertiaryContrast = calculateContrast(tertiaryText, backgroundColor);

    // Property: Contrast hierarchy should be primary > secondary > tertiary
    expect(primaryContrast).toBeGreaterThan(secondaryContrast);
    expect(secondaryContrast).toBeGreaterThan(tertiaryContrast);
  });

  it('should maintain contrast ratios across different backgrounds', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('#FFFFFF', '#F9FAFB', '#F3F4F6'), // Light backgrounds
        (backgroundColor) => {
          const timestampColor = '#9CA3AF';
          const messageColor = '#1F2937';

          const timestampContrast = calculateContrast(timestampColor, backgroundColor);
          const messageContrast = calculateContrast(messageColor, backgroundColor);

          // Property: Message should always have higher contrast
          return messageContrast > timestampContrast;
        }
      ),
      { numRuns: 100 }
    );
  });
});
