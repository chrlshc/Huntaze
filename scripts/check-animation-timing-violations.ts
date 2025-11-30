#!/usr/bin/env tsx

/**
 * Animation Timing Violations Checker
 * 
 * Scans CSS files for custom animation timing values and suggests
 * using standardized timing tokens instead.
 */

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

// ANSI color codes
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

const STANDARD_TIMING_TOKENS = [
  '--transition-fast',    // 150ms
  '--transition-base',    // 200ms
  '--transition-slow',    // 300ms
  '--transition-slower',  // 500ms
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

interface TimingViolation {
  file: string;
  line: number;
  content: string;
  type: 'custom-duration' | 'custom-easing' | 'inline-timing';
  suggestion: string;
  duration?: string;
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
            // Suggest closest standard timing
            const durationMs = parseInt(duration);
            let suggestedToken = '--transition-base';
            if (durationMs <= 150) suggestedToken = '--transition-fast';
            else if (durationMs <= 200) suggestedToken = '--transition-base';
            else if (durationMs <= 300) suggestedToken = '--transition-slow';
            else suggestedToken = '--transition-slower';

            violations.push({
              file: filePath,
              line: index + 1,
              content: trimmedLine,
              type: 'custom-duration',
              duration,
              suggestion: `Use var(${suggestedToken}) instead of ${duration}`,
            });
          } else {
            // Standard value but not using token
            const tokenMap: Record<string, string> = {
              '150ms': '--transition-fast',
              '200ms': '--transition-base',
              '300ms': '--transition-slow',
              '500ms': '--transition-slower',
            };
            const suggestedToken = tokenMap[duration] || '--transition-base';
            
            violations.push({
              file: filePath,
              line: index + 1,
              content: trimmedLine,
              type: 'inline-timing',
              duration,
              suggestion: `Replace ${duration} with var(${suggestedToken})`,
            });
          }
        }
        
        // Check for custom easing functions
        const hasCubicBezier = /cubic-bezier\([^)]+\)/.test(value);
        if (hasCubicBezier) {
          const cubicBezierMatch = value.match(/cubic-bezier\(([^)]+)\)/);
          const cubicBezier = cubicBezierMatch ? cubicBezierMatch[0] : '';
          
          violations.push({
            file: filePath,
            line: index + 1,
            content: trimmedLine,
            type: 'custom-easing',
            suggestion: `Replace ${cubicBezier} with var(--ease-in-out)`,
          });
        }
      }
    }
  });

  return violations;
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}🎬 Animation Timing Violations Scanner${colors.reset}\n`);

  const cssFiles = await glob('**/*.css', {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ],
  });

  console.log(`Scanning ${cssFiles.length} CSS files...\n`);

  const allViolations: TimingViolation[] = [];

  for (const file of cssFiles) {
    const violations = scanFileForTimingViolations(file);
    allViolations.push(...violations);
  }

  // Group violations by type
  const customDurations = allViolations.filter(v => v.type === 'custom-duration');
  const customEasings = allViolations.filter(v => v.type === 'custom-easing');
  const inlineTimings = allViolations.filter(v => v.type === 'inline-timing');

  // Calculate compliance
  const filesWithViolations = new Set(allViolations.map(v => v.file)).size;
  const compliantFiles = cssFiles.length - filesWithViolations;
  const complianceRate = ((compliantFiles / cssFiles.length) * 100).toFixed(1);

  // Print summary
  console.log(`${colors.bold}📊 Summary${colors.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`Total CSS files:        ${cssFiles.length}`);
  console.log(`Compliant files:        ${colors.green}${compliantFiles}${colors.reset}`);
  console.log(`Files with violations:  ${filesWithViolations > 0 ? colors.red : colors.green}${filesWithViolations}${colors.reset}`);
  console.log(`Compliance rate:        ${filesWithViolations === 0 ? colors.green : colors.yellow}${complianceRate}%${colors.reset}`);
  console.log(`Total violations:       ${allViolations.length}\n`);

  if (allViolations.length === 0) {
    console.log(`${colors.green}${colors.bold}✅ Perfect! All animations use standardized timing tokens!${colors.reset}\n`);
    return;
  }

  // Print violations by type
  if (customDurations.length > 0) {
    console.log(`${colors.bold}${colors.red}❌ Custom Duration Values (${customDurations.length})${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    
    // Group by duration value
    const byDuration = customDurations.reduce((acc, v) => {
      const key = v.duration || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {} as Record<string, TimingViolation[]>);

    Object.entries(byDuration).forEach(([duration, violations]) => {
      console.log(`\n${colors.yellow}Duration: ${duration}${colors.reset} (${violations.length} occurrences)`);
      violations.slice(0, 3).forEach(v => {
        console.log(`  ${colors.cyan}${v.file}:${v.line}${colors.reset}`);
        console.log(`    ${v.content}`);
        console.log(`    ${colors.green}💡 ${v.suggestion}${colors.reset}`);
      });
      if (violations.length > 3) {
        console.log(`  ${colors.magenta}... and ${violations.length - 3} more${colors.reset}`);
      }
    });
    console.log();
  }

  if (customEasings.length > 0) {
    console.log(`${colors.bold}${colors.red}❌ Custom Easing Functions (${customEasings.length})${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    customEasings.slice(0, 5).forEach(v => {
      console.log(`  ${colors.cyan}${v.file}:${v.line}${colors.reset}`);
      console.log(`    ${v.content}`);
      console.log(`    ${colors.green}💡 ${v.suggestion}${colors.reset}\n`);
    });
    if (customEasings.length > 5) {
      console.log(`  ${colors.magenta}... and ${customEasings.length - 5} more${colors.reset}\n`);
    }
  }

  if (inlineTimings.length > 0) {
    console.log(`${colors.bold}${colors.yellow}⚠️  Inline Standard Values (${inlineTimings.length})${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`These use standard timing values but should use tokens for consistency\n`);
    
    inlineTimings.slice(0, 5).forEach(v => {
      console.log(`  ${colors.cyan}${v.file}:${v.line}${colors.reset}`);
      console.log(`    ${v.content}`);
      console.log(`    ${colors.green}💡 ${v.suggestion}${colors.reset}\n`);
    });
    if (inlineTimings.length > 5) {
      console.log(`  ${colors.magenta}... and ${inlineTimings.length - 5} more${colors.reset}\n`);
    }
  }

  // Print available tokens
  console.log(`${colors.bold}${colors.green}✅ Standard Timing Tokens Available${colors.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`${colors.cyan}--transition-fast${colors.reset}    150ms cubic-bezier(0.4, 0, 0.2, 1)`);
  console.log(`${colors.cyan}--transition-base${colors.reset}    200ms cubic-bezier(0.4, 0, 0.2, 1)`);
  console.log(`${colors.cyan}--transition-slow${colors.reset}    300ms cubic-bezier(0.4, 0, 0.2, 1)`);
  console.log(`${colors.cyan}--transition-slower${colors.reset}  500ms cubic-bezier(0.4, 0, 0.2, 1)\n`);

  console.log(`${colors.bold}${colors.green}✅ Standard Easing Tokens Available${colors.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`${colors.cyan}--ease-in${colors.reset}        cubic-bezier(0.4, 0, 1, 1)`);
  console.log(`${colors.cyan}--ease-out${colors.reset}       cubic-bezier(0, 0, 0.2, 1)`);
  console.log(`${colors.cyan}--ease-in-out${colors.reset}    cubic-bezier(0.4, 0, 0.2, 1)\n`);

  // Migration examples
  console.log(`${colors.bold}${colors.blue}📝 Migration Examples${colors.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`${colors.red}❌ Before:${colors.reset}`);
  console.log(`  transition: all 250ms ease-in-out;`);
  console.log(`${colors.green}✅ After:${colors.reset}`);
  console.log(`  transition: all var(--transition-base) var(--ease-in-out);\n`);

  process.exit(allViolations.length > 0 ? 1 : 0);
}

main().catch(console.error);
