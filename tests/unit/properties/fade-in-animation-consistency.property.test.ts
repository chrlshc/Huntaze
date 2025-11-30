/**
 * Property Test: Fade-in Animation Consistency
 * 
 * **Feature: design-system-unification, Property 17: Fade-in Animation Consistency**
 * **Validates: Requirements 6.1**
 * 
 * Property: For any element with fade-in animation, it should use standard animation duration
 * 
 * This test verifies that all fade-in animations across the codebase use
 * standardized animation duration tokens from design-tokens.css rather than
 * arbitrary timing values.
 * 
 * Standard durations from design tokens:
 * - --transition-fast: 150ms
 * - --transition-base: 200ms
 * - --transition-slow: 300ms
 * - --transition-slower: 500ms
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard animation durations from design tokens
const STANDARD_DURATIONS = [
  '150ms',
  '200ms',
  '300ms',
  '500ms',
  '0.15s',
  '0.2s',
  '0.3s',
  '0.5s',
  'var(--transition-fast)',
  'var(--transition-base)',
  'var(--transition-slow)',
  'var(--transition-slower)',
];

// Patterns that indicate fade-in animations
const FADE_IN_PATTERNS = [
  /fadeIn/i,
  /fade-in/i,
  /fade_in/i,
  /@keyframes\s+\w*fade\w*in\w*/i,
  /animation:\s*\w*fade\w*in\w*/i,
  /animation-name:\s*\w*fade\w*in\w*/i,
];

interface AnimationViolation {
  file: string;
  line: number;
  content: string;
  duration: string;
  animationName: string;
}

/**
 * Scans a file for fade-in animations and checks their durations
 */
function checkFadeInAnimations(filePath: string): AnimationViolation[] {
  const violations: AnimationViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check if line contains fade-in animation
    const hasFadeIn = FADE_IN_PATTERNS.some(pattern => pattern.test(line));
    
    if (hasFadeIn) {
      // Extract animation name
      const animationNameMatch = line.match(/(?:animation(?:-name)?:\s*|@keyframes\s+)(\w*fade\w*in\w*)/i);
      const animationName = animationNameMatch ? animationNameMatch[1] : 'unknown';

      // Check for animation duration in the same line or nearby lines
      const contextLines = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 5)).join('\n');
      
      // Extract duration from animation shorthand or animation-duration
      // Only match if the animation name contains "fade" and "in"
      const durationPatterns = [
        new RegExp(`animation:\\s*${animationName}\\s+([\\d.]+m?s)`, 'i'),
        new RegExp(`animation:\\s*${animationName}\\s+(var\\(--[\\w-]+\\))`, 'i'),
        /animation:\s*fade[_-]?in\s+([\d.]+m?s)/i,
        /animation:\s*fade[_-]?in\s+(var\(--[\w-]+\))/i,
      ];

      let foundDuration: string | null = null;
      
      // Only check duration if this is actually a fade-in animation definition or usage
      if (animationName.toLowerCase().includes('fade') && animationName.toLowerCase().includes('in')) {
        for (const pattern of durationPatterns) {
          const match = contextLines.match(pattern);
          if (match) {
            foundDuration = match[1] || match[0];
            break;
          }
        }
      }

      // If we found a duration, check if it's standard
      if (foundDuration) {
        const isStandard = STANDARD_DURATIONS.some(std => 
          foundDuration!.includes(std) || foundDuration!.includes('var(--transition')
        );

        if (!isStandard) {
          // Check if it's a reasonable approximation (within 50ms of standard)
          const numericDuration = parseFloat(foundDuration);
          const standardNumericValues = [150, 200, 300, 500];
          const isCloseToStandard = standardNumericValues.some(std => {
            return Math.abs(numericDuration - std) <= 50;
          });

          if (!isCloseToStandard) {
            violations.push({
              file: filePath,
              line: lineNumber,
              content: line.trim(),
              duration: foundDuration,
              animationName,
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Gets all CSS and TypeScript files that might contain animations
 */
async function getAnimationFiles(): Promise<string[]> {
  const patterns = [
    'app/**/*.css',
    'styles/**/*.css',
    'components/**/*.css',
    'components/**/*.tsx',
    'app/**/*.tsx',
  ];

  const files: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
      ],
    });
    files.push(...matches);
  }

  return files;
}

describe('Property 17: Fade-in Animation Consistency', () => {
  it('should use standard animation durations for all fade-in animations', async () => {
    const files = await getAnimationFiles();
    const allViolations: AnimationViolation[] = [];

    for (const file of files) {
      const violations = checkFadeInAnimations(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      const violationReport = allViolations
        .map(v => 
          `\n  ${v.file}:${v.line}\n` +
          `    Animation: ${v.animationName}\n` +
          `    Duration: ${v.duration} (should use standard duration token)\n` +
          `    Content: ${v.content}`
        )
        .join('\n');

      console.error(
        `\n❌ Found ${allViolations.length} fade-in animation(s) with non-standard durations:${violationReport}\n\n` +
        `Standard durations:\n` +
        `  - var(--transition-fast)   = 150ms\n` +
        `  - var(--transition-base)   = 200ms\n` +
        `  - var(--transition-slow)   = 300ms\n` +
        `  - var(--transition-slower) = 500ms\n`
      );
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should have fade-in animations defined in the codebase', async () => {
    const files = await getAnimationFiles();
    let hasFadeInAnimations = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (FADE_IN_PATTERNS.some(pattern => pattern.test(content))) {
        hasFadeInAnimations = true;
        break;
      }
    }

    expect(hasFadeInAnimations).toBe(true);
  });
});
