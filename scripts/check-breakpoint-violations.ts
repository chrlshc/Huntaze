#!/usr/bin/env tsx

/**
 * Breakpoint Violation Checker
 * 
 * Scans the codebase for non-standard media query breakpoints and provides
 * detailed migration guidance.
 * 
 * Usage:
 *   npm run check:breakpoints
 *   tsx scripts/check-breakpoint-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard breakpoints (Tailwind defaults)
const STANDARD_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

const ALLOWED_BREAKPOINTS = Object.values(STANDARD_BREAKPOINTS);

interface BreakpointViolation {
  file: string;
  line: number;
  column: number;
  mediaQuery: string;
  breakpointValue: number;
  suggestion: string;
  context: string;
}

interface ScanResult {
  violations: BreakpointViolation[];
  totalFiles: number;
  filesWithViolations: number;
  complianceRate: number;
}

/**
 * Scans CSS files for breakpoint violations
 */
function scanForBreakpointViolations(): ScanResult {
  const baseDir = process.cwd();
  const violations: BreakpointViolation[] = [];

  // Find all CSS files
  const cssFiles = glob.sync('**/*.css', {
    cwd: baseDir,
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'test-results/**'],
    absolute: true,
  });

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check min-width media queries
      const minWidthRegex = /@media\s*\([^)]*min-width:\s*(\d+)px[^)]*\)/g;
      let match;

      while ((match = minWidthRegex.exec(line)) !== null) {
        const breakpointValue = parseInt(match[1], 10);
        const fullMatch = match[0];
        const column = match.index;

        if (!ALLOWED_BREAKPOINTS.includes(breakpointValue)) {
          const suggestion = findNearestStandardBreakpoint(breakpointValue);
          violations.push({
            file: path.relative(baseDir, file),
            line: index + 1,
            column: column + 1,
            mediaQuery: fullMatch,
            breakpointValue,
            suggestion,
            context: line.trim(),
          });
        }
      }

      // Check max-width media queries
      const maxWidthRegex = /@media\s*\([^)]*max-width:\s*(\d+)px[^)]*\)/g;
      while ((match = maxWidthRegex.exec(line)) !== null) {
        const breakpointValue = parseInt(match[1], 10);
        const fullMatch = match[0];
        const column = match.index;

        // For max-width, allow n-1 of standard breakpoints
        const isStandardMaxWidth = ALLOWED_BREAKPOINTS.some(
          bp => breakpointValue === bp - 1 || breakpointValue === bp
        );

        if (!isStandardMaxWidth) {
          const suggestion = findNearestStandardBreakpoint(breakpointValue, true);
          violations.push({
            file: path.relative(baseDir, file),
            line: index + 1,
            column: column + 1,
            mediaQuery: fullMatch,
            breakpointValue,
            suggestion,
            context: line.trim(),
          });
        }
      }
    });
  }

  const filesWithViolations = new Set(violations.map(v => v.file)).size;
  const complianceRate = cssFiles.length > 0
    ? ((cssFiles.length - filesWithViolations) / cssFiles.length) * 100
    : 100;

  return {
    violations,
    totalFiles: cssFiles.length,
    filesWithViolations,
    complianceRate,
  };
}

/**
 * Finds the nearest standard breakpoint
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
    return `max-width: ${nearest[1] - 1}px (${nearest[0]} - 1)`;
  }
  return `min-width: ${nearest[1]}px (${nearest[0]})`;
}

/**
 * Prints a detailed report
 */
function printReport(result: ScanResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('MOBILE BREAKPOINT CONSISTENCY REPORT');
  console.log('='.repeat(80));
  console.log('');

  // Summary
  console.log('📊 SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total CSS files scanned: ${result.totalFiles}`);
  console.log(`Files with violations: ${result.filesWithViolations}`);
  console.log(`Compliant files: ${result.totalFiles - result.filesWithViolations}`);
  console.log(`Compliance rate: ${result.complianceRate.toFixed(1)}%`);
  console.log(`Total violations: ${result.violations.length}`);
  console.log('');

  // Standard breakpoints reference
  console.log('📐 STANDARD BREAKPOINTS');
  console.log('─'.repeat(80));
  Object.entries(STANDARD_BREAKPOINTS).forEach(([name, value]) => {
    console.log(`  ${name.padEnd(4)} ${value}px`);
  });
  console.log('');

  if (result.violations.length === 0) {
    console.log('✅ No violations found! All media queries use standard breakpoints.');
    console.log('='.repeat(80));
    console.log('');
    return;
  }

  // Violations by file
  console.log('🚨 VIOLATIONS');
  console.log('─'.repeat(80));
  console.log('');

  const violationsByFile = result.violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, BreakpointViolation[]>);

  for (const [file, violations] of Object.entries(violationsByFile)) {
    console.log(`📄 ${file}`);
    console.log('');

    for (const violation of violations) {
      console.log(`  Line ${violation.line}, Column ${violation.column}:`);
      console.log(`    Found:   ${violation.mediaQuery}`);
      console.log(`    Value:   ${violation.breakpointValue}px (non-standard)`);
      console.log(`    Fix:     @media (${violation.suggestion})`);
      console.log(`    Context: ${violation.context}`);
      console.log('');
    }
  }

  // Migration guide
  console.log('─'.repeat(80));
  console.log('');
  console.log('📝 MIGRATION GUIDE');
  console.log('─'.repeat(80));
  console.log('');
  console.log('1. Replace non-standard breakpoints with standard values');
  console.log('2. For min-width queries, use exact standard values');
  console.log('3. For max-width queries, use standard value - 1px');
  console.log('4. Consider using Tailwind responsive classes instead');
  console.log('');
  console.log('Example migrations:');
  console.log('  ❌ @media (min-width: 769px)  → ✅ @media (min-width: 768px)');
  console.log('  ❌ @media (max-width: 1023px) → ✅ @media (max-width: 1023px)');
  console.log('  ❌ @media (min-width: 375px)  → ✅ @media (min-width: 640px)');
  console.log('');
  console.log('Tailwind responsive classes (preferred):');
  console.log('  sm:block   → Shows on screens ≥ 640px');
  console.log('  md:flex    → Shows on screens ≥ 768px');
  console.log('  lg:grid    → Shows on screens ≥ 1024px');
  console.log('');
  console.log('='.repeat(80));
  console.log('');
}

/**
 * Exports violations to JSON for CI/CD integration
 */
function exportToJSON(result: ScanResult, outputPath: string): void {
  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: result.totalFiles,
      filesWithViolations: result.filesWithViolations,
      complianceRate: result.complianceRate,
      totalViolations: result.violations.length,
    },
    standardBreakpoints: STANDARD_BREAKPOINTS,
    violations: result.violations,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`📄 Report exported to: ${outputPath}`);
}

// Main execution
function main() {
  console.log('🔍 Scanning for breakpoint violations...\n');

  const result = scanForBreakpointViolations();
  printReport(result);

  // Export to JSON if requested
  const args = process.argv.slice(2);
  if (args.includes('--json')) {
    const outputPath = args[args.indexOf('--json') + 1] || 'breakpoint-violations.json';
    exportToJSON(result, outputPath);
  }

  // Exit with error code if violations found
  if (result.violations.length > 0) {
    process.exit(1);
  }
}

main();
