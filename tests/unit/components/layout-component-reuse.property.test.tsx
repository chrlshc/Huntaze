/**
 * Property-Based Tests for Layout Component Reuse
 * 
 * Tests that all marketing pages use the shared layout component
 * to avoid code duplication.
 * 
 * Feature: site-restructure-multipage
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Layout Component Reuse Property Tests', () => {
  /**
   * Property 21: Layout component reuse
   * 
   * For any marketing page, it should use the shared layout component
   * from `app/(marketing)/layout.tsx` to avoid duplication.
   * 
   * Validates: Requirements 8.2
   * 
   * Feature: site-restructure-multipage, Property 21: Layout component reuse
   */
  describe('Property 21: Layout component reuse', () => {
    const marketingLayoutPath = join(process.cwd(), 'app/(marketing)/layout.tsx');
    const marketingPagesDir = join(process.cwd(), 'app/(marketing)');

    it('should have a shared marketing layout file', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            // Marketing layout should exist
            expect(existsSync(marketingLayoutPath)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should import MarketingHeader in the shared layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should import MarketingHeader
            expect(layoutContent).toContain('MarketingHeader');
            expect(layoutContent).toMatch(/import.*MarketingHeader.*from/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should import MarketingFooter in the shared layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should import MarketingFooter
            expect(layoutContent).toContain('MarketingFooter');
            expect(layoutContent).toMatch(/import.*MarketingFooter.*from/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render MarketingHeader component in the layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should render MarketingHeader component
            expect(layoutContent).toMatch(/<MarketingHeader\s*\/>/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render MarketingFooter component in the layout', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should render MarketingFooter component
            expect(layoutContent).toMatch(/<MarketingFooter\s*\/>/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render children between header and footer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should have children prop
            expect(layoutContent).toContain('children');
            
            // Should render children in the layout
            expect(layoutContent).toMatch(/>\s*{children}\s*</);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use proper semantic HTML structure', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should have main element for content
            expect(layoutContent).toMatch(/<main/);
            expect(layoutContent).toContain('{children}');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should export a default layout component', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should have default export
            expect(layoutContent).toMatch(/export default function/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent layout structure across multiple reads', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (readCount) => {
            const contents: string[] = [];

            for (let i = 0; i < readCount; i++) {
              const content = readFileSync(marketingLayoutPath, 'utf-8');
              contents.push(content);
            }

            // All reads should return identical content
            const firstContent = contents[0];
            expect(contents.every(c => c === firstContent)).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not duplicate header/footer code in individual pages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('page.tsx', 'features/page.tsx', 'pricing/page.tsx', 'about/page.tsx'),
          (pagePath) => {
            const fullPath = join(marketingPagesDir, pagePath);
            
            // Skip if page doesn't exist yet
            if (!existsSync(fullPath)) {
              return true;
            }

            const pageContent = readFileSync(fullPath, 'utf-8');

            // Individual pages should NOT import MarketingHeader or MarketingFooter
            // (they should rely on the layout)
            expect(pageContent).not.toMatch(/import.*MarketingHeader/);
            expect(pageContent).not.toMatch(/import.*MarketingFooter/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain layout component structure with proper TypeScript types', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should have ReactNode type for children
            expect(layoutContent).toMatch(/ReactNode|React\.ReactNode/);
            
            // Should type the children prop
            expect(layoutContent).toMatch(/children.*:.*ReactNode/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reference requirements in comments', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should document which requirements it satisfies
            expect(layoutContent).toContain('1.1');
            expect(layoutContent).toContain('5.1');
            expect(layoutContent).toContain('8.2');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use flex layout for proper footer positioning', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should use flex layout to push footer to bottom
            expect(layoutContent).toMatch(/flex.*flex-col|flex-col.*flex/);
            expect(layoutContent).toMatch(/min-h-screen/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should make main content area flexible to fill space', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Main should have flex-1 to fill available space
            expect(layoutContent).toMatch(/<main[^>]*flex-1/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Component Import Paths
   * 
   * Verifies that components are imported from the correct locations
   */
  describe('Component Import Paths', () => {
    const marketingLayoutPath = join(process.cwd(), 'app/(marketing)/layout.tsx');

    it('should import components from @/components/layout', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('MarketingHeader', 'MarketingFooter'),
          (componentName) => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should import from @/components/layout
            const importRegex = new RegExp(`import.*${componentName}.*from.*@/components/layout`);
            expect(layoutContent).toMatch(importRegex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use consistent import style', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          () => {
            const layoutContent = readFileSync(marketingLayoutPath, 'utf-8');

            // Should use named imports with curly braces
            expect(layoutContent).toMatch(/import\s*{\s*MarketingHeader\s*}/);
            expect(layoutContent).toMatch(/import\s*{\s*MarketingFooter\s*}/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
