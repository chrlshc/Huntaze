#!/usr/bin/env tsx

/**
 * Touch Target Size Violation Checker
 * 
 * Scans the codebase for interactive elements that may not meet
 * the minimum touch target size of 44x44px (WCAG 2.1 Level AAA).
 * 
 * Usage:
 *   npm run check:touch-targets
 *   tsx scripts/check-touch-target-violations.ts
 *   tsx scripts/check-touch-target-violations.ts --fix
 *   tsx scripts/check-touch-target-violations.ts --json > report.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const MIN_TOUCH_TARGET_SIZE = 44; // pixels
const RECOMMENDED_SIZE = 48; // pixels

interface TouchTargetViolation {
  file: string;
  line: number;
  column: number;
  element: string;
  issue: string;
  currentSize?: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
  autoFixable: boolean;
}

interface ScanResult {
  violations: TouchTargetViolation[];
  compliantFiles: string[];
  totalFiles: number;
  complianceRate: number;
}

/**
 * Scans a file for touch target violations
 */
function scanFile(filePath: string): TouchTargetViolation[] {
  const violations: TouchTargetViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Check for buttons with small padding
    if (/<button[^>]*className="[^"]*\b(p-0|p-1|py-0|py-1|px-0|px-1)\b[^"]*"/.test(line)) {
      const match = line.match(/<button/);
      if (match && !line.includes('touch-target')) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index! + 1,
          element: 'button',
          issue: 'Button has minimal padding (may be too small for touch)',
          currentSize: line.match(/\b(p-\d+|py-\d+|px-\d+)\b/)?.[0],
          suggestion: 'Add min-h-11 min-w-11 or use touch-target-md class',
          severity: 'warning',
          autoFixable: true
        });
      }
    }

    // Check for icon buttons without sizing
    if (/<button[^>]*>[\s\n]*<(?:svg|Icon|[A-Z]\w*Icon)/.test(line)) {
      const match = line.match(/<button/);
      const hasSizing = /\b(w-\d+|h-\d+|min-w-\d+|min-h-\d+|touch-target)\b/.test(line);
      
      if (match && !hasSizing) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index! + 1,
          element: 'icon button',
          issue: 'Icon button without explicit sizing',
          suggestion: 'Add touch-target-md class or min-h-11 min-w-11 p-2',
          severity: 'error',
          autoFixable: true
        });
      }
    }

    // Check for small explicit sizes
    const sizeMatch = line.match(/<(button|a|input)[^>]*className="[^"]*\b(w-(\d+)|h-(\d+))\b[^"]*"/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[3] || sizeMatch[4]) * 4; // Tailwind scale
      if (size < MIN_TOUCH_TARGET_SIZE) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: sizeMatch.index! + 1,
          element: sizeMatch[1],
          issue: `Explicit size (${size}px) below minimum (${MIN_TOUCH_TARGET_SIZE}px)`,
          currentSize: sizeMatch[2],
          suggestion: `Use w-11 h-11 (44px) or w-12 h-12 (48px)`,
          severity: 'error',
          autoFixable: true
        });
      }
    }

    // Check for checkboxes/radios without proper sizing
    if (/<input[^>]*type="(?:checkbox|radio)"/.test(line)) {
      const hasSizing = /\b(w-\d+|h-\d+)\b/.test(line);
      const match = line.match(/<input/);
      
      if (match && !hasSizing) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index! + 1,
          element: 'checkbox/radio',
          issue: 'Checkbox/radio without explicit sizing',
          suggestion: 'Add w-5 h-5 class (20px) and ensure parent label has adequate padding',
          severity: 'warning',
          autoFixable: true
        });
      }
    }

    // Check for links with small text
    if (/<a[^>]*className="[^"]*\btext-(xs|sm)\b[^"]*"/.test(line)) {
      const match = line.match(/<a/);
      const hasMinHeight = /\bmin-h-\d+\b/.test(line);
      
      if (match && !hasMinHeight) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index! + 1,
          element: 'link',
          issue: 'Link with small text may not meet touch target size',
          currentSize: 'text-xs or text-sm',
          suggestion: 'Add inline-block min-h-11 py-2 or increase text size',
          severity: 'info',
          autoFixable: false
        });
      }
    }

    // Check for custom components with small size prop
    if (/<(?:Button|IconButton)[^>]*size="(?:xs|sm|small)"/.test(line)) {
      const match = line.match(/<(?:Button|IconButton)/);
      if (match) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index! + 1,
          element: 'component',
          issue: 'Component using small size variant',
          currentSize: 'xs/sm/small',
          suggestion: 'Use size="md" or ensure component meets 44px minimum',
          severity: 'warning',
          autoFixable: false
        });
      }
    }
  });

  return violations;
}

/**
 * Scans all files and generates report
 */
async function scanAllFiles(): Promise<ScanResult> {
  const files = await glob('**/*.{tsx,jsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      '**/*.test.{tsx,jsx}',
      '**/*.spec.{tsx,jsx}'
    ]
  });

  const allViolations: TouchTargetViolation[] = [];
  const compliantFiles: string[] = [];

  files.forEach(file => {
    const violations = scanFile(file);
    if (violations.length === 0) {
      compliantFiles.push(file);
    } else {
      allViolations.push(...violations);
    }
  });

  return {
    violations: allViolations,
    compliantFiles,
    totalFiles: files.length,
    complianceRate: (compliantFiles.length / files.length) * 100
  };
}

/**
 * Prints human-readable report
 */
function printReport(result: ScanResult) {
  console.log('\n📱 Touch Target Size Compliance Report');
  console.log('======================================\n');
  console.log(`Total Files: ${result.totalFiles}`);
  console.log(`Compliant: ${result.compliantFiles.length}`);
  console.log(`With Violations: ${result.totalFiles - result.compliantFiles.length}`);
  console.log(`Compliance Rate: ${result.complianceRate.toFixed(1)}%\n`);

  if (result.violations.length === 0) {
    console.log('✅ No violations found! All interactive elements meet touch target requirements.\n');
    return;
  }

  // Group by severity
  const errors = result.violations.filter(v => v.severity === 'error');
  const warnings = result.violations.filter(v => v.severity === 'warning');
  const info = result.violations.filter(v => v.severity === 'info');

  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`ℹ️  Info: ${info.length}\n`);

  // Group by file
  const byFile = result.violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, TouchTargetViolation[]>);

  console.log('Violations by File:\n');
  Object.entries(byFile)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 20) // Show top 20
    .forEach(([file, violations]) => {
      console.log(`\n📄 ${file} (${violations.length} violation${violations.length > 1 ? 's' : ''})`);
      violations.forEach(v => {
        const icon = v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} Line ${v.line}:${v.column} - ${v.element}`);
        console.log(`      ${v.issue}`);
        if (v.currentSize) {
          console.log(`      Current: ${v.currentSize}`);
        }
        console.log(`      Fix: ${v.suggestion}`);
        if (v.autoFixable) {
          console.log(`      🔧 Auto-fixable`);
        }
      });
    });

  console.log('\n\n💡 Quick Fixes:\n');
  console.log('1. Add touch-target utilities to responsive-utilities.css:');
  console.log('   .touch-target-sm { min-width: 44px; min-height: 44px; }');
  console.log('   .touch-target-md { min-width: 48px; min-height: 48px; }');
  console.log('   .touch-target-lg { min-width: 56px; min-height: 56px; }\n');
  console.log('2. For icon buttons: <button className="touch-target-md p-2">');
  console.log('3. For text buttons: <button className="min-h-11 px-4 py-2">');
  console.log('4. For checkboxes: <input type="checkbox" className="w-5 h-5" />\n');

  const autoFixable = result.violations.filter(v => v.autoFixable).length;
  if (autoFixable > 0) {
    console.log(`\n🔧 ${autoFixable} violations are auto-fixable. Run with --fix flag (coming soon).\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const fixMode = args.includes('--fix');

  if (fixMode) {
    console.log('⚠️  Auto-fix mode is not yet implemented. Manual fixes required.\n');
  }

  const result = await scanAllFiles();

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printReport(result);
  }

  // Exit with error code if violations found (for CI/CD)
  if (process.env.CI && result.violations.filter(v => v.severity === 'error').length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
