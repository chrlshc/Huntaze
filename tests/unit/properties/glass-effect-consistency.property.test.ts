/**
 * Property-Based Test: Glass Effect Consistency
 * 
 * **Feature: design-system-unification, Property 2: Glass Effect Consistency**
 * **Validates: Requirements 1.2, 3.2**
 * 
 * Property: For any card or container component, the glass effect should use 
 * the standardized glass effect token
 * 
 * This test verifies that:
 * 1. All glass effects use --bg-glass token
 * 2. All backdrop-filter values use --blur-xl token
 * 3. All glass borders use --border-subtle token
 * 4. No hardcoded glass effect values exist
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard glass effect tokens
const GLASS_TOKENS = {
  background: ['var(--bg-glass)', 'var(--bg-glass-hover)', 'var(--bg-glass-active)'],
  backdropFilter: ['blur(var(--blur-xl))', 'blur(var(--blur-lg))', 'blur(var(--blur-2xl))'],
  border: ['var(--border-subtle)', 'var(--border-default)'],
  boxShadow: ['var(--shadow-inner-glow)'],
};

// Patterns that indicate hardcoded glass effects
const HARDCODED_GLASS_PATTERNS = [
  /backdrop-filter:\s*blur\(\d+px\)/gi,
  /background:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/gi,
  /background-color:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/gi,
];

interface GlassViolation {
  file: string;
  line: number;
  content: string;
  type: 'hardcoded-backdrop' | 'hardcoded-background' | 'missing-token';
}

/**
 * Scan a file for glass effect violations
 */
function scanFileForGlassViolations(filePath: string): GlassViolation[] {
  const violations: GlassViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for hardcoded backdrop-filter blur values
    if (/backdrop-filter:\s*blur\(\d+px\)/i.test(line)) {
      violations.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: 'hardcoded-backdrop',
      });
    }

    // Check for hardcoded rgba glass backgrounds
    if (/background(-color)?:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/i.test(line)) {
      violations.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: 'hardcoded-background',
      });
    }
  });

  return violations;
}

/**
 * Get all component and page files
 */
function getComponentFiles(): string[] {
  const patterns = [
    'components/**/*.{tsx,ts,css}',
    'app/**/*.{tsx,ts,css}',
    'styles/**/*.css',
  ];

  const files: string[] = [];
  patterns.forEach(pattern => {
    const matches = glob.sync(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    });
    files.push(...matches);
  });

  return files;
}

/**
 * Check if a file uses glass effects
 */
function usesGlassEffect(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return (
    content.includes('backdrop-filter') ||
    content.includes('glass') ||
    /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/i.test(content)
  );
}

describe('Property 2: Glass Effect Consistency', () => {
  it('should verify all glass effects use design tokens', () => {
    const files = getComponentFiles();
    const allViolations: GlassViolation[] = [];

    files.forEach(file => {
      if (usesGlassEffect(file)) {
        const violations = scanFileForGlassViolations(file);
        allViolations.push(...violations);
      }
    });

    if (allViolations.length > 0) {
      const violationReport = allViolations
        .map(v => `  ${v.file}:${v.line} - ${v.type}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Glass Effect Violations Found:\n');
      console.error(violationReport);
      console.error(`\n📊 Total violations: ${allViolations.length}`);
      console.error('\n💡 Fix: Replace hardcoded values with design tokens:');
      console.error('   - backdrop-filter: blur(16px) → backdrop-filter: blur(var(--blur-xl))');
      console.error('   - background: rgba(255,255,255,0.05) → background: var(--bg-glass)');
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should verify glass utility classes use correct tokens', () => {
    const designTokensPath = 'styles/design-tokens.css';
    
    if (!fs.existsSync(designTokensPath)) {
      throw new Error('Design tokens file not found');
    }

    const content = fs.readFileSync(designTokensPath, 'utf-8');

    // Verify .glass class uses correct tokens
    expect(content).toContain('background: var(--bg-glass)');
    expect(content).toContain('backdrop-filter: blur(var(--blur-xl))');
    expect(content).toContain('border: 1px solid var(--border-subtle)');
    expect(content).toContain('box-shadow: var(--shadow-inner-glow)');
  });

  it('should verify glass-card components use standardized class', () => {
    const files = getComponentFiles().filter(f => f.endsWith('.tsx'));
    const violations: { file: string; line: number; content: string }[] = [];

    // Files that are allowed to use inline backdrop-filter (special cases)
    const allowedFiles = [
      'components/ui/Modal.tsx',           // Modal backdrop needs custom blur
      'components/layout/SafeArea.tsx',    // SafeArea uses Tailwind conditional
      'components/RemoveDarkOverlay.tsx',  // Utility that checks for filters
      'components/animations/MobileOptimizations.tsx', // Performance optimizations
    ];

    files.forEach(file => {
      // Skip allowed files
      if (allowedFiles.some(allowed => file.includes(allowed))) {
        return;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for inline glass effects instead of using .glass class
        if (
          line.includes('backdrop-filter') &&
          !line.includes('className') &&
          !line.includes('// allowed')
        ) {
          violations.push({
            file,
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Inline Glass Effects Found (should use .glass class):\n');
      console.error(report);
      console.error('\n💡 Fix: Use className="glass" or className="glass-card" instead');
    }

    expect(violations).toHaveLength(0);
  });

  it('should verify property-based: glass effects across random components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getComponentFiles().filter(usesGlassEffect)),
        (filePath) => {
          const violations = scanFileForGlassViolations(filePath);
          
          if (violations.length > 0) {
            console.error(`\n❌ Violations in ${filePath}:`);
            violations.forEach(v => {
              console.error(`  Line ${v.line}: ${v.content}`);
            });
          }

          return violations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify backdrop-filter values match token patterns', () => {
    const files = getComponentFiles();
    const violations: { file: string; line: number; value: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const backdropMatch = line.match(/backdrop-filter:\s*([^;]+)/i);
        if (backdropMatch) {
          const value = backdropMatch[1].trim();
          
          // Check if it's using a token
          const usesToken = value.includes('var(--blur-');
          
          // Check if it's a hardcoded pixel value
          const isHardcoded = /blur\(\d+px\)/.test(value);

          if (isHardcoded && !usesToken) {
            violations.push({
              file,
              line: index + 1,
              value,
            });
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line} - ${v.value}`)
        .join('\n');

      console.error('\n❌ Hardcoded backdrop-filter values found:\n');
      console.error(report);
      console.error('\n💡 Available blur tokens:');
      console.error('   --blur-sm: 4px');
      console.error('   --blur-md: 8px');
      console.error('   --blur-lg: 12px');
      console.error('   --blur-xl: 16px');
      console.error('   --blur-2xl: 24px');
      console.error('   --blur-3xl: 40px');
    }

    expect(violations).toHaveLength(0);
  });

  it('should verify glass background values match token patterns', () => {
    const files = getComponentFiles();
    const violations: { file: string; line: number; value: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for rgba white backgrounds (glass effect pattern)
        const glassMatch = line.match(/background(-color)?:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/i);
        if (glassMatch) {
          // Check if it's using a token
          const usesToken = line.includes('var(--bg-glass');

          if (!usesToken) {
            violations.push({
              file,
              line: index + 1,
              value: glassMatch[0],
            });
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.value}`)
        .join('\n');

      console.error('\n❌ Hardcoded glass background values found:\n');
      console.error(report);
      console.error('\n💡 Available glass tokens:');
      console.error('   --bg-glass: rgba(255, 255, 255, 0.05)');
      console.error('   --bg-glass-hover: rgba(255, 255, 255, 0.08)');
      console.error('   --bg-glass-active: rgba(255, 255, 255, 0.12)');
    }

    expect(violations).toHaveLength(0);
  });

  it('should verify glass borders use design tokens', () => {
    const files = getComponentFiles();
    const violations: { file: string; line: number; content: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // If line has backdrop-filter (glass effect), check if border uses token
        if (line.includes('backdrop-filter') || line.includes('glass')) {
          const nextLines = lines.slice(index, index + 5).join(' ');
          
          // Check for hardcoded border colors in glass contexts
          if (/border(-color)?:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.\d+\)/i.test(nextLines)) {
            const usesToken = nextLines.includes('var(--border-');
            
            if (!usesToken) {
              violations.push({
                file,
                line: index + 1,
                content: line.trim(),
              });
            }
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Glass effects with hardcoded borders found:\n');
      console.error(report);
      console.error('\n💡 Use border tokens:');
      console.error('   --border-subtle: rgba(255, 255, 255, 0.08)');
      console.error('   --border-default: rgba(255, 255, 255, 0.12)');
    }

    expect(violations).toHaveLength(0);
  });
});
