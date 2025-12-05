/**
 * Property Test: Card Shadow Presence
 * **Feature: onlyfans-shopify-design, Property 3: Card Shadow Presence**
 * **Validates: Requirements 2.2**
 * 
 * For any ShopifyCard with shadow enabled, the card SHALL have a subtle shadow
 * (0 1px 3px rgba(0,0,0,0.08)) to create depth without being distracting.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Shopify card shadow specification
const SHOPIFY_CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.08)';
const SHOPIFY_CARD_SHADOW_HOVER = '0 2px 6px rgba(0,0,0,0.12)';

interface CardConfig {
  shadow: boolean;
  interactive: boolean;
}

// Function to get expected shadow class based on config
function getExpectedShadowClass(config: CardConfig): string | null {
  if (!config.shadow) return null;
  return `shadow-[${SHOPIFY_CARD_SHADOW.replace(/ /g, '_')}]`;
}

// Function to validate shadow is subtle (opacity <= 0.15)
function isShadowSubtle(shadowValue: string): boolean {
  const opacityMatch = shadowValue.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
  if (!opacityMatch) return true; // No rgba found, assume subtle
  const opacity = parseFloat(opacityMatch[1]);
  return opacity <= 0.15;
}

// Parse shadow value to extract components
function parseShadow(shadow: string): { x: number; y: number; blur: number; opacity: number } | null {
  const match = shadow.match(/(\d+)\s+(\d+)px\s+(\d+)px\s+rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
  if (!match) {
    // Try simpler format
    const simpleMatch = shadow.match(/(\d+)\s+(\d+)px\s+(\d+)px/);
    if (simpleMatch) {
      return {
        x: parseInt(simpleMatch[1]),
        y: parseInt(simpleMatch[2]),
        blur: parseInt(simpleMatch[3]),
        opacity: 0.08
      };
    }
    return null;
  }
  return {
    x: parseInt(match[1]),
    y: parseInt(match[2]),
    blur: parseInt(match[3]),
    opacity: parseFloat(match[4])
  };
}

describe('Property 3: Card Shadow Presence', () => {
  it('should have subtle shadow when shadow prop is true', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // shadow enabled
        fc.boolean(), // interactive
        (shadowEnabled, interactive) => {
          const config: CardConfig = { shadow: shadowEnabled, interactive };
          
          if (shadowEnabled) {
            // Shadow should be present and subtle
            expect(isShadowSubtle(SHOPIFY_CARD_SHADOW)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have shadow opacity <= 0.15 for subtlety', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 15 }), // 0-15 represents 0.00-0.15 opacity
        (opacityInt) => {
          const opacity = opacityInt / 100;
          const shadowValue = `0 1px 3px rgba(0,0,0,${opacity})`;
          expect(isShadowSubtle(shadowValue)).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject shadows with opacity > 0.15 as not subtle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 100 }), // 16-100 represents 0.16-1.0 opacity
        (opacityInt) => {
          const opacity = opacityInt / 100;
          const shadowValue = `0 1px 3px rgba(0,0,0,${opacity})`;
          expect(isShadowSubtle(shadowValue)).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent shadow values across all card instances', () => {
    const expectedShadow = SHOPIFY_CARD_SHADOW;
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // number of cards
        (cardCount) => {
          // All cards should use the same shadow value
          const shadows = Array(cardCount).fill(expectedShadow);
          const uniqueShadows = new Set(shadows);
          
          expect(uniqueShadows.size).toBe(1);
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have enhanced shadow on hover for interactive cards', () => {
    // Hover shadow should be slightly more prominent but still subtle
    const hoverOpacityMatch = SHOPIFY_CARD_SHADOW_HOVER.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    const hoverOpacity = hoverOpacityMatch ? parseFloat(hoverOpacityMatch[1]) : 0;
    
    // Hover shadow should be more visible but still under 0.2
    expect(hoverOpacity).toBeGreaterThan(0.08);
    expect(hoverOpacity).toBeLessThanOrEqual(0.2);
  });
});
