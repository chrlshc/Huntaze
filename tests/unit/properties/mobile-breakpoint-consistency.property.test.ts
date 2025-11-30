/**
 * Property Test: Mobile Breakpoint Consistency
 * 
 * **Feature: design-system-unification, Property 21: Mobile Breakpoint Consistency**
 * **Validates: Requirements 7.1**
 * 
 * Property: For any responsive media query, breakpoints should match the standardized breakpoint tokens
 * 
 * This test ensures that all media queries use consistent, standardized breakpoints
 * rather than arbitrary pixel values. This maintains responsive design consistency
 * across the application.
 * 
 * Standard breakpoints (Tailwind defaults):
 * - sm: 640px
 * - md: 768px  
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard breakpoints that should be used
const STANDARD_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Allowed breakpoint values (in pixels)
const ALLOWED_BREAKPOINTS = Object.values(STANDARD_BREAKPOINTS);

interface BreakpointViolation {
  file: string;
  line: number;
  mediaQuery: string;
  breakpointValue: number;
  suggestion: string;
}

/**
 * Scans CSS files for media query breakpoints
 */
function scanCSSFilesForBreakpoints(baseDir: string): BreakpointViolation[] {
  const violations: BreakpointViolation[] = [];
  
  // Find all CSS files
  const cssFiles = glob.sync('**/*.css', {
    cwd: baseDir,
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
    absolute: true,
  });

  // Regex patterns for media queries
  const minWidthPattern = /@media\s*\([^)]*min-width:\s*(\d+)px[^)]*\)/g;
  const maxWidthPattern = /@media\s*\([^)]*max-width:\s*(\d+)px[^)]*\)/g;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check min-width media queries
      let match;
      const minWidthRegex = /@media\s*\([^)]*min-width:\s*(\d+)px[^)]*\)/g;
      while ((match = minWidthRegex.exec(line)) !== null) {
        const breakpointValue = parseInt(match[1], 10);
        const fullMatch = match[0];

        if (!ALLOWED_BREAKPOINTS.includes(breakpointValue)) {
          const suggestion = findNearestStandardBreakpoint(breakpointValue);
          violations.push({
            file: path.relative(baseDir, file),
            line: index + 1,
            mediaQuery: fullMatch,
            breakpointValue,
            suggestion,
          });
        }
      }

      // Check max-width media queries
      const maxWidthRegex = /@media\s*\([^)]*max-width:\s*(\d+)px[^)]*\)/g;
      while ((match = maxWidthRegex.exec(line)) !== null) {
        const breakpointValue = parseInt(match[1], 10);
        const fullMatch = match[0];

        // For max-width, we allow n-1 of standard breakpoints (e.g., 767px for md-1)
        const isStandardMaxWidth = ALLOWED_BREAKPOINTS.some(
          bp => breakpointValue === bp - 1 || breakpointValue === bp
        );

        if (!isStandardMaxWidth) {
          const suggestion = findNearestStandardBreakpoint(breakpointValue, true);
          violations.push({
            file: path.relative(baseDir, file),
            line: index + 1,
            mediaQuery: fullMatch,
            breakpointValue,
            suggestion,
          });
        }
      }
    });
  }

  return violations;
}

/**
 * Finds the nearest standard breakpoint for a given value
 */
function findNearestStandardBreakpoint(value: number, isMaxWidth = false): string {
  const breakpoints = Object.entries(STANDARD_BREAKPOINTS);
  
  let nearest = breakpoints[0];
  let minDiff = Math.abs(value - nearest[1]);

  for (const [name, bp] of breakpoints) {
    const diff = Math.abs(value - bp);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = [name, bp];
    }
  }

  if (isMaxWidth) {
    return `Use max-width: ${nearest[1] - 1}px (${nearest[0]} breakpoint - 1)`;
  }
  return `Use min-width: ${nearest[1]}px (${nearest[0]} breakpoint)`;
}

/**
 * Generates a detailed report of breakpoint violations
 */
function generateViolationReport(violations: BreakpointViolation[]): string {
  if (violations.length === 0) {
    return 'No breakpoint violations found. All media queries use standard breakpoints.';
  }

  const report: string[] = [
    '\n='.repeat(80),
    'MOBILE BREAKPOINT CONSISTENCY VIOLATIONS',
    '='.repeat(80),
    '',
    `Total violations found: ${violations.length}`,
    '',
    'Standard breakpoints:',
    ...Object.entries(STANDARD_BREAKPOINTS).map(
      ([name, value]) => `  ${name}: ${value}px`
    ),
    '',
    '─'.repeat(80),
    '',
  ];

  // Group violations by file
  const violationsByFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, BreakpointViolation[]>);

  for (const [file, fileViolations] of Object.entries(violationsByFile)) {
    report.push(`📄 ${file}`);
    report.push('');

    for (const violation of fileViolations) {
      report.push(`  Line ${violation.line}:`);
      report.push(`    Found: ${violation.mediaQuery}`);
      report.push(`    Value: ${violation.breakpointValue}px (non-standard)`);
      report.push(`    Fix: ${violation.suggestion}`);
      report.push('');
    }

    report.push('');
  }

  report.push('─'.repeat(80));
  report.push('');
  report.push('MIGRATION GUIDE:');
  report.push('');
  report.push('1. Replace non-standard breakpoints with standard values');
  report.push('2. For min-width queries, use exact standard values');
  report.push('3. For max-width queries, use standard value - 1px');
  report.push('4. Consider using Tailwind responsive classes instead of custom media queries');
  report.push('');
  report.push('Example migrations:');
  report.push('  @media (min-width: 769px) → @media (min-width: 768px)  // md breakpoint');
  report.push('  @media (max-width: 767px) → @media (max-width: 767px)  // md-1 (correct)');
  report.push('  @media (min-width: 1023px) → @media (min-width: 1024px) // lg breakpoint');
  report.push('');
  report.push('='.repeat(80));

  return report.join('\n');
}

describe('Property 21: Mobile Breakpoint Consistency', () => {
  it('should use only standardized breakpoints in media queries', () => {
    const baseDir = process.cwd();
    const violations = scanCSSFilesForBreakpoints(baseDir);

    // Generate detailed report
    const report = generateViolationReport(violations);
    console.log(report);

    // Calculate compliance rate
    const totalFiles = glob.sync('**/*.css', {
      cwd: baseDir,
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
    }).length;

    const filesWithViolations = new Set(violations.map(v => v.file)).size;
    const compliantFiles = totalFiles - filesWithViolations;
    const complianceRate = totalFiles > 0 
      ? ((compliantFiles / totalFiles) * 100).toFixed(1)
      : '100.0';

    console.log(`\n📊 Compliance Rate: ${complianceRate}% (${compliantFiles}/${totalFiles} files)`);

    // Property assertion
    expect(violations).toEqual([]);
  });

  it('should document standard breakpoints for reference', () => {
    // This test documents the standard breakpoints
    const breakpoints = STANDARD_BREAKPOINTS;

    expect(breakpoints).toEqual({
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    });

    console.log('\n📐 Standard Breakpoints:');
    console.log('  sm:  640px  - Small devices (phones)');
    console.log('  md:  768px  - Medium devices (tablets)');
    console.log('  lg:  1024px - Large devices (desktops)');
    console.log('  xl:  1280px - Extra large devices');
    console.log('  2xl: 1536px - 2X extra large devices');
  });
});
