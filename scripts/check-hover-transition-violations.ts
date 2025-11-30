#!/usr/bin/env ts-node
/**
 * Hover Transition Timing Violations Checker
 * 
 * This script scans the codebase for hover transitions that don't use
 * approved duration tokens and provides suggestions for fixes.
 * 
 * Usage:
 *   npm run check:hover-transitions
 *   or
 *   ts-node scripts/check-hover-transition-violations.ts
 */

import * as fs from 'fs';
import { glob } from 'glob';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Approved transition durations
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

interface Violation {
  file: string;
  line: number;
  content: string;
  duration: string;
  context: string;
  suggestion: string;
}

/**
 * Suggests the appropriate transition token based on duration
 */
function suggestTransitionToken(duration: string): string {
  const numericDuration = parseFloat(duration);
  
  if (isNaN(numericDuration)) {
    return 'var(--transition-base)';
  }

  if (numericDuration <= 150) {
    return 'var(--transition-fast) /* 150ms - quick interactions */';
  } else if (numericDuration <= 200) {
    return 'var(--transition-base) /* 200ms - standard transitions */';
  } else if (numericDuration <= 300) {
    return 'var(--transition-slow) /* 300ms - deliberate animations */';
  } else {
    return 'var(--transition-slower) /* 500ms - entrance effects */';
  }
}

/**
 * Extracts transition duration from a transition declaration
 */
function extractTransitionDuration(transitionValue: string): string | null {
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
  if (APPROVED_DURATIONS.some(approved => duration.includes(approved))) {
    return true;
  }

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
 * Scans a CSS file for hover transitions
 */
function checkCSSFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes(':hover') || line.includes('&:hover')) {
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

        if (contextLine.includes('transition') && !contextLine.trim().startsWith('//')) {
          const duration = extractTransitionDuration(contextLine);
          
          if (duration && !isApprovedDuration(duration)) {
            violations.push({
              file: filePath,
              line: j + 1,
              content: contextLine.trim(),
              duration,
              context: 'CSS :hover block',
              suggestion: suggestTransitionToken(duration),
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
function checkTSXFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Tailwind hover utilities with transition
    if (line.includes('hover:') && line.includes('transition')) {
      const durationMatch = line.match(/duration-(\d+)/);
      if (durationMatch) {
        const duration = durationMatch[1] + 'ms';
        if (!isApprovedDuration(duration)) {
          violations.push({
            file: filePath,
            line: i + 1,
            content: line.trim(),
            duration,
            context: 'Tailwind className',
            suggestion: suggestTransitionToken(duration),
          });
        }
      }
    }

    // Check for inline styles with hover transitions
    if (line.includes('transition') && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      const duration = extractTransitionDuration(line);
      
      if (duration && !isApprovedDuration(duration)) {
        const contextLines = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join('\n');
        if (contextLines.toLowerCase().includes('hover')) {
          violations.push({
            file: filePath,
            line: i + 1,
            content: line.trim(),
            duration,
            context: 'Inline style or styled component',
            suggestion: suggestTransitionToken(duration),
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bold}${colors.cyan}🔍 Scanning for Hover Transition Timing Violations...${colors.reset}\n`);

  const patterns = [
    'app/**/*.css',
    'styles/**/*.css',
    'components/**/*.css',
    'components/**/*.tsx',
    'app/**/*.tsx',
  ];

  const allViolations: Violation[] = [];
  let filesScanned = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/test-results/**',
      ],
    });

    for (const file of files) {
      filesScanned++;
      
      if (file.endsWith('.css')) {
        const violations = checkCSSFile(file);
        allViolations.push(...violations);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const violations = checkTSXFile(file);
        allViolations.push(...violations);
      }
    }
  }

  console.log(`${colors.blue}📊 Scanned ${filesScanned} files${colors.reset}\n`);

  if (allViolations.length === 0) {
    console.log(`${colors.green}${colors.bold}✅ No violations found! All hover transitions use approved durations.${colors.reset}\n`);
    return;
  }

  console.log(`${colors.red}${colors.bold}❌ Found ${allViolations.length} violation(s):${colors.reset}\n`);

  // Group violations by file
  const violationsByFile = allViolations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = [];
    }
    acc[violation.file].push(violation);
    return acc;
  }, {} as Record<string, Violation[]>);

  // Print violations grouped by file
  for (const [file, violations] of Object.entries(violationsByFile)) {
    console.log(`${colors.yellow}📄 ${file}${colors.reset}`);
    
    for (const violation of violations) {
      console.log(`  ${colors.red}Line ${violation.line}:${colors.reset} ${violation.context}`);
      console.log(`    ${colors.magenta}Current:${colors.reset} ${violation.duration}`);
      console.log(`    ${colors.green}Suggested:${colors.reset} ${violation.suggestion}`);
      console.log(`    ${colors.cyan}Code:${colors.reset} ${violation.content.substring(0, 80)}${violation.content.length > 80 ? '...' : ''}`);
      console.log('');
    }
  }

  console.log(`${colors.bold}${colors.cyan}📚 Approved Durations:${colors.reset}`);
  console.log(`  ${colors.green}var(--transition-fast)${colors.reset}   = 150ms (quick interactions)`);
  console.log(`  ${colors.green}var(--transition-base)${colors.reset}   = 200ms (standard transitions)`);
  console.log(`  ${colors.green}var(--transition-slow)${colors.reset}   = 300ms (deliberate animations)`);
  console.log(`  ${colors.green}var(--transition-slower)${colors.reset} = 500ms (entrance effects)`);
  console.log('');

  process.exit(1);
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
