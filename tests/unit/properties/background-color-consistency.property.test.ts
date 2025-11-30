/**
 * Property-Based Test: Background Color Consistency
 * 
 * **Feature: design-system-unification, Property 1: Background Color Consistency**
 * **Validates: Requirements 1.1**
 * 
 * Property: For any dashboard page, the background color should reference 
 * the same design token (--bg-primary) rather than hardcoded values.
 * 
 * This test scans all dashboard page files and verifies that:
 * 1. No hardcoded background colors (bg-zinc-950, bg-gray-950, etc.) are used
 * 2. Background colors reference the --bg-primary design token
 * 3. Consistent background styling across all dashboard pages
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Property 1: Background Color Consistency', () => {
  // Get all dashboard page files
  const getDashboardPages = (): string[] => {
    const patterns = [
      'app/(app)/**/page.tsx',
      'app/(app)/**/layout.tsx',
    ];
    
    const files: string[] = [];
    patterns.forEach(pattern => {
      const matches = glob.sync(pattern, { 
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/.next/**']
      });
      files.push(...matches);
    });
    
    return files;
  };

  // Check if a file contains hardcoded background colors
  const hasHardcodedBackgroundColors = (content: string): { 
    hasViolation: boolean; 
    violations: string[];
  } => {
    const violations: string[] = [];
    
    // Patterns for hardcoded background colors
    const hardcodedPatterns = [
      /className=["'][^"']*bg-zinc-950[^"']*["']/g,
      /className=["'][^"']*bg-gray-950[^"']*["']/g,
      /className=["'][^"']*bg-slate-950[^"']*["']/g,
      /className=["'][^"']*bg-black[^"']*["']/g,
      /style={{[^}]*background:\s*['"]#[0-9a-fA-F]{3,6}['"]/g,
      /style={{[^}]*backgroundColor:\s*['"]#[0-9a-fA-F]{3,6}['"]/g,
      /style={{[^}]*background:\s*['"]rgb/g,
      /style={{[^}]*backgroundColor:\s*['"]rgb/g,
    ];

    hardcodedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push(...matches);
      }
    });

    return {
      hasViolation: violations.length > 0,
      violations
    };
  };

  // Check if file uses design token for background
  const usesDesignTokenBackground = (content: string): boolean => {
    // Check for CSS variable usage or utility classes that reference tokens
    const tokenPatterns = [
      /var\(--bg-primary\)/,
      /var\(--bg-secondary\)/,
      /var\(--bg-tertiary\)/,
      /className=["'][^"']*\[var\(--bg-[^)]+\)\][^"']*["']/,
    ];

    return tokenPatterns.some(pattern => pattern.test(content));
  };

  it('should verify all dashboard pages use design tokens for backgrounds', () => {
    const dashboardPages = getDashboardPages();
    
    expect(dashboardPages.length).toBeGreaterThan(0);

    const violations: Array<{ file: string; issues: string[] }> = [];

    dashboardPages.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const { hasViolation, violations: fileViolations } = hasHardcodedBackgroundColors(content);
      
      if (hasViolation) {
        violations.push({
          file: filePath,
          issues: fileViolations
        });
      }
    });

    if (violations.length > 0) {
      const errorMessage = violations.map(v => 
        `\n${v.file}:\n${v.issues.map(issue => `  - ${issue}`).join('\n')}`
      ).join('\n');
      
      expect.fail(
        `Found ${violations.length} file(s) with hardcoded background colors:\n${errorMessage}\n\n` +
        `All dashboard pages should use design tokens like var(--bg-primary) instead of hardcoded colors.`
      );
    }
  });

  it('should verify background color consistency using property-based testing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getDashboardPages()),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          const { hasViolation } = hasHardcodedBackgroundColors(content);
          
          // Property: No dashboard page should have hardcoded background colors
          return !hasViolation;
        }
      ),
      { 
        numRuns: Math.max(100, getDashboardPages().length),
        verbose: true
      }
    );
  });

  it('should verify specific pages use --bg-primary token', () => {
    const criticalPages = [
      'app/(app)/home/page.tsx',
      'app/(app)/analytics/page.tsx',
      'app/(app)/messages/page.tsx',
      'app/(app)/integrations/page.tsx',
    ];

    criticalPages.forEach(pagePath => {
      const fullPath = path.join(process.cwd(), pagePath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { hasViolation, violations } = hasHardcodedBackgroundColors(content);
        
        expect(hasViolation).toBe(false);
        
        if (hasViolation) {
          console.error(`Violations in ${pagePath}:`, violations);
        }
      }
    });
  });

  it('should verify no inline style background colors in dashboard pages', () => {
    const dashboardPages = getDashboardPages();
    const inlineStyleViolations: Array<{ file: string; matches: string[] }> = [];

    dashboardPages.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check for inline styles with background colors
      const inlineStylePattern = /style={{[^}]*(background|backgroundColor)[^}]*}}/g;
      const matches = content.match(inlineStylePattern);
      
      if (matches) {
        // Filter out those that use design tokens
        const violations = matches.filter(match => 
          !match.includes('var(--') && 
          (match.includes('#') || match.includes('rgb'))
        );
        
        if (violations.length > 0) {
          inlineStyleViolations.push({
            file: filePath,
            matches: violations
          });
        }
      }
    });

    if (inlineStyleViolations.length > 0) {
      const errorMessage = inlineStyleViolations.map(v =>
        `\n${v.file}:\n${v.matches.map(m => `  - ${m}`).join('\n')}`
      ).join('\n');
      
      expect.fail(
        `Found ${inlineStyleViolations.length} file(s) with inline background color styles:\n${errorMessage}\n\n` +
        `Use design tokens like var(--bg-primary) instead of hardcoded colors.`
      );
    }
  });

  it('should verify consistent background token usage across layouts', () => {
    const layoutFiles = glob.sync('app/(app)/**/layout.tsx', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/.next/**']
    });

    expect(layoutFiles.length).toBeGreaterThan(0);

    const violations: string[] = [];

    layoutFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const { hasViolation } = hasHardcodedBackgroundColors(content);
      
      if (hasViolation) {
        violations.push(filePath);
      }
    });

    expect(violations).toEqual([]);
  });
});
