#!/usr/bin/env tsx

/**
 * Effect Token Violations Checker
 * 
 * Scans the codebase for hardcoded box-shadow and backdrop-filter values
 * that should be using design tokens instead.
 * 
 * Usage:
 *   npm run check:effect-violations
 *   tsx scripts/check-effect-token-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface EffectViolation {
  file: string;
  line: number;
  type: 'shadow' | 'blur';
  content: string;
  context: string;
  suggestion?: string;
}

const VALID_SHADOW_TOKENS = [
  '--shadow-xs',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-xl',
  '--shadow-inner-glow',
  '--shadow-accent',
  '--shadow-accent-strong',
];

const VALID_BLUR_TOKENS = [
  '--blur-none',
  '--blur-sm',
  '--blur-md',
  '--blur-lg',
  '--blur-xl',
  '--blur-2xl',
  '--blur-3xl',
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

const HARDCODED_SHADOW_PATTERN = /box-shadow\s*:\s*(?!var\(--shadow-)[^;]+;/gi;
const HARDCODED_BLUR_PATTERN = /backdrop-filter\s*:\s*blur\s*\(\s*(?!var\(--blur-)\d+[a-z]+\s*\)/gi;
const INLINE_SHADOW_PATTERN = /boxShadow\s*[:=]\s*['"`](?!var\(--shadow-)[^'"`]+['"`]/gi;
const INLINE_BLUR_PATTERN = /backdropFilter\s*[:=]\s*['"`]blur\((?!var\(--blur-)\d+[a-z]+\)['"`]/gi;

function suggestToken(value: string, type: 'shadow' | 'blur'): string {
  if (type === 'blur') {
    // Extract pixel value from blur(Xpx)
    const match = value.match(/(\d+)px/);
    if (match) {
      const pixels = parseInt(match[1]);
      if (pixels === 0) return '--blur-none';
      if (pixels <= 4) return '--blur-sm';
      if (pixels <= 8) return '--blur-md';
      if (pixels <= 12) return '--blur-lg';
      if (pixels <= 16) return '--blur-xl';
      if (pixels <= 24) return '--blur-2xl';
      return '--blur-3xl';
    }
  }
  
  if (type === 'shadow') {
    // Analyze shadow complexity
    if (value.includes('inset')) return '--shadow-inner-glow';
    if (value.includes('rgba(139, 92, 246') || value.includes('violet')) return '--shadow-accent';
    
    // Check spread/blur values to suggest size
    const spreadMatch = value.match(/(\d+)px/g);
    if (spreadMatch && spreadMatch.length > 0) {
      const maxValue = Math.max(...spreadMatch.map(v => parseInt(v)));
      if (maxValue <= 2) return '--shadow-xs';
      if (maxValue <= 3) return '--shadow-sm';
      if (maxValue <= 6) return '--shadow-md';
      if (maxValue <= 15) return '--shadow-lg';
      return '--shadow-xl';
    }
  }
  
  return type === 'shadow' ? '--shadow-md' : '--blur-md';
}

function findEffectViolations(filePath: string, content: string): EffectViolation[] {
  const violations: EffectViolation[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check for hardcoded box-shadow
    const shadowMatches = line.match(HARDCODED_SHADOW_PATTERN);
    if (shadowMatches) {
      shadowMatches.forEach(match => {
        if (match.includes('var(--shadow-') || match.includes('box-shadow: none')) {
          return;
        }
        
        const suggestion = suggestToken(match, 'shadow');
        violations.push({
          file: filePath,
          line: lineNumber,
          type: 'shadow',
          content: match.trim(),
          context: trimmedLine,
          suggestion,
        });
      });
    }

    // Check for hardcoded backdrop-filter blur
    const blurMatches = line.match(HARDCODED_BLUR_PATTERN);
    if (blurMatches) {
      blurMatches.forEach(match => {
        if (match.includes('var(--blur-')) {
          return;
        }

        const suggestion = suggestToken(match, 'blur');
        violations.push({
          file: filePath,
          line: lineNumber,
          type: 'blur',
          content: match.trim(),
          context: trimmedLine,
          suggestion,
        });
      });
    }

    // Check inline styles
    const inlineShadowMatches = line.match(INLINE_SHADOW_PATTERN);
    if (inlineShadowMatches) {
      inlineShadowMatches.forEach(match => {
        if (!match.includes('var(--shadow-')) {
          const suggestion = suggestToken(match, 'shadow');
          violations.push({
            file: filePath,
            line: lineNumber,
            type: 'shadow',
            content: match.trim(),
            context: trimmedLine,
            suggestion,
          });
        }
      });
    }

    const inlineBlurMatches = line.match(INLINE_BLUR_PATTERN);
    if (inlineBlurMatches) {
      inlineBlurMatches.forEach(match => {
        if (!match.includes('var(--blur-')) {
          const suggestion = suggestToken(match, 'blur');
          violations.push({
            file: filePath,
            line: lineNumber,
            type: 'blur',
            content: match.trim(),
            context: trimmedLine,
            suggestion,
          });
        }
      });
    }
  });

  return violations;
}

async function main() {
  console.log('🔍 Scanning for effect token violations...\n');

  const files = await glob('**/*.{css,tsx,ts,jsx,js}', {
    ignore: EXCLUDED_PATTERNS,
    cwd: process.cwd(),
    absolute: true,
  });

  const allViolations: EffectViolation[] = [];
  let filesChecked = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const violations = findEffectViolations(file, content);
      
      if (violations.length > 0) {
        allViolations.push(...violations);
      }
      
      filesChecked++;
    } catch (error) {
      continue;
    }
  }

  // Group violations by file
  const violationsByFile = allViolations.reduce((acc, v) => {
    if (!acc[v.file]) {
      acc[v.file] = [];
    }
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, EffectViolation[]>);

  const filesWithViolations = Object.keys(violationsByFile).length;
  const compliantFiles = filesChecked - filesWithViolations;
  const complianceRate = filesChecked > 0 ? (compliantFiles / filesChecked) * 100 : 100;

  // Statistics
  const shadowViolations = allViolations.filter(v => v.type === 'shadow');
  const blurViolations = allViolations.filter(v => v.type === 'blur');

  console.log('📊 Effect Token Usage Report\n');
  console.log('═'.repeat(60));
  console.log(`Files scanned:           ${filesChecked}`);
  console.log(`Compliant files:         ${compliantFiles}`);
  console.log(`Files with violations:   ${filesWithViolations}`);
  console.log(`Compliance rate:         ${complianceRate.toFixed(1)}%`);
  console.log('═'.repeat(60));
  console.log(`Total violations:        ${allViolations.length}`);
  console.log(`  Shadow violations:     ${shadowViolations.length}`);
  console.log(`  Blur violations:       ${blurViolations.length}`);
  console.log('═'.repeat(60));

  if (allViolations.length === 0) {
    console.log('\n✅ No effect token violations found! All effects use design tokens.\n');
    return;
  }

  console.log('\n⚠️  Violations by File:\n');

  Object.entries(violationsByFile)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([file, violations]) => {
      const relPath = path.relative(process.cwd(), file);
      console.log(`\n📄 ${relPath}`);
      console.log(`   ${violations.length} violation${violations.length > 1 ? 's' : ''}`);
      console.log('   ' + '─'.repeat(58));

      violations.forEach(v => {
        const icon = v.type === 'shadow' ? '🎨' : '🌫️';
        console.log(`\n   ${icon} Line ${v.line}: ${v.type === 'shadow' ? 'Shadow' : 'Blur'} violation`);
        console.log(`   Current:    ${v.content}`);
        console.log(`   Suggested:  var(${v.suggestion})`);
        console.log(`   Context:    ${v.context.substring(0, 80)}${v.context.length > 80 ? '...' : ''}`);
      });
    });

  console.log('\n\n💡 How to Fix:\n');
  console.log('1. Replace hardcoded box-shadow values:');
  console.log('   Before: box-shadow: 0 4px 6px rgba(0,0,0,0.1);');
  console.log('   After:  box-shadow: var(--shadow-md);');
  console.log('');
  console.log('2. Replace hardcoded backdrop-filter blur:');
  console.log('   Before: backdrop-filter: blur(16px);');
  console.log('   After:  backdrop-filter: blur(var(--blur-xl));');
  console.log('');
  console.log('3. For inline styles in TSX:');
  console.log('   Before: style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}');
  console.log('   After:  style={{ boxShadow: "var(--shadow-md)" }}');
  console.log('');
  console.log('📚 Available Tokens:\n');
  console.log('Shadows:');
  VALID_SHADOW_TOKENS.forEach(token => {
    console.log(`  • ${token}`);
  });
  console.log('\nBlurs:');
  VALID_BLUR_TOKENS.forEach(token => {
    console.log(`  • ${token}`);
  });
  console.log('');
}

main().catch(console.error);
