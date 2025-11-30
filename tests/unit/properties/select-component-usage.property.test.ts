/**
 * Property Test: Select Component Usage
 * 
 * **Feature: design-system-unification, Property 16: Select Component Usage**
 * **Validates: Requirements 4.3**
 * 
 * This test validates that select elements use the standardized Select component
 * rather than raw <select> tags, ensuring consistency across the application.
 * 
 * Property: For any TSX/JSX file in the codebase, all select elements should use
 * the Select component from components/ui rather than raw HTML select tags.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface SelectViolation {
  file: string;
  line: number;
  content: string;
  context: string;
}

/**
 * Scans TSX/JSX files for raw select elements
 */
function scanForRawSelects(filePath: string): SelectViolation[] {
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

  // Pattern to detect raw select elements
  // Matches: <select (lowercase), but not <Select (capital S)
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
          context: lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join('\n')
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

describe('Property 16: Select Component Usage', () => {
  it('should use Select component instead of raw select elements', async () => {
    const files = await getAllTsxFiles();
    expect(files.length).toBeGreaterThan(0);

    const allViolations: SelectViolation[] = [];

    for (const file of files) {
      const violations = scanForRawSelects(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      console.log('\n❌ Select Component Usage Violations Found:\n');
      console.log(`Total violations: ${allViolations.length}\n`);

      // Group by file
      const violationsByFile = allViolations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, SelectViolation[]>);

      Object.entries(violationsByFile).forEach(([file, violations]) => {
        console.log(`\n📁 ${file}`);
        violations.forEach(v => {
          console.log(`  Line ${v.line}: ${v.content}`);
        });
      });

      console.log('\n💡 Remediation:');
      console.log('  1. Import Select component: import { Select } from "@/components/ui/export-all"');
      console.log('  2. Replace <select> with <Select>');
      console.log('  3. Update child <option> elements to use design tokens');
      console.log('  4. Run: npm run check:select-usage for detailed report\n');
    }

    expect(allViolations).toHaveLength(0);
  }, 30000);

  it('should have Select component properly exported', () => {
    const exportAllPath = path.join(process.cwd(), 'components/ui/export-all.tsx');
    expect(fs.existsSync(exportAllPath)).toBe(true);

    const content = fs.readFileSync(exportAllPath, 'utf-8');
    expect(content).toContain('export const Select');
  });

  it('should have consistent Select component styling', () => {
    const exportAllPath = path.join(process.cwd(), 'components/ui/export-all.tsx');
    const content = fs.readFileSync(exportAllPath, 'utf-8');

    // Check that Select component exists and is exported
    expect(content).toContain('export const Select');
    
    // Verify it renders a select element with className for styling
    expect(content).toContain('<select');
    expect(content).toContain('className');
  });
});
