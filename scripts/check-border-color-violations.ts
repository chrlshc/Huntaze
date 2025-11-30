#!/usr/bin/env tsx

/**
 * Border Color Violations Checker
 * 
 * This script scans the codebase for border color violations and generates
 * a detailed report with actionable recommendations.
 * 
 * Usage:
 *   npm run check:border-violations
 *   or
 *   tsx scripts/check-border-color-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface BorderViolation {
  file: string;
  line: number;
  content: string;
  issue: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
}

interface ViolationReport {
  totalFiles: number;
  filesWithViolations: number;
  totalViolations: number;
  violations: BorderViolation[];
  summary: {
    high: number;
    medium: number;
    low: number;
  };
}

// Approved border color patterns
const APPROVED_PATTERNS = [
  /border-\[var\(--border-subtle\)\]/,
  /var\(--border-subtle\)/,
  /className="[^"]*border-subtle[^"]*"/,
  /border:\s*[^;]*var\(--border-subtle\)/,
  /borderColor:\s*['"]var\(--border-subtle\)['"]/,
  /border:\s*none/i,
  /border:\s*0/,
];

// Violation patterns with severity
const VIOLATION_PATTERNS = [
  {
    pattern: /border-(?:gray|zinc|slate|neutral|stone)-\d+/,
    name: 'Tailwind gray-scale border',
    suggestion: 'Replace with border-subtle or var(--border-subtle)',
    severity: 'high' as const,
  },
  {
    pattern: /border-white(?!\/\[0\.08\])/,
    name: 'border-white without opacity',
    suggestion: 'Replace with border-subtle or border-white/[0.08]',
    severity: 'medium' as const,
  },
  {
    pattern: /border-\[#[0-9a-fA-F]{3,8}\]/,
    name: 'Hardcoded hex border color',
    suggestion: 'Replace with var(--border-subtle)',
    severity: 'high' as const,
  },
  {
    pattern: /border-\[rgba?\([^)]+\)\]/,
    name: 'Hardcoded rgb border color',
    suggestion: 'Replace with var(--border-subtle)',
    severity: 'high' as const,
  },
  {
    pattern: /border-color:\s*#[0-9a-fA-F]{3,8}/,
    name: 'CSS hardcoded hex border-color',
    suggestion: 'Replace with border-color: var(--border-subtle)',
    severity: 'high' as const,
  },
  {
    pattern: /border-color:\s*rgba?\([^)]+\)/,
    name: 'CSS hardcoded rgb border-color',
    suggestion: 'Replace with border-color: var(--border-subtle)',
    severity: 'high' as const,
  },
  {
    pattern: /borderColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/,
    name: 'React hardcoded hex borderColor',
    suggestion: 'Replace with borderColor: "var(--border-subtle)"',
    severity: 'high' as const,
  },
  {
    pattern: /borderColor:\s*['"]rgba?\([^)]+\)['"]/,
    name: 'React hardcoded rgb borderColor',
    suggestion: 'Replace with borderColor: "var(--border-subtle)"',
    severity: 'high' as const,
  },
  {
    pattern: /border-black/,
    name: 'border-black',
    suggestion: 'Replace with border-subtle for consistency',
    severity: 'low' as const,
  },
];

const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/design-tokens.css',
  '**/vitest.config*.ts',
  '**/next.config*.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

function findBorderViolations(filePath: string, content: string): BorderViolation[] {
  const violations: BorderViolation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Skip comments and imports
    if (
      trimmedLine.startsWith('//') ||
      trimmedLine.startsWith('/*') ||
      trimmedLine.startsWith('*') ||
      trimmedLine.startsWith('import')
    ) {
      return;
    }

    // Check if line has an approved pattern
    const hasApprovedPattern = APPROVED_PATTERNS.some((pattern) => pattern.test(line));

    if (hasApprovedPattern) {
      return;
    }

    // Check for violation patterns
    for (const { pattern, name, suggestion, severity } of VIOLATION_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: trimmedLine,
          issue: name,
          suggestion,
          severity,
        });
      }
    }
  });

  return violations;
}

async function scanForViolations(): Promise<ViolationReport> {
  const files = await glob('**/*.{tsx,ts,css,jsx,js}', {
    ignore: EXCLUDED_PATTERNS,
    cwd: process.cwd(),
    absolute: true,
  });

  const report: ViolationReport = {
    totalFiles: files.length,
    filesWithViolations: 0,
    totalViolations: 0,
    violations: [],
    summary: {
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(process.cwd(), file);
      const violations = findBorderViolations(relativePath, content);

      if (violations.length > 0) {
        report.violations.push(...violations);
        report.filesWithViolations++;
        report.totalViolations += violations.length;

        violations.forEach((v) => {
          report.summary[v.severity]++;
        });
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return report;
}

function printReport(report: ViolationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('BORDER COLOR CONSISTENCY REPORT');
  console.log('='.repeat(80));
  console.log('');
  console.log(`📊 Scan Results:`);
  console.log(`   Total files scanned: ${report.totalFiles}`);
  console.log(`   Files with violations: ${report.filesWithViolations}`);
  console.log(`   Total violations: ${report.totalViolations}`);
  console.log('');
  console.log(`📈 Violations by Severity:`);
  console.log(`   🔴 High:   ${report.summary.high}`);
  console.log(`   🟡 Medium: ${report.summary.medium}`);
  console.log(`   🟢 Low:    ${report.summary.low}`);
  console.log('');

  if (report.violations.length === 0) {
    console.log('✅ No border color violations found!');
    console.log('   All border colors use the standardized --border-subtle token.');
    console.log('');
    return;
  }

  // Group violations by severity
  const bySeverity = {
    high: report.violations.filter((v) => v.severity === 'high'),
    medium: report.violations.filter((v) => v.severity === 'medium'),
    low: report.violations.filter((v) => v.severity === 'low'),
  };

  // Print high severity violations
  if (bySeverity.high.length > 0) {
    console.log('-'.repeat(80));
    console.log(`🔴 HIGH SEVERITY VIOLATIONS (${bySeverity.high.length})`);
    console.log('-'.repeat(80));
    console.log('');

    const byFile = groupByFile(bySeverity.high);
    printViolationsByFile(byFile, 5);
  }

  // Print medium severity violations
  if (bySeverity.medium.length > 0) {
    console.log('-'.repeat(80));
    console.log(`🟡 MEDIUM SEVERITY VIOLATIONS (${bySeverity.medium.length})`);
    console.log('-'.repeat(80));
    console.log('');

    const byFile = groupByFile(bySeverity.medium);
    printViolationsByFile(byFile, 3);
  }

  // Print low severity violations
  if (bySeverity.low.length > 0) {
    console.log('-'.repeat(80));
    console.log(`🟢 LOW SEVERITY VIOLATIONS (${bySeverity.low.length})`);
    console.log('-'.repeat(80));
    console.log('');

    const byFile = groupByFile(bySeverity.low);
    printViolationsByFile(byFile, 2);
  }

  // Print recommendations
  console.log('='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. Replace Tailwind border colors:');
  console.log('   ❌ className="border border-gray-700"');
  console.log('   ✅ className="border border-subtle"');
  console.log('');
  console.log('2. Replace CSS border-color:');
  console.log('   ❌ border-color: #ffffff20;');
  console.log('   ✅ border-color: var(--border-subtle);');
  console.log('');
  console.log('3. Replace React inline styles:');
  console.log('   ❌ style={{ borderColor: "#ffffff20" }}');
  console.log('   ✅ style={{ borderColor: "var(--border-subtle)" }}');
  console.log('');
  console.log('4. For Tailwind arbitrary values:');
  console.log('   ❌ className="border border-[#ffffff20]"');
  console.log('   ✅ className="border border-[var(--border-subtle)]"');
  console.log('');
  console.log('📚 Design Token Reference:');
  console.log('   --border-subtle is defined in styles/design-tokens.css');
  console.log('   Default value: rgba(255, 255, 255, 0.08)');
  console.log('');
}

function groupByFile(violations: BorderViolation[]): Record<string, BorderViolation[]> {
  return violations.reduce((acc, v) => {
    if (!acc[v.file]) {
      acc[v.file] = [];
    }
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, BorderViolation[]>);
}

function printViolationsByFile(
  violationsByFile: Record<string, BorderViolation[]>,
  maxFilesToShow: number
): void {
  const files = Object.keys(violationsByFile).slice(0, maxFilesToShow);

  files.forEach((file) => {
    const fileViolations = violationsByFile[file];
    console.log(`📄 ${file} (${fileViolations.length} violations)`);

    fileViolations.slice(0, 3).forEach((v) => {
      console.log(`   Line ${v.line}: ${v.issue}`);
      console.log(`   ${v.content.substring(0, 80)}${v.content.length > 80 ? '...' : ''}`);
      console.log(`   💡 ${v.suggestion}`);
      console.log('');
    });

    if (fileViolations.length > 3) {
      console.log(`   ... and ${fileViolations.length - 3} more violations`);
      console.log('');
    }
  });

  const remainingFiles = Object.keys(violationsByFile).length - maxFilesToShow;
  if (remainingFiles > 0) {
    console.log(`... and ${remainingFiles} more files with violations`);
    console.log('');
  }
}

// Main execution
async function main() {
  console.log('🔍 Scanning codebase for border color violations...\n');

  const report = await scanForViolations();
  printReport(report);

  // Exit with error code if violations found
  if (report.totalViolations > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running border color check:', error);
  process.exit(1);
});
