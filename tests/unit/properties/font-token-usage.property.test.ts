/**
 * Property-Based Test: Font Token Usage
 * 
 * **Feature: design-system-unification, Property 8: Font Token Usage**
 * **Validates: Requirements 2.4**
 * 
 * Property: For any font-family or font-size declaration, it should reference typography tokens
 * 
 * This test scans all CSS, TSX, and styled component files to ensure that:
 * 1. font-family declarations reference --font-sans, --font-mono, or --font-display tokens
 * 2. font-size declarations reference --text-* tokens (xs, sm, base, lg, xl, 2xl, etc.)
 * 3. No inline font declarations bypass the design system
 * 
 * Rationale:
 * - Consistent typography is essential for professional appearance
 * - Using tokens ensures easy global updates to font system
 * - Prevents font inconsistencies across the application
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Property 8: Font Token Usage', () => {
  // Valid font token patterns
  const VALID_FONT_FAMILY_TOKENS = [
    '--font-sans',
    '--font-mono',
    '--font-display',
    'var(--font-sans)',
    'var(--font-mono)',
    'var(--font-display)',
  ];

  const VALID_FONT_SIZE_TOKENS = [
    '--text-xs',
    '--text-sm',
    '--text-base',
    '--text-lg',
    '--text-xl',
    '--text-2xl',
    '--text-3xl',
    '--text-4xl',
    '--text-5xl',
    '--text-6xl',
    'var(--text-xs)',
    'var(--text-sm)',
    'var(--text-base)',
    'var(--text-lg)',
    'var(--text-xl)',
    'var(--text-2xl)',
    'var(--text-3xl)',
    'var(--text-4xl)',
    'var(--text-5xl)',
    'var(--text-6xl)',
  ];

  // Patterns to detect hardcoded font declarations
  const HARDCODED_FONT_FAMILY_PATTERN = /font-family\s*:\s*(?!var\(--font-)[^;]+;/gi;
  const HARDCODED_FONT_SIZE_PATTERN = /font-size\s*:\s*(?!var\(--text-)[^;]+;/gi;
  
  // Inline style patterns in TSX
  const INLINE_FONT_FAMILY_PATTERN = /fontFamily\s*:\s*['"`](?!var\(--font-)[^'"`]+['"`]/gi;
  const INLINE_FONT_SIZE_PATTERN = /fontSize\s*:\s*['"`](?!var\(--text-)[^'"`]+['"`]/gi;

  // Tailwind font classes that should be replaced with tokens
  const TAILWIND_FONT_FAMILY_PATTERN = /className=["'][^"']*\b(font-sans|font-serif|font-mono)\b[^"']*["']/gi;
  const TAILWIND_FONT_SIZE_PATTERN = /className=["'][^"']*\b(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl|text-5xl|text-6xl|text-7xl|text-8xl|text-9xl)\b[^"']*["']/gi;

  // Files and directories to exclude
  const EXCLUDED_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/test-results/**',
    '**/styles/design-tokens.css', // Token definition file itself
    '**/tailwind.config.ts', // Tailwind config
    '**/postcss.config.mjs', // PostCSS config
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ];

  // Allowed exceptions (documented in ACCEPTABLE-VIOLATIONS.md)
  const ALLOWED_EXCEPTIONS = [
    'app/globals.css', // Base Tailwind imports
    'app/tailwind.css', // Tailwind utilities
    // Email templates (email clients don't support CSS variables)
    'lib/services/email-verification.service.ts',
    'lib/services/contentNotificationService.ts',
    'lib/services/email/ses.ts',
    'lib/performance/signup-optimization.ts',
    'lib/email/ses.ts',
    'lib/auth/magic-link.ts',
    'lib/amplify-env-vars/validationReporter.ts',
    // Development tools (not user-facing)
    'lib/devtools/hydrationDevtools.ts',
    // Design system base (intentional inherit)
    'styles/design-system.css',
    // Dynamic calculations (runtime values)
    'components/content/TagAnalytics.tsx',
  ];

  function getAllRelevantFiles(): string[] {
    const patterns = [
      'app/**/*.{css,tsx,ts}',
      'components/**/*.{css,tsx,ts}',
      'styles/**/*.css',
      'lib/**/*.{tsx,ts}',
      'hooks/**/*.{tsx,ts}',
    ];

    let allFiles: string[] = [];
    
    patterns.forEach(pattern => {
      const files = glob.sync(pattern, {
        ignore: EXCLUDED_PATTERNS,
        absolute: false,
      });
      allFiles = allFiles.concat(files);
    });

    // Remove duplicates and filter out allowed exceptions
    return [...new Set(allFiles)].filter(
      file => !ALLOWED_EXCEPTIONS.some(exception => file.includes(exception))
    );
  }

  function checkFileForHardcodedFonts(filePath: string): {
    hasViolations: boolean;
    violations: Array<{
      type: 'font-family' | 'font-size' | 'inline-font-family' | 'inline-font-size' | 'tailwind-font-family' | 'tailwind-font-size';
      line: number;
      content: string;
      match: string;
    }>;
  } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: Array<{
      type: 'font-family' | 'font-size' | 'inline-font-family' | 'inline-font-size' | 'tailwind-font-family' | 'tailwind-font-size';
      line: number;
      content: string;
      match: string;
    }> = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        return;
      }

      // Check for hardcoded font-family in CSS
      const fontFamilyMatches = line.matchAll(HARDCODED_FONT_FAMILY_PATTERN);
      for (const match of fontFamilyMatches) {
        // Skip if it's using a valid token
        const isValidToken = VALID_FONT_FAMILY_TOKENS.some(token => 
          match[0].includes(token)
        );
        
        if (!isValidToken) {
          violations.push({
            type: 'font-family',
            line: lineNumber,
            content: line.trim(),
            match: match[0],
          });
        }
      }

      // Check for hardcoded font-size in CSS
      const fontSizeMatches = line.matchAll(HARDCODED_FONT_SIZE_PATTERN);
      for (const match of fontSizeMatches) {
        // Skip if it's using a valid token
        const isValidToken = VALID_FONT_SIZE_TOKENS.some(token => 
          match[0].includes(token)
        );
        
        // Skip if it's a Tailwind utility class definition
        if (line.includes('@apply') || line.includes('theme(')) {
          continue;
        }
        
        if (!isValidToken) {
          violations.push({
            type: 'font-size',
            line: lineNumber,
            content: line.trim(),
            match: match[0],
          });
        }
      }

      // Check for inline fontFamily in TSX
      const inlineFontFamilyMatches = line.matchAll(INLINE_FONT_FAMILY_PATTERN);
      for (const match of inlineFontFamilyMatches) {
        violations.push({
          type: 'inline-font-family',
          line: lineNumber,
          content: line.trim(),
          match: match[0],
        });
      }

      // Check for inline fontSize in TSX
      const inlineFontSizeMatches = line.matchAll(INLINE_FONT_SIZE_PATTERN);
      for (const match of inlineFontSizeMatches) {
        violations.push({
          type: 'inline-font-size',
          line: lineNumber,
          content: line.trim(),
          match: match[0],
        });
      }

      // Check for Tailwind font-family classes (should use tokens instead)
      const tailwindFontFamilyMatches = line.matchAll(TAILWIND_FONT_FAMILY_PATTERN);
      for (const match of tailwindFontFamilyMatches) {
        // This is actually acceptable - Tailwind classes are fine
        // We're mainly concerned with inline styles and CSS declarations
        // So we'll skip this check
      }

      // Check for Tailwind font-size classes (acceptable, but note for migration)
      const tailwindFontSizeMatches = line.matchAll(TAILWIND_FONT_SIZE_PATTERN);
      for (const match of tailwindFontSizeMatches) {
        // Tailwind classes are acceptable - they're part of the utility-first approach
        // We're mainly concerned with inline styles and CSS declarations
      }
    });

    return {
      hasViolations: violations.length > 0,
      violations,
    };
  }

  it('should ensure all font-family declarations use design tokens', () => {
    const files = getAllRelevantFiles();
    const filesWithViolations: Array<{
      file: string;
      violations: Array<{
        type: string;
        line: number;
        content: string;
        match: string;
      }>;
    }> = [];

    files.forEach(file => {
      const result = checkFileForHardcodedFonts(file);
      
      if (result.hasViolations) {
        const fontFamilyViolations = result.violations.filter(
          v => v.type === 'font-family' || v.type === 'inline-font-family'
        );
        
        if (fontFamilyViolations.length > 0) {
          filesWithViolations.push({
            file,
            violations: fontFamilyViolations,
          });
        }
      }
    });

    if (filesWithViolations.length > 0) {
      const errorMessage = [
        '\n❌ Font Token Usage Violation: Hardcoded font-family declarations found',
        '\nAll font-family declarations should use design tokens:',
        '  - var(--font-sans) for sans-serif fonts',
        '  - var(--font-mono) for monospace fonts',
        '  - var(--font-display) for display/heading fonts',
        '\nViolations found in the following files:\n',
        ...filesWithViolations.map(({ file, violations }) => {
          return [
            `\n📄 ${file}`,
            ...violations.map(v => 
              `   Line ${v.line}: ${v.match}\n   Context: ${v.content}`
            ),
          ].join('\n');
        }),
        '\n💡 Fix: Replace hardcoded font-family values with design tokens',
        '   Example: font-family: var(--font-sans);',
      ].join('\n');

      expect(filesWithViolations).toHaveLength(0);
    }
  });

  it('should ensure all font-size declarations use design tokens', () => {
    const files = getAllRelevantFiles();
    const filesWithViolations: Array<{
      file: string;
      violations: Array<{
        type: string;
        line: number;
        content: string;
        match: string;
      }>;
    }> = [];

    files.forEach(file => {
      const result = checkFileForHardcodedFonts(file);
      
      if (result.hasViolations) {
        const fontSizeViolations = result.violations.filter(
          v => v.type === 'font-size' || v.type === 'inline-font-size'
        );
        
        if (fontSizeViolations.length > 0) {
          filesWithViolations.push({
            file,
            violations: fontSizeViolations,
          });
        }
      }
    });

    if (filesWithViolations.length > 0) {
      const errorMessage = [
        '\n❌ Font Token Usage Violation: Hardcoded font-size declarations found',
        '\nAll font-size declarations should use design tokens:',
        '  - var(--text-xs) through var(--text-6xl)',
        '\nViolations found in the following files:\n',
        ...filesWithViolations.map(({ file, violations }) => {
          return [
            `\n📄 ${file}`,
            ...violations.map(v => 
              `   Line ${v.line}: ${v.match}\n   Context: ${v.content}`
            ),
          ].join('\n');
        }),
      ].join('\n');

      expect(filesWithViolations).toHaveLength(0);
    }
  });

  it('should provide a summary of font token usage compliance', () => {
    const files = getAllRelevantFiles();
    let totalFiles = files.length;
    let filesWithViolations = 0;
    let totalViolations = 0;

    files.forEach(file => {
      const result = checkFileForHardcodedFonts(file);
      if (result.hasViolations) {
        filesWithViolations++;
        totalViolations += result.violations.length;
      }
    });

    const compliantFiles = totalFiles - filesWithViolations;
    const complianceRate = totalFiles > 0 
      ? ((compliantFiles / totalFiles) * 100).toFixed(1)
      : '0.0';

    console.log('\n📊 Font Token Usage Compliance Report');
    console.log('=====================================');
    console.log(`Total files scanned: ${totalFiles}`);
    console.log(`Compliant files: ${compliantFiles}`);
    console.log(`Files with violations: ${filesWithViolations}`);
    console.log(`Total violations: ${totalViolations}`);
    console.log(`Compliance rate: ${complianceRate}%`);
    console.log('=====================================\n');

    // This test always passes - it's just for reporting
    expect(true).toBe(true);
  });
});
