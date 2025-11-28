/**
 * Property-Based Test: CSS Import Uniqueness
 * 
 * Feature: codebase-cleanup-refactor, Property 1: CSS Import Uniqueness
 * Validates: Requirements 1.1
 * 
 * Property: For any layout file, each CSS concern (mobile, glass, animations) 
 * should be imported exactly once
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 1: CSS Import Uniqueness', () => {
  const LAYOUT_FILES = [
    'app/(app)/layout.tsx',
    'app/layout.tsx',
  ];

  const CSS_CONCERNS = {
    mobile: ['mobile.css', 'mobile-optimized.css', 'mobile-emergency-fix.css', 'nuclear-mobile-fix.css'],
    glass: ['glass.css'],
    animations: ['animations.css'],
    designTokens: ['design-tokens.css'],
  };

  /**
   * Extract CSS imports from a file
   */
  function extractCSSImports(filePath: string): string[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];

    // Match import statements for CSS files
    const importRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Count imports for a specific CSS concern
   */
  function countConcernImports(imports: string[], concernFiles: string[]): number {
    return imports.filter(imp => 
      concernFiles.some(file => imp.includes(file))
    ).length;
  }

  it('should import each CSS concern at most once in layout files', () => {
    for (const layoutFile of LAYOUT_FILES) {
      const fullPath = path.join(process.cwd(), layoutFile);
      
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const imports = extractCSSImports(fullPath);

      // Check each concern
      for (const [concernName, concernFiles] of Object.entries(CSS_CONCERNS)) {
        const count = countConcernImports(imports, concernFiles);
        
        expect(
          count,
          `${layoutFile} should import ${concernName} CSS at most once, but found ${count} imports`
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it('property: no duplicate CSS imports across all concerns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LAYOUT_FILES),
        (layoutFile) => {
          const fullPath = path.join(process.cwd(), layoutFile);
          
          if (!fs.existsSync(fullPath)) {
            return true; // Skip non-existent files
          }

          const imports = extractCSSImports(fullPath);
          const uniqueImports = new Set(imports);

          // Property: number of imports should equal number of unique imports
          return imports.length === uniqueImports.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('property: mobile CSS files should not be imported together', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LAYOUT_FILES),
        (layoutFile) => {
          const fullPath = path.join(process.cwd(), layoutFile);
          
          if (!fs.existsSync(fullPath)) {
            return true;
          }

          const imports = extractCSSImports(fullPath);
          const mobileImports = countConcernImports(imports, CSS_CONCERNS.mobile);

          // Property: should have 0 or 1 mobile CSS import, not multiple
          return mobileImports <= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have consolidated mobile CSS imports', () => {
    for (const layoutFile of LAYOUT_FILES) {
      const fullPath = path.join(process.cwd(), layoutFile);
      
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const imports = extractCSSImports(fullPath);
      const mobileImports = imports.filter(imp => 
        CSS_CONCERNS.mobile.some(file => imp.includes(file))
      );

      // After consolidation, should only have mobile.css
      const hasConsolidated = mobileImports.length === 0 || 
        (mobileImports.length === 1 && mobileImports[0].includes('mobile.css'));

      expect(
        hasConsolidated,
        `${layoutFile} should have consolidated mobile CSS imports. Found: ${mobileImports.join(', ')}`
      ).toBe(true);
    }
  });

  it('property: CSS import order should be consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LAYOUT_FILES),
        (layoutFile) => {
          const fullPath = path.join(process.cwd(), layoutFile);
          
          if (!fs.existsSync(fullPath)) {
            return true;
          }

          const imports = extractCSSImports(fullPath);
          
          // Find indices of different concerns
          const tokenIndex = imports.findIndex(imp => imp.includes('design-tokens'));
          const mobileIndex = imports.findIndex(imp => 
            CSS_CONCERNS.mobile.some(file => imp.includes(file))
          );
          const glassIndex = imports.findIndex(imp => imp.includes('glass'));
          const animIndex = imports.findIndex(imp => imp.includes('animations'));

          // Property: tokens should come before other CSS (if both exist)
          if (tokenIndex !== -1 && mobileIndex !== -1) {
            if (tokenIndex > mobileIndex) return false;
          }
          if (tokenIndex !== -1 && glassIndex !== -1) {
            if (tokenIndex > glassIndex) return false;
          }
          if (tokenIndex !== -1 && animIndex !== -1) {
            if (tokenIndex > animIndex) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
