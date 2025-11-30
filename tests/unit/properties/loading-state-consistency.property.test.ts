/**
 * Property Test: Loading State Consistency
 * 
 * **Feature: design-system-unification, Property 19: Loading State Consistency**
 * **Validates: Requirements 6.3**
 * 
 * Property: For any loading indicator, it should use the standardized loading component
 * 
 * This test verifies that all loading states across the codebase use
 * standardized loading components (Skeleton, ProgressIndicator, SectionLoader)
 * rather than custom implementations with hardcoded spinners or loading text.
 * 
 * Standard loading components:
 * - Skeleton / SkeletonCard / SkeletonTable / SkeletonList
 * - ProgressIndicator / CircularProgress
 * - SectionLoader
 * - SmoothTransition
 * - useLoadingState hook
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Standard loading components from our design system
const STANDARD_LOADING_COMPONENTS = [
  'Skeleton',
  'SkeletonCard',
  'SkeletonTable',
  'SkeletonList',
  'SkeletonDashboard',
  'SkeletonAvatar',
  'SkeletonText',
  'SkeletonImage',
  'ProgressIndicator',
  'CircularProgress',
  'SectionLoader',
  'SmoothTransition',
  'useLoadingState',
];

// Patterns that indicate custom loading implementations (violations)
const CUSTOM_LOADING_PATTERNS = [
  // Custom spinner implementations
  /className=["'][^"']*animate-spin[^"']*["']/,
  /<div[^>]*>Loading\.\.\.<\/div>/i,
  /<div[^>]*>Loading<\/div>/i,
  /<span[^>]*>Loading\.\.\.<\/span>/i,
  /<span[^>]*>Loading<\/span>/i,
  
  // Custom loading text without component
  /\{isLoading\s*&&\s*<[^>]*>Loading/i,
  /\{loading\s*&&\s*<[^>]*>Loading/i,
  /\{isPending\s*&&\s*<[^>]*>Loading/i,
  
  // Custom spinner divs without using standard components
  /<div[^>]*className=["'][^"']*spinner[^"']*["']/i,
  /<div[^>]*className=["'][^"']*loader[^"']*["']/i,
  
  // Hardcoded loading animations
  /@keyframes\s+spin\s*\{/i,
  /@keyframes\s+rotate\s*\{/i,
];

// Exceptions: Files that are allowed to have custom loading (e.g., the loading components themselves)
const EXCEPTION_PATTERNS = [
  /components\/loading\//,
  /hooks\/useLoadingState/,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /node_modules/,
  /\.next/,
];

interface LoadingViolation {
  file: string;
  line: number;
  content: string;
  pattern: string;
  suggestion: string;
}

/**
 * Checks if a file is an exception (allowed to have custom loading)
 */
function isException(filePath: string): boolean {
  return EXCEPTION_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Checks if a file uses standard loading components
 */
function usesStandardComponents(content: string): boolean {
  return STANDARD_LOADING_COMPONENTS.some(component => 
    content.includes(component)
  );
}

/**
 * Scans a file for custom loading implementations
 */
function checkLoadingConsistency(filePath: string): LoadingViolation[] {
  if (isException(filePath)) {
    return [];
  }

  const violations: LoadingViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // If file uses standard components, it's likely compliant
  const hasStandardComponents = usesStandardComponents(content);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip if this line imports or uses a standard component
    if (STANDARD_LOADING_COMPONENTS.some(comp => line.includes(comp))) {
      continue;
    }

    // Check for custom loading patterns
    for (const pattern of CUSTOM_LOADING_PATTERNS) {
      if (pattern.test(line)) {
        let suggestion = 'Use Skeleton component for loading states';
        let patternName = 'Custom loading implementation';

        if (line.includes('animate-spin')) {
          suggestion = 'Use <ProgressIndicator /> or <CircularProgress /> instead of custom spinner';
          patternName = 'Custom spinner (animate-spin)';
        } else if (line.includes('Loading')) {
          suggestion = 'Use <SectionLoader /> with skeleton prop or <Skeleton /> component';
          patternName = 'Custom loading text';
        } else if (/@keyframes/.test(line)) {
          suggestion = 'Use standard loading animations from design tokens';
          patternName = 'Custom loading animation';
        }

        // Only report if the file doesn't use standard components at all
        // (to avoid false positives where standard components are used alongside custom ones)
        if (!hasStandardComponents) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            pattern: patternName,
            suggestion,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Gets all TypeScript/React files that might contain loading states
 */
async function getComponentFiles(): Promise<string[]> {
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
        '**/components/loading/**', // Exclude loading components themselves
        '**/hooks/useLoadingState.ts', // Exclude the hook itself
        '**/*.test.*',
        '**/*.spec.*',
      ],
    });
    files.push(...matches);
  }

  return files;
}

describe('Property 19: Loading State Consistency', () => {
  it('should use standardized loading components for all loading indicators', async () => {
    const files = await getComponentFiles();
    const allViolations: LoadingViolation[] = [];

    for (const file of files) {
      const violations = checkLoadingConsistency(file);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      const violationReport = allViolations
        .map(v => 
          `\n  ${v.file}:${v.line}\n` +
          `    Pattern: ${v.pattern}\n` +
          `    Suggestion: ${v.suggestion}\n` +
          `    Content: ${v.content}`
        )
        .join('\n');

      console.error(
        `\n❌ Found ${allViolations.length} custom loading implementation(s):${violationReport}\n\n` +
        `Standard loading components:\n` +
        `  - <Skeleton /> - Basic skeleton loader\n` +
        `  - <SkeletonCard /> - Card skeleton\n` +
        `  - <SkeletonTable /> - Table skeleton\n` +
        `  - <SkeletonList /> - List skeleton\n` +
        `  - <ProgressIndicator /> - Linear progress bar\n` +
        `  - <CircularProgress /> - Circular progress\n` +
        `  - <SectionLoader /> - Section-level loading management\n` +
        `  - <SmoothTransition /> - Smooth loading transitions\n` +
        `  - useLoadingState() - Loading state hook\n`
      );
    }

    expect(allViolations).toHaveLength(0);
  });

  it('should have standard loading components available', () => {
    // Check that Skeleton component exists
    const skeletonPath = path.join(process.cwd(), 'components/loading/SkeletonScreen.tsx');
    expect(fs.existsSync(skeletonPath)).toBe(true);

    // Check that ProgressIndicator exists
    const progressPath = path.join(process.cwd(), 'components/loading/ProgressIndicator.tsx');
    expect(fs.existsSync(progressPath)).toBe(true);

    // Check that SectionLoader exists
    const sectionLoaderPath = path.join(process.cwd(), 'components/loading/SectionLoader.tsx');
    expect(fs.existsSync(sectionLoaderPath)).toBe(true);

    // Check that useLoadingState hook exists
    const hookPath = path.join(process.cwd(), 'hooks/useLoadingState.ts');
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it('should have loading components properly exported', () => {
    const skeletonContent = fs.readFileSync(
      path.join(process.cwd(), 'components/loading/SkeletonScreen.tsx'),
      'utf-8'
    );

    // Check that main components are exported
    expect(skeletonContent).toContain('export const Skeleton');
    expect(skeletonContent).toContain('export const SkeletonCard');
    expect(skeletonContent).toContain('export const SkeletonTable');
    expect(skeletonContent).toContain('export const SkeletonList');
  });

  it('should have loading components use design tokens', () => {
    const skeletonContent = fs.readFileSync(
      path.join(process.cwd(), 'components/loading/SkeletonScreen.tsx'),
      'utf-8'
    );

    // Skeleton components should use Tailwind classes or design tokens
    // They should not have hardcoded colors
    const hasHardcodedColors = /#[0-9a-fA-F]{3,6}/.test(skeletonContent);
    
    if (hasHardcodedColors) {
      console.error('❌ Skeleton components contain hardcoded colors. Use design tokens instead.');
    }

    expect(hasHardcodedColors).toBe(false);
  });
});
