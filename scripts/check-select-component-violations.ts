#!/usr/bin/env tsx

/**
 * Select Component Usage Violation Checker
 * 
 * Scans the codebase for raw <select> elements that should use the Select component.
 * Provides detailed reports with line numbers and remediation suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SelectViolation {
  file: string;
  line: number;
  content: string;
  context: string;
  suggestion: string;
}

interface ViolationReport {
  totalFiles: number;
  filesWithViolations: number;
  totalViolations: number;
  violations: SelectViolation[];
}

/**
 * ANSI color codes for terminal output
 */
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

/**
 * Generates a suggestion for fixing the violation
 */
function generateSuggestion(line: string): string {
  // Extract select attributes
  const selectMatch = line.match(/<select([^>]*)\/?>/);
  if (!selectMatch) return 'Replace <select> with <Select>';

  const attrs = selectMatch[1];
  
  // Common patterns
  if (attrs.includes('multiple')) {
    return 'Replace with: <Select multiple> (consider using a multi-select component)';
  }
  if (attrs.includes('disabled')) {
    return 'Replace with: <Select disabled>';
  }
  if (attrs.includes('required')) {
    return 'Replace with: <Select required>';
  }
  
  return 'Replace <select> with <Select> from @/components/ui/export-all';
}

/**
 * Scans a file for raw select elements
 */
function scanFile(filePath: string): SelectViolation[] {
  const violations: SelectViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip files that are the Select component itself or test files
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('components/ui/select') ||
    normalizedPath.includes('components/ui/export-all') ||
    normalizedPath.includes('components/forms/FormInput') || // FormSelect is a wrapper
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('node_modules')
  ) {
    return violations;
  }

  // Pattern to detect raw select elements (lowercase only, not the Select component)
  const rawSelectPattern = /<select[\s/>]/g;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check for raw select tags
    const matches = line.match(rawSelectPattern);
    if (matches) {
      // Additional check: make sure it's not in a comment or string
      const beforeMatch = line.substring(0, line.indexOf('<select'));
      const inComment = beforeMatch.includes('//') || beforeMatch.includes('/*');
      
      if (!inComment) {
        violations.push({
          file: filePath,
          line: index + 1,
          content: trimmedLine,
          context: lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join('\n'),
          suggestion: generateSuggestion(line)
        });
      }
    }
  });

  return violations;
}

/**
 * Gets all TSX/JSX files in the project
 */
async function getAllTsxFiles(): Promise<string[]> {
  const patterns = [
    'app/**/*.{tsx,jsx}',
    'components/**/*.{tsx,jsx}',
    'src/**/*.{tsx,jsx}',
    'pages/**/*.{tsx,jsx}',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{tsx,jsx}',
        '**/*.spec.{tsx,jsx}',
      ],
    });
    files.push(...matches);
  }

  return [...new Set(files)];
}

/**
 * Scans the entire codebase
 */
async function scanCodebase(): Promise<ViolationReport> {
  const files = await getAllTsxFiles();
  const allViolations: SelectViolation[] = [];

  for (const file of files) {
    const violations = scanFile(file);
    allViolations.push(...violations);
  }

  const filesWithViolations = new Set(allViolations.map(v => v.file)).size;

  return {
    totalFiles: files.length,
    filesWithViolations,
    totalViolations: allViolations.length,
    violations: allViolations,
  };
}

/**
 * Prints the violation report
 */
function printReport(report: ViolationReport): void {
  console.log(`\n${colors.bold}${colors.cyan}Select Component Usage Report${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total files scanned: ${colors.cyan}${report.totalFiles}${colors.reset}`);
  console.log(`  Files with violations: ${colors.yellow}${report.filesWithViolations}${colors.reset}`);
  console.log(`  Total violations: ${report.totalViolations > 0 ? colors.red : colors.green}${report.totalViolations}${colors.reset}\n`);

  if (report.totalViolations === 0) {
    console.log(`${colors.green}${colors.bold}✓ No violations found!${colors.reset}`);
    console.log(`${colors.green}All select elements use the Select component.${colors.reset}\n`);
    return;
  }

  // Group violations by file
  const violationsByFile = report.violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, SelectViolation[]>);

  console.log(`${colors.bold}Violations by File:${colors.reset}\n`);

  Object.entries(violationsByFile).forEach(([file, violations]) => {
    console.log(`${colors.bold}${colors.blue}📁 ${file}${colors.reset}`);
    console.log(`   ${colors.yellow}${violations.length} violation(s)${colors.reset}\n`);

    violations.forEach((v, index) => {
      console.log(`   ${colors.bold}${index + 1}.${colors.reset} Line ${colors.cyan}${v.line}${colors.reset}:`);
      console.log(`      ${colors.red}${v.content}${colors.reset}`);
      console.log(`      ${colors.green}💡 ${v.suggestion}${colors.reset}\n`);
    });
  });

  console.log(`${colors.bold}${colors.yellow}Remediation Steps:${colors.reset}\n`);
  console.log(`  1. Import the Select component:`);
  console.log(`     ${colors.cyan}import { Select } from "@/components/ui/export-all"${colors.reset}\n`);
  console.log(`  2. Replace raw <select> tags with <Select> component\n`);
  console.log(`  3. Update child <option> elements to maintain consistency\n`);
  console.log(`  4. Example:`);
  console.log(`     ${colors.red}- <select className="...">${colors.reset}`);
  console.log(`     ${colors.red}-   <option value="1">Option 1</option>${colors.reset}`);
  console.log(`     ${colors.red}- </select>${colors.reset}`);
  console.log(`     ${colors.green}+ <Select>${colors.reset}`);
  console.log(`     ${colors.green}+   <option value="1">Option 1</option>${colors.reset}`);
  console.log(`     ${colors.green}+ </Select>${colors.reset}\n`);
  console.log(`  5. For more complex dropdowns, consider using SelectTrigger, SelectContent, SelectItem\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`${colors.bold}Scanning codebase for select component usage...${colors.reset}\n`);
    
    const report = await scanCodebase();
    printReport(report);

    // Exit with error code if violations found
    if (report.totalViolations > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}${colors.bold}Error:${colors.reset}`, error);
    process.exit(1);
  }
}

main();
