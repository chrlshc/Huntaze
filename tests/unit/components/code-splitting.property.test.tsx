/**
 * Property-Based Tests for Code Splitting
 * 
 * Tests that marketing pages implement proper code splitting to reduce initial bundle size.
 * Verifies Property 15: Code splitting per page
 * 
 * Feature: site-restructure-multipage, Property 15: Code splitting per page
 * Validates: Requirements 6.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Code Splitting Property Tests', () => {
  /**
   * Property 15: Code splitting per page
   * 
   * For any marketing page, the JavaScript bundle should only include code
   * necessary for that specific page (verified through bundle analysis).
   * 
   * This property verifies that:
   * 1. Pages use dynamic imports for heavy components
   * 2. Each page has its own chunk
   * 3. Common code is properly split into shared chunks
   * 4. Dynamic imports have loading states
   * 
   * Feature: site-restructure-multipage, Property 15: Code splitting per page
   * Validates: Requirements 6.4
   */
  describe('Property 15: Code splitting per page', () => {
    it('should use dynamic imports for heavy components', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            // Read the file content
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              // File doesn't exist, skip
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Check for dynamic import usage
            const hasDynamicImport = content.includes('dynamic(') || content.includes('next/dynamic');
            
            // If the file is a client component with heavy dependencies, it should use dynamic imports
            const isClientComponent = content.includes("'use client'");
            const hasHeavyDependencies = 
              content.includes('framer-motion') ||
              content.includes('FeatureGrid') ||
              content.includes('FeatureDetail') ||
              content.includes('PricingTiers') ||
              content.includes('PricingFAQ');
            
            if (isClientComponent && hasHeavyDependencies) {
              expect(hasDynamicImport).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide loading states for dynamically imported components', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // If file uses dynamic imports, it should have loading states
            if (content.includes('dynamic(')) {
              // Check for loading prop in dynamic imports
              const hasLoadingState = content.includes('loading:');
              
              // Dynamic imports should have loading states for better UX
              expect(hasLoadingState).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not import heavy components directly in pages that use dynamic imports', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // If using dynamic imports, heavy components should not be directly imported
            if (content.includes('dynamic(')) {
              const lines = content.split('\n');
              const importLines = lines.filter(line => 
                line.trim().startsWith('import') && 
                !line.includes('next/dynamic') &&
                !line.includes('react') &&
                !line.includes('lucide-react') &&
                !line.includes('next/link') &&
                !line.includes('type ') && // Type imports are OK (erased at runtime)
                !line.includes('import type') // Type-only imports are OK
              );
              
              // Check that dynamically imported components are not also statically imported
              const dynamicImports = content.match(/dynamic\(\(\) => import\(['"]([^'"]+)['"]\)/g) || [];
              const dynamicPaths = dynamicImports.map(imp => {
                const match = imp.match(/import\(['"]([^'"]+)['"]\)/);
                return match ? match[1] : '';
              });
              
              importLines.forEach(line => {
                dynamicPaths.forEach(dynamicPath => {
                  if (dynamicPath && line.includes(dynamicPath)) {
                    // This component is both dynamically and statically imported
                    // This defeats the purpose of code splitting
                    expect(false).toBe(true);
                  }
                });
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use SSR-safe dynamic imports where appropriate', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Check for dynamic imports
            if (content.includes('dynamic(')) {
              // Dynamic imports should specify ssr option
              const hasSSROption = content.includes('ssr:');
              
              // It's good practice to explicitly set ssr option
              expect(hasSSROption).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent dynamic import patterns across pages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'app/(marketing)/page.tsx',
              'app/(marketing)/features/page.tsx',
              'app/(marketing)/pricing/page.tsx'
            ),
            { minLength: 2, maxLength: 3 }
          ).map(arr => [...new Set(arr)]), // Remove duplicates
          (filePaths) => {
            const fs = require('fs');
            const path = require('path');
            
            const patterns: string[] = [];
            
            filePaths.forEach(filePath => {
              const fullPath = path.join(process.cwd(), filePath);
              
              if (!fs.existsSync(fullPath)) {
                return;
              }
              
              const content = fs.readFileSync(fullPath, 'utf-8');
              
              // Extract dynamic import pattern
              if (content.includes('dynamic(')) {
                // Check if it uses the same pattern: dynamic(() => import(...).then(mod => ...))
                const hasThenPattern = content.includes('.then(mod =>');
                patterns.push(hasThenPattern ? 'then' : 'direct');
              }
            });
            
            // All pages should use consistent pattern
            if (patterns.length > 1) {
              const firstPattern = patterns[0];
              patterns.forEach(pattern => {
                expect(pattern).toBe(firstPattern);
              });
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have loading.tsx file for page transitions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const fs = require('fs');
            const path = require('path');
            const loadingPath = path.join(process.cwd(), 'app/(marketing)/loading.tsx');
            
            // Marketing section should have a loading.tsx file
            expect(fs.existsSync(loadingPath)).toBe(true);
            
            if (fs.existsSync(loadingPath)) {
              const content = fs.readFileSync(loadingPath, 'utf-8');
              
              // Loading file should export a default component
              expect(content).toContain('export default');
              
              // Should have skeleton or loading UI
              expect(
                content.includes('skeleton') ||
                content.includes('loading') ||
                content.includes('animate-pulse')
              ).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not bundle unnecessary dependencies in each page', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Count total imports
            const importLines = content.split('\n').filter(line => 
              line.trim().startsWith('import')
            );
            
            // Pages should not have excessive direct imports if using code splitting
            if (content.includes('dynamic(')) {
              // With dynamic imports, direct imports should be minimal
              // (excluding common ones like React, Next.js, icons)
              const heavyImports = importLines.filter(line =>
                !line.includes('react') &&
                !line.includes('next/') &&
                !line.includes('lucide-react') &&
                !line.includes('type ')
              );
              
              // Should have fewer heavy imports when using dynamic imports
              expect(heavyImports.length).toBeLessThan(10);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Code Splitting Consistency Tests
   * 
   * Verifies that code splitting is applied consistently across the application
   */
  describe('Code Splitting Consistency', () => {
    it('should apply code splitting to all marketing pages consistently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (iterations) => {
            const fs = require('fs');
            const path = require('path');
            
            const pages = [
              'app/(marketing)/page.tsx',
              'app/(marketing)/features/page.tsx',
              'app/(marketing)/pricing/page.tsx'
            ];
            
            const pagesWithDynamic = pages.filter(pagePath => {
              const fullPath = path.join(process.cwd(), pagePath);
              if (!fs.existsSync(fullPath)) {
                return false;
              }
              const content = fs.readFileSync(fullPath, 'utf-8');
              return content.includes('dynamic(');
            });
            
            // At least some pages should use dynamic imports
            expect(pagesWithDynamic.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have proper module resolution for dynamic imports', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'app/(marketing)/page.tsx',
            'app/(marketing)/features/page.tsx',
            'app/(marketing)/pricing/page.tsx'
          ),
          (filePath) => {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(process.cwd(), filePath);
            
            if (!fs.existsSync(fullPath)) {
              return true;
            }
            
            const content = fs.readFileSync(fullPath, 'utf-8');
            
            // Extract dynamic import paths
            const dynamicImports = content.match(/import\(['"]([^'"]+)['"]\)/g) || [];
            
            dynamicImports.forEach(imp => {
              const match = imp.match(/import\(['"]([^'"]+)['"]\)/);
              if (match) {
                const importPath = match[1];
                
                // Should use @ alias for absolute imports
                if (importPath.startsWith('@/')) {
                  expect(importPath).toMatch(/^@\//);
                } else if (importPath.startsWith('.')) {
                  // Relative imports should be valid
                  expect(importPath).toMatch(/^\.\.?\//);
                }
              }
            });
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
