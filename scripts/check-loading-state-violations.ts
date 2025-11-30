#!/usr/bin/env ts-node
/**
 * Check Loading State Violations Script
 * 
 * **Feature: design-system-unification, Task 28**
 * 
 * This script scans the codebase for custom loading implementations
 * and provides suggestions for migrating to standardized components.
 * 
 * Usage:
 *   npm run check:loading-violations
 *   npm run check:loading-violations -- --fix (coming soon)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Standard loading components from our design system
const STANDARD_LOADING_COMPONENTS = [
  'Skeleton',
  'SkeletonCard',
  'SkeletonTable',
  'SkeletonList',
  'SkeletonDashboard',
  'ProgressIndicator',
  'CircularProgress',
  'SectionLoader',
  'SmoothTransition',
  'useLoadingState',
];

// Patterns that indicate custom loading implementations
const CUSTOM_LOADING_PATTERNS = [
  {
    pattern: /className=["'][^"']*animate-spin[^"']*["']/,
    name: 'Custom spinner (animate-spin)',
    suggestion: 'Use <CircularProgress /> or <ProgressIndicator /> component',
    example: '<CircularProgress size={20} />',
  },
  {
    pattern: /<div[^>]*>Loading\.\.\.<\/div>/i,
    name: 'Custom loading text',
    suggestion: 'Use <SectionLoader /> with skeleton prop',
    example: '<SectionLoader isLoading={true} skeleton={<Skeleton />}>',
  },
  {
    pattern: /<span[^>]*>Loading\.\.\.<\/span>/i,
    name: 'Custom loading text (span)',
    suggestion: 'Use <SectionLoader /> with skeleton prop',
    example: '<SectionLoader isLoading={true} skeleton={<Skeleton />}>',
  },
  {
    pattern: /\{isLoading\s*&&\s*<[^>]*>Loading/i,
    name: 'Conditional loading text',
    suggestion: 'Use <SectionLoader /> component',
    example: '<SectionLoader isLoading={isLoading} skeleton={<Skeleton />}>',
  },
  {
    pattern: /<div[^>]*className=["'][^"']*spinner[^"']*["']/i,
    name: 'Custom spinner class',
    suggestion: 'Use <CircularProgress /> component',
    example: '<CircularProgress />',
  },
  {
    pattern: /<div[^>]*className=["'][^"']*loader[^"']*["']/i,
    name: 'Custom loader class',
    suggestion: 'Use <CircularProgress /> or <Skeleton /> component',
    example: '<CircularProgress />',
  },
];

// Files to exclude
const EXCEPTION_PATTERNS = [
  /components\/loading\//,
  /hooks\/useLoadingState/,
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /\.next/,
];

interface Violation {
  file: string;
  line: number;
  content: string;
  patternName: string;
  suggestion: string;
  example: string;
}

function isException(filePath: string): boolean {
  return EXCEPTION_PATTERNS.some(pattern => pattern.test(filePath));
}

function usesStandardComponents(content: string): boolean {
  return STANDARD_LOADING_COMPONENTS.some(component => 
    content.includes(component)
  );
}

function checkFile(filePath: string): Violation[] {
  if (isException(filePath)) {
    return [];
  }

  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const hasStandardComponents = usesStandardComponents(content);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip if this line imports or uses a standard component
    if (STANDARD_LOADING_COMPONENTS.some(comp => line.includes(comp))) {
      continue;
    }

    // Check for custom loading patterns
    for (const { pattern, name, suggestion, example } of CUSTOM_LOADING_PATTERNS) {
      if (pattern.test(line)) {
        // Only report if the file doesn't use standard components at all
        if (!hasStandardComponents) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            patternName: name,
            suggestion,
            example,
          });
        }
        break; // Only report one violation per line
      }
    }
  }

  return violations;
}

async function main() {
  console.log(chalk.blue.bold('\n🔍 Scanning for loading state violations...\n'));

  const patterns = [
    'app/**/*.tsx',
    'components/**/*.tsx',
    'app/**/*.ts',
    'components/**/*.ts',
  ];

  const files: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/components/loading/**',
        '**/hooks/useLoadingState.ts',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    });
    files.push(...matches);
  }

  console.log(chalk.gray(`Scanning ${files.length} files...\n`));

  const allViolations: Violation[] = [];
  const violationsByFile = new Map<string, Violation[]>();

  for (const file of files) {
    const violations = checkFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      violationsByFile.set(file, violations);
    }
  }

  if (allViolations.length === 0) {
    console.log(chalk.green.bold('✅ No loading state violations found!\n'));
    console.log(chalk.gray('All loading states use standardized components.\n'));
    return;
  }

  // Group violations by pattern
  const violationsByPattern = new Map<string, Violation[]>();
  for (const violation of allViolations) {
    const existing = violationsByPattern.get(violation.patternName) || [];
    existing.push(violation);
    violationsByPattern.set(violation.patternName, existing);
  }

  // Print summary
  console.log(chalk.red.bold(`❌ Found ${allViolations.length} loading state violations\n`));
  
  console.log(chalk.yellow.bold('Violations by pattern:\n'));
  for (const [pattern, violations] of violationsByPattern.entries()) {
    console.log(chalk.yellow(`  ${pattern}: ${violations.length} occurrences`));
  }
  console.log();

  // Print violations by file
  console.log(chalk.yellow.bold('Violations by file:\n'));
  
  for (const [file, violations] of violationsByFile.entries()) {
    console.log(chalk.cyan(`\n📄 ${file} (${violations.length} violations)`));
    
    for (const violation of violations) {
      console.log(chalk.gray(`  Line ${violation.line}:`));
      console.log(chalk.red(`    ❌ ${violation.patternName}`));
      console.log(chalk.gray(`       ${violation.content.substring(0, 80)}${violation.content.length > 80 ? '...' : ''}`));
      console.log(chalk.green(`    ✅ ${violation.suggestion}`));
      console.log(chalk.blue(`       Example: ${violation.example}`));
    }
  }

  // Print migration guide
  console.log(chalk.blue.bold('\n\n📚 Migration Guide:\n'));
  console.log(chalk.white('Standard loading components available:\n'));
  console.log(chalk.gray('  1. ') + chalk.cyan('<Skeleton />') + chalk.gray(' - Basic skeleton loader'));
  console.log(chalk.gray('     ') + chalk.gray('import { Skeleton } from "@/components/loading/SkeletonScreen";'));
  console.log();
  console.log(chalk.gray('  2. ') + chalk.cyan('<SkeletonCard />') + chalk.gray(' - Card skeleton'));
  console.log(chalk.gray('     ') + chalk.gray('import { SkeletonCard } from "@/components/loading/SkeletonScreen";'));
  console.log();
  console.log(chalk.gray('  3. ') + chalk.cyan('<CircularProgress />') + chalk.gray(' - Circular progress indicator'));
  console.log(chalk.gray('     ') + chalk.gray('import { CircularProgress } from "@/components/loading/ProgressIndicator";'));
  console.log();
  console.log(chalk.gray('  4. ') + chalk.cyan('<ProgressIndicator />') + chalk.gray(' - Linear progress bar'));
  console.log(chalk.gray('     ') + chalk.gray('import { ProgressIndicator } from "@/components/loading/ProgressIndicator";'));
  console.log();
  console.log(chalk.gray('  5. ') + chalk.cyan('<SectionLoader />') + chalk.gray(' - Section-level loading management'));
  console.log(chalk.gray('     ') + chalk.gray('import { SectionLoader } from "@/components/loading/SectionLoader";'));
  console.log();
  console.log(chalk.gray('  6. ') + chalk.cyan('useLoadingState()') + chalk.gray(' - Loading state hook'));
  console.log(chalk.gray('     ') + chalk.gray('import { useLoadingState } from "@/hooks/useLoadingState";'));
  console.log();

  console.log(chalk.yellow.bold('\n💡 Quick fixes:\n'));
  console.log(chalk.white('Replace custom spinners:'));
  console.log(chalk.red('  - <div className="animate-spin ...">'));
  console.log(chalk.green('  + <CircularProgress size={20} />'));
  console.log();
  console.log(chalk.white('Replace loading text:'));
  console.log(chalk.red('  - {isLoading && <div>Loading...</div>}'));
  console.log(chalk.green('  + <SectionLoader isLoading={isLoading} skeleton={<Skeleton />}>'));
  console.log();

  process.exit(1);
}

main().catch(error => {
  console.error(chalk.red.bold('\n❌ Error:'), error);
  process.exit(1);
});
