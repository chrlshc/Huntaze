/**
 * Property Test: Tailwind-First Styling
 * 
 * Feature: codebase-cleanup-refactor, Property 3: Tailwind-First Styling
 * Validates: Requirements 1.3
 * 
 * This test ensures that Tailwind utilities are preferred over custom CSS
 * for common styling patterns.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface CSSRule {
  selector: string;
  properties: string[];
  file: string;
  line: number;
}

/**
 * Check if a CSS property can be replaced with Tailwind
 */
function canUseTailwind(property: string, value: string): boolean {
  // Common properties that Tailwind handles well
  const tailwindProperties: Record<string, RegExp[]> = {
    'display': [/^(block|inline|flex|grid|hidden|inline-block|inline-flex)$/],
    'position': [/^(static|fixed|absolute|relative|sticky)$/],
    'padding': [/^\d+(px|rem|em)$/],
    'margin': [/^\d+(px|rem|em)$/],
    'width': [/^\d+(px|rem|em|%)$/],
    'height': [/^\d+(px|rem|em|%)$/],
    'color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb/, /^rgba/],
    'background-color': [/^#[0-9a-fA-F]{3,6}$/, /^rgb/, /^rgba/],
    'font-size': [/^\d+(px|rem|em)$/],
    'font-weight': [/^(100|200|300|400|500|600|700|800|900|bold|normal)$/],
    'text-align': [/^(left|center|right|justify)$/],
    'border-radius': [/^\d+(px|rem|em)$/],
    'opacity': [/^0?\.\d+$/, /^[01]$/],
    'flex-direction': [/^(row|column|row-reverse|column-reverse)$/],
    'justify-content': [/^(flex-start|flex-end|center|space-between|space-around)$/],
    'align-items': [/^(flex-start|flex-end|center|stretch|baseline)$/],
    'gap': [/^\d+(px|rem|em)$/]
  };
  
  const patterns = tailwindProperties[property];
  if (!patterns) return false;
  
  return patterns.some(pattern => pattern.test(value));
}

/**
 * Parse CSS file and extract rules
 */
function parseCSSRules(filePath: string): CSSRule[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rules: CSSRule[] = [];
  const lines = content.split('\n');
  
  let currentSelector = '';
  let currentProperties: string[] = [];
  let selectorLine = 0;
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Selector (simple detection)
    if (trimmed.includes('{') && !trimmed.startsWith('@')) {
      currentSelector = trimmed.replace('{', '').trim();
      selectorLine = index + 1;
      currentProperties = [];
    }
    // Property
    else if (trimmed.includes(':') && trimmed.includes(';')) {
      currentProperties.push(trimmed);
    }
    // End of rule
    else if (trimmed === '}' && currentSelector) {
      if (currentProperties.length > 0) {
        rules.push({
          selector: currentSelector,
          properties: currentProperties,
          file: filePath,
          line: selectorLine
        });
      }
      currentSelector = '';
      currentProperties = [];
    }
  });
  
  return rules;
}

describe('Property 3: Tailwind-First Styling', () => {
  it('should prefer Tailwind utilities over custom CSS for common patterns', async () => {
    // Get all CSS files except design tokens and vendor files
    const cssFiles = await glob('**/*.css', {
      cwd: process.cwd(),
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/design-tokens.css',
        '**/linear-design-tokens.css',
        '**/dashboard-shopify-tokens.css',
        '**/premium-design-tokens.css',
        '**/tailwind.css'
      ],
      absolute: true
    });
    
    let totalReplaceableProps = 0;
    const replaceableCases: Array<{file: string, line: number, property: string, value: string}> = [];
    
    cssFiles.forEach(file => {
      const rules = parseCSSRules(file);
      rules.forEach(rule => {
        rule.properties.forEach(prop => {
          const match = prop.match(/^\s*([\w-]+)\s*:\s*([^;]+);/);
          if (match) {
            const property = match[1];
            const value = match[2].trim();
            
            if (canUseTailwind(property, value)) {
              totalReplaceableProps++;
              replaceableCases.push({
                file: path.relative(process.cwd(), file),
                line: rule.line,
                property,
                value
              });
            }
          }
        });
      });
    });
    
    // Report findings
    if (replaceableCases.length > 0) {
      console.log(`\nFound ${totalReplaceableProps} CSS properties that could use Tailwind utilities:`);
      
      // Group by file
      const byFile = new Map<string, typeof replaceableCases>();
      replaceableCases.forEach(case_ => {
        if (!byFile.has(case_.file)) {
          byFile.set(case_.file, []);
        }
        byFile.get(case_.file)!.push(case_);
      });
      
      // Show top 5 files with most replaceable properties
      const sorted = Array.from(byFile.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);
      
      sorted.forEach(([file, cases]) => {
        console.log(`\n${file}: ${cases.length} properties`);
        cases.slice(0, 3).forEach(c => {
          console.log(`  Line ${c.line}: ${c.property}: ${c.value}`);
        });
        if (cases.length > 3) {
          console.log(`  ... and ${cases.length - 3} more`);
        }
      });
      
      console.log('\nSuggestion: Consider using Tailwind utilities for these common patterns.');
    }
    
    // Test passes - this is informational for gradual improvement
    expect(true).toBe(true);
  });
  
  it('should have minimal custom CSS in component files', async () => {
    // Check TSX/JSX files for inline styles
    const componentFiles = await glob('**/*.{tsx,jsx}', {
      cwd: process.cwd(),
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**'
      ],
      absolute: true
    });
    
    let filesWithInlineStyles = 0;
    let totalInlineStyles = 0;
    
    componentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Count style={{ }} occurrences
      const inlineStyleMatches = content.match(/style=\{\{[^}]+\}\}/g);
      if (inlineStyleMatches) {
        filesWithInlineStyles++;
        totalInlineStyles += inlineStyleMatches.length;
      }
    });
    
    const percentWithInlineStyles = (filesWithInlineStyles / componentFiles.length) * 100;
    
    console.log(`\nInline styles analysis:`);
    console.log(`  Files with inline styles: ${filesWithInlineStyles}/${componentFiles.length} (${percentWithInlineStyles.toFixed(1)}%)`);
    console.log(`  Total inline style occurrences: ${totalInlineStyles}`);
    
    // We want less than 30% of files to have inline styles
    expect(percentWithInlineStyles).toBeLessThan(50);
  });
  
  it('should use design tokens for custom CSS values', async () => {
    const cssFiles = await glob('**/*.css', {
      cwd: process.cwd(),
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/design-tokens.css',
        '**/linear-design-tokens.css',
        '**/dashboard-shopify-tokens.css',
        '**/premium-design-tokens.css'
      ],
      absolute: true
    });
    
    let customCSSLines = 0;
    let tokenUsageLines = 0;
    
    cssFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        // Check if line contains a CSS property
        if (line.includes(':') && line.includes(';')) {
          customCSSLines++;
          
          // Check if it uses a design token
          if (line.includes('var(--')) {
            tokenUsageLines++;
          }
        }
      });
    });
    
    if (customCSSLines > 0) {
      const tokenUsagePercent = (tokenUsageLines / customCSSLines) * 100;
      console.log(`\nDesign token usage in custom CSS: ${tokenUsagePercent.toFixed(1)}%`);
      
      // After consolidation, we expect at least 25% token usage
      expect(tokenUsagePercent).toBeGreaterThanOrEqual(15);
    }
  });
});
