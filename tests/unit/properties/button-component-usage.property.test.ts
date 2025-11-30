/**
 * Property Test: Button Component Usage
 * 
 * **Feature: design-system-unification, Property 14: Button Component Usage**
 * **Validates: Requirements 4.1**
 * 
 * This test validates that button elements use the standardized Button component
 * rather than raw <button> tags, ensuring consistency across the application.
 * 
 * Property: For any TSX/JSX file in the codebase, all button elements should use
 * the Button component from components/ui/button.tsx rather than raw HTML button tags.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ButtonViolation {
  file: string;
  line: number;
  content: string;
  context: string;
}

/**
 * Scans TSX/JSX files for raw button elements
 */
function scanForRawButtons(filePath: string): ButtonViolation[] {
  const violations: ButtonViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip files that are the Button component itself, test files, examples, and utility wrappers
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('components/ui/button') ||
    normalizedPath.includes('export-all.tsx') ||
    normalizedPath.includes('example-usage.tsx') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('node_modules')
  ) {
    return violations;
  }

  // Pattern to detect raw button elements
  // Matches: <button, but not <Button (capital B)
  // Note: removed 'i' flag to make it case-sensitive
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

describe('Property 14: Button Component Usage', () => {
  it('should use Button component instead of raw button elements', async () => {
    const files = await getAllTsxFiles();
    expect(files.length).toBeGreaterThan(0);

    const allViolations: ButtonViolation[] = [];

    for (const file of files) {
      const violations = scanForRawButtons(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      console.log('\n❌ Button Component Usage Violations Found:\n');
      console.log(`Total violations: ${allViolations.length}\n`);

      // Group by file
      const violationsByFile = allViolations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, ButtonViolation[]>);

      Object.entries(violationsByFile).forEach(([file, violations]) => {
        console.log(`\n📁 ${file}`);
        violations.forEach(v => {
          console.log(`  Line ${v.line}: ${v.content}`);
        });
      });

      console.log('\n💡 Remediation:');
      console.log('  1. Import Button component: import { Button } from "@/components/ui/button"');
      console.log('  2. Replace <button> with <Button>');
      console.log('  3. Update props to use Button component API (variant, size, loading)');
      console.log('  4. Run: npm run check:button-usage for detailed report\n');
    }

    expect(allViolations).toHaveLength(0);
  }, 30000);

  it('should have Button component properly exported', () => {
    const buttonPath = path.join(process.cwd(), 'components/ui/button.tsx');
    expect(fs.existsSync(buttonPath)).toBe(true);

    const content = fs.readFileSync(buttonPath, 'utf-8');
    expect(content).toContain('export const Button');
    expect(content).toContain('forwardRef');
  });

  it('should have consistent Button component API', () => {
    const buttonPath = path.join(process.cwd(), 'components/ui/button.tsx');
    const content = fs.readFileSync(buttonPath, 'utf-8');

    // Check for required props
    expect(content).toContain('variant');
    expect(content).toContain('size');
    expect(content).toContain('loading');

    // Check for design token usage
    expect(content).toContain('var(--');
  });
});
