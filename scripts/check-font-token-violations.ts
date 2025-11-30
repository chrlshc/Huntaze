#!/usr/bin/env tsx
/**
 * Script to check and display font token usage violations
 */

import * as fs from 'fs';
import { glob } from 'glob';

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

// Files and directories to exclude
const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/styles/design-tokens.css',
  '**/tailwind.config.ts',
  '**/postcss.config.mjs',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

const ALLOWED_EXCEPTIONS = [
  'app/globals.css',
  'app/tailwind.css',
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

  return [...new Set(allFiles)].filter(
    file => !ALLOWED_EXCEPTIONS.some(exception => file.includes(exception))
  );
}

function checkFileForHardcodedFonts(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Array<{
    type: string;
    line: number;
    content: string;
    match: string;
  }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return;
    }

    // Check for hardcoded font-family
    const fontFamilyMatches = line.matchAll(HARDCODED_FONT_FAMILY_PATTERN);
    for (const match of fontFamilyMatches) {
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

    // Check for hardcoded font-size
    const fontSizeMatches = line.matchAll(HARDCODED_FONT_SIZE_PATTERN);
    for (const match of fontSizeMatches) {
      const isValidToken = VALID_FONT_SIZE_TOKENS.some(token => 
        match[0].includes(token)
      );
      
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

    // Check for inline fontFamily
    const inlineFontFamilyMatches = line.matchAll(INLINE_FONT_FAMILY_PATTERN);
    for (const match of inlineFontFamilyMatches) {
      violations.push({
        type: 'inline-font-family',
        line: lineNumber,
        content: line.trim(),
        match: match[0],
      });
    }

    // Check for inline fontSize
    const inlineFontSizeMatches = line.matchAll(INLINE_FONT_SIZE_PATTERN);
    for (const match of inlineFontSizeMatches) {
      violations.push({
        type: 'inline-font-size',
        line: lineNumber,
        content: line.trim(),
        match: match[0],
      });
    }
  });

  return violations;
}

// Main execution
const files = getAllRelevantFiles();
const filesWithViolations: Array<{
  file: string;
  violations: any[];
}> = [];

files.forEach(file => {
  const violations = checkFileForHardcodedFonts(file);
  if (violations.length > 0) {
    filesWithViolations.push({ file, violations });
  }
});

console.log('\n🔍 Font Token Usage Violations Report\n');
console.log('=' .repeat(80));

if (filesWithViolations.length === 0) {
  console.log('\n✅ No violations found! All files use design tokens correctly.\n');
} else {
  console.log(`\n❌ Found ${filesWithViolations.length} files with violations:\n`);
  
  filesWithViolations.forEach(({ file, violations }) => {
    console.log(`\n📄 ${file}`);
    console.log('-'.repeat(80));
    
    violations.forEach(v => {
      console.log(`   Line ${v.line} [${v.type}]:`);
      console.log(`   ${v.match}`);
      console.log(`   Context: ${v.content.substring(0, 100)}${v.content.length > 100 ? '...' : ''}`);
      console.log('');
    });
  });
  
  const totalViolations = filesWithViolations.reduce((sum, f) => sum + f.violations.length, 0);
  console.log('=' .repeat(80));
  console.log(`\nTotal: ${filesWithViolations.length} files, ${totalViolations} violations`);
  console.log(`Compliance: ${((1 - filesWithViolations.length / files.length) * 100).toFixed(1)}%\n`);
}
