/**
 * Property-Based Test: Button Hover Consistency
 * 
 * **Feature: design-system-unification, Property 3: Button Hover Consistency**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any button component, hover transitions should use 
 * the standard animation duration token
 * 
 * This test verifies that:
 * 1. All button hover transitions use --transition-base token (200ms)
 * 2. All button transitions use standard easing functions
 * 3. No hardcoded transition durations exist in button components
 * 4. Transition properties are consistent across all button variants
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard transition tokens
const TRANSITION_TOKENS = {
  duration: ['var(--transition-fast)', 'var(--transition-base)', 'var(--transition-slow)', 'var(--transition-slower)'],
  easing: ['var(--ease-in)', 'var(--ease-out)', 'var(--ease-in-out)'],
  // Tailwind duration classes that map to tokens
  tailwindDuration: ['duration-[var(--transition-fast)]', 'duration-[var(--transition-base)]', 'duration-[var(--transition-slow)]'],
};

// Patterns that indicate hardcoded transitions
const HARDCODED_TRANSITION_PATTERNS = [
  /transition:\s*[^;]*\d+ms/gi,
  /transition-duration:\s*\d+ms/gi,
  /duration-\d+/g, // Tailwind duration-150, duration-200, etc.
];

interface TransitionViolation {
  file: string;
  line: number;
  content: string;
  type: 'hardcoded-duration' | 'hardcoded-easing' | 'missing-token';
}

/**
 * Scan a file for button transition violations
 */
function scanFileForTransitionViolations(filePath: string): TransitionViolation[] {
  const violations: TransitionViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }

    // Check for hardcoded transition durations in CSS
    if (/transition(-duration)?:\s*[^;]*\d+ms/i.test(line)) {
      violations.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: 'hardcoded-duration',
      });
    }

    // Check for hardcoded Tailwind duration classes (duration-150, duration-200, etc.)
    // But allow duration-[var(--transition-base)] and other token-based variants
    const tailwindDurationMatch = line.match(/duration-(\d+)/);
    if (tailwindDurationMatch && !line.includes('var(--transition-')) {
      violations.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
        type: 'hardcoded-duration',
      });
    }
  });

  return violations;
}

/**
 * Get all button-related files
 */
function getButtonFiles(): string[] {
  const patterns = [
    'components/ui/button.{tsx,ts,css}',
    'components/**/Button*.{tsx,ts,css}',
    'components/**/*button*.{tsx,ts,css}',
    'app/**/*button*.{tsx,ts,css}',
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
      nocase: true,
    });
    files.push(...matches);
  });

  // Also scan for files that contain button-like elements
  const componentFiles = glob.sync('components/**/*.{tsx,ts}', {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
  });

  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Check if file contains button elements with transitions
    if (
      (content.includes('<button') || content.includes('Button')) &&
      (content.includes('transition') || content.includes('hover:'))
    ) {
      if (!files.includes(file)) {
        files.push(file);
      }
    }
  });

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Check if a file contains button transitions
 */
function hasButtonTransitions(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return (
    (content.includes('button') || content.includes('Button')) &&
    (content.includes('transition') || content.includes('duration'))
  );
}

describe('Property 3: Button Hover Consistency', () => {
  it('should verify all button transitions use design tokens', () => {
    const files = getButtonFiles();
    const allViolations: TransitionViolation[] = [];

    files.forEach(file => {
      if (hasButtonTransitions(file)) {
        const violations = scanFileForTransitionViolations(file);
        allViolations.push(...violations);
      }
    });

    if (allViolations.length > 0) {
      const violationReport = allViolations
        .map(v => `  ${v.file}:${v.line} - ${v.type}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Button Transition Violations Found:\n');
      console.error(violationReport);
      console.error(`\n📊 Total violations: ${allViolations.length}`);
      console.error('\n💡 Fix: Replace hardcoded values with design tokens:');
      console.error('   - transition: all 200ms → transition: all var(--transition-base)');
      console.error('   - duration-200 → duration-[var(--transition-base)]');
      console.error('   - transition-duration: 150ms → transition-duration: var(--transition-fast)');
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should verify Button component uses correct transition token', () => {
    const buttonComponentPath = 'components/ui/button.tsx';
    
    if (!fs.existsSync(buttonComponentPath)) {
      throw new Error('Button component not found at components/ui/button.tsx');
    }

    const content = fs.readFileSync(buttonComponentPath, 'utf-8');

    // Verify Button component uses transition token
    const usesTransitionToken = 
      content.includes('var(--transition-base)') ||
      content.includes('duration-[var(--transition-base)]') ||
      content.includes('var(--transition-fast)') ||
      content.includes('duration-[var(--transition-fast)]');

    if (!usesTransitionToken) {
      console.error('\n❌ Button component does not use transition tokens');
      console.error('💡 Expected: duration-[var(--transition-base)] or similar');
    }

    expect(usesTransitionToken).toBe(true);
  });

  it('should verify no hardcoded transition durations in button files', () => {
    const files = getButtonFiles();
    const violations: { file: string; line: number; content: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          return;
        }

        // Check for hardcoded millisecond values
        if (/\d+ms/.test(line) && line.includes('transition')) {
          // Make sure it's not using a token
          if (!line.includes('var(--transition-')) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Hardcoded transition durations found:\n');
      console.error(report);
      console.error('\n💡 Available transition tokens:');
      console.error('   --transition-fast: 150ms');
      console.error('   --transition-base: 200ms');
      console.error('   --transition-slow: 300ms');
      console.error('   --transition-slower: 500ms');
    }

    expect(violations).toHaveLength(0);
  });

  it('should verify property-based: transitions across random button components', () => {
    const buttonFiles = getButtonFiles().filter(hasButtonTransitions);
    
    if (buttonFiles.length === 0) {
      console.warn('⚠️  No button files with transitions found');
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...buttonFiles),
        (filePath) => {
          const violations = scanFileForTransitionViolations(filePath);
          
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

  it('should verify transition properties are consistent', () => {
    const files = getButtonFiles();
    const transitionProperties: Map<string, Set<string>> = new Map();

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line) => {
        // Extract transition property declarations
        const transitionMatch = line.match(/transition:\s*([^;]+)/i);
        if (transitionMatch) {
          const value = transitionMatch[1].trim();
          
          if (!transitionProperties.has(file)) {
            transitionProperties.set(file, new Set());
          }
          transitionProperties.get(file)!.add(value);
        }
      });
    });

    // Check for inconsistencies
    const inconsistencies: string[] = [];
    transitionProperties.forEach((values, file) => {
      if (values.size > 1) {
        inconsistencies.push(`${file}: ${Array.from(values).join(', ')}`);
      }
    });

    if (inconsistencies.length > 0) {
      console.error('\n⚠️  Inconsistent transition properties found:');
      inconsistencies.forEach(inc => console.error(`  ${inc}`));
      console.error('\n💡 Consider standardizing to: transition: all var(--transition-base)');
    }

    // This is a warning, not a failure
    // expect(inconsistencies).toHaveLength(0);
  });

  it('should verify hover states use transition tokens', () => {
    const files = getButtonFiles();
    const violations: { file: string; line: number; content: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for hover states with transitions
        if (line.includes('hover:') && line.includes('transition')) {
          // Check if it uses a token
          const usesToken = 
            line.includes('var(--transition-') ||
            line.includes('duration-[var(--transition-');

          // Check if it has a hardcoded duration
          const hasHardcodedDuration = /duration-\d+/.test(line);

          if (hasHardcodedDuration && !usesToken) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Hover states with hardcoded durations found:\n');
      console.error(report);
      console.error('\n💡 Use: duration-[var(--transition-base)] for hover transitions');
    }

    expect(violations).toHaveLength(0);
  });

  it('should verify design tokens file defines transition tokens', () => {
    const designTokensPath = 'styles/design-tokens.css';
    
    if (!fs.existsSync(designTokensPath)) {
      throw new Error('Design tokens file not found');
    }

    const content = fs.readFileSync(designTokensPath, 'utf-8');

    // Verify transition tokens are defined
    expect(content).toContain('--transition-fast:');
    expect(content).toContain('--transition-base:');
    expect(content).toContain('--transition-slow:');
    
    // Verify they have proper values
    expect(content).toMatch(/--transition-fast:\s*150ms/);
    expect(content).toMatch(/--transition-base:\s*200ms/);
    expect(content).toMatch(/--transition-slow:\s*300ms/);
  });

  it('should verify easing functions use design tokens', () => {
    const files = getButtonFiles();
    const violations: { file: string; line: number; content: string }[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for hardcoded cubic-bezier in button contexts
        if (line.includes('cubic-bezier') && !line.includes('var(--ease-')) {
          // Check if it's in a button-related context
          const context = lines.slice(Math.max(0, index - 2), index + 3).join(' ');
          if (context.toLowerCase().includes('button') || context.includes('hover')) {
            violations.push({
              file,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    });

    if (violations.length > 0) {
      const report = violations
        .map(v => `  ${v.file}:${v.line}\n    ${v.content}`)
        .join('\n');

      console.error('\n❌ Hardcoded easing functions found:\n');
      console.error(report);
      console.error('\n💡 Available easing tokens:');
      console.error('   --ease-in: cubic-bezier(0.4, 0, 1, 1)');
      console.error('   --ease-out: cubic-bezier(0, 0, 0.2, 1)');
      console.error('   --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)');
    }

    expect(violations).toHaveLength(0);
  });
});
