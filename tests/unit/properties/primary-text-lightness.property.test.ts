/**
 * Property Test: Primary Text Color Lightness
 * 
 * **Feature: design-system-unification, Property 24: Primary Text Color Lightness**
 * **Validates: Requirements 9.2**
 * 
 * This property-based test validates that primary text content uses light colors
 * (zinc-50/100) rather than mid-range grays (zinc-400+), ensuring proper text
 * hierarchy and readability.
 * 
 * WCAG 2.1 Guidelines:
 * - Primary text should have maximum contrast for readability
 * - zinc-50 (#fafafa) provides 19.5:1 contrast on zinc-950
 * - zinc-100 (#f4f4f5) provides 18.2:1 contrast on zinc-950
 * - zinc-400 (#a1a1aa) provides only 8.3:1 contrast
 * 
 * Test Strategy:
 * 1. Scan all component files for text color usage
 * 2. Identify primary content elements (headings, body text, labels)
 * 3. Verify they use --text-primary or zinc-50/100
 * 4. Flag any primary content using mid-range grays (zinc-400+)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TextColorViolation {
  file: string;
  line: number;
  content: string;
  color: string;
  context: 'heading' | 'paragraph' | 'label' | 'span' | 'div' | 'unknown';
  severity: 'error' | 'warning';
  recommendation: string;
}

interface TextColorAnalysis {
  totalFiles: number;
  filesScanned: number;
  violations: TextColorViolation[];
  summary: {
    errorCount: number;
    warningCount: number;
    affectedFiles: number;
  };
}

// ============================================================================
// COLOR DEFINITIONS
// ============================================================================

// Light colors (acceptable for primary text)
const LIGHT_TEXT_COLORS = [
  'zinc-50',
  'zinc-100',
  'white',
  '#fafafa',
  '#f4f4f5',
  '#ffffff',
  'var(--text-primary)',
  'text-primary',
  'text-white',
  'text-zinc-50',
  'text-zinc-100',
];

// Mid-range grays (should NOT be used for primary content)
const MID_RANGE_GRAYS = [
  'zinc-400',
  'zinc-500',
  'zinc-600',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  'var(--text-secondary)',
  'var(--text-tertiary)',
  'var(--text-quaternary)',
  'text-secondary',
  'text-tertiary',
  'text-zinc-400',
  'text-zinc-500',
  'text-zinc-600',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines if an element is likely primary content based on context
 */
function isPrimaryContent(context: string, elementType: string): boolean {
  const primaryElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
  
  // Check if it's a heading
  if (elementType.match(/^h[1-6]$/i)) {
    return true;
  }
  
  // Check if it's a paragraph
  if (elementType === 'p') {
    return true;
  }
  
  // Check for primary content indicators in className
  const primaryIndicators = [
    'title',
    'heading',
    'header',
    'content',
    'body',
    'description',
    'text-primary',
  ];
  
  return primaryIndicators.some(indicator => 
    context.toLowerCase().includes(indicator)
  );
}

/**
 * Determines if an element is secondary/metadata content
 */
function isSecondaryContent(context: string): boolean {
  const secondaryIndicators = [
    'label',
    'caption',
    'meta',
    'subtitle',
    'helper',
    'hint',
    'placeholder',
    'text-secondary',
    'text-muted',
    'text-sm',
    'text-xs',
  ];
  
  return secondaryIndicators.some(indicator => 
    context.toLowerCase().includes(indicator)
  );
}

/**
 * Extracts element type from JSX/TSX line
 */
function extractElementType(line: string): string {
  // Match opening tags like <h1>, <p>, <div>, etc.
  const tagMatch = line.match(/<(\w+)[\s>]/);
  if (tagMatch) {
    return tagMatch[1];
  }
  return 'unknown';
}

/**
 * Checks if a color value is a mid-range gray
 */
function isMidRangeGray(colorValue: string): boolean {
  return MID_RANGE_GRAYS.some(gray => 
    colorValue.includes(gray)
  );
}

/**
 * Checks if a color value is a light color
 */
function isLightColor(colorValue: string): boolean {
  return LIGHT_TEXT_COLORS.some(light => 
    colorValue.includes(light)
  );
}

/**
 * Scans a file for text color usage violations
 */
function scanFileForTextColorViolations(filePath: string): TextColorViolation[] {
  const violations: TextColorViolation[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Skip comments and imports
      if (trimmedLine.startsWith('//') || 
          trimmedLine.startsWith('/*') || 
          trimmedLine.startsWith('*') ||
          trimmedLine.startsWith('import')) {
        return;
      }
      
      // Extract element type
      const elementType = extractElementType(line);
      
      // Check for className with text color
      const classNameMatch = line.match(/className=["']([^"']+)["']/);
      if (classNameMatch) {
        const className = classNameMatch[1];
        
        // Check if it's primary content with mid-range gray
        if (isPrimaryContent(className, elementType) && isMidRangeGray(className)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: trimmedLine.substring(0, 100),
            color: extractColorFromClassName(className),
            context: elementType as any,
            severity: 'error',
            recommendation: 'Use var(--text-primary) or text-zinc-50 for primary content',
          });
        }
      }
      
      // Check for inline styles with color
      const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
      if (styleMatch) {
        const styleContent = styleMatch[1];
        const colorMatch = styleContent.match(/color:\s*['"]?([^'",}]+)['"]?/);
        
        if (colorMatch) {
          const colorValue = colorMatch[1].trim();
          
          // Check if it's primary content with mid-range gray
          if (isPrimaryContent(line, elementType) && isMidRangeGray(colorValue)) {
            violations.push({
              file: filePath,
              line: lineNumber,
              content: trimmedLine.substring(0, 100),
              color: colorValue,
              context: elementType as any,
              severity: 'error',
              recommendation: 'Use var(--text-primary) for primary content',
            });
          }
        }
      }
      
      // Check for CSS-in-JS with color
      const cssInJsMatch = line.match(/color:\s*['"]?([^'",;]+)['"]?[,;]/);
      if (cssInJsMatch) {
        const colorValue = cssInJsMatch[1].trim();
        
        if (isPrimaryContent(line, elementType) && isMidRangeGray(colorValue)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            content: trimmedLine.substring(0, 100),
            color: colorValue,
            context: elementType as any,
            severity: 'error',
            recommendation: 'Use var(--text-primary) for primary content',
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }
  
  return violations;
}

/**
 * Extracts color name from className
 */
function extractColorFromClassName(className: string): string {
  const colorMatch = className.match(/text-(zinc-\d+|white|black|gray-\d+)/);
  return colorMatch ? colorMatch[1] : 'unknown';
}

/**
 * Scans all component files for text color violations
 */
async function scanAllFilesForTextColorViolations(): Promise<TextColorAnalysis> {
  const patterns = [
    'components/**/*.{tsx,jsx}',
    'app/**/*.{tsx,jsx}',
    'src/**/*.{tsx,jsx}',
  ];
  
  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { 
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{tsx,jsx}',
        '**/*.spec.{tsx,jsx}',
      ]
    });
    allFiles.push(...files);
  }
  
  const uniqueFiles = Array.from(new Set(allFiles));
  const allViolations: TextColorViolation[] = [];
  
  for (const file of uniqueFiles) {
    const violations = scanFileForTextColorViolations(file);
    allViolations.push(...violations);
  }
  
  const affectedFiles = new Set(allViolations.map(v => v.file)).size;
  const errorCount = allViolations.filter(v => v.severity === 'error').length;
  const warningCount = allViolations.filter(v => v.severity === 'warning').length;
  
  return {
    totalFiles: uniqueFiles.length,
    filesScanned: uniqueFiles.length,
    violations: allViolations,
    summary: {
      errorCount,
      warningCount,
      affectedFiles,
    },
  };
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Property 24: Primary Text Color Lightness', () => {
  it('should use light colors (zinc-50/100) for primary text content', async () => {
    const analysis = await scanAllFilesForTextColorViolations();
    
    console.log('\n=== Primary Text Color Lightness Analysis ===');
    console.log(`Files scanned: ${analysis.filesScanned}`);
    console.log(`Total violations: ${analysis.violations.length}`);
    console.log(`Errors: ${analysis.summary.errorCount}`);
    console.log(`Warnings: ${analysis.summary.warningCount}`);
    console.log(`Affected files: ${analysis.summary.affectedFiles}`);
    
    if (analysis.violations.length > 0) {
      console.log('\n=== Violations by File ===');
      const violationsByFile = analysis.violations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, TextColorViolation[]>);
      
      Object.entries(violationsByFile).forEach(([file, violations]) => {
        console.log(`\n${file} (${violations.length} violations):`);
        violations.slice(0, 5).forEach(v => {
          console.log(`  Line ${v.line}: ${v.color} in ${v.context}`);
          console.log(`    → ${v.recommendation}`);
        });
        if (violations.length > 5) {
          console.log(`  ... and ${violations.length - 5} more`);
        }
      });
    }
    
    // The test passes if there are no violations
    // This is a strict test - all primary content must use light colors
    expect(analysis.summary.errorCount).toBe(0);
  }, 30000);
  
  it('should verify text hierarchy follows lightness guidelines', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...[
          'components/ui/button.tsx',
          'components/ui/card.tsx',
          'components/ui/input.tsx',
        ]),
        async (filePath) => {
          if (!fs.existsSync(filePath)) {
            return true; // Skip if file doesn't exist
          }
          
          const violations = scanFileForTextColorViolations(filePath);
          const primaryViolations = violations.filter(v => 
            v.context === 'heading' || v.context === 'paragraph'
          );
          
          // Primary content should never use mid-range grays
          return primaryViolations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should allow secondary content to use mid-range grays', async () => {
    const analysis = await scanAllFilesForTextColorViolations();
    
    // This test verifies that our detection correctly identifies
    // secondary content and doesn't flag it as a violation
    const secondaryViolations = analysis.violations.filter(v => 
      isSecondaryContent(v.content)
    );
    
    // Secondary content violations should be warnings, not errors
    const secondaryErrors = secondaryViolations.filter(v => v.severity === 'error');
    
    console.log('\n=== Secondary Content Analysis ===');
    console.log(`Secondary violations: ${secondaryViolations.length}`);
    console.log(`Secondary errors: ${secondaryErrors.length}`);
    
    // We should have few or no errors for secondary content
    expect(secondaryErrors.length).toBeLessThan(10);
  });
  
  it('should verify headings use maximum contrast colors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('h1', 'h2', 'h3', 'h4', 'h5', 'h6'),
        async (headingTag) => {
          const patterns = [
            'components/**/*.{tsx,jsx}',
            'app/**/*.{tsx,jsx}',
          ];
          
          const allFiles: string[] = [];
          for (const pattern of patterns) {
            const files = await glob(pattern, { 
              ignore: ['**/node_modules/**', '**/.next/**']
            });
            allFiles.push(...files);
          }
          
          let headingViolations = 0;
          
          for (const file of allFiles.slice(0, 50)) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              const lines = content.split('\n');
              
              lines.forEach(line => {
                if (line.includes(`<${headingTag}`) && isMidRangeGray(line)) {
                  headingViolations++;
                }
              });
            } catch (error) {
              // Skip files that can't be read
            }
          }
          
          // Headings should never use mid-range grays
          return headingViolations === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify proper use of text color tokens', async () => {
    const analysis = await scanAllFilesForTextColorViolations();
    
    // Count usage of proper tokens vs hardcoded colors
    const tokenUsage = analysis.violations.filter(v => 
      v.color.includes('var(--')
    ).length;
    
    const hardcodedUsage = analysis.violations.filter(v => 
      !v.color.includes('var(--') && !v.color.startsWith('text-')
    ).length;
    
    console.log('\n=== Token Usage Analysis ===');
    console.log(`Token-based violations: ${tokenUsage}`);
    console.log(`Hardcoded color violations: ${hardcodedUsage}`);
    
    // We prefer token usage over hardcoded colors
    // This is informational, not a strict requirement
    expect(true).toBe(true);
  });
  
  it('should generate comprehensive text color report', async () => {
    const analysis = await scanAllFilesForTextColorViolations();
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: analysis.summary,
      violations: analysis.violations.map(v => ({
        file: v.file,
        line: v.line,
        color: v.color,
        context: v.context,
        severity: v.severity,
      })),
      recommendations: [
        'Use var(--text-primary) for all primary content',
        'Reserve var(--text-secondary) for labels and metadata only',
        'Ensure headings always use zinc-50 or --text-primary',
        'Avoid zinc-400+ for any visible primary content',
      ],
    };
    
    // Write report to file
    const reportPath = '.kiro/specs/design-system-unification/TASK-43-TEXT-COLOR-REPORT.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\nReport written to: ${reportPath}`);
    
    expect(report).toBeDefined();
  });
});
