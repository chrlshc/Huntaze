#!/usr/bin/env tsx

/**
 * Input Component Usage Violation Checker
 * 
 * Scans the codebase for raw <input> elements that should use the Input component.
 * Provides detailed reports with line numbers and remediation suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface InputViolation {
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
  violations: InputViolation[];
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
  // Extract input attributes
  const inputMatch = line.match(/<input([^>]*)\/?>/);
  if (!inputMatch) return 'Replace <input> with <Input>';

  const attrs = inputMatch[1];
  
  // Common patterns
  if (attrs.includes('type="email"')) {
    return 'Replace with: <Input type="email" variant="standard">';
  }
  if (attrs.includes('type="password"')) {
    return 'Replace with: <Input type="password" variant="standard">';
  }
  if (attrs.includes('type="text"')) {
    return 'Replace with: <Input type="text" variant="standard">';
  }
  if (attrs.includes('type="number"')) {
    return 'Replace with: <Input type="number" variant="standard">';
  }
  if (attrs.includes('disabled')) {
    return 'Replace with: <Input disabled>';
  }
  if (attrs.includes('type="checkbox"') || attrs.includes('type="radio"')) {
    return 'Checkbox/Radio: Consider using specialized component or keep as-is if appropriate';
  }
  
  return 'Replace <input> with <Input> and add appropriate variant prop';
}

/**
 * Scans a file for raw input elements
 */
function scanFile(filePath: string): InputViolation[] {
  const violations: InputViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip files that are the Input component itself or test files
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('components/ui/input') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('node_modules')
  ) {
    return violations;
  }

  // Pattern to detect raw input elements (case-sensitive to avoid matching <Input>)
  const rawInputPattern = /<input[\s/>]/g;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check for raw input tags
    const matches = line.match(rawInputPattern);
    if (matches) {
      // Additional check: make sure it's not in a comment or string
      const beforeMatch = line.substring(0, line.indexOf('<input'));
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
  const allViolations: InputViolation[] = [];

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
  console.log(`\n${colors.bold}${colors.cyan}Input Component Usage Report${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total files scanned: ${colors.cyan}${report.totalFiles}${colors.reset}`);
  console.log(`  Files with violations: ${colors.yellow}${report.filesWithViolations}${colors.reset}`);
  console.log(`  Total violations: ${report.totalViolations > 0 ? colors.red : colors.green}${report.totalViolations}${colors.reset}\n`);

  if (report.totalViolations === 0) {
    console.log(`${colors.green}${colors.bold}✓ No violations found!${colors.reset}`);
    console.log(`${colors.green}All input elements use the Input component.${colors.reset}\n`);
    return;
  }

  // Group violations by file
  const violationsByFile = report.violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, InputViolation[]>);

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
  console.log(`  1. Import the Input component:`);
  console.log(`     ${colors.cyan}import { Input } from "@/components/ui/input"${colors.reset}\n`);
  console.log(`  2. Replace raw <input> tags with <Input> component\n`);
  console.log(`  3. Update props to use Input API:`);
  console.log(`     - ${colors.cyan}type${colors.reset}: "text" | "email" | "password" | "number"`);
  console.log(`     - ${colors.cyan}variant${colors.reset}: "dense" | "standard" (default: "standard")`);
  console.log(`     - ${colors.cyan}error${colors.reset}: string (displays error message below input)`);
  console.log(`     - ${colors.cyan}disabled${colors.reset}: boolean\n`);
  console.log(`  4. Example:`);
  console.log(`     ${colors.red}- <input type="email" className="..." placeholder="Email" />${colors.reset}`);
  console.log(`     ${colors.green}+ <Input type="email" placeholder="Email" variant="standard" />${colors.reset}\n`);
  console.log(`  5. Note: Checkbox and radio inputs may use specialized components\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`${colors.bold}Scanning codebase for input component usage...${colors.reset}\n`);
    
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
