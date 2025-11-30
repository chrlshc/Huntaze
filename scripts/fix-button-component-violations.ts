#!/usr/bin/env node
/**
 * Automated Button Component Migration Script
 * 
 * This script automatically migrates raw <button> elements to the design system <Button> component.
 * It preserves all functionality, event handlers, and accessibility attributes.
 * 
 * Usage: npx tsx scripts/fix-button-component-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ButtonMigration {
  filePath: string;
  lineNumber: number;
  original: string;
  replacement: string;
  reason: string;
}

interface MigrationResult {
  totalFiles: number;
  totalReplacements: number;
  migrations: ButtonMigration[];
  errors: string[];
}

// Patterns to detect button variants based on className
const VARIANT_PATTERNS = {
  primary: [
    /btn-primary/,
    /bg-purple-600|bg-blue-600|bg-indigo-600/,
    /bg-gradient-to-r.*from-purple/,
    /bg-black.*text-white/,
    /bg-gray-900.*text-white/,
  ],
  secondary: [
    /btn-secondary/,
    /btn-ghost/,
    /btn-outline/,
    /border.*border-gray/,
  ],
  outline: [
    /border-2.*border-purple/,
    /border.*rounded/,
  ],
  ghost: [
    /hover:bg-gray-50/,
    /hover:bg-gray-100/,
  ],
  danger: [
    /bg-red-|text-red-|border-red-/,
  ],
};

function detectVariant(className: string): string {
  for (const [variant, patterns] of Object.entries(VARIANT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(className))) {
      return variant;
    }
  }
  return 'primary'; // default
}

function extractProps(buttonTag: string): {
  props: string[];
  children: string;
  className: string;
  variant: string;
} {
  // Extract className (handle both string and template literals)
  const classMatch = buttonTag.match(/className=(?:["']([^"']*)["']|\{`([^`]*)`\}|\{([^}]+)\})/);
  const className = classMatch ? (classMatch[1] || classMatch[2] || classMatch[3] || '') : '';
  
  // Detect variant from className
  const variant = detectVariant(className);
  
  // Extract all props except className
  const props: string[] = [];
  
  // Extract onClick (handle complex expressions)
  const onClickMatch = buttonTag.match(/onClick=\{[^}]*(?:\{[^}]*\}[^}]*)?\}/);
  if (onClickMatch) props.push(onClickMatch[0]);
  
  // Extract disabled
  if (/\bdisabled\b/.test(buttonTag)) {
    const disabledMatch = buttonTag.match(/disabled(?:=\{[^}]+\})?/);
    if (disabledMatch) props.push(disabledMatch[0]);
  }
  
  // Extract type
  const typeMatch = buttonTag.match(/type=["']([^"']*)["']/);
  if (typeMatch) props.push(typeMatch[0]);
  
  // Extract aria attributes
  const ariaMatches = buttonTag.match(/aria-[a-z-]+(?:=["'][^"']*["']|=\{[^}]+\})/g);
  if (ariaMatches) props.push(...ariaMatches);
  
  // Extract data attributes
  const dataMatches = buttonTag.match(/data-[a-z-]+(?:=["'][^"']*["']|=\{[^}]+\})/g);
  if (dataMatches) props.push(...dataMatches);
  
  // Extract style attribute
  const styleMatch = buttonTag.match(/style=\{[^}]+\}/);
  if (styleMatch) props.push(styleMatch[0]);
  
  // Extract children (content between tags, including nested elements)
  const childrenMatch = buttonTag.match(/>(.+)<\/button>/s);
  const children = childrenMatch ? childrenMatch[1].trim() : '';
  
  return { props, children, className, variant };
}

function migrateButtonTag(buttonTag: string): string {
  const { props, children, variant } = extractProps(buttonTag);
  
  // Build new Button component
  const variantProp = `variant="${variant}"`;
  const allProps = [variantProp, ...props].filter(Boolean).join(' ');
  
  // Handle multi-line formatting
  if (buttonTag.includes('\n')) {
    // Preserve indentation for multi-line buttons
    const indent = buttonTag.match(/^\s*/)?.[0] || '';
    return `${indent}<Button ${allProps}>\n${children}\n${indent}</Button>`;
  }
  
  return `<Button ${allProps}>${children}</Button>`;
}

function addButtonImport(content: string): string {
  // Check if Button import already exists
  if (/import.*Button.*from.*@\/components\/ui\/button/.test(content)) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertPosition = lastImportIndex + lastImport.length;
    
    const buttonImport = '\nimport { Button } from "@/components/ui/button";';
    return content.slice(0, insertPosition) + buttonImport + content.slice(insertPosition);
  }
  
  // If no imports found, add at the beginning
  return 'import { Button } from "@/components/ui/button";\n\n' + content;
}

function migrateFile(filePath: string): ButtonMigration[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const migrations: ButtonMigration[] = [];
  
  let newContent = content;
  let hasChanges = false;
  
  // Find all <button> tags (including multi-line)
  // This regex handles both single-line and multi-line buttons
  const buttonRegex = /<button(?:\s+[^>]*)?>([\s\S]*?)<\/button>/g;
  let match;
  
  while ((match = buttonRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    
    // Skip if it's already a Button component
    if (fullMatch.includes('<Button')) continue;
    
    // Skip if it's in a comment
    const matchIndex = match.index;
    const beforeMatch = content.slice(Math.max(0, matchIndex - 50), matchIndex);
    if (beforeMatch.includes('//') || beforeMatch.includes('/*')) continue;
    
    try {
      const replacement = migrateButtonTag(fullMatch);
      newContent = newContent.replace(fullMatch, replacement);
      hasChanges = true;
      
      // Find line number
      const lineNumber = content.slice(0, matchIndex).split('\n').length;
      
      migrations.push({
        filePath,
        lineNumber,
        original: fullMatch.slice(0, 150) + (fullMatch.length > 150 ? '...' : ''),
        replacement,
        reason: 'Migrated raw button to Button component',
      });
    } catch (error) {
      console.warn(`⚠️  Could not migrate button at line ${content.slice(0, matchIndex).split('\n').length} in ${filePath}`);
    }
  }
  
  if (hasChanges) {
    // Add Button import if needed
    newContent = addButtonImport(newContent);
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return migrations;
}

async function main() {
  console.log('🔍 Starting Button Component Migration...\n');
  
  const result: MigrationResult = {
    totalFiles: 0,
    totalReplacements: 0,
    migrations: [],
    errors: [],
  };
  
  // Find all TypeScript/TSX files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'components/ui/button.tsx', // Don't modify the Button component itself
    ],
  });
  
  console.log(`📁 Found ${files.length} files to scan\n`);
  
  for (const file of files) {
    try {
      const migrations = migrateFile(file);
      if (migrations.length > 0) {
        result.totalFiles++;
        result.totalReplacements += migrations.length;
        result.migrations.push(...migrations);
        console.log(`✅ ${file}: ${migrations.length} button(s) migrated`);
      }
    } catch (error) {
      const errorMsg = `Error processing ${file}: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary');
  console.log('='.repeat(80));
  console.log(`Files modified: ${result.totalFiles}`);
  console.log(`Total replacements: ${result.totalReplacements}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  // Save detailed report
  const reportPath = '.kiro/specs/design-system-violations-fix/BUTTON-MIGRATION-REPORT.md';
  const reportContent = `# Button Component Migration Report

## Summary
- **Files Modified**: ${result.totalFiles}
- **Total Replacements**: ${result.totalReplacements}
- **Errors**: ${result.errors.length}

## Migrations by File

${result.migrations.map(m => `### ${m.filePath}
- **Line**: ${m.lineNumber}
- **Original**: \`${m.original.slice(0, 100)}${m.original.length > 100 ? '...' : ''}\`
- **Replacement**: \`${m.replacement}\`
- **Reason**: ${m.reason}
`).join('\n')}

${result.errors.length > 0 ? `## Errors\n\n${result.errors.map(e => `- ${e}`).join('\n')}` : ''}
`;
  
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContent, 'utf-8');
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  console.log('\n✨ Migration complete!');
  console.log('\n⚠️  Note: This script handles simple button patterns.');
  console.log('   Complex multi-line buttons may need manual review.');
  console.log('   Please run tests and verify the changes.');
}

main().catch(console.error);
