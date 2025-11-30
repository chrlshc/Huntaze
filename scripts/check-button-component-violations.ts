#!/usr/bin/env tsx

/**
 * Button Component Usage Violation Checker
 * 
 * Scans the codebase for raw <button> elements that should use the Button component.
 * Provides detailed reports with line numbers and remediation suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ButtonViolation {
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
  violations: ButtonViolation[];
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
  // Extract button attributes
  const buttonMatch = line.match(/<button([^>]*)>/);
  if (!buttonMatch) return 'Replace <button> with <Button>';

  const attrs = buttonMatch[1];
  
  // Common patterns
  if (attrs.includes('type="submit"')) {
    return 'Replace with: <Button type="submit" variant="primary">';
  }
  if (attrs.includes('type="button"')) {
    return 'Replace with: <Button variant="secondary">';
  }
  if (attrs.includes('disabled')) {
    return 'Replace with: <Button disabled>';
  }
  
  return 'Replace <button> with <Button> and add appropriate variant prop';
}

/**
 * Scans a file for raw button elements
 */
function scanFile(filePath: string): ButtonViolation[] {
  const violations: ButtonViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip files that are the Button component itself or test files
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('components/ui/button') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('node_modules')
  ) {
    return violations;
  }

  // Pattern to detect raw button elements (case-sensitive to exclude <Button>)
  const rawButtonPattern = /<button[\s>]/g;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }

    // Check for raw button tags
    const matches = line.match(rawButtonPattern);
    if (matches) {
      // Additional check: make sure it's not in a comment or string
      const beforeMatch = line.substring(0, line.indexOf('<button'));
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
  const allViolations: ButtonViolation[] = [];

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
  console.log(`\n${colors.bold}${colors.cyan}Button Component Usage Report${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total files scanned: ${colors.cyan}${report.totalFiles}${colors.reset}`);
  console.log(`  Files with violations: ${colors.yellow}${report.filesWithViolations}${colors.reset}`);
  console.log(`  Total violations: ${report.totalViolations > 0 ? colors.red : colors.green}${report.totalViolations}${colors.reset}\n`);

  if (report.totalViolations === 0) {
    console.log(`${colors.green}${colors.bold}✓ No violations found!${colors.reset}`);
    console.log(`${colors.green}All button elements use the Button component.${colors.reset}\n`);
    return;
  }

  // Group violations by file
  const violationsByFile = report.violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, ButtonViolation[]>);

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
  console.log(`  1. Import the Button component:`);
  console.log(`     ${colors.cyan}import { Button } from "@/components/ui/button"${colors.reset}\n`);
  console.log(`  2. Replace raw <button> tags with <Button> component\n`);
  console.log(`  3. Update props to use Button API:`);
  console.log(`     - ${colors.cyan}variant${colors.reset}: "primary" | "secondary" | "outline" | "ghost" | "tonal" | "danger" | "gradient" | "link"`);
  console.log(`     - ${colors.cyan}size${colors.reset}: "sm" | "md" | "lg" | "xl" | "pill"`);
  console.log(`     - ${colors.cyan}loading${colors.reset}: boolean (shows loading spinner)\n`);
  console.log(`  4. Example:`);
  console.log(`     ${colors.red}- <button className="..." onClick={handleClick}>Submit</button>${colors.reset}`);
  console.log(`     ${colors.green}+ <Button variant="primary" onClick={handleClick}>Submit</Button>${colors.reset}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`${colors.bold}Scanning codebase for button component usage...${colors.reset}\n`);
    
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
