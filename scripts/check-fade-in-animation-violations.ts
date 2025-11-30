#!/usr/bin/env tsx

/**
 * Fade-in Animation Consistency Checker
 * 
 * This script scans the codebase for fade-in animations and verifies they use
 * standard animation duration tokens from design-tokens.css.
 * 
 * Standard durations:
 * - var(--transition-fast)   = 150ms
 * - var(--transition-base)   = 200ms
 * - var(--transition-slow)   = 300ms
 * - var(--transition-slower) = 500ms
 * 
 * Usage:
 *   npm run check:fade-in-animations
 *   tsx scripts/check-fade-in-animation-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

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
  suggestion: string;
}

interface AnimationInfo {
  file: string;
  line: number;
  animationName: string;
  duration: string;
  isStandard: boolean;
}

/**
 * Suggests the closest standard duration
 */
function suggestStandardDuration(duration: string): string {
  const numericDuration = parseFloat(duration);
  
  if (isNaN(numericDuration)) {
    return 'var(--transition-base)';
  }

  // Map to closest standard duration
  if (numericDuration <= 150) return 'var(--transition-fast)';
  if (numericDuration <= 200) return 'var(--transition-base)';
  if (numericDuration <= 300) return 'var(--transition-slow)';
  return 'var(--transition-slower)';
}

/**
 * Scans a file for fade-in animations
 */
function scanFile(filePath: string): { violations: AnimationViolation[]; animations: AnimationInfo[] } {
  const violations: AnimationViolation[] = [];
  const animations: AnimationInfo[] = [];
  
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
            foundDuration = match[1];
            break;
          }
        }
      }

      // If we found a duration, check if it's standard
      if (foundDuration) {
        const isStandard = STANDARD_DURATIONS.some(std => 
          foundDuration!.includes(std) || foundDuration!.includes('var(--transition')
        );

        animations.push({
          file: filePath,
          line: lineNumber,
          animationName,
          duration: foundDuration,
          isStandard,
        });

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
              suggestion: suggestStandardDuration(foundDuration),
            });
          }
        }
      }
    }
  }

  return { violations, animations };
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

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bold}${colors.cyan}🎬 Fade-in Animation Consistency Check${colors.reset}\n`);

  const files = await getAnimationFiles();
  console.log(`Scanning ${files.length} files...\n`);

  const allViolations: AnimationViolation[] = [];
  const allAnimations: AnimationInfo[] = [];

  for (const file of files) {
    const { violations, animations } = scanFile(file);
    allViolations.push(...violations);
    allAnimations.push(...animations);
  }

  // Display results
  console.log(`${colors.bold}📊 Summary:${colors.reset}`);
  console.log(`  Total fade-in animations found: ${allAnimations.length}`);
  console.log(`  Using standard durations: ${allAnimations.filter(a => a.isStandard).length}`);
  console.log(`  Violations: ${allViolations.length}\n`);

  if (allViolations.length > 0) {
    console.log(`${colors.bold}${colors.red}❌ Violations Found:${colors.reset}\n`);

    allViolations.forEach((violation, index) => {
      console.log(`${colors.yellow}${index + 1}. ${violation.file}:${violation.line}${colors.reset}`);
      console.log(`   Animation: ${colors.cyan}${violation.animationName}${colors.reset}`);
      console.log(`   Current duration: ${colors.red}${violation.duration}${colors.reset}`);
      console.log(`   Suggested: ${colors.green}${violation.suggestion}${colors.reset}`);
      console.log(`   Code: ${violation.content}`);
      console.log('');
    });

    console.log(`${colors.bold}📝 Standard Durations:${colors.reset}`);
    console.log(`  ${colors.green}var(--transition-fast)${colors.reset}   = 150ms`);
    console.log(`  ${colors.green}var(--transition-base)${colors.reset}   = 200ms`);
    console.log(`  ${colors.green}var(--transition-slow)${colors.reset}   = 300ms`);
    console.log(`  ${colors.green}var(--transition-slower)${colors.reset} = 500ms\n`);

    console.log(`${colors.bold}🔧 How to Fix:${colors.reset}`);
    console.log(`  Replace hardcoded durations with design token variables.`);
    console.log(`  Example: animation: fadeIn 0.3s → animation: fadeIn var(--transition-slow)\n`);

    process.exit(1);
  } else {
    console.log(`${colors.bold}${colors.green}✅ All fade-in animations use standard durations!${colors.reset}\n`);
    
    if (allAnimations.length > 0) {
      console.log(`${colors.bold}📋 Compliant Animations:${colors.reset}`);
      allAnimations.forEach(anim => {
        console.log(`  ${colors.green}✓${colors.reset} ${anim.animationName} (${anim.duration}) in ${anim.file}:${anim.line}`);
      });
      console.log('');
    }

    process.exit(0);
  }
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
