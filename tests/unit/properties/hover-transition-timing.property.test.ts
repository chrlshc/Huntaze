/**
 * Property Test: Hover Transition Timing
 * 
 * **Feature: design-system-unification, Property 18: Hover Transition Timing**
 * **Validates: Requirements 6.2**
 * 
 * Property: For any element with hover transitions, it should use approved duration tokens
 * 
 * This test verifies that all hover transitions across the codebase use
 * standardized transition duration tokens from design-tokens.css rather than
 * arbitrary timing values.
 * 
 * Approved durations from design tokens:
 * - --transition-fast: 150ms (quick interactions)
 * - --transition-base: 200ms (standard transitions)
 * - --transition-slow: 300ms (deliberate animations)
 * - --transition-slower: 500ms (entrance effects)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { glob } from 'glob';

// Approved transition durations from design tokens
const APPROVED_DURATIONS = [
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

// Patterns that indicate hover transitions
const HOVER_PATTERNS = [
  /:hover\s*{[^}]*transition/i,
  /&:hover\s*{[^}]*transition/i,
  /hover:\w+/,  // Tailwind hover utilities
];

interface TransitionViolation {
  file: string;
  line: number;
  content: string;
  duration: string;
  context: string;
}

/**
 * Extracts transition duration from a transition declaration
 */
function extractTransitionDuration(transitionValue: string): string | null {
  // Match duration in transition shorthand or transition-duration
  const durationPatterns = [
    /transition:\s*(?:all\s+)?([\d.]+m?s)/i,
    /transition:\s*(?:[\w-]+\s+)?([\d.]+m?s)/i,
    /transition:\s*(var\(--transition-[\w-]+\))/i,
    /transition-duration:\s*([\d.]+m?s)/i,
    /transition-duration:\s*(var\(--transition-[\w-]+\))/i,
  ];

  for (const pattern of durationPatterns) {
    const match = transitionValue.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Checks if a duration is approved
 */
function isApprovedDuration(duration: string): boolean {
  // Check if it's an approved token or value
  if (APPROVED_DURATIONS.some(approved => duration.includes(approved))) {
    return true;
  }

  // Check if it's close to an approved numeric value (within 50ms tolerance)
  const numericDuration = parseFloat(duration);
  if (!isNaN(numericDuration)) {
    const approvedNumericValues = [150, 200, 300, 500];
    return approvedNumericValues.some(approved => 
      Math.abs(numericDuration - approved) <= 50
    );
  }

  return false;
}

/**
 * Scans a CSS file for hover transitions and checks their durations
 */
function checkHoverTransitionsInCSS(filePath: string): TransitionViolation[] {
  const violations: TransitionViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check if this line or nearby lines contain :hover with transition
    if (line.includes(':hover') || line.includes('&:hover')) {
      // Look ahead for transition declarations within the hover block
      let braceDepth = 0;
      let foundOpenBrace = false;
      
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        const contextLine = lines[j];
        
        if (contextLine.includes('{')) {
          braceDepth++;
          foundOpenBrace = true;
        }
        if (contextLine.includes('}')) {
          braceDepth--;
          if (braceDepth === 0 && foundOpenBrace) break;
        }

        // Check for transition in this line
        if (contextLine.includes('transition') && !contextLine.trim().startsWith('//')) {
          const duration = extractTransitionDuration(contextLine);
          
          if (duration && !isApprovedDuration(duration)) {
            violations.push({
              file: filePath,
              line: j + 1,
              content: contextLine.trim(),
              duration,
              context: 'CSS :hover block',
            });
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Scans a TypeScript/TSX file for hover transitions
 */
function checkHoverTransitionsInTSX(filePath: string): TransitionViolation[] {
  const violations: TransitionViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for Tailwind hover utilities with transition
    if (line.includes('hover:') && line.includes('transition')) {
      // Look for duration in className
      const durationMatch = line.match(/duration-(\d+)/);
      if (durationMatch) {
        const duration = durationMatch[1] + 'ms';
        if (!isApprovedDuration(duration)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            duration,
            context: 'Tailwind className',
          });
        }
      }
    }

    // Check for inline styles with hover transitions
    if (line.includes('transition') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      const duration = extractTransitionDuration(line);
      
      if (duration && !isApprovedDuration(duration)) {
        // Check if this is in a hover-related context
        const contextLines = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
        if (contextLines.toLowerCase().includes('hover')) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            duration,
            context: 'Inline style or styled component',
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Gets all CSS and TypeScript files that might contain hover transitions
 */
async function getStyleFiles(): Promise<string[]> {
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
        '**/test-results/**',
      ],
    });
    files.push(...matches);
  }

  return files;
}

describe('Property 18: Hover Transition Timing', () => {
  it('should use approved transition durations for all hover effects', async () => {
    const files = await getStyleFiles();
    const allViolations: TransitionViolation[] = [];

    for (const file of files) {
      if (file.endsWith('.css')) {
        const violations = checkHoverTransitionsInCSS(file);
        allViolations.push(...violations);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const violations = checkHoverTransitionsInTSX(file);
        allViolations.push(...violations);
      }
    }

    if (allViolations.length > 0) {
      const violationReport = allViolations
        .map(v => 
          `\n  ${v.file}:${v.line}\n` +
          `    Context: ${v.context}\n` +
          `    Duration: ${v.duration} (should use approved duration token)\n` +
          `    Content: ${v.content.substring(0, 100)}${v.content.length > 100 ? '...' : ''}`
        )
        .join('\n');

      console.error(
        `\n❌ Found ${allViolations.length} hover transition(s) with non-approved durations:${violationReport}\n\n` +
        `Approved durations:\n` +
        `  - var(--transition-fast)   = 150ms (quick interactions)\n` +
        `  - var(--transition-base)   = 200ms (standard transitions)\n` +
        `  - var(--transition-slow)   = 300ms (deliberate animations)\n` +
        `  - var(--transition-slower) = 500ms (entrance effects)\n`
      );
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should have hover transitions defined in the codebase', async () => {
    const files = await getStyleFiles();
    let hasHoverTransitions = false;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (HOVER_PATTERNS.some(pattern => pattern.test(content))) {
        hasHoverTransitions = true;
        break;
      }
    }

    expect(hasHoverTransitions).toBe(true);
  });
});
