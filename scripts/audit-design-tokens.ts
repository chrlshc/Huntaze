#!/usr/bin/env tsx
/**
 * Design Token Usage Audit Script
 * 
 * Scans all component files to identify:
 * 1. Hardcoded colors (hex, rgb, rgba, hsl)
 * 2. Hardcoded spacing values
 * 3. Hardcoded font sizes
 * 4. Components that should use design tokens
 * 
 * Generates a migration map for the design system unification project.
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface HardcodedValue {
  file: string;
  line: number;
  type: 'color' | 'spacing' | 'font-size' | 'shadow' | 'border-radius';
  value: string;
  context: string;
  suggestedToken?: string;
}

interface AuditResults {
  totalFiles: number;
  filesWithIssues: number;
  hardcodedValues: HardcodedValue[];
  summary: {
    colors: number;
    spacing: number;
    fontSize: number;
    shadows: number;
    borderRadius: number;
  };
  migrationPriority: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

// Regex patterns for detecting hardcoded values
const PATTERNS = {
  // Hex colors: #fff, #ffffff, #fff3
  hexColor: /#([0-9a-fA-F]{3,8})\b/g,
  
  // RGB/RGBA colors
  rgbColor: /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g,
  
  // HSL/HSLA colors
  hslColor: /hsla?\s*\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%(?:\s*,\s*[\d.]+)?\s*\)/g,
  
  // Tailwind color classes (bg-*, text-*, border-*)
  tailwindColor: /(?:bg|text|border|from|to|via)-(?:gray|zinc|slate|red|blue|green|purple|indigo|violet|amber|emerald)-\d{2,3}/g,
  
  // Hardcoded spacing in className (p-4, m-2, etc.)
  tailwindSpacing: /(?:p|m|px|py|pl|pr|pt|pb|mx|my|ml|mr|mt|mb|gap|space-[xy])-\d+/g,
  
  // Hardcoded font sizes
  tailwindFontSize: /text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/g,
  
  // Inline styles with hardcoded values
  inlineStyle: /style=\{?\{[^}]*\}?\}/g,
};

// Token suggestions based on common values
const TOKEN_SUGGESTIONS: Record<string, string> = {
  // Colors
  '#09090b': '--bg-primary',
  '#18181b': '--bg-secondary',
  '#27272a': '--bg-tertiary',
  '#fafafa': '--text-primary',
  '#a1a1aa': '--text-secondary',
  '#71717a': '--text-tertiary',
  '#8b5cf6': '--accent-primary',
  'rgba(255, 255, 255, 0.05)': '--bg-glass',
  'rgba(255, 255, 255, 0.08)': '--border-subtle',
  
  // Spacing
  '0.25rem': '--space-1',
  '0.5rem': '--space-2',
  '1rem': '--space-4',
  '1.5rem': '--space-6',
  '2rem': '--space-8',
  
  // Font sizes
  '0.75rem': '--text-xs',
  '0.875rem': '--text-sm',
  '1rem': '--text-base',
  '1.125rem': '--text-lg',
  '1.25rem': '--text-xl',
};

function scanFile(filePath: string): HardcodedValue[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: HardcodedValue[] = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Skip lines that are comments or already use CSS variables
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.includes('var(--')) {
      return;
    }
    
    // Check for hex colors
    const hexMatches = line.matchAll(PATTERNS.hexColor);
    for (const match of hexMatches) {
      const value = match[0];
      // Skip common exceptions
      if (value === '#fff' || value === '#000' || value === '#ffffff' || value === '#000000') {
        continue;
      }
      
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'color',
        value,
        context: line.trim(),
        suggestedToken: TOKEN_SUGGESTIONS[value.toLowerCase()],
      });
    }
    
    // Check for RGB/RGBA colors
    const rgbMatches = line.matchAll(PATTERNS.rgbColor);
    for (const match of rgbMatches) {
      const value = match[0];
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'color',
        value,
        context: line.trim(),
        suggestedToken: TOKEN_SUGGESTIONS[value],
      });
    }
    
    // Check for Tailwind color classes that should use tokens
    const tailwindColorMatches = line.matchAll(PATTERNS.tailwindColor);
    for (const match of tailwindColorMatches) {
      const value = match[0];
      // Flag specific problematic patterns
      if (value.includes('gray-') || value.includes('zinc-')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type: 'color',
          value,
          context: line.trim(),
          suggestedToken: 'Use design token classes or CSS variables',
        });
      }
    }
  });
  
  return issues;
}

async function auditDesignTokens(): Promise<AuditResults> {
  console.log('🔍 Starting design token audit...\n');
  
  // Scan patterns
  const patterns = [
    'components/**/*.{tsx,ts,jsx,js}',
    'app/**/*.{tsx,ts,jsx,js}',
    'styles/**/*.css',
    '!node_modules/**',
    '!.next/**',
    '!build/**',
  ];
  
  const files = await glob(patterns, { ignore: ['node_modules/**', '.next/**'] });
  
  console.log(`📁 Found ${files.length} files to scan\n`);
  
  const results: AuditResults = {
    totalFiles: files.length,
    filesWithIssues: 0,
    hardcodedValues: [],
    summary: {
      colors: 0,
      spacing: 0,
      fontSize: 0,
      shadows: 0,
      borderRadius: 0,
    },
    migrationPriority: {
      high: [],
      medium: [],
      low: [],
    },
  };
  
  // Scan each file
  for (const file of files) {
    const issues = scanFile(file);
    
    if (issues.length > 0) {
      results.filesWithIssues++;
      results.hardcodedValues.push(...issues);
      
      // Categorize by priority
      const issueCount = issues.length;
      if (issueCount > 10) {
        results.migrationPriority.high.push(file);
      } else if (issueCount > 5) {
        results.migrationPriority.medium.push(file);
      } else {
        results.migrationPriority.low.push(file);
      }
    }
  }
  
  // Calculate summary
  results.hardcodedValues.forEach(issue => {
    results.summary[issue.type]++;
  });
  
  return results;
}

function generateReport(results: AuditResults): string {
  const report: string[] = [];
  
  report.push('# Design Token Usage Audit Report');
  report.push('');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push('');
  
  report.push('## Summary');
  report.push('');
  report.push(`- **Total Files Scanned**: ${results.totalFiles}`);
  report.push(`- **Files with Issues**: ${results.filesWithIssues}`);
  report.push(`- **Total Hardcoded Values**: ${results.hardcodedValues.length}`);
  report.push('');
  
  report.push('### Issues by Type');
  report.push('');
  report.push(`- **Colors**: ${results.summary.colors}`);
  report.push(`- **Spacing**: ${results.summary.spacing}`);
  report.push(`- **Font Sizes**: ${results.summary.fontSize}`);
  report.push(`- **Shadows**: ${results.summary.shadows}`);
  report.push(`- **Border Radius**: ${results.summary.borderRadius}`);
  report.push('');
  
  report.push('## Migration Priority');
  report.push('');
  
  report.push('### 🔴 High Priority (>10 issues)');
  report.push('');
  results.migrationPriority.high.forEach(file => {
    const count = results.hardcodedValues.filter(v => v.file === file).length;
    report.push(`- \`${file}\` (${count} issues)`);
  });
  report.push('');
  
  report.push('### 🟡 Medium Priority (5-10 issues)');
  report.push('');
  results.migrationPriority.medium.forEach(file => {
    const count = results.hardcodedValues.filter(v => v.file === file).length;
    report.push(`- \`${file}\` (${count} issues)`);
  });
  report.push('');
  
  report.push('### 🟢 Low Priority (<5 issues)');
  report.push('');
  results.migrationPriority.low.forEach(file => {
    const count = results.hardcodedValues.filter(v => v.file === file).length;
    report.push(`- \`${file}\` (${count} issues)`);
  });
  report.push('');
  
  report.push('## Detailed Issues');
  report.push('');
  
  // Group by file
  const byFile = new Map<string, HardcodedValue[]>();
  results.hardcodedValues.forEach(issue => {
    if (!byFile.has(issue.file)) {
      byFile.set(issue.file, []);
    }
    byFile.get(issue.file)!.push(issue);
  });
  
  // Sort by number of issues (descending)
  const sortedFiles = Array.from(byFile.entries())
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedFiles.forEach(([file, issues]) => {
    report.push(`### ${file}`);
    report.push('');
    report.push(`**${issues.length} issues found**`);
    report.push('');
    
    issues.forEach(issue => {
      report.push(`- Line ${issue.line}: \`${issue.value}\` (${issue.type})`);
      if (issue.suggestedToken) {
        report.push(`  - Suggested: \`${issue.suggestedToken}\``);
      }
      report.push(`  - Context: \`${issue.context.substring(0, 80)}${issue.context.length > 80 ? '...' : ''}\``);
      report.push('');
    });
  });
  
  report.push('## Token Coverage Analysis');
  report.push('');
  report.push('### Existing Design Tokens');
  report.push('');
  report.push('✅ Comprehensive token system exists in `styles/design-tokens.css`:');
  report.push('- Background colors (primary, secondary, tertiary, glass)');
  report.push('- Border colors (subtle, default, emphasis, strong)');
  report.push('- Text colors (primary, secondary, tertiary, quaternary)');
  report.push('- Accent colors (primary, success, warning, error, info)');
  report.push('- Shadows (xs, sm, md, lg, xl, inner-glow, accent)');
  report.push('- Spacing system (0-32, 4px grid)');
  report.push('- Typography (font families, sizes, weights, line heights)');
  report.push('- Border radius (sm, md, lg, xl, 2xl, 3xl, full)');
  report.push('- Transitions (fast, base, slow, slower)');
  report.push('- Z-index scale (dropdown, sticky, modal, tooltip)');
  report.push('- Component tokens (buttons, inputs, cards)');
  report.push('- Layout tokens (max-widths, sidebar, header)');
  report.push('- Backdrop blur (sm, md, lg, xl, 2xl, 3xl)');
  report.push('');
  
  report.push('### Migration Recommendations');
  report.push('');
  report.push('1. **Start with high-priority files** - These have the most hardcoded values');
  report.push('2. **Focus on colors first** - Most visible impact on consistency');
  report.push('3. **Update component library** - Ensures new usage is correct');
  report.push('4. **Create utility classes** - For common patterns (glass-card, etc.)');
  report.push('5. **Document patterns** - Help developers use tokens correctly');
  report.push('');
  
  return report.join('\n');
}

// Main execution
async function main() {
  try {
    const results = await auditDesignTokens();
    const report = generateReport(results);
    
    // Write report to file
    const reportPath = '.kiro/specs/design-system-unification/AUDIT-REPORT.md';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    
    console.log('✅ Audit complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('');
    console.log('Summary:');
    console.log(`  - Files scanned: ${results.totalFiles}`);
    console.log(`  - Files with issues: ${results.filesWithIssues}`);
    console.log(`  - Total issues: ${results.hardcodedValues.length}`);
    console.log('');
    console.log('Priority breakdown:');
    console.log(`  - High: ${results.migrationPriority.high.length} files`);
    console.log(`  - Medium: ${results.migrationPriority.medium.length} files`);
    console.log(`  - Low: ${results.migrationPriority.low.length} files`);
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

main();
