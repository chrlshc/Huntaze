/**
 * Property Test: Animation Timing Standardization
 * Feature: design-system-unification, Property 20: Animation Timing Standardization
 * Validates: Requirements 6.5
 * 
 * Property: For any CSS file, all transition and animation durations should reference
 * standardized timing tokens (--transition-fast, --transition-base, --transition-slow, --transition-slower)
 * and not use custom timing values.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Standard animation timing tokens from design-tokens.css
const STANDARD_TIMING_TOKENS = [
  '--transition-fast',
  '--transition-base',
  '--transition-slow',
  '--transition-slower',
];

const STANDARD_TIMING_VALUES = [
  '150ms',
  '200ms',
  '300ms',
  '500ms',
];

const STANDARD_EASING_TOKENS = [
  '--ease-in',
  '--ease-out',
  '--ease-in-out',
];

const STANDARD_EASING_VALUES = [
  'cubic-bezier(0.4, 0, 1, 1)',
  'cubic-bezier(0, 0, 0.2, 1)',
  'cubic-bezier(0.4, 0, 0.2, 1)',
];

interface TimingViolation {
  file: string;
  line: number;
  content: string;
  type: 'custom-duration' | 'custom-easing' | 'inline-timing';
  suggestion: string;
}

function scanFileForTimingViolations(filePath: string): TimingViolation[] {
  const violations: TimingViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || !trimmedLine) {
      return;
    }

    // Check for transition or animation properties
    const transitionMatch = line.match(/transition(-duration|-property)?:\s*([^;]+)/i);
    const animationMatch = line.match(/animation(-duration)?:\s*([^;]+)/i);
    
    if (transitionMatch || animationMatch) {
      const match = transitionMatch || animationMatch;
      const value = match![2];
      
      // Check if using a token (var(--...))
      const usesToken = /var\(--transition-|var\(--ease-/.test(value);
      
      if (!usesToken) {
        // Check for custom duration values (ms or s)
        const hasDuration = /\d+m?s/.test(value);
        
        if (hasDuration) {
          // Extract the duration
          const durationMatch = value.match(/(\d+m?s)/);
          const duration = durationMatch ? durationMatch[1] : '';
          
          // Check if it's a standard value
          const isStandardValue = STANDARD_TIMING_VALUES.some(std => 
            value.includes(std)
          );
          
          if (!isStandardValue) {
            violations.push({
              file: filePath,
              line: index + 1,
              content: trimmedLine,
              type: 'custom-duration',
              suggestion: `Use var(--transition-base) or var(--transition-fast) instead of ${duration}`,
            });
          } else {
            // Standard value but not using token
            violations.push({
              file: filePath,
              line: index + 1,
              content: trimmedLine,
              type: 'inline-timing',
              suggestion: 'Use timing token instead of hardcoded value',
            });
          }
        }
        
        // Check for custom easing functions
        const hasCubicBezier = /cubic-bezier\([^)]+\)/.test(value);
        if (hasCubicBezier) {
          const isStandardEasing = STANDARD_EASING_VALUES.some(std =>
            value.includes(std)
          );
          
          if (!isStandardEasing) {
            violations.push({
              file: filePath,
              line: index + 1,
              content: trimmedLine,
              type: 'custom-easing',
              suggestion: 'Use var(--ease-in-out) or other standard easing token',
            });
          }
        }
      }
    }
  });

  return violations;
}

describe('Property 20: Animation Timing Standardization', () => {
  it('should verify all CSS transitions reference animation duration tokens', async () => {
    const cssFiles = await glob('**/*.css', {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
      ],
    });

    const allViolations: TimingViolation[] = [];

    for (const file of cssFiles) {
      const violations = scanFileForTimingViolations(file);
      allViolations.push(...violations);
    }

    // Group violations by type
    const customDurations = allViolations.filter(v => v.type === 'custom-duration');
    const customEasings = allViolations.filter(v => v.type === 'custom-easing');
    const inlineTimings = allViolations.filter(v => v.type === 'inline-timing');

    // Generate detailed report
    if (allViolations.length > 0) {
      console.log('\n📊 Animation Timing Violations Report\n');
      console.log(`Total files scanned: ${cssFiles.length}`);
      console.log(`Total violations: ${allViolations.length}`);
      console.log(`Files with violations: ${new Set(allViolations.map(v => v.file)).size}\n`);

      if (customDurations.length > 0) {
        console.log(`❌ Custom Duration Values (${customDurations.length}):`);
        customDurations.slice(0, 10).forEach(v => {
          console.log(`  ${v.file}:${v.line}`);
          console.log(`    ${v.content}`);
          console.log(`    💡 ${v.suggestion}\n`);
        });
        if (customDurations.length > 10) {
          console.log(`  ... and ${customDurations.length - 10} more\n`);
        }
      }

      if (customEasings.length > 0) {
        console.log(`❌ Custom Easing Functions (${customEasings.length}):`);
        customEasings.slice(0, 5).forEach(v => {
          console.log(`  ${v.file}:${v.line}`);
          console.log(`    ${v.content}`);
          console.log(`    💡 ${v.suggestion}\n`);
        });
        if (customEasings.length > 5) {
          console.log(`  ... and ${customEasings.length - 5} more\n`);
        }
      }

      if (inlineTimings.length > 0) {
        console.log(`⚠️  Inline Standard Values (${inlineTimings.length}):`);
        console.log(`  These use standard values but should use tokens for consistency\n`);
      }

      console.log('✅ Standard Timing Tokens Available:');
      STANDARD_TIMING_TOKENS.forEach(token => {
        console.log(`  ${token}`);
      });
      console.log('\n✅ Standard Easing Tokens Available:');
      STANDARD_EASING_TOKENS.forEach(token => {
        console.log(`  ${token}`);
      });
    } else {
      console.log('\n✅ All animations use standardized timing tokens!');
    }

    // Property assertion: All transitions should use timing tokens
    expect(allViolations.length).toBe(0);
  });

  it('should confirm standard timing tokens exist in design system', () => {
    const designTokensPath = path.join(process.cwd(), 'styles/design-tokens.css');
    
    expect(fs.existsSync(designTokensPath)).toBe(true);
    
    const content = fs.readFileSync(designTokensPath, 'utf-8');
    
    // Verify all standard timing tokens are defined
    STANDARD_TIMING_TOKENS.forEach(token => {
      expect(content).toContain(token);
    });
    
    // Verify all standard easing tokens are defined
    STANDARD_EASING_TOKENS.forEach(token => {
      expect(content).toContain(token);
    });
  });
});
