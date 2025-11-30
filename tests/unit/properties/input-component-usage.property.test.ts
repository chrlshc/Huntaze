/**
 * Property Test: Input Component Usage
 * 
 * **Feature: design-system-unification, Property 15: Input Component Usage**
 * **Validates: Requirements 4.2**
 * 
 * This test validates that input elements use the standardized Input component
 * rather than raw <input> tags, ensuring consistency across the application.
 * 
 * Property: For any TSX/JSX file in the codebase, all input elements should use
 * the Input component from components/ui/input.tsx rather than raw HTML input tags.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface InputViolation {
  file: string;
  line: number;
  content: string;
  context: string;
}

/**
 * Files with acceptable exceptions (documented reasons for raw input usage)
 */
const ACCEPTABLE_EXCEPTIONS = [
  'components/ui/export-all.tsx',           // Low-level component wrappers
  'src/components/ui/export-all.tsx',       // Low-level component wrappers
  'components/ui/container.example.tsx',    // Example/demo file
  'components/layout/SkeletonScreen.example.tsx', // Example/demo file
];

/**
 * Scans TSX/JSX files for raw input elements
 */
function scanForRawInputs(filePath: string): InputViolation[] {
  const violations: InputViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip files that are the Input component itself or test files
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (
    normalizedPath.includes('components/ui/input') ||
    normalizedPath.includes('.test.') ||
    normalizedPath.includes('.spec.') ||
    normalizedPath.includes('node_modules') ||
    ACCEPTABLE_EXCEPTIONS.some(exception => normalizedPath.includes(exception))
  ) {
    return violations;
  }

  // Pattern to detect raw input elements (case-sensitive to avoid matching <Input>)
  // Matches: <input, but not <Input (capital I)
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
        // Skip acceptable input types (checkbox, radio, range, file)
        const isCheckbox = line.includes('type="checkbox"');
        const isRadio = line.includes('type="radio"');
        const isRange = line.includes('type="range"');
        const isFile = line.includes('type="file"');
        
        // Only report violations for standard input types
        if (!isCheckbox && !isRadio && !isRange && !isFile) {
          violations.push({
            file: filePath,
            line: index + 1,
            content: trimmedLine,
            context: lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join('\n')
          });
        }
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

describe('Property 15: Input Component Usage', () => {
  it('should use Input component instead of raw input elements', async () => {
    const files = await getAllTsxFiles();
    expect(files.length).toBeGreaterThan(0);

    const allViolations: InputViolation[] = [];

    for (const file of files) {
      const violations = scanForRawInputs(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      console.log('\n❌ Input Component Usage Violations Found:\n');
      console.log(`Total violations: ${allViolations.length}\n`);

      // Group by file
      const violationsByFile = allViolations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, InputViolation[]>);

      Object.entries(violationsByFile).forEach(([file, violations]) => {
        console.log(`\n📁 ${file}`);
        violations.forEach(v => {
          console.log(`  Line ${v.line}: ${v.content}`);
        });
      });

      console.log('\n💡 Remediation:');
      console.log('  1. Import Input component: import { Input } from "@/components/ui/input"');
      console.log('  2. Replace <input> with <Input>');
      console.log('  3. Update props to use Input component API (variant, error)');
      console.log('  4. Run: npm run check:input-usage for detailed report\n');
    }

    expect(allViolations).toHaveLength(0);
  }, 30000);

  it('should have Input component properly exported', () => {
    const inputPath = path.join(process.cwd(), 'components/ui/input.tsx');
    expect(fs.existsSync(inputPath)).toBe(true);

    const content = fs.readFileSync(inputPath, 'utf-8');
    expect(content).toContain('export const Input');
    expect(content).toContain('forwardRef');
  });

  it('should have consistent Input component API', () => {
    const inputPath = path.join(process.cwd(), 'components/ui/input.tsx');
    const content = fs.readFileSync(inputPath, 'utf-8');

    // Check for required props
    expect(content).toContain('variant');
    expect(content).toContain('error');

    // Check for design token usage
    expect(content).toContain('var(--');
  });
});
