#!/usr/bin/env tsx

/**
 * Card Component Usage Violation Checker
 * 
 * This script scans the codebase for card-like containers that don't use
 * the standardized Card component and provides detailed remediation guidance.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  code: string;
  type: string;
  suggestion: string;
}

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

async function checkCardComponentUsage(): Promise<void> {
  console.log(`${colors.bold}${colors.cyan}Card Component Usage Checker${colors.reset}\n`);

  // Find all TSX/JSX files
  const files = await glob('**/*.{tsx,jsx}', {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.test.{tsx,jsx}',
      '**/*.spec.{tsx,jsx}',
      '**/card.tsx',
      '**/card.example.tsx',
    ],
  });

  console.log(`Scanning ${files.length} files...\n`);

  const violations: Violation[] = [];

  // Patterns that indicate a card-like container
  const cardPatterns = [
    {
      pattern: /<div[^>]*className=["'][^"']*\b(card|panel|box|container-card|content-card|info-card|stat-card|metric-card)\b[^"']*["']/gi,
      type: 'div-with-card-class',
      suggestion: 'Replace with <Card> component',
    },
    {
      pattern: /<div[^>]*className=["'][^"']*\b(glass-card|glass-effect|backdrop-blur)\b[^"']*["']/gi,
      type: 'div-with-glass-effect',
      suggestion: 'Replace with <Card variant="glass">',
    },
    {
      pattern: /<div[^>]*className=["'][^"']*\b(rounded-\w+)[^"']*\b(border|shadow)\b[^"']*["']/gi,
      type: 'div-with-card-styling',
      suggestion: 'Consider using <Card> if this is a card-like container',
    },
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip if line already uses <Card component
      if (/<Card\b/.test(line)) {
        return;
      }

      // Check each pattern
      for (const { pattern, type, suggestion } of cardPatterns) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            code: line.trim(),
            type,
            suggestion,
          });
        }
      }
    });
  }

  // Display results
  if (violations.length === 0) {
    console.log(`${colors.green}✓ No violations found!${colors.reset}`);
    console.log(`${colors.green}All card-like containers use the Card component.${colors.reset}\n`);
    return;
  }

  // Group violations by file
  const violationsByFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) {
      acc[v.file] = [];
    }
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);

  // Group violations by type
  const violationsByType = violations.reduce((acc, v) => {
    if (!acc[v.type]) {
      acc[v.type] = 0;
    }
    acc[v.type]++;
    return acc;
  }, {} as Record<string, number>);

  // Display summary
  console.log(`${colors.red}${colors.bold}❌ Found ${violations.length} violations in ${Object.keys(violationsByFile).length} files${colors.reset}\n`);

  console.log(`${colors.bold}Violations by Type:${colors.reset}`);
  Object.entries(violationsByType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${colors.yellow}•${colors.reset} ${type}: ${colors.bold}${count}${colors.reset}`);
    });
  console.log();

  // Display detailed violations
  console.log(`${colors.bold}Detailed Violations:${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);

  Object.entries(violationsByFile)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([file, fileViolations]) => {
      console.log(`${colors.cyan}📄 ${file}${colors.reset} ${colors.yellow}(${fileViolations.length} violations)${colors.reset}`);
      
      fileViolations.forEach((v, index) => {
        console.log(`\n  ${colors.bold}${index + 1}.${colors.reset} Line ${colors.yellow}${v.line}${colors.reset}: ${colors.magenta}[${v.type}]${colors.reset}`);
        console.log(`     ${colors.blue}Suggestion:${colors.reset} ${v.suggestion}`);
        console.log(`     ${colors.reset}${v.code.substring(0, 100)}${v.code.length > 100 ? '...' : ''}${colors.reset}`);
      });
      
      console.log();
    });

  // Display remediation guide
  console.log(`${'='.repeat(80)}`);
  console.log(`${colors.bold}${colors.green}Remediation Guide${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`${colors.bold}1. Import the Card component:${colors.reset}`);
  console.log(`   ${colors.cyan}import { Card } from "@/components/ui/card";${colors.reset}\n`);

  console.log(`${colors.bold}2. Replace card-like divs:${colors.reset}`);
  console.log(`   ${colors.red}Before:${colors.reset} <div className="card rounded-lg border p-4">`);
  console.log(`   ${colors.green}After:${colors.reset}  <Card>\n`);

  console.log(`${colors.bold}3. For glass effect cards:${colors.reset}`);
  console.log(`   ${colors.red}Before:${colors.reset} <div className="glass-card">`);
  console.log(`   ${colors.green}After:${colors.reset}  <Card variant="glass">\n`);

  console.log(`${colors.bold}4. Card Component API:${colors.reset}`);
  console.log(`   ${colors.cyan}<Card${colors.reset}`);
  console.log(`     ${colors.yellow}variant${colors.reset}="default" | "glass"  ${colors.reset}// Optional, default: "default"`);
  console.log(`     ${colors.yellow}className${colors.reset}="..."              ${colors.reset}// Optional additional classes`);
  console.log(`   ${colors.cyan}>${colors.reset}`);
  console.log(`     {children}`);
  console.log(`   ${colors.cyan}</Card>${colors.reset}\n`);

  console.log(`${colors.bold}5. Benefits of using Card component:${colors.reset}`);
  console.log(`   ${colors.green}✓${colors.reset} Consistent styling across the application`);
  console.log(`   ${colors.green}✓${colors.reset} Uses design tokens automatically`);
  console.log(`   ${colors.green}✓${colors.reset} Hover states and transitions included`);
  console.log(`   ${colors.green}✓${colors.reset} Easier to maintain and update`);
  console.log(`   ${colors.green}✓${colors.reset} Type-safe with TypeScript\n`);

  console.log(`${colors.bold}Run this script again after making changes to verify fixes.${colors.reset}\n`);

  // Exit with error code
  process.exit(1);
}

// Run the checker
checkCardComponentUsage().catch((error) => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
