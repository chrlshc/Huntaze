/**
 * Property Test: Responsive Layout Adaptation
 * 
 * Feature: dashboard-views-unification, Property 7: Responsive Layout Adaptation
 * 
 * Property: For any dashboard view containing StatCard or InfoCard components,
 * when viewport width is less than 768px, the components SHALL stack vertically
 * with full width; when viewport width is 768px-1024px, components SHALL display
 * in 2-column grid; when viewport width is greater than 1024px, components SHALL
 * display in flexible row layout with equal widths.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * Note: This test validates that responsive CSS rules exist in the stylesheets.
 * Visual regression testing (Percy/Chromatic) or E2E tests (Playwright) should
 * be used to verify actual rendering behavior at different viewport sizes.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import fc from 'fast-check';

// Helper to read CSS file content
function readCSSFile(relativePath: string): string {
  const fullPath = join(process.cwd(), relativePath);
  return readFileSync(fullPath, 'utf-8');
}

// Helper to check if CSS contains media query
function hasMediaQuery(css: string, query: string): boolean {
  return css.includes(query);
}

// Helper to check if CSS contains rule within media query
function hasRuleInMediaQuery(css: string, mediaQuery: string, rule: string): boolean {
  const mediaQueryRegex = new RegExp(`@media[^{]*${mediaQuery.replace(/[()]/g, '\\$&')}[^{]*\\{([^}]+\\{[^}]*${rule}[^}]*\\}[^}]*)+\\}`, 's');
  return mediaQueryRegex.test(css);
}

// Breakpoint constants
const MOBILE_MAX = 767;
const TABLET_MIN = 768;
const TABLET_MAX = 1023;
const DESKTOP_MIN = 1024;

describe('Property 7: Responsive Layout Adaptation', () => {
  describe('Dashboard views CSS has mobile responsive rules (<768px)', () => {
    it('dashboard-views.css contains mobile media query', () => {
      const css = readCSSFile('styles/dashboard-views.css');
      
      // Should have mobile media query
      expect(hasMediaQuery(css, '@media (max-width: 767px)')).toBe(true);
      
      // Should set single column grid
      expect(css).toContain('grid-template-columns: 1fr');
    });

    it('StatCard.css contains mobile responsive adjustments', () => {
      const css = readCSSFile('components/ui/StatCard.css');
      
      // Should have mobile media query
      expect(hasMediaQuery(css, '@media (max-width: 767px)')).toBe(true);
      
      // Should adjust padding and sizing
      expect(css).toMatch(/padding:\s*8px\s+10px/);
    });

    it('InfoCard.css contains mobile responsive adjustments', () => {
      const css = readCSSFile('components/ui/InfoCard.css');
      
      // Should have mobile media query
      expect(hasMediaQuery(css, '@media (max-width: 767px)')).toBe(true);
      
      // Should adjust padding
      expect(css).toMatch(/padding:\s*10px\s+12px/);
    });

    it('DashboardEmptyState.css contains mobile responsive adjustments', () => {
      const css = readCSSFile('components/ui/DashboardEmptyState.css');
      
      // Should have mobile media query
      expect(hasMediaQuery(css, '@media (max-width: 767px)')).toBe(true);
      
      // Should reduce padding
      expect(css).toMatch(/padding:\s*24px\s+16px/);
    });
  });

  describe('Dashboard views CSS has tablet responsive rules (768px-1024px)', () => {
    it('dashboard-views.css contains tablet media query', () => {
      const css = readCSSFile('styles/dashboard-views.css');
      
      // Should have tablet media query
      expect(hasMediaQuery(css, '@media (min-width: 768px) and (max-width: 1023px)')).toBe(true);
      
      // Should set 2-column grid
      expect(css).toContain('grid-template-columns: repeat(2, 1fr)');
    });

    it('fans.css contains tablet grid configuration', () => {
      const css = readCSSFile('app/(app)/onlyfans/fans/fans.css');
      
      // Should have tablet media query
      expect(hasMediaQuery(css, '@media (min-width: 768px) and (max-width: 1024px)')).toBe(true);
      
      // Should set 2-column grid for segments
      expect(css).toContain('grid-template-columns: repeat(2, 1fr)');
    });
  });

  describe('Dashboard views CSS has desktop responsive rules (>1024px)', () => {
    it('dashboard-views.css contains desktop media query', () => {
      const css = readCSSFile('styles/dashboard-views.css');
      
      // Should have desktop media query
      expect(hasMediaQuery(css, '@media (min-width: 1024px)')).toBe(true);
      
      // Should set flexible grid
      expect(css).toContain('grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))');
    });

    it('fans.css contains desktop grid configuration', () => {
      const css = readCSSFile('app/(app)/onlyfans/fans/fans.css');
      
      // Should have desktop media query
      expect(hasMediaQuery(css, '@media (min-width: 1024px)')).toBe(true);
      
      // Should set 5-column grid for segments
      expect(css).toContain('grid-template-columns: repeat(5, 1fr)');
    });
  });

  describe('Responsive spacing adaptation', () => {
    it('reduces spacing variables on mobile', () => {
      const css = readCSSFile('styles/dashboard-views.css');
      
      // Mobile section should reduce gap values
      const mobileSection = css.match(/@media \(max-width: 767px\)[^}]*\{([^}]+\{[^}]*\}[^}]*)+\}/s);
      expect(mobileSection).toBeTruthy();
      
      if (mobileSection) {
        const mobileCss = mobileSection[0];
        expect(mobileCss).toMatch(/--dashboard-gap-md:\s*8px/);
        expect(mobileCss).toMatch(/--dashboard-gap-lg:\s*12px/);
      }
    });

    it('uses standard spacing on desktop', () => {
      const css = readCSSFile('styles/dashboard-views.css');
      
      // Desktop section should have standard gap values
      const desktopSection = css.match(/@media \(min-width: 1024px\)[^}]*\{([^}]+\{[^}]*\}[^}]*)+\}/s);
      expect(desktopSection).toBeTruthy();
      
      if (desktopSection) {
        const desktopCss = desktopSection[0];
        expect(desktopCss).toMatch(/--dashboard-gap-md:\s*12px/);
        expect(desktopCss).toMatch(/--dashboard-gap-lg:\s*16px/);
      }
    });
  });

  describe('Table responsive behavior', () => {
    it('enables horizontal scrolling on mobile', () => {
      const css = readCSSFile('app/(app)/onlyfans/fans/fans.css');
      
      // Should have mobile media query with table scrolling
      expect(hasMediaQuery(css, '@media (max-width: 767px)')).toBe(true);
      expect(css).toContain('overflow-x: auto');
    });

    it('removes scrolling on desktop', () => {
      const css = readCSSFile('app/(app)/onlyfans/fans/fans.css');
      
      // Should have desktop media query with visible overflow
      expect(hasMediaQuery(css, '@media (min-width: 1024px)')).toBe(true);
      expect(css).toContain('overflow-x: visible');
    });
  });

  describe('Property: Responsive layout rules exist for all breakpoints', () => {
    it('validates mobile breakpoint rules exist across all component stylesheets', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'styles/dashboard-views.css',
            'components/ui/StatCard.css',
            'components/ui/InfoCard.css',
            'components/ui/DashboardEmptyState.css',
            'components/ui/TagChip.css'
          ),
          (cssFile) => {
            const css = readCSSFile(cssFile);
            
            // Every component stylesheet should have mobile responsive rules
            const hasMobileQuery = hasMediaQuery(css, '@media (max-width: 767px)') ||
                                   hasMediaQuery(css, '@media (max-width: 768px)');
            
            expect(hasMobileQuery).toBe(true);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('validates breakpoint consistency across stylesheets', () => {
      const stylesheets = [
        'styles/dashboard-views.css',
        'components/ui/StatCard.css',
        'components/ui/InfoCard.css',
        'components/ui/DashboardEmptyState.css',
        'app/(app)/onlyfans/fans/fans.css'
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...stylesheets),
          (cssFile) => {
            const css = readCSSFile(cssFile);
            
            // Check that breakpoints are consistent
            // Mobile: max-width 767px or 768px
            // Tablet: min-width 768px and max-width 1023px or 1024px
            // Desktop: min-width 1024px
            
            const mobileBreakpoints = css.match(/@media[^{]*max-width:\s*(\d+)px/g) || [];
            const tabletMinBreakpoints = css.match(/@media[^{]*min-width:\s*(\d+)px[^{]*max-width/g) || [];
            const desktopBreakpoints = css.match(/@media[^{]*min-width:\s*(\d+)px[^{]*\{/g) || [];
            
            // All mobile breakpoints should be 767px or 768px
            mobileBreakpoints.forEach(bp => {
              const value = parseInt(bp.match(/(\d+)px/)?.[1] || '0');
              expect([767, 768]).toContain(value);
            });
            
            // All tablet min breakpoints should be 768px
            tabletMinBreakpoints.forEach(bp => {
              const value = parseInt(bp.match(/min-width:\s*(\d+)px/)?.[1] || '0');
              expect(value).toBe(768);
            });
            
            // All desktop breakpoints should be 1024px
            desktopBreakpoints.forEach(bp => {
              const value = parseInt(bp.match(/(\d+)px/)?.[1] || '0');
              if (value >= 1024) {
                expect(value).toBe(1024);
              }
            });
          }
        ),
        { numRuns: 25 }
      );
    });
  });
});
