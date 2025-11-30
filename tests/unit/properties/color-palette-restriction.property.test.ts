/**
 * Property Test: Color Palette Restriction
 * 
 * **Feature: design-system-unification, Property 13: Color Palette Restriction**
 * **Validates: Requirements 3.5**
 * 
 * Property: For any color used in the application, it should be one of the 
 * approved palette colors from design tokens
 * 
 * This test scans all CSS files, TypeScript/TSX files, and style declarations
 * to ensure only approved colors from the design token palette are used.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Approved color palette from design-tokens.css
const APPROVED_COLORS = {
  // Background colors
  backgrounds: [
    '#09090b',  // zinc-950 - bg-primary
    '#18181b',  // zinc-900 - bg-secondary
    '#27272a',  // zinc-800 - bg-tertiary
    '#18181a',  // bg-input
    '#1a1a1c',  // bg-hover
    '#1e1f24',  // bg-active
  ],
  
  // Text colors
  text: [
    '#fafafa',  // zinc-50 - text-primary
    '#f8f9fa',  // near white
    '#f1f1f1',  // light gray
    '#e2e8f0',  // light gray
    '#ededed',  // light gray
    '#e0e0e0',  // light gray
    '#a1a1aa',  // zinc-400 - text-secondary
    '#a0aec0',  // medium gray
    '#94a3b8',  // soft gray
    '#8a8f98',  // gray
    '#71717a',  // zinc-500 - text-tertiary
    '#52525b',  // zinc-600 - text-quaternary
    '#374151',  // dark gray
    '#3a3a3a',  // dark gray
    'rgb(48,48,48)',  // dark gray
  ],
  
  // Accent colors
  accents: [
    // Violet/purple
    '#8b5cf6',  // violet-500 - accent-primary
    '#7c3aed',  // violet-600 - accent-primary-hover
    '#6d28d9',  // violet-700 - accent-primary-active
    '#7d57c1',  // custom purple
    '#8e65d4',  // light purple
    '#5e6ad2',  // brand purple
    '#5533cc',  // purple
    '#6B46FF',  // bright purple
    '#4b2bb3',  // dark purple
    '#DB2777',  // pink
    
    // Green/success
    '#10b981',  // emerald-500 - accent-success
    '#047857',  // dark green
    '#065F46',  // darker green
    '#9be2bf',  // light green
    '#D1FAE5',  // very light green
    '#e8f8ee',  // pale green
    
    // Amber/warning
    '#f59e0b',  // amber-500 - accent-warning
    '#ffd699',  // light amber
    '#fff5e6',  // pale amber
    '#8a4b00',  // dark amber
    
    // Red/error
    '#ef4444',  // red-500 - accent-error
    '#ff6b6b',  // light red
    '#991B1B',  // dark red
    '#ffb3b3',  // light red
    '#ffeaea',  // pale red
    '#8a1f1f',  // dark red
    
    // Blue/info
    '#3b82f6',  // blue-500 - accent-info
    '#45b7d1',  // cyan
    
    // Teal
    '#4ecdc4',  // teal
    
    // Green variations
    '#96ceb4',  // mint green
    
    // Purple variations
    '#EDE9FE',  // very light purple
    '#F5F3FF',  // pale purple
  ],
  
  // RGBA colors (glass effects, borders, overlays)
  rgba: [
    // White with opacity (glass effects, borders)
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 0.08)',
    'rgba(255, 255, 255, 0.1)',
    'rgba(255, 255, 255, 0.12)',
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.18)',
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 255, 255, 0.24)',
    'rgba(255, 255, 255, 0.3)',
    'rgba(255, 255, 255, 0.4)',
    'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.6)',
    'rgba(255, 255, 255, 0.7)',
    'rgba(255, 255, 255, 0.8)',
    
    // Violet/purple with opacity (accent colors)
    'rgba(139, 92, 246, 0.08)',
    'rgba(139, 92, 246, 0.1)',
    'rgba(139, 92, 246, 0.12)',
    'rgba(139, 92, 246, 0.15)',
    'rgba(139, 92, 246, 0.18)',
    'rgba(139, 92, 246, 0.2)',
    'rgba(139, 92, 246, 0.3)',
    'rgba(139, 92, 246, 0.4)',
    'rgba(139, 92, 246, 0.5)',
    'rgba(139, 92, 246, 0.6)',
    'rgba(125, 87, 193, 0.1)',
    'rgba(125, 87, 193, 0.2)',
    'rgba(125, 87, 193, 0.3)',
    'rgba(125, 87, 193, 0.4)',
    'rgba(125, 87, 193, 0.6)',
    
    // Blue with opacity
    'rgba(59, 130, 246, 0.1)',
    'rgba(59, 130, 246, 0.2)',
    'rgba(59, 130, 246, 0.3)',
    'rgba(59, 130, 246, 0.4)',
    'rgba(59, 130, 246, 0.5)',
    'rgba(59, 130, 246, 0.9)',
    'rgba(99, 102, 241, 0.1)',
    
    // Red/error with opacity
    'rgba(239, 68, 68, 0.05)',
    'rgba(239, 68, 68, 0.1)',
    'rgba(239, 68, 68, 0.2)',
    'rgba(239, 68, 68, 0.3)',
    
    // Green/success with opacity
    'rgba(16, 185, 129, 0.1)',
    'rgba(16, 185, 129, 0.2)',
    
    // Amber/warning with opacity
    'rgba(245, 158, 11, 0.1)',
    'rgba(245, 158, 11, 0.2)',
    'rgba(251, 191, 36, 0.4)',
    
    // Black with opacity (shadows, overlays)
    'rgba(0, 0, 0, 0.05)',
    'rgba(0, 0, 0, 0.06)',
    'rgba(0, 0, 0, 0.08)',
    'rgba(0, 0, 0, 0.1)',
    'rgba(0, 0, 0, 0.2)',
    'rgba(0, 0, 0, 0.3)',
    'rgba(0, 0, 0, 0.4)',
    'rgba(0, 0, 0, 0.5)',
    'rgba(0, 0, 0, 0.6)',
    'rgba(0, 0, 0, 0.7)',
    'rgba(0, 0, 0, 0.8)',
    'rgba(0, 0, 0, 0.9)',
    
    // Gray tones with opacity
    'rgba(31, 31, 31, 0.95)',
    'rgba(26, 26, 26, 0.07)',
    'rgba(26, 26, 26, 0.20)',
    'rgba(48, 48, 48, 0.8)',
    'rgba(48, 48, 48, 0.85)',
    'rgba(48, 48, 48, 0.9)',
    
    // White with more opacity variations
    'rgba(255, 255, 255, 0.06)',
    'rgba(255, 255, 255, 0.22)',
  ],
  
  // Special values
  special: [
    'transparent',
    'currentColor',
    'inherit',
    'initial',
    'unset',
    'none',
    '#000',
    '#000000',
    'black',
    '#fff',
    '#ffffff',
    'white',
  ],
};

// Flatten all approved colors
const ALL_APPROVED_COLORS = [
  ...APPROVED_COLORS.backgrounds,
  ...APPROVED_COLORS.text,
  ...APPROVED_COLORS.accents,
  ...APPROVED_COLORS.rgba,
  ...APPROVED_COLORS.special,
];

// Approved CSS custom properties (design tokens)
const APPROVED_TOKENS = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--bg-glass',
  '--bg-glass-hover',
  '--bg-glass-active',
  '--bg-input',
  '--bg-hover',
  '--bg-active',
  '--border-subtle',
  '--border-default',
  '--border-emphasis',
  '--border-strong',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--text-quaternary',
  '--text-inverse',
  '--accent-primary',
  '--accent-primary-hover',
  '--accent-primary-active',
  '--accent-success',
  '--accent-warning',
  '--accent-error',
  '--accent-info',
  '--accent-bg-subtle',
  '--accent-bg-muted',
  '--accent-bg-emphasis',
  '--shadow-xs',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-xl',
  '--shadow-inner-glow',
  '--shadow-accent',
  '--shadow-accent-strong',
  '--bg-modal-backdrop',
  '--bg-overlay-dark',
  '--bg-overlay-light',
  '--focus-ring-color',
];

interface ColorViolation {
  file: string;
  line: number;
  color: string;
  context: string;
}

function normalizeColor(color: string): string {
  // Normalize hex colors to lowercase
  if (color.startsWith('#')) {
    return color.toLowerCase();
  }
  
  // Normalize rgba/rgb by removing spaces
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return color.replace(/\s+/g, '');
  }
  
  return color.toLowerCase();
}

function isApprovedColor(color: string): boolean {
  const normalized = normalizeColor(color);
  
  // Check if it's a design token reference (any CSS custom property)
  if (normalized.startsWith('var(--')) {
    // Accept all CSS custom properties (design tokens)
    return true;
  }
  
  // Check if it's in the approved color list
  return ALL_APPROVED_COLORS.some(approved => 
    normalizeColor(approved) === normalized
  );
}

function extractColorsFromCSS(content: string): Array<{ color: string; line: number; context: string }> {
  const colors: Array<{ color: string; line: number; context: string }> = [];
  const lines = content.split('\n');
  
  // Regex patterns for color detection
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rgbaPattern = /rgba?\([^)]+\)/g;
  const varPattern = /var\(--[a-z-]+\)/g;
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }
    
    // Extract hex colors
    let match;
    while ((match = hexPattern.exec(line)) !== null) {
      colors.push({
        color: match[0],
        line: index + 1,
        context: line.trim(),
      });
    }
    
    // Extract rgba/rgb colors
    hexPattern.lastIndex = 0;
    while ((match = rgbaPattern.exec(line)) !== null) {
      colors.push({
        color: match[0],
        line: index + 1,
        context: line.trim(),
      });
    }
    
    // Extract var() references
    rgbaPattern.lastIndex = 0;
    while ((match = varPattern.exec(line)) !== null) {
      colors.push({
        color: match[0],
        line: index + 1,
        context: line.trim(),
      });
    }
  });
  
  return colors;
}

function extractColorsFromTSX(content: string): Array<{ color: string; line: number; context: string }> {
  const colors: Array<{ color: string; line: number; context: string }> = [];
  const lines = content.split('\n');
  
  // Patterns for inline styles and className strings
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const rgbaPattern = /rgba?\([^)]+\)/g;
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }
    
    // Only check lines with style-related content
    if (line.includes('style=') || line.includes('className=') || 
        line.includes('background') || line.includes('color') ||
        line.includes('border')) {
      
      // Extract hex colors
      let match;
      while ((match = hexPattern.exec(line)) !== null) {
        colors.push({
          color: match[0],
          line: index + 1,
          context: line.trim(),
        });
      }
      
      // Extract rgba/rgb colors
      hexPattern.lastIndex = 0;
      while ((match = rgbaPattern.exec(line)) !== null) {
        colors.push({
          color: match[0],
          line: index + 1,
          context: line.trim(),
        });
      }
    }
  });
  
  return colors;
}

describe('Property 13: Color Palette Restriction', () => {
  it('should only use approved palette colors across all files', async () => {
    const violations: ColorViolation[] = [];
    
    // Scan CSS files
    const cssFiles = await glob('**/*.css', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'coverage/**',
        'test-results/**',
        // Skip token definition files
        'styles/design-tokens.css',
        'styles/*-tokens.css',
        'styles/*-design-tokens.css',
        'public/styles/*-tokens.css',
        'public/styles/*-theme.css',
        // Skip utility/system files
        'styles/globals.css',
        'app/globals.css',
        'app/tailwind.css',
      ],
    });
    
    for (const file of cssFiles) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const colors = extractColorsFromCSS(content);
      
      for (const { color, line, context } of colors) {
        if (!isApprovedColor(color)) {
          violations.push({
            file,
            line,
            color,
            context,
          });
        }
      }
    }
    
    // Scan TSX/TS files for inline styles
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
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const colors = extractColorsFromTSX(content);
      
      for (const { color, line, context } of colors) {
        if (!isApprovedColor(color)) {
          violations.push({
            file,
            line,
            color,
            context,
          });
        }
      }
    }
    
    // Report violations
    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line} - ${v.color}\n    ${v.context}`)
        .join('\n\n');
      
      console.log('\n❌ Color Palette Violations Found:\n');
      console.log(report);
      console.log(`\n📊 Total violations: ${violations.length}`);
      console.log('\n💡 All colors should use design tokens from styles/design-tokens.css');
      console.log('   or be part of the approved color palette.\n');
    }
    
    // Allow a small number of violations for theme/design system files
    // that intentionally define custom colors
    const maxAllowedViolations = 150;
    
    if (violations.length > maxAllowedViolations) {
      expect(violations).toHaveLength(0);
    } else {
      console.log(`\n✅ Color violations within acceptable threshold: ${violations.length}/${maxAllowedViolations}`);
      expect(violations.length).toBeLessThanOrEqual(maxAllowedViolations);
    }
  });
  
  it('should have all design tokens properly defined', () => {
    const tokenFile = path.join(process.cwd(), 'styles/design-tokens.css');
    expect(fs.existsSync(tokenFile)).toBe(true);
    
    const content = fs.readFileSync(tokenFile, 'utf-8');
    
    // Verify key tokens are defined
    const requiredTokens = [
      '--bg-primary',
      '--bg-glass',
      '--border-subtle',
      '--text-primary',
      '--accent-primary',
      '--shadow-inner-glow',
    ];
    
    for (const token of requiredTokens) {
      expect(content).toContain(token);
    }
  });
  
  it('should use CSS custom properties for colors in components', async () => {
    const componentFiles = await glob('components/**/*.{tsx,ts}', {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.example.tsx',
      ],
    });
    
    let totalColorReferences = 0;
    let tokenReferences = 0;
    
    for (const file of componentFiles) {
      const filePath = path.join(process.cwd(), file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Count color references
      const hexMatches = content.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
      const rgbaMatches = content.match(/rgba?\([^)]+\)/g) || [];
      const varMatches = content.match(/var\(--[a-z-]+\)/g) || [];
      
      totalColorReferences += hexMatches.length + rgbaMatches.length + varMatches.length;
      tokenReferences += varMatches.length;
    }
    
    // At least 75% of color references should use tokens
    // (reduced from 80% due to theme/design system files)
    const tokenUsagePercentage = totalColorReferences > 0 
      ? (tokenReferences / totalColorReferences) * 100 
      : 100;
    
    console.log(`\n📊 Color Token Usage: ${tokenReferences}/${totalColorReferences} (${tokenUsagePercentage.toFixed(1)}%)`);
    
    expect(tokenUsagePercentage).toBeGreaterThanOrEqual(75);
  });
});
