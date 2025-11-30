/**
 * Property-Based Test: Typography Hierarchy Consistency
 * 
 * **Feature: design-system-unification, Property 4: Typography Hierarchy Consistency**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any text element, font sizes should reference typography tokens 
 * rather than arbitrary values
 * 
 * This test scans all component files to ensure:
 * 1. No hardcoded font-size values in inline styles
 * 2. No hardcoded text-* classes with arbitrary values
 * 3. All font sizes reference design tokens (--text-xs through --text-6xl)
 * 4. Tailwind text classes use standard sizes only
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Valid typography tokens from design-tokens.css
const VALID_TYPOGRAPHY_TOKENS = [
  '--text-xs',    // 12px
  '--text-sm',    // 14px
  '--text-base',  // 16px
  '--text-lg',    // 18px
  '--text-xl',    // 20px
  '--text-2xl',   // 24px
  '--text-3xl',   // 30px
  '--text-4xl',   // 36px
  '--text-5xl',   // 48px
  '--text-6xl',   // 60px
];

// Valid Tailwind text size classes
const VALID_TAILWIND_TEXT_CLASSES = [
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'text-6xl',
  'text-7xl',
  'text-8xl',
  'text-9xl',
];

interface TypographyViolation {
  file: string;
  line: number;
  content: string;
  type: 'inline-style' | 'arbitrary-class' | 'css-hardcoded';
  value: string;
}

/**
 * Scans a file for typography violations
 */
function scanFileForTypographyViolations(filePath: string): TypographyViolation[] {
  const violations: TypographyViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for inline style font-size with hardcoded values
    // Matches: style={{ fontSize: '16px' }} or style="font-size: 16px"
    const inlineStyleRegex = /(?:style=(?:{|")\s*(?:{[^}]*)?fontSize\s*:\s*['"]?(\d+(?:px|rem|em))['"]?|font-size\s*:\s*(\d+(?:px|rem|em)))/gi;
    let match;
    while ((match = inlineStyleRegex.exec(line)) !== null) {
      const value = match[1] || match[2];
      // Allow var(--text-*) references
      if (!line.includes('var(--text-')) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'inline-style',
          value: value,
        });
      }
    }

    // Check for arbitrary Tailwind text classes
    // Matches: text-[16px] or text-[1.5rem]
    const arbitraryClassRegex = /text-\[(\d+(?:px|rem|em))\]/g;
    while ((match = arbitraryClassRegex.exec(line)) !== null) {
      violations.push({
        file: filePath,
        line: lineNumber,
        content: line.trim(),
        type: 'arbitrary-class',
        value: match[1],
      });
    }

    // For CSS files, check for hardcoded font-size values
    if (filePath.endsWith('.css')) {
      const cssHardcodedRegex = /font-size\s*:\s*(\d+(?:px|rem|em))(?!\s*\/)/g;
      while ((match = cssHardcodedRegex.exec(line)) !== null) {
        // Allow if it's using a CSS variable
        if (!line.includes('var(--text-') && !line.includes('var(--font-')) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            type: 'css-hardcoded',
            value: match[1],
          });
        }
      }
    }
  });

  return violations;
}

/**
 * Gets all relevant files to scan
 */
async function getFilesToScan(): Promise<string[]> {
  const patterns = [
    'components/**/*.{tsx,ts,jsx,js}',
    'app/**/*.{tsx,ts,jsx,js}',
    'styles/**/*.css',
    'app/**/*.css',
  ];

  const excludePatterns = [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.{ts,tsx,js,jsx}',
    '**/*.spec.{ts,tsx,js,jsx}',
  ];

  const allFiles: string[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: excludePatterns,
      absolute: false,
    });
    allFiles.push(...files);
  }

  return allFiles;
}

describe('Property 4: Typography Hierarchy Consistency', () => {
  it('should ensure all font sizes reference typography tokens', async () => {
    const files = await getFilesToScan();
    expect(files.length).toBeGreaterThan(0);

    const allViolations: TypographyViolation[] = [];

    for (const file of files) {
      const violations = scanFileForTypographyViolations(file);
      allViolations.push(...violations);
    }

    // Group violations by type for better reporting
    const violationsByType = {
      'inline-style': allViolations.filter(v => v.type === 'inline-style'),
      'arbitrary-class': allViolations.filter(v => v.type === 'arbitrary-class'),
      'css-hardcoded': allViolations.filter(v => v.type === 'css-hardcoded'),
    };

    // Report violations
    if (allViolations.length > 0) {
      console.log('\n❌ Typography Token Violations Found:\n');
      console.log(`Total violations: ${allViolations.length}\n`);

      Object.entries(violationsByType).forEach(([type, violations]) => {
        if (violations.length > 0) {
          console.log(`\n${type.toUpperCase()} (${violations.length} violations):`);
          
          // Group by file
          const byFile = violations.reduce((acc, v) => {
            if (!acc[v.file]) acc[v.file] = [];
            acc[v.file].push(v);
            return acc;
          }, {} as Record<string, TypographyViolation[]>);

          Object.entries(byFile).forEach(([file, fileViolations]) => {
            console.log(`\n  ${file}:`);
            fileViolations.slice(0, 3).forEach(v => {
              console.log(`    Line ${v.line}: ${v.content.substring(0, 80)}...`);
              console.log(`    → Found hardcoded value: ${v.value}`);
            });
            if (fileViolations.length > 3) {
              console.log(`    ... and ${fileViolations.length - 3} more violations`);
            }
          });
        }
      });

      console.log('\n💡 Fix by using typography tokens:');
      console.log('   ❌ fontSize: "16px"');
      console.log('   ✅ fontSize: "var(--text-base)"');
      console.log('   ❌ className="text-[14px]"');
      console.log('   ✅ className="text-sm"');
      console.log('   ❌ font-size: 1.5rem;');
      console.log('   ✅ font-size: var(--text-2xl);');
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should verify typography tokens are defined in design-tokens.css', () => {
    const tokenFile = 'styles/design-tokens.css';
    expect(fs.existsSync(tokenFile)).toBe(true);

    const content = fs.readFileSync(tokenFile, 'utf-8');

    VALID_TYPOGRAPHY_TOKENS.forEach(token => {
      expect(content).toContain(token);
    });
  });

  it('should use property-based testing to verify token consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_TYPOGRAPHY_TOKENS),
        (token) => {
          // Property: All typography tokens should follow naming convention
          expect(token).toMatch(/^--text-(xs|sm|base|lg|xl|\dxl)$/);
          
          // Property: Token names should be consistent
          const tokenName = token.replace('--text-', '');
          expect(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl']).toContain(tokenName);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify Tailwind text classes are standard sizes', async () => {
    const files = await getFilesToScan();
    const invalidTailwindClasses: Array<{ file: string; line: number; className: string }> = [];

    for (const file of files) {
      if (!file.endsWith('.tsx') && !file.endsWith('.jsx') && !file.endsWith('.ts') && !file.endsWith('.js')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Find all text-* classes including arbitrary values
        const textClassRegex = /\btext-(\[[^\]]+\]|[a-z0-9-]+)/g;
        let match;
        
        while ((match = textClassRegex.exec(line)) !== null) {
          const fullClass = `text-${match[1]}`;
          
          // Skip if it's a valid standard class
          if (VALID_TAILWIND_TEXT_CLASSES.includes(fullClass)) {
            continue;
          }
          
          // Skip if it's a color class (text-white, text-gray-500, etc.)
          if (match[1].match(/^(white|black|gray|zinc|red|blue|green|yellow|purple|pink|indigo|violet|emerald|amber|rose|sky|cyan|teal|lime|orange|fuchsia|slate|neutral|stone)-/)) {
            continue;
          }
          
          // Skip if it's a utility class (text-left, text-center, etc.)
          if (['left', 'center', 'right', 'justify', 'start', 'end'].includes(match[1])) {
            continue;
          }
          
          // Skip if it's using a CSS variable
          if (line.includes('var(--')) {
            continue;
          }
          
          // If it's an arbitrary value, check if it's a color or size
          if (match[1].includes('[')) {
            // Skip if it's an arbitrary color (text-[#...] or text-[rgb...])
            if (match[1].match(/\[#[0-9A-Fa-f]+\]/) || match[1].match(/\[rgb/)) {
              continue;
            }
            
            // It's an arbitrary size value - this is a violation
            invalidTailwindClasses.push({
              file,
              line: index + 1,
              className: fullClass,
            });
          }
        }
      });
    }

    if (invalidTailwindClasses.length > 0) {
      console.log('\n❌ Invalid Tailwind Text Classes Found:\n');
      invalidTailwindClasses.slice(0, 10).forEach(({ file, line, className }) => {
        console.log(`  ${file}:${line} - ${className}`);
      });
      if (invalidTailwindClasses.length > 10) {
        console.log(`  ... and ${invalidTailwindClasses.length - 10} more`);
      }
    }

    expect(invalidTailwindClasses).toHaveLength(0);
  });
});
