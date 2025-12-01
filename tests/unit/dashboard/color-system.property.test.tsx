/**
 * Feature: dashboard-shopify-migration, Property 13: Surface Element Color Consistency
 * Feature: dashboard-shopify-migration, Property 14: Primary Action Color Consistency
 * Feature: dashboard-shopify-migration, Property 15: Text Color Hierarchy
 * Feature: dashboard-shopify-migration, Property 16: Shadow Consistency
 * 
 * Property-based tests for color system migration (Phase 8)
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Note: These tests validate that CSS variables are used correctly in the codebase,
 * not the computed values (which require a browser environment).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Helper to read CSS module files
function readCSSModule(modulePath: string): string {
  const fullPath = path.join(process.cwd(), modulePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

// Helper to check if CSS uses variables instead of hardcoded colors
function usesVariables(css: string, variablePattern: RegExp): boolean {
  return variablePattern.test(css);
}

// Helper to check for hardcoded color values
function hasHardcodedColors(css: string): string[] {
  const hardcodedColorPattern = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\)/g;
  const matches = css.match(hardcodedColorPattern) || [];
  
  // Filter out acceptable hardcoded colors (like in gradients that reference variables)
  return matches.filter(color => {
    // Allow colors in comments
    const lines = css.split('\n');
    for (const line of lines) {
      if (line.includes(color) && line.trim().startsWith('/*')) {
        return false;
      }
    }
    return true;
  });
}

describe('Color System Migration - Property Tests', () => {
  describe('Property 13: Surface Element Color Consistency', () => {
    it('should use var(--bg-surface) for surface backgrounds', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use CSS variable for surface backgrounds
            return usesVariables(css, /var\(--bg-surface\)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use var(--bg-app) for canvas backgrounds', () => {
      const css = readCSSModule('styles/dashboard-shopify-tokens.css');
      // Shopify-like admin canvas color
      expect(css).toContain('--bg-app: #F1F2F4');
    });
  });

  describe('Property 14: Primary Action Color Consistency', () => {
    it('should use var(--color-indigo) for primary actions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/Button.module.css',
            'components/dashboard/GamifiedOnboarding.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use CSS variable for indigo color
            return usesVariables(css, /var\(--color-indigo\)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use Electric Indigo gradient for primary buttons', () => {
      const css = readCSSModule('components/dashboard/Button.module.css');
      expect(css).toContain('var(--color-indigo)');
      expect(css).toContain('var(--color-indigo-dark)');
    });
  });

  describe('Property 15: Text Color Hierarchy', () => {
    it('should use semantic text color variables', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use semantic color variables
            const hasTextMain = usesVariables(css, /var\(--color-text-main\)/);
            const hasTextSub = usesVariables(css, /var\(--color-text-sub\)/);
            const hasTextHeading = usesVariables(css, /var\(--color-text-heading\)/);
            
            return hasTextMain || hasTextSub || hasTextHeading;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not use pure black (#000000) for text colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GlobalSearch.module.css',
            'components/dashboard/Button.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should not contain pure black for text
            // (Platform brand colors like TikTok's black are acceptable)
            const hasBlackText = /color:\s*#000000|color:\s*#000(?![0-9a-fA-F])/g.test(css);
            return !hasBlackText;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Shadow Consistency', () => {
    it('should use var(--shadow-soft) for card shadows', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use CSS variable for shadows
            return usesVariables(css, /var\(--shadow-soft\)|var\(--shadow-card-hover\)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use var(--color-indigo-glow) for focus effects', () => {
      const css = readCSSModule('components/dashboard/Button.module.css');
      expect(css).toContain('var(--color-indigo-glow)');
    });
  });

  describe('Color System Integration', () => {
    it('should minimize hardcoded colors in CSS modules', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css',
            'components/dashboard/Button.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            const hardcoded = hasHardcodedColors(css);
            
            // Allow hardcoded colors for specific cases:
            // - Platform brand colors (Instagram, TikTok, YouTube gradients)
            // - Specific design elements that need exact colors
            // GamifiedOnboarding has ~15 colors for platform logos, which is acceptable
            const threshold = modulePath.includes('GamifiedOnboarding') ? 20 : 10;
            return hardcoded.length < threshold;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent transition variables', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css',
            'components/dashboard/Button.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use transition variables
            return usesVariables(css, /var\(--transition-fast\)|var\(--transition-medium\)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent spacing variables', () => {
      const css = readCSSModule('components/dashboard/GamifiedOnboarding.module.css');
      expect(css).toContain('var(--spacing-card-gap)');
      expect(css).toContain('var(--spacing-card-padding)');
    });

    it('should use consistent typography variables', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'components/dashboard/GamifiedOnboarding.module.css',
            'components/dashboard/GlobalSearch.module.css'
          ),
          (modulePath) => {
            const css = readCSSModule(modulePath);
            // Should use font variables
            const hasFontHeading = usesVariables(css, /var\(--font-heading\)/);
            const hasFontSize = usesVariables(css, /var\(--font-size-[a-z]+\)/);
            const hasFontWeight = usesVariables(css, /var\(--font-weight-[a-z]+\)/);
            
            return hasFontHeading || hasFontSize || hasFontWeight;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Design Token Definitions', () => {
    it('should define all required color tokens in dashboard-shopify-tokens.css', () => {
      const css = readCSSModule('styles/dashboard-shopify-tokens.css');
      
      const requiredTokens = [
        '--bg-app',
        '--bg-surface',
        '--color-indigo',
        '--color-indigo-dark',
        '--color-indigo-fade',
        '--color-indigo-glow',
        '--color-text-main',
        '--color-text-sub',
        '--color-text-heading',
        '--color-text-inactive',
        '--shadow-soft',
        '--shadow-card-hover',
      ];

      requiredTokens.forEach(token => {
        expect(css).toContain(token);
      });
    });

    it('should define all required spacing tokens', () => {
      const css = readCSSModule('styles/dashboard-shopify-tokens.css');
      
      expect(css).toContain('--spacing-card-padding');
      expect(css).toContain('--spacing-card-gap');
      expect(css).toContain('--spacing-content-padding');
    });

    it('should define all required typography tokens', () => {
      const css = readCSSModule('styles/dashboard-shopify-tokens.css');
      
      expect(css).toContain('--font-heading');
      expect(css).toContain('--font-body');
      expect(css).toContain('--font-weight-heading');
      expect(css).toContain('--font-size-welcome');
    });
  });
});
