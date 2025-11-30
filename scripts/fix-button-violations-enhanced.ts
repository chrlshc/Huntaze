#!/usr/bin/env node
/**
 * Enhanced Button Component Migration Script
 * 
 * This script handles more complex button patterns including:
 * - Multi-line buttons
 * - Buttons with nested elements (icons, spans, etc.)
 * - Buttons with complex event handlers
 * - Buttons with conditional classNames
 * 
 * Usage: npx tsx scripts/fix-button-violations-enhanced.ts [--dry-run] [--file=path/to/file.tsx]
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

interface Migration {
  file: string;
  line: number;
  original: string;
  fixed: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const results: Migration[] = [];
let filesModified = 0;
let highConfidence = 0;
let mediumConfidence = 0;
let lowConfidence = 0;

// Enhanced variant detection with more patterns
function detectVariant(className: string, content: string): string {
  // Primary patterns
  if (/btn-primary|bg-purple-600|bg-blue-600|bg-indigo-600|bg-gradient-to-r.*from-purple|bg-gradient-to-r.*from-blue/.test(className)) {
    return 'primary';
  }
  
  // Danger patterns
  if (/bg-red-|text-red-|border-red-|btn-danger/.test(className)) {
    return 'danger';
  }
  
  // Outline patterns
  if (/btn-outline|border-2.*border-purple|border-2.*border-blue/.test(className)) {
    return 'outline';
  }
  
  // Ghost patterns
  if (/btn-ghost|hover:bg-gray-50|hover:bg-gray-100/.test(className)) {
    return 'ghost';
  }
  
  // Secondary patterns
  if (/btn-secondary|bg-gray-|border.*border-gray/.test(className)) {
    return 'secondary';
  }
  
  // Default to primary for buttons with strong colors
  if (/bg-black|bg-orange-|bg-green-|bg-emerald-/.test(className)) {
    return 'primary';
  }
  
  return 'primary';
}

// Extract button content including nested elements
function extractButtonContent(buttonTag: string): string {
  const match = buttonTag.match(/>(.+)<\/button>/s);
  if (!match) return '';
  
  let content = match[1].trim();
  
  // Preserve indentation for multi-line content
  if (content.includes('\n')) {
    const lines = content.split('\n');
    const minIndent = Math.min(
      ...lines
        .filter(line => line.trim())
        .map(line => line.match(/^\s*/)?.[0].length || 0)
    );
    content = lines
      .map(line => line.slice(minIndent))
      .join('\n');
  }
  
  return content;
}

// Extract all props from button tag
function extractProps(buttonTag: string): {
  onClick?: string;
  disabled?: string;
  type?: string;
  className?: string;
  style?: string;
  ariaLabel?: string;
  other: string[];
} {
  const props: any = { other: [] };
  
  // Extract onClick (handle complex expressions with nested braces)
  const onClickMatch = buttonTag.match(/onClick=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  if (onClickMatch) props.onClick = onClickMatch[1];
  
  // Extract disabled
  const disabledMatch = buttonTag.match(/disabled(?:=\{([^}]+)\})?/);
  if (disabledMatch) {
    props.disabled = disabledMatch[1] || 'true';
  }
  
  // Extract type
  const typeMatch = buttonTag.match(/type=["']([^"']*)["']/);
  if (typeMatch) props.type = typeMatch[1];
  
  // Extract className
  const classMatch = buttonTag.match(/className=(?:["']([^"']*)["']|\{`([^`]*)`\}|\{([^}]+)\})/);
  if (classMatch) {
    props.className = classMatch[1] || classMatch[2] || classMatch[3];
  }
  
  // Extract style
  const styleMatch = buttonTag.match(/style=\{([^}]+)\}/);
  if (styleMatch) props.style = styleMatch[1];
  
  // Extract aria-label
  const ariaLabelMatch = buttonTag.match(/aria-label=["']([^"']*)["']/);
  if (ariaLabelMatch) props.ariaLabel = ariaLabelMatch[1];
  
  // Extract other aria and data attributes
  const ariaMatches = buttonTag.match(/aria-[a-z-]+(?:=["'][^"']*["']|=\{[^}]+\})/g);
  if (ariaMatches) {
    ariaMatches.forEach(attr => {
      if (!attr.includes('aria-label')) {
        props.other.push(attr);
      }
    });
  }
  
  const dataMatches = buttonTag.match(/data-[a-z-]+(?:=["'][^"']*["']|=\{[^}]+\})/g);
  if (dataMatches) props.other.push(...dataMatches);
  
  return props;
}

// Determine confidence level for migration
function assessConfidence(buttonTag: string, content: string): 'high' | 'medium' | 'low' {
  // High confidence: simple buttons with basic props
  if (
    !buttonTag.includes('\n') &&
    content.length < 50 &&
    !content.includes('<') &&
    !buttonTag.includes('ref=') &&
    !buttonTag.includes('...props')
  ) {
    return 'high';
  }
  
  // Low confidence: very complex buttons
  if (
    buttonTag.includes('ref=') ||
    buttonTag.includes('...props') ||
    buttonTag.includes('...rest') ||
    content.includes('dangerouslySetInnerHTML') ||
    (content.match(/<[^>]+>/g) || []).length > 5
  ) {
    return 'low';
  }
  
  // Medium confidence: everything else
  return 'medium';
}

// Migrate a single button tag
function migrateButton(buttonTag: string, filePath: string, lineNumber: number): Migration | null {
  const content = extractButtonContent(buttonTag);
  const props = extractProps(buttonTag);
  const confidence = assessConfidence(buttonTag, content);
  
  // Skip low confidence migrations
  if (confidence === 'low') {
    return {
      file: filePath,
      line: lineNumber,
      original: buttonTag.slice(0, 150) + (buttonTag.length > 150 ? '...' : ''),
      fixed: '// Requires manual migration',
      confidence,
      reason: 'Complex pattern - requires manual review',
    };
  }
  
  const variant = detectVariant(props.className || '', content);
  
  // Build Button component props
  const buttonProps: string[] = [`variant="${variant}"`];
  
  if (props.onClick) buttonProps.push(`onClick={${props.onClick}}`);
  if (props.disabled) buttonProps.push(props.disabled === 'true' ? 'disabled' : `disabled={${props.disabled}}`);
  if (props.type) buttonProps.push(`type="${props.type}"`);
  if (props.style) buttonProps.push(`style={${props.style}}`);
  if (props.ariaLabel) buttonProps.push(`aria-label="${props.ariaLabel}"`);
  if (props.other.length > 0) buttonProps.push(...props.other);
  
  // Handle multi-line buttons
  const isMultiLine = buttonTag.includes('\n');
  const indent = buttonTag.match(/^\s*/)?.[0] || '';
  
  let fixed: string;
  if (isMultiLine) {
    const contentIndent = content.match(/^\s*/)?.[0] || '  ';
    fixed = `${indent}<Button ${buttonProps.join(' ')}>\n${contentIndent}${content}\n${indent}</Button>`;
  } else {
    fixed = `<Button ${buttonProps.join(' ')}>${content}</Button>`;
  }
  
  return {
    file: filePath,
    line: lineNumber,
    original: buttonTag.slice(0, 150) + (buttonTag.length > 150 ? '...' : ''),
    fixed,
    confidence,
    reason: `${confidence} confidence migration`,
  };
}

// Check if Button import exists
function hasButtonImport(content: string): boolean {
  return /import.*\{[^}]*Button[^}]*\}.*from.*["']@\/components\/ui\/button["']/.test(content);
}

// Add Button import
function addButtonImport(content: string): string {
  if (hasButtonImport(content)) return content;
  
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, 'import { Button } from "@/components/ui/button";');
    return lines.join('\n');
  }
  
  return 'import { Button } from "@/components/ui/button";\n\n' + content;
}

// Process a single file
async function processFile(filePath: string): Promise<void> {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileModified = false;
  
  // Find all button tags (including multi-line)
  const buttonRegex = /<button(?:\s+[^>]*)?>([\s\S]*?)<\/button>/g;
  let match;
  const migrations: Migration[] = [];
  
  while ((match = buttonRegex.exec(originalContent)) !== null) {
    const buttonTag = match[0];
    
    // Skip if already a Button component
    if (buttonTag.includes('<Button')) continue;
    
    // Skip if in a comment
    const matchIndex = match.index;
    const beforeMatch = originalContent.slice(Math.max(0, matchIndex - 50), matchIndex);
    if (beforeMatch.includes('//') || beforeMatch.includes('/*')) continue;
    
    const lineNumber = originalContent.slice(0, matchIndex).split('\n').length;
    const migration = migrateButton(buttonTag, filePath, lineNumber);
    
    if (migration) {
      migrations.push(migration);
      
      // Only apply high and medium confidence migrations
      if (migration.confidence !== 'low') {
        content = content.replace(buttonTag, migration.fixed);
        fileModified = true;
        
        if (migration.confidence === 'high') highConfidence++;
        else mediumConfidence++;
      } else {
        lowConfidence++;
      }
    }
  }
  
  // Write changes if not dry run
  if (fileModified && !DRY_RUN) {
    content = addButtonImport(content);
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
  } else if (fileModified) {
    filesModified++;
  }
  
  results.push(...migrations);
}

async function main() {
  console.log('🚀 Starting Enhanced Button Migration...\n');
  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No files will be modified\n');
  }
  
  let files: string[];
  
  if (SPECIFIC_FILE) {
    files = [SPECIFIC_FILE];
    console.log(`📁 Processing specific file: ${SPECIFIC_FILE}\n`);
  } else {
    files = await glob('**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'components/ui/button.tsx',
        'scripts/**',
      ],
    });
    console.log(`📁 Scanning ${files.length} files...\n`);
  }
  
  for (const file of files) {
    try {
      await processFile(file);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary');
  console.log('='.repeat(80));
  console.log(`Files modified: ${filesModified}`);
  console.log(`High confidence migrations: ${highConfidence}`);
  console.log(`Medium confidence migrations: ${mediumConfidence}`);
  console.log(`Low confidence (manual review): ${lowConfidence}`);
  console.log(`Total migrations: ${results.length}`);
  
  // Save detailed report
  const reportDir = '.kiro/specs/design-system-violations-fix';
  fs.mkdirSync(reportDir, { recursive: true});
  
  const reportPath = path.join(reportDir, 'BUTTON-MIGRATION-ENHANCED-REPORT.md');
  const report = generateReport();
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (lowConfidence > 0) {
    console.log(`\n⚠️  ${lowConfidence} buttons require manual review`);
  }
  
  if (!DRY_RUN && (highConfidence + mediumConfidence) > 0) {
    console.log('\n✅ Enhanced migrations applied successfully');
    console.log('   Please run tests to verify changes');
  }
}

function generateReport(): string {
  const high = results.filter(r => r.confidence === 'high');
  const medium = results.filter(r => r.confidence === 'medium');
  const low = results.filter(r => r.confidence === 'low');
  
  return `# Enhanced Button Migration Report

## Summary
- **Files Modified**: ${filesModified}
- **High Confidence**: ${highConfidence}
- **Medium Confidence**: ${mediumConfidence}
- **Manual Review**: ${lowConfidence}
- **Total**: ${results.length}

## High Confidence Migrations (${high.length})

${high.map(r => `### ${r.file}:${r.line}
**Original:**
\`\`\`tsx
${r.original}
\`\`\`

**Fixed:**
\`\`\`tsx
${r.fixed}
\`\`\`

---
`).join('\n')}

## Medium Confidence Migrations (${medium.length})

${medium.map(r => `### ${r.file}:${r.line}
**Original:**
\`\`\`tsx
${r.original}
\`\`\`

**Fixed:**
\`\`\`tsx
${r.fixed}
\`\`\`

⚠️ **Please review** - Medium confidence migration

---
`).join('\n')}

## Manual Review Required (${low.length})

${low.map(r => `### ${r.file}:${r.line}
**Current Code:**
\`\`\`tsx
${r.original}
\`\`\`

**Reason:** ${r.reason}

**Migration Instructions:**
1. Import Button: \`import { Button } from "@/components/ui/button"\`
2. Replace \`<button>\` with \`<Button>\`
3. Map className to variant prop
4. Preserve all props and event handlers
5. Test thoroughly

---
`).join('\n')}

## Next Steps

1. Review medium confidence migrations
2. Manually migrate low confidence cases
3. Run tests: \`npm run test -- tests/unit/properties/button-component-usage.property.test.ts --run\`
4. Check for visual regressions
`;
}

main().catch(console.error);
