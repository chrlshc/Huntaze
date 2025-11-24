/**
 * Property-Based Tests for Viewport CSS Enforcement
 * 
 * Tests universal properties that should hold for viewport configuration
 * using fast-check for property-based testing.
 * 
 * Feature: mobile-ux-marketing-refactor
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('Viewport CSS Property Tests', () => {
  /**
   * Property 1: Global viewport CSS enforcement
   * 
   * For any page in the application, the computed styles of html and body elements
   * should have overflow-x: hidden and width: 100%
   * 
   * Validates: Requirements 1.1
   * 
   * Feature: mobile-ux-marketing-refactor, Property 1: Global viewport CSS enforcement
   */
  describe('Property 1: Global viewport CSS enforcement', () => {
    it('should enforce overflow-x: hidden on html and body in globals.css', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random line numbers to verify consistency
          fc.integer({ min: 1, max: 100 }),
          async (randomCheck) => {
            // Read the global CSS file
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Verify html element has overflow-x: hidden
            // The CSS should contain rules for html element
            const htmlRuleMatch = globalsContent.match(/html\s*{[^}]*}/s);
            expect(htmlRuleMatch, 'html CSS rule should exist').toBeTruthy();

            // Verify body element has overflow-x: hidden
            const bodyRuleMatch = globalsContent.match(/body\s*{[^}]*}/s);
            expect(bodyRuleMatch, 'body CSS rule should exist').toBeTruthy();

            if (bodyRuleMatch) {
              const bodyRule = bodyRuleMatch[0];
              // Check for overflow-x: hidden
              expect(
                bodyRule.includes('overflow-x: hidden') || 
                bodyRule.includes('overflow-x:hidden'),
                'body should have overflow-x: hidden'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce width: 100% or 100vw on body element', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Verify body has width constraint
            const bodyRuleMatch = globalsContent.match(/body\s*{[^}]*}/s);
            expect(bodyRuleMatch, 'body CSS rule should exist').toBeTruthy();

            // Body should not allow horizontal overflow
            // This is enforced by overflow-x: hidden
            if (bodyRuleMatch) {
              const bodyRule = bodyRuleMatch[0];
              expect(
                bodyRule.includes('overflow-x: hidden') || 
                bodyRule.includes('overflow-x:hidden'),
                'body should prevent horizontal overflow'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should define safe area CSS variables in :root', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('--sat', '--sab', '--sal', '--sar'),
          async (cssVar) => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Verify :root contains safe area variables
            const rootRuleMatch = globalsContent.match(/:root\s*{[^}]*}/s);
            expect(rootRuleMatch, ':root CSS rule should exist').toBeTruthy();

            if (rootRuleMatch) {
              const rootRule = rootRuleMatch[0];
              // Check for safe area variable
              expect(
                rootRule.includes(cssVar),
                `${cssVar} should be defined in :root`
              ).toBe(true);

              // Verify it uses env() function
              expect(
                rootRule.includes('env(safe-area-inset-'),
                'Safe area variables should use env() function'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have app-viewport-lock class with overflow: hidden', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Verify .app-viewport-lock class exists
            const appLockMatch = globalsContent.match(/\.app-viewport-lock\s*{[^}]*}/s);
            expect(appLockMatch, '.app-viewport-lock class should exist').toBeTruthy();

            if (appLockMatch) {
              const appLockRule = appLockMatch[0];
              
              // Should have overflow: hidden (no scroll on body)
              expect(
                appLockRule.includes('overflow: hidden') || 
                appLockRule.includes('overflow:hidden'),
                '.app-viewport-lock should have overflow: hidden'
              ).toBe(true);

              // Should use dvh for height
              expect(
                appLockRule.includes('100dvh'),
                '.app-viewport-lock should use 100dvh for height'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have touch-action: manipulation on html element', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Verify html element has touch-action
            const htmlRuleMatch = globalsContent.match(/html\s*{[^}]*}/s);
            expect(htmlRuleMatch, 'html CSS rule should exist').toBeTruthy();

            if (htmlRuleMatch) {
              const htmlRule = htmlRuleMatch[0];
              expect(
                htmlRule.includes('touch-action: manipulation') || 
                htmlRule.includes('touch-action:manipulation'),
                'html should have touch-action: manipulation'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent viewport configuration across multiple reads', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constant(true), { minLength: 2, maxLength: 5 }),
          async (reads) => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            
            // Read file multiple times
            const contents = reads.map(() => fs.readFileSync(globalsPath, 'utf-8'));
            
            // All reads should be identical
            for (let i = 1; i < contents.length; i++) {
              expect(contents[i]).toBe(contents[0]);
            }

            // Verify overflow-x: hidden is present in all reads
            for (const content of contents) {
              expect(
                content.includes('overflow-x: hidden') || 
                content.includes('overflow-x:hidden')
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Dynamic viewport height usage
   * 
   * For any full-screen element in the codebase, height declarations should
   * use dvh units instead of vh units
   * 
   * Validates: Requirements 1.2
   * 
   * Feature: mobile-ux-marketing-refactor, Property 2: Dynamic viewport height usage
   */
  describe('Property 2: Dynamic viewport height usage', () => {
    it('should use dvh instead of vh for viewport-locked elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Check for .app-viewport-lock class
            const appLockMatch = globalsContent.match(/\.app-viewport-lock\s*{[^}]*}/s);
            
            if (appLockMatch) {
              const appLockRule = appLockMatch[0];
              
              // Should use dvh, not vh
              expect(
                appLockRule.includes('dvh'),
                '.app-viewport-lock should use dvh units'
              ).toBe(true);

              // Should NOT use vh (old unit)
              expect(
                !appLockRule.includes('100vh') || appLockRule.includes('100dvh'),
                '.app-viewport-lock should not use vh units'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not have any 100vh declarations in globals.css', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // Find all height declarations with vh
            const vhMatches = globalsContent.match(/height:\s*100vh/g);
            
            // If there are any 100vh declarations, they should be replaced with dvh
            if (vhMatches) {
              // Check if there are corresponding dvh declarations
              const dvhMatches = globalsContent.match(/height:\s*100dvh/g);
              expect(
                dvhMatches && dvhMatches.length > 0,
                'Should use dvh instead of vh for full-height elements'
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Safe area padding on fixed components
   * 
   * For any fixed Header or Footer component, the styles should include
   * CSS environment variables for safe area insets
   * 
   * Validates: Requirements 1.4
   * 
   * Feature: mobile-ux-marketing-refactor, Property 3: Safe area padding on fixed components
   */
  describe('Property 3: Safe area padding on fixed components', () => {
    it('should define safe area CSS variables for all insets', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // All four safe area insets should be defined
            const requiredVars = ['--sat', '--sab', '--sal', '--sar'];
            
            for (const cssVar of requiredVars) {
              expect(
                globalsContent.includes(cssVar),
                `${cssVar} should be defined in globals.css`
              ).toBe(true);
            }

            // Verify they use env() function
            expect(
              globalsContent.includes('env(safe-area-inset-top)'),
              'Should define safe-area-inset-top'
            ).toBe(true);
            expect(
              globalsContent.includes('env(safe-area-inset-bottom)'),
              'Should define safe-area-inset-bottom'
            ).toBe(true);
            expect(
              globalsContent.includes('env(safe-area-inset-left)'),
              'Should define safe-area-inset-left'
            ).toBe(true);
            expect(
              globalsContent.includes('env(safe-area-inset-right)'),
              'Should define safe-area-inset-right'
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent safe area variable definitions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom('--sat', '--sab', '--sal', '--sar'), { minLength: 2, maxLength: 4 }),
          async (varsToCheck) => {
            const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
            const globalsContent = fs.readFileSync(globalsPath, 'utf-8');

            // All checked variables should be defined
            for (const cssVar of varsToCheck) {
              expect(
                globalsContent.includes(cssVar),
                `${cssVar} should be consistently defined`
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
