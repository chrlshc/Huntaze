#!/usr/bin/env tsx
/**
 * Touch Target Audit Script
 * 
 * Audits all interactive elements to ensure they meet the 44px × 44px minimum
 * touch target size requirement for mobile accessibility.
 * 
 * Requirements: 10.1
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TouchTargetIssue {
  file: string;
  line: number;
  element: string;
  issue: string;
  suggestion: string;
}

interface AuditResult {
  totalElements: number;
  issuesFound: TouchTargetIssue[];
  filesScanned: number;
}

const MINIMUM_TOUCH_TARGET = 44; // pixels

// Patterns for interactive elements that need touch targets
const INTERACTIVE_PATTERNS = [
  /className=["'][^"']*\b(button|btn|link|input|select|textarea)\b[^"']*["']/gi,
  /<button/gi,
  /<input/gi,
  /<select/gi,
  /<textarea/gi,
  /<a\s+/gi,
];

// Patterns that indicate proper touch target sizing
const PROPER_SIZING_PATTERNS = [
  /min-h-\[44px\]/,
  /min-h-11/, // 44px in Tailwind
  /h-11/,
  /h-12/,
  /h-14/,
  /py-3/,
  /py-4/,
  /py-5/,
  /p-3/,
  /p-4/,
  /p-5/,
];

async function findComponentFiles(): Promise<string[]> {
  const patterns = [
    'components/**/*.tsx',
    'app/**/*.tsx',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { 
      ignore: ['node_modules/**', '**/*.test.tsx', '**/*.spec.tsx'] 
    });
    files.push(...matches);
  }

  return files;
}

function hasProperTouchTarget(line: string): boolean {
  return PROPER_SIZING_PATTERNS.some(pattern => pattern.test(line));
}

function analyzeFile(content: string, filePath: string): TouchTargetIssue[] {
  const lines = content.split('\n');
  const issues: TouchTargetIssue[] = [];

  lines.forEach((line, index) => {
    // Check if line contains an interactive element
    const hasInteractive = INTERACTIVE_PATTERNS.some(pattern => {
      pattern.lastIndex = 0; // Reset regex
      return pattern.test(line);
    });

    if (hasInteractive && !hasProperTouchTarget(line)) {
      // Check surrounding lines for sizing
      const contextStart = Math.max(0, index - 2);
      const contextEnd = Math.min(lines.length, index + 3);
      const context = lines.slice(contextStart, contextEnd).join('\n');

      if (!hasProperTouchTarget(context)) {
        issues.push({
          file: filePath,
          line: index + 1,
          element: line.trim().substring(0, 80),
          issue: 'Interactive element may not meet 44px minimum touch target',
          suggestion: 'Add min-h-11 (44px) or py-3/py-4 classes, or ensure parent has proper sizing',
        });
      }
    }
  });

  return issues;
}

async function auditTouchTargets(): Promise<AuditResult> {
  const files = await findComponentFiles();
  const result: AuditResult = {
    totalElements: 0,
    issuesFound: [],
    filesScanned: files.length,
  };

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const issues = analyzeFile(content, file);
    
    result.issuesFound.push(...issues);
    
    // Count interactive elements
    INTERACTIVE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) result.totalElements += matches.length;
    });
  }

  return result;
}

function generateReport(result: AuditResult): string {
  let report = '# Touch Target Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += '## Summary\n\n';
  report += `- Files scanned: ${result.filesScanned}\n`;
  report += `- Interactive elements found: ${result.totalElements}\n`;
  report += `- Potential issues: ${result.issuesFound.length}\n`;
  
  const complianceRate = result.totalElements > 0
    ? ((result.totalElements - result.issuesFound.length) / result.totalElements * 100).toFixed(1)
    : 100;
  report += `- Estimated compliance: ${complianceRate}%\n\n`;
  
  report += '## Requirements\n\n';
  report += `- Minimum touch target size: ${MINIMUM_TOUCH_TARGET}px × ${MINIMUM_TOUCH_TARGET}px\n`;
  report += '- Applies to: buttons, links, inputs, selects, textareas\n';
  report += '- Standard: WCAG 2.1 Level AAA (2.5.5 Target Size)\n\n';
  
  if (result.issuesFound.length > 0) {
    report += '## Potential Issues\n\n';
    
    // Group by file
    const byFile = new Map<string, TouchTargetIssue[]>();
    result.issuesFound.forEach(issue => {
      if (!byFile.has(issue.file)) {
        byFile.set(issue.file, []);
      }
      byFile.get(issue.file)!.push(issue);
    });
    
    Array.from(byFile.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([file, issues]) => {
        report += `### ${file}\n\n`;
        issues.forEach(issue => {
          report += `**Line ${issue.line}:**\n`;
          report += `- Element: \`${issue.element}\`\n`;
          report += `- Issue: ${issue.issue}\n`;
          report += `- Suggestion: ${issue.suggestion}\n\n`;
        });
      });
  } else {
    report += '## ✅ No Issues Found\n\n';
    report += 'All interactive elements appear to meet the minimum touch target size requirement.\n\n';
  }
  
  report += '## Recommendations\n\n';
  report += '1. Use Tailwind classes for consistent sizing:\n';
  report += '   - `min-h-11` (44px height)\n';
  report += '   - `py-3` or `py-4` (vertical padding)\n';
  report += '   - `px-4` or `px-6` (horizontal padding)\n\n';
  report += '2. For buttons, use the Button component with proper sizing\n';
  report += '3. For inputs, ensure parent containers have adequate padding\n';
  report += '4. Test on real mobile devices to verify touch targets\n\n';
  
  return report;
}

async function main() {
  console.log('🔍 Auditing touch targets for mobile accessibility...\n');
  
  const result = await auditTouchTargets();
  const report = generateReport(result);
  
  // Write report to file
  const reportPath = path.join(
    process.cwd(),
    '.kiro/specs/signup-ux-optimization/TOUCH_TARGET_AUDIT_REPORT.md'
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  
  console.log('✅ Audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Files scanned: ${result.filesScanned}`);
  console.log(`   - Interactive elements: ${result.totalElements}`);
  console.log(`   - Potential issues: ${result.issuesFound.length}`);
  
  const complianceRate = result.totalElements > 0
    ? ((result.totalElements - result.issuesFound.length) / result.totalElements * 100).toFixed(1)
    : 100;
  console.log(`   - Estimated compliance: ${complianceRate}%`);
  console.log(`\n📄 Full report: ${reportPath}\n`);
  
  if (result.issuesFound.length > 0) {
    console.log('⚠️  Potential Issues Found:');
    result.issuesFound.slice(0, 5).forEach(issue => {
      console.log(`   - ${issue.file}:${issue.line}`);
    });
    if (result.issuesFound.length > 5) {
      console.log(`   ... and ${result.issuesFound.length - 5} more (see report)`);
    }
  } else {
    console.log('✅ No issues found! All touch targets appear compliant.');
  }
}

main().catch(console.error);
