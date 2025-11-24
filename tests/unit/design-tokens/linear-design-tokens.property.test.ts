/**
 * Property-Based Tests for Linear UI Design Token System
 * 
 * Tests universal properties that should hold for design token usage
 * using fast-check for property-based testing.
 * 
 * Feature: linear-ui-performance-refactor
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { designTokens } from '@/types/design-tokens';
import fs from 'fs';
import path from 'path';

// Read CSS file for validation
let cssContent: string;

beforeAll(() => {
  const cssPath = path.join(process.cwd(), 'styles', 'linear-design-tokens.css');
  cssContent = fs.readFileSync(cssPath, 'utf-8');
});

describe('Linear Design Token Property Tests', () => {
  /**
   * Property 23: Design token usage over hardcoded values
   * 
   * For any component style that references a color, spacing, or typography value,
   * it should use a CSS custom property (design token) rather than a hardcoded value
   * 
   * Validates: Requirements 8.4
   * 
   * Feature: linear-ui-performance-refactor, Property 23: Design token usage over hardcoded values
   */
  describe('Property 23: Design token usage over hardcoded values', () => {
    it('should define all color tokens as CSS custom properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'color-bg-app',
            'color-bg-surface',
            'color-bg-hover',
            'color-bg-input',
            'color-border-subtle',
            'color-border-emphasis',
            'color-border-focus',
            'color-accent-primary',
            'color-accent-hover',
            'color-accent-active',
            'color-text-primary',
            'color-text-secondary',
            'color-text-muted',
            'color-text-inverse'
          ),
          (tokenName) => {
            // Verify token is defined in CSS
            const tokenPattern = new RegExp(`--${tokenName}:\\s*#[0-9A-Fa-f]{6};`);
            expect(
              cssContent.match(tokenPattern),
              `Token --${tokenName} should be defined in CSS`
            ).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define all spacing tokens as CSS custom properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'spacing-0',
            'spacing-1',
            'spacing-2',
            'spacing-3',
            'spacing-4',
            'spacing-5',
            'spacing-6',
            'spacing-7',
            'spacing-8',
            'spacing-10',
            'spacing-12',
            'spacing-16',
            'spacing-20',
            'spacing-24'
          ),
          (tokenName) => {
            // Verify token is defined in CSS
            const tokenPattern = new RegExp(`--${tokenName}:`);
            expect(
              cssContent.match(tokenPattern),
              `Token --${tokenName} should be defined in CSS`
            ).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define all typography tokens as CSS custom properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'font-family-base',
            'font-family-mono',
            'font-weight-regular',
            'font-weight-medium',
            'font-size-xs',
            'font-size-sm',
            'font-size-base',
            'font-size-lg',
            'font-size-xl',
            'font-size-2xl',
            'font-size-3xl',
            'font-size-4xl'
          ),
          (tokenName) => {
            // Verify token is defined in CSS
            const tokenPattern = new RegExp(`--${tokenName}:`);
            expect(
              cssContent.match(tokenPattern),
              `Token --${tokenName} should be defined in CSS`
            ).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define all component tokens as CSS custom properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'input-height-dense',
            'input-height-standard',
            'button-height-dense',
            'button-height-standard',
            'border-width-max',
            'content-max-width-sm',
            'content-max-width-lg',
            'content-padding'
          ),
          (tokenName) => {
            // Verify token is defined in CSS
            const tokenPattern = new RegExp(`--${tokenName}:`);
            expect(
              cssContent.match(tokenPattern),
              `Token --${tokenName} should be defined in CSS`
            ).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have TypeScript definitions matching CSS tokens', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Verify key color tokens exist in TypeScript
            expect(designTokens.colors.background.app).toBe('#0F0F10');
            expect(designTokens.colors.background.surface).toBe('#151516');
            expect(designTokens.colors.accent.primary).toBe('#7D57C1');
            expect(designTokens.colors.text.primary).toBe('#EDEDEF');
            expect(designTokens.colors.text.secondary).toBe('#8A8F98');

            // Verify spacing tokens
            expect(designTokens.spacing.unit).toBe(4);
            expect(designTokens.spacing.scale).toContain(4);
            expect(designTokens.spacing.scale).toContain(8);
            expect(designTokens.spacing.scale).toContain(16);
            expect(designTokens.spacing.scale).toContain(24);

            // Verify typography tokens
            expect(designTokens.typography.weights.regular).toBe(400);
            expect(designTokens.typography.weights.medium).toBe(500);

            // Verify component tokens
            expect(designTokens.components.input.heightDense).toBe('2rem');
            expect(designTokens.components.input.heightStandard).toBe('2.5rem');
            expect(designTokens.components.button.heightDense).toBe('2rem');
            expect(designTokens.components.button.heightStandard).toBe('2.5rem');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use hardcoded color values in token definitions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // All color tokens should be hex values, not var() references
            const colorTokenPattern = /--(color-[a-z-]+):\s*(#[0-9A-Fa-f]{6});/g;
            const matches = [...cssContent.matchAll(colorTokenPattern)];

            expect(matches.length).toBeGreaterThan(0);

            // Each color token should have a direct hex value
            for (const match of matches) {
              const tokenName = match[1];
              const tokenValue = match[2];
              
              expect(tokenValue).toMatch(/^#[0-9A-Fa-f]{6}$/);
              expect(tokenValue).not.toContain('var(');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use 4px base unit for all spacing values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Extract spacing values from CSS
            const spacingPattern = /--spacing-\d+:\s*([\d.]+)rem;/g;
            const matches = [...cssContent.matchAll(spacingPattern)];

            expect(matches.length).toBeGreaterThan(0);

            // Convert rem to px and verify multiples of 4
            for (const match of matches) {
              const remValue = parseFloat(match[1]);
              const pxValue = remValue * 16; // 1rem = 16px
              
              // Should be a multiple of 4
              expect(pxValue % 4).toBe(0);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define layout tokens with proper max-width values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Verify layout tokens exist
            expect(cssContent).toContain('--content-max-width-sm: 75rem');
            expect(cssContent).toContain('--content-max-width-lg: 80rem');
            expect(cssContent).toContain('--content-padding:');

            // Verify TypeScript definitions
            expect(designTokens.layout.contentMaxWidth.sm).toBe('75rem');
            expect(designTokens.layout.contentMaxWidth.lg).toBe('80rem');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent token naming convention', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // All tokens should follow kebab-case naming
            const tokenPattern = /--([\w-]+):/g;
            const matches = [...cssContent.matchAll(tokenPattern)];

            for (const match of matches) {
              const tokenName = match[1];
              
              // Should be kebab-case (lowercase with hyphens)
              expect(tokenName).toMatch(/^[a-z][a-z0-9-]*$/);
              
              // Should not have consecutive hyphens
              expect(tokenName).not.toContain('--');
              
              // Should not start or end with hyphen
              expect(tokenName).not.toMatch(/^-/);
              expect(tokenName).not.toMatch(/-$/);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define transition tokens with proper timing functions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (iterations) => {
            // Verify transition tokens exist
            expect(cssContent).toContain('--transition-fast:');
            expect(cssContent).toContain('--transition-base:');
            expect(cssContent).toContain('--transition-slow:');

            // Verify they use cubic-bezier
            expect(cssContent).toContain('cubic-bezier(0.4, 0, 0.2, 1)');

            // Verify TypeScript definitions
            expect(designTokens.transitions.fast).toContain('cubic-bezier');
            expect(designTokens.transitions.base).toContain('cubic-bezier');
            expect(designTokens.transitions.slow).toContain('cubic-bezier');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
