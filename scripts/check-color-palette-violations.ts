#!/usr/bin/env tsx

/**
 * Color Palette Violation Scanner
 * 
 * Scans the codebase for colors that don't match the approved design token palette.
 * Provides detailed reporting and suggestions for fixes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Approved color palette from design-tokens.css
const APPROVED_COLORS = {
  backgrounds: [
    '#09090b', '#18181b', '#27272a', '#18181a', '#1a1a1c', '#1e1f24',
  ],
  text: [
    '#fafafa', '#f8f9fa', '#f1f1f1', '#e2e8f0', '#ededed', '#e0e0e0',
    '#a1a1aa', '#a0aec0', '#94a3b8', '#8a8f98', '#71717a', '#52525b',
    '#374151', '#3a3a3a', 'rgb(48,48,48)',
  ],
  accents: [
    '#8b5cf6', '#7c3aed', '#6d28d9', '#7d57c1', '#8e65d4', '#5e6ad2',
    '#5533cc', '#6B46FF', '#4b2bb3', '#DB2777', '#10b981', '#047857',
    '#065F46', '#9be2bf', '#D1FAE5', '#e8f8ee', '#f59e0b', '#ffd699',
    '#fff5e6', '#8a4b00', '#ef4444', '#ff6b6b', '#991B1B', '#ffb3b3',
    '#ffeaea', '#8a1f1f', '#3b82f6', '#45b7d1', '#4ecdc4', '#96ceb4',
    '#EDE9FE', '#F5F3FF',
  ],
  rgba: [
    // White with opacity
    'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.1)',
    'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.18)',
    'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.24)', 'rgba(255,255,255,0.3)',
    'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.6)',
    'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.8)',
    // Violet/purple
    'rgba(139,92,246,0.08)', 'rgba(139,92,246,0.1)', 'rgba(139,92,246,0.12)',
    'rgba(139,92,246,0.15)', 'rgba(139,92,246,0.18)', 'rgba(139,92,246,0.2)',
    'rgba(139,92,246,0.3)', 'rgba(139,92,246,0.4)', 'rgba(139,92,246,0.5)',
    'rgba(139,92,246,0.6)', 'rgba(125,87,193,0.1)', 'rgba(125,87,193,0.2)',
    'rgba(125,87,193,0.3)', 'rgba(125,87,193,0.4)', 'rgba(125,87,193,0.6)',
    // Blue
    'rgba(59,130,246,0.1)', 'rgba(59,130,246,0.2)', 'rgba(59,130,246,0.3)',
    'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.5)', 'rgba(59,130,246,0.9)',
    'rgba(99,102,241,0.1)',
    // Red/error
    'rgba(239,68,68,0.05)', 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.2)',
    'rgba(239,68,68,0.3)',
    // Green/success
    'rgba(16,185,129,0.1)', 'rgba(16,185,129,0.2)',
    // Amber/warning
    'rgba(245,158,11,0.1)', 'rgba(245,158,11,0.2)', 'rgba(251,191,36,0.4)',
    // Black
    'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.1)',
    'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)',
    'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)',
    // Gray
    'rgba(31,31,31,0.95)', 'rgba(26,26,26,0.07)', 'rgba(26,26,26,0.20)',
    'rgba(48,48,48,0.8)', 'rgba(48,48,48,0.85)', 'rgba(48,48,48,0.9)',
    // White variations
    'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.22)',
  ],
  special: [
    'transparent', 'currentColor', 'inherit', 'initial', 'unset', 'none',
    '#000', '#000000', 'black', '#fff', '#ffffff', 'white',
  ],
};

const APPROVED_TOKENS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-glass',
  '--bg-glass-hover', '--bg-glass-active', '--bg-input', '--bg-hover',
  '--bg-active', '--border-subtle', '--border-default', '--border-emphasis',
  '--border-strong', '--text-primary', '--text-secondary', '--text-tertiary',
  '--text-quaternary', '--text-inverse', '--accent-primary',
  '--accent-primary-hover', '--accent-primary-active', '--accent-success',
  '--accent-warning', '--accent-error', '--accent-info', '--accent-bg-subtle',
  '--accent-bg-muted', '--accent-bg-emphasis',
];

const ALL_APPROVED_COLORS = [
  ...APPROVED_COLORS.backgrounds,
  ...APPROVED_COLORS.text,
  ...APPROVED_COLORS.accents,
  ...APPROVED_COLORS.rgba,
  ...APPROVED_COLORS.special,
];

interface ColorViolation {
  file: string;
  line: number;
  color: string;
  context: string;
  suggestion?: string;
}

function normalizeColor(color: string): string {
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return color.replace(/\s+/g, '');
  }
  return color.toLowerCase();
}

function isApprovedColor(color: string): boolean {
  const normalized = normalizeColor(color);
  
  // Accept all CSS custom properties (design tokens)
  if (normalized.startsWith('var(--')) {
    return true;
  }
  
  return ALL_APPROVED_COLORS.some(approved => 
    normalizeColor(approved) === normalized
  );
}

function suggestToken(color: string): string | undefined {
  const normalized = normalizeColor(color);
  
  // Background suggestions
  if (normalized === '#09090b' || normalized === 'rgb(9,9,11)') return 'var(--bg-primary)';
  if (normalized === '#18181b' || normalized === 'rgb(24,24,27)') return 'var(--bg-secondary)';
  if (normalized === '#27272a' || normalized === 'rgb(39,39,42)') return 'var(--bg-tertiary)';
  
  // Text suggestions
  if (normalized === '#fafafa' || normalized === 'rgb(250,250,250)') return 'var(--text-primary)';
  if (normalized === '#a1a1aa' || normalized === 'rgb(161,161,170)') return 'var(--text-secondary)';
  
  // Accent suggestions
  if (normalized === '#8b5cf6' || normalized === 'rgb(139,92,246)') return 'var(--accent-primary)';
  if (normalized === '#10b981' || normalized === 'rgb(16,185,129)') return 'var(--accent-success)';
  if (normalized === '#ef4444' || normalized === 'rgb(239,68,68)') return 'var(--accent-error)';
  
  return undefined;
}

function extractColorsFromFile(content: string, isCSS: boolean): Array<{ color: string; line: number; context: string }> {
  const colors: Array<{ color: string; line: number; context: string }> = [];
  const lines = content.split('\n');
  
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rgbaPattern = /rgba?\([^)]+\)/g;
  const varPattern = /var\(--[a-z-]+\)/g;
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }
    
    if (!isCSS && !line.includes('style') && !line.includes('className') && 
        !line.includes('background') && !line.includes('color') && !line.includes('border')) {
      return;
    }
    
    let match;
    while ((match = hexPattern.exec(line)) !== null) {
      colors.push({ color: match[0], line: index + 1, context: line.trim() });
    }
    
    hexPattern.lastIndex = 0;
    while ((match = rgbaPattern.exec(line)) !== null) {
      colors.push({ color: match[0], line: index + 1, context: line.trim() });
    }
    
    rgbaPattern.lastIndex = 0;
    if (isCSS) {
      while ((match = varPattern.exec(line)) !== null) {
        colors.push({ color: match[0], line: index + 1, context: line.trim() });
      }
    }
  });
  
  return colors;
}

async function scanFiles() {
  console.log(chalk.blue.bold('\n🎨 Scanning for Color Palette Violations...\n'));
  
  const violations: ColorViolation[] = [];
  let filesScanned = 0;
  
  // Scan CSS files
  const cssFiles = await glob('**/*.css', {
    cwd: process.cwd(),
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'styles/design-tokens.css',
    ],
  });
  
  for (const file of cssFiles) {
    filesScanned++;
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const colors = extractColorsFromFile(content, true);
    
    for (const { color, line, context } of colors) {
      if (!isApprovedColor(color)) {
        violations.push({
          file,
          line,
          color,
          context,
          suggestion: suggestToken(color),
        });
      }
    }
  }
  
  // Scan TSX/TS files
  const tsxFiles = await glob('**/*.{tsx,ts}', {
    cwd: process.cwd(),
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'tests/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
  });
  
  for (const file of tsxFiles) {
    filesScanned++;
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const colors = extractColorsFromFile(content, false);
    
    for (const { color, line, context } of colors) {
      if (!isApprovedColor(color)) {
        violations.push({
          file,
          line,
          color,
          context,
          suggestion: suggestToken(color),
        });
      }
    }
  }
  
  // Report results
  console.log(chalk.gray(`📁 Files scanned: ${filesScanned}`));
  
  if (violations.length === 0) {
    console.log(chalk.green.bold('\n✅ No color palette violations found!'));
    console.log(chalk.green('All colors are using approved design tokens.\n'));
    return;
  }
  
  console.log(chalk.red.bold(`\n❌ Found ${violations.length} color palette violations:\n`));
  
  // Group by file
  const byFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, ColorViolation[]>);
  
  for (const [file, fileViolations] of Object.entries(byFile)) {
    console.log(chalk.yellow(`\n📄 ${file}`));
    
    for (const v of fileViolations) {
      console.log(chalk.gray(`   Line ${v.line}:`), chalk.red(v.color));
      console.log(chalk.gray(`   ${v.context.substring(0, 80)}${v.context.length > 80 ? '...' : ''}`));
      
      if (v.suggestion) {
        console.log(chalk.green(`   💡 Suggestion: ${v.suggestion}`));
      }
    }
  }
  
  console.log(chalk.blue.bold('\n📚 Design Token Reference:'));
  console.log(chalk.gray('   See styles/design-tokens.css for all available tokens'));
  console.log(chalk.gray('   Use var(--token-name) to reference design tokens\n'));
  
  process.exit(1);
}

scanFiles().catch(console.error);
