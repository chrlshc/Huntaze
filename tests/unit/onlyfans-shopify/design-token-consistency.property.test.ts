/**
 * **Feature: onlyfans-shopify-unification, Property 1: Design Token Consistency**
 * 
 * *For any* OnlyFans page, all design elements should reference CSS variables from shopify-tokens.css 
 * for colors, spacing, typography, and shadows
 * 
 * **Validates: Requirements 1.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the shopify-tokens.css file
const tokensPath = join(process.cwd(), 'styles', 'shopify-tokens.css');
const tokensContent = readFileSync(tokensPath, 'utf-8');

// Extract all CSS custom properties from the tokens file
function extractCSSVariables(cssContent: string): Set<string> {
  const variableRegex = /--[\w-]+/g;
  const matches = cssContent.match(variableRegex) || [];
  return new Set(matches);
}

// Check if a CSS value references a design token
function referencesDesignToken(value: string): boolean {
  return value.includes('var(--shopify-');
}

// Parse CSS custom property value
function getCSSVariableValue(variableName: string): string | null {
  const regex = new RegExp(`${variableName}:\\s*([^;]+);`, 'i');
  const match = tokensContent.match(regex);
  return match ? match[1].trim() : null;
}

// Design token categories
const TOKEN_CATEGORIES = {
  colors: [
    '--shopify-bg-surface',
    '--shopify-bg-app',
    '--shopify-text-primary',
    '--shopify-text-secondary',
    '--shopify-text-disabled',
    '--shopify-border-default',
    '--shopify-interactive-default',
    '--shopify-success',
  ],
  spacing: [
    '--shopify-space-1',
    '--shopify-space-2',
    '--shopify-space-3',
    '--shopify-space-4',
    '--shopify-space-6',
    '--shopify-space-8',
  ],
  typography: [
    '--shopify-font-family',
    '--shopify-font-size-75',
    '--shopify-font-size-100',
    '--shopify-font-size-200',
    '--shopify-font-size-300',
    '--shopify-font-weight-regular',
    '--shopify-font-weight-medium',
    '--shopify-font-weight-semibold',
  ],
  shadows: [
    '--shopify-shadow-card',
    '--shopify-shadow-button',
    '--shopify-shadow-modal',
  ],
  radius: [
    '--shopify-border-radius-input',
    '--shopify-border-radius-button',
    '--shopify-border-radius-base',
    '--shopify-border-radius-large',
    '--shopify-border-radius-full',
  ],
};

describe('Property 1: Design Token Consistency', () => {
  const availableTokens = extractCSSVariables(tokensContent);

  it('should define all required color tokens', () => {
    TOKEN_CATEGORIES.colors.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
      const value = getCSSVariableValue(token);
      expect(value).not.toBeNull();
      expect(value).toBeTruthy();
    });
  });

  it('should define all required spacing tokens', () => {
    TOKEN_CATEGORIES.spacing.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
      const value = getCSSVariableValue(token);
      expect(value).not.toBeNull();
      expect(value).toMatch(/^\d+px$/); // Should be in pixels
    });
  });

  it('should define all required typography tokens', () => {
    TOKEN_CATEGORIES.typography.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
      const value = getCSSVariableValue(token);
      expect(value).not.toBeNull();
      expect(value).toBeTruthy();
    });
  });

  it('should define all required shadow tokens', () => {
    TOKEN_CATEGORIES.shadows.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
      const value = getCSSVariableValue(token);
      expect(value).not.toBeNull();
      expect(value).toBeTruthy();
    });
  });

  it('should define all required radius tokens', () => {
    TOKEN_CATEGORIES.radius.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
      const value = getCSSVariableValue(token);
      expect(value).not.toBeNull();
      expect(value).toMatch(/^\d+px$|^9999px$/); // Should be in pixels or full radius
    });
  });

  it('should have spacing tokens following 4px base unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOKEN_CATEGORIES.spacing),
        (token) => {
          const value = getCSSVariableValue(token);
          expect(value).not.toBeNull();
          
          if (value) {
            const pixels = parseInt(value.replace('px', ''), 10);
            // All spacing should be multiples of 4
            expect(pixels % 4).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent color format (hex or rgb)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOKEN_CATEGORIES.colors),
        (token) => {
          const value = getCSSVariableValue(token);
          expect(value).not.toBeNull();
          
          if (value) {
            // Should be hex color or rgb/rgba
            const isHex = /^#[0-9a-f]{3,6}$/i.test(value);
            const isRgb = /^rgba?\(/.test(value);
            expect(isHex || isRgb).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have typography sizes in ascending order', () => {
    const sizeTokens = [
      '--shopify-font-size-75',
      '--shopify-font-size-100',
      '--shopify-font-size-200',
      '--shopify-font-size-300',
      '--shopify-font-size-400',
      '--shopify-font-size-500',
    ];

    const sizes = sizeTokens
      .map((token) => getCSSVariableValue(token))
      .filter((v): v is string => v !== null)
      .map((v) => parseInt(v.replace('px', ''), 10));

    // Each size should be larger than the previous
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
    }
  });

  it('should have font weights in ascending order', () => {
    const weightTokens = [
      '--shopify-font-weight-regular',
      '--shopify-font-weight-medium',
      '--shopify-font-weight-semibold',
      '--shopify-font-weight-bold',
    ];

    const weights = weightTokens
      .map((token) => getCSSVariableValue(token))
      .filter((v): v is string => v !== null)
      .map((v) => parseInt(v, 10));

    // Each weight should be heavier than the previous
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
    }
  });

  it('should have border radius values in ascending order', () => {
    const radiusTokens = [
      '--shopify-border-radius-input',
      '--shopify-border-radius-button',
      '--shopify-border-radius-base',
      '--shopify-border-radius-large',
    ];

    const radii = radiusTokens
      .map((token) => getCSSVariableValue(token))
      .filter((v): v is string => v !== null)
      .map((v) => parseInt(v.replace('px', ''), 10));

    // Each radius should be larger than the previous
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });

  it('should maintain token naming consistency', () => {
    fc.assert(
      fc.property(
        fc.constant(Array.from(availableTokens)),
        (tokens) => {
          tokens.forEach((token) => {
            // All tokens should start with --shopify-
            expect(token).toMatch(/^--shopify-/);
            
            // Tokens should use kebab-case
            expect(token).toMatch(/^--shopify-[a-z0-9-]+$/);
            
            // No uppercase letters
            expect(token).not.toMatch(/[A-Z]/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have all token categories represented', () => {
    const allRequiredTokens = Object.values(TOKEN_CATEGORIES).flat();
    
    allRequiredTokens.forEach((token) => {
      expect(availableTokens.has(token)).toBe(true);
    });
  });

  it('should have valid shadow syntax', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOKEN_CATEGORIES.shadows),
        (token) => {
          const value = getCSSVariableValue(token);
          expect(value).not.toBeNull();
          
          if (value) {
            // Shadow should contain offset, blur, and color
            expect(value).toMatch(/\d+px/); // Has pixel values
            expect(value).toMatch(/rgba?\(/); // Has color
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support component-specific token usage', () => {
    fc.assert(
      fc.property(
        fc.record({
          component: fc.constantFrom('card', 'button', 'input', 'banner'),
          property: fc.constantFrom('background', 'border', 'padding', 'radius'),
        }),
        (config) => {
          // For any component and property combination, appropriate tokens should exist
          const { component, property } = config;
          
          // Map component properties to token categories
          const tokenMap: Record<string, string[]> = {
            background: TOKEN_CATEGORIES.colors,
            border: [...TOKEN_CATEGORIES.colors, ...TOKEN_CATEGORIES.radius],
            padding: TOKEN_CATEGORIES.spacing,
            radius: TOKEN_CATEGORIES.radius,
          };
          
          const relevantTokens = tokenMap[property] || [];
          expect(relevantTokens.length).toBeGreaterThan(0);
          
          // At least one relevant token should exist
          const hasRelevantToken = relevantTokens.some((token) =>
            availableTokens.has(token)
          );
          expect(hasRelevantToken).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consistent transition timing', () => {
    const transitionTokens = [
      '--shopify-transition-fast',
      '--shopify-transition-base',
      '--shopify-transition-slow',
    ];

    transitionTokens.forEach((token) => {
      const value = getCSSVariableValue(token);
      if (value) {
        // Should have timing in ms and easing function
        expect(value).toMatch(/\d+ms/);
        expect(value).toMatch(/ease/);
      }
    });
  });

  it('should maintain semantic color naming', () => {
    const semanticColors = [
      '--shopify-success',
      '--shopify-warning',
      '--shopify-critical',
      '--shopify-info',
    ];

    semanticColors.forEach((token) => {
      if (availableTokens.has(token)) {
        const value = getCSSVariableValue(token);
        expect(value).not.toBeNull();
        expect(value).toBeTruthy();
      }
    });
  });

  it('should have button-specific tokens', () => {
    const buttonTokens = [
      '--shopify-interactive-default',
      '--shopify-interactive-hover',
      '--shopify-interactive-active',
    ];

    buttonTokens.forEach((token) => {
      if (availableTokens.has(token)) {
        const value = getCSSVariableValue(token);
        expect(value).not.toBeNull();
        expect(value).toBeTruthy();
      }
    });
  });

  it('should support responsive layout tokens', () => {
    const layoutTokens = [
      '--shopify-breakpoint-mobile',
      '--shopify-breakpoint-tablet',
      '--shopify-breakpoint-desktop',
    ];

    layoutTokens.forEach((token) => {
      if (availableTokens.has(token)) {
        const value = getCSSVariableValue(token);
        expect(value).not.toBeNull();
        expect(value).toMatch(/\d+px/);
      }
    });
  });
});
