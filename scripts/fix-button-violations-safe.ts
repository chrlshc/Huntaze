#!/usr/bin/env node
/**
 * Safe Button Component Migration Script
 * 
 * This script provides a conservative approach to migrating button elements:
 * 1. Automatically fixes simple, safe cases
 * 2. Generates detailed reports for complex cases requiring manual review
 * 3. Preserves all functionality and formatting
 * 
 * Usage: npx tsx scripts/fix-button-violations-safe.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

interface Replacement {
  file: string;
  line: number;
  original: string;
  fixed: string;
  category: 'auto' | 'manual';
  reason: string;
}

const results: Replacement[] = [];
let filesModified = 0;
let autoFixes = 0;
let manualReviews = 0;

// Simple button patterns that are safe to auto-fix
const SAFE_PATTERNS = [
  // Simple buttons with basic className and text content
  {
    pattern: /<button\s+className="([^"]+)">([^<]+)<\/button>/g,
    replace: (match: string, className: string, text: string) => {
      const variant = detectVariant(className);
      return `<Button variant="${variant}">${text}</Button>`;
    },
    category: 'auto' as const,
  },
  // Buttons with onClick and simple text
  {
    pattern: /<button\s+onClick=\{([^}]+)\}\s+className="([^"]+)">([^<]+)<\/button>/g,
    replace: (match: string, onClick: string, className: string, text: string) => {
      const variant = detectVariant(className);
      return `<Button variant="${variant}" onClick={${onClick}}>${text}</Button>`;
    },
    category: 'auto' as const,
  },
  // Disabled buttons
  {
    pattern: /<button\s+disabled\s+className="([^"]+)">([^<]+)<\/button>/g,
    replace: (match: string, className: string, text: string) => {
      const variant = detectVariant(className);
      return `<Button variant="${variant}" disabled>${text}</Button>`;
    },
    category: 'auto' as const,
  },
];

function detectVariant(className: string): string {
  if (/btn-primary|bg-purple-600|bg-blue-600|bg-gradient/.test(className)) return 'primary';
  if (/btn-secondary|btn-ghost/.test(className)) return 'secondary';
  if (/btn-outline|border-2/.test(className)) return 'outline';
  if (/hover:bg-gray-50|hover:bg-gray-100/.test(className)) return 'ghost';
  if (/bg-red-|text-red-/.test(className)) return 'danger';
  return 'primary';
}

function hasButtonImport(content: string): boolean {
  return /import.*Button.*from.*@\/components\/ui\/button/.test(content);
}

function addButtonImport(content: string): string {
  if (hasButtonImport(content)) return content;
  
  // Find last import
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (/^import\s/.test(importLines[i])) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex >= 0) {
    importLines.splice(lastImportIndex + 1, 0, 'import { Button } from "@/components/ui/button";');
    return importLines.join('\n');
  }
  
  return 'import { Button } from "@/components/ui/button";\n\n' + content;
}

async function processFile(filePath: string): Promise<void> {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileModified = false;
  
  // Apply safe patterns
  for (const { pattern, replace, category } of SAFE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(originalContent)) !== null) {
      const original = match[0];
      const fixed = replace(match[0], ...match.slice(1));
      
      if (original !== fixed) {
        content = content.replace(original, fixed);
        fileModified = true;
        autoFixes++;
        
        const lineNumber = originalContent.slice(0, match.index).split('\n').length;
        results.push({
          file: filePath,
          line: lineNumber,
          original: original.slice(0, 100),
          fixed,
          category,
          reason: 'Simple button pattern - auto-fixed',
        });
      }
    }
  }
  
  // Detect complex cases that need manual review
  const complexButtonRegex = /<button[\s\S]*?<\/button>/g;
  let complexMatch;
  
  while ((complexMatch = complexButtonRegex.exec(originalContent)) !== null) {
    const buttonTag = complexMatch[0];
    
    // Skip if already a Button component
    if (buttonTag.includes('<Button')) continue;
    
    // Skip if already processed by safe patterns
    if (!content.includes(buttonTag)) continue;
    
    // This is a complex case
    manualReviews++;
    const lineNumber = originalContent.slice(0, complexMatch.index).split('\n').length;
    
    results.push({
      file: filePath,
      line: lineNumber,
      original: buttonTag.slice(0, 150) + (buttonTag.length > 150 ? '...' : ''),
      fixed: '// TODO: Manually migrate this button',
      category: 'manual',
      reason: 'Complex button pattern - requires manual review',
    });
  }
  
  // Write changes if not dry run
  if (fileModified && !DRY_RUN) {
    content = addButtonImport(content);
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
  } else if (fileModified) {
    filesModified++;
  }
}

async function main() {
  console.log('🔍 Starting Safe Button Migration...\n');
  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No files will be modified\n');
  }
  
  const files = await glob('**/*.{ts,tsx}', {
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
  
  for (const file of files) {
    try {
      await processFile(file);
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  
  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 Migration Summary');
  console.log('='.repeat(80));
  console.log(`Files modified: ${filesModified}`);
  console.log(`Auto-fixed: ${autoFixes}`);
  console.log(`Manual review needed: ${manualReviews}`);
  console.log(`Total changes: ${results.length}`);
  
  // Save detailed report
  const reportDir = '.kiro/specs/design-system-violations-fix';
  fs.mkdirSync(reportDir, { recursive: true });
  
  const reportPath = path.join(reportDir, 'BUTTON-MIGRATION-REPORT.md');
  const report = generateReport();
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  if (manualReviews > 0) {
    console.log(`\n⚠️  ${manualReviews} buttons require manual review`);
    console.log('   See report for details and migration instructions');
  }
  
  if (!DRY_RUN && autoFixes > 0) {
    console.log('\n✅ Auto-fixes applied successfully');
    console.log('   Please run tests to verify changes');
  }
}

function generateReport(): string {
  const autoFixed = results.filter(r => r.category === 'auto');
  const manualReview = results.filter(r => r.category === 'manual');
  
  return `# Button Component Migration Report

## Summary
- **Files Modified**: ${filesModified}
- **Auto-Fixed**: ${autoFixes}
- **Manual Review Needed**: ${manualReviews}
- **Total Changes**: ${results.length}

## Auto-Fixed Buttons (${autoFixed.length})

${autoFixed.map(r => `### ${r.file}:${r.line}
**Original:**
\`\`\`tsx
${r.original}
\`\`\`

**Fixed:**
\`\`\`tsx
${r.fixed}
\`\`\`

**Reason:** ${r.reason}

---
`).join('\n')}

## Manual Review Required (${manualReview.length})

${manualReview.map(r => `### ${r.file}:${r.line}
**Current Code:**
\`\`\`tsx
${r.original}
\`\`\`

**Migration Instructions:**
1. Import Button component: \`import { Button } from "@/components/ui/button"\`
2. Replace \`<button>\` with \`<Button>\`
3. Map className to variant prop:
   - \`btn-primary\` or \`bg-purple-600\` → \`variant="primary"\`
   - \`btn-secondary\` or \`btn-ghost\` → \`variant="secondary"\`
   - \`btn-outline\` or \`border-2\` → \`variant="outline"\`
4. Preserve all other props (onClick, disabled, type, aria-*, etc.)
5. Keep children content unchanged

**Example:**
\`\`\`tsx
<Button variant="primary" onClick={handleClick} disabled={loading}>
  Submit
</Button>
\`\`\`

**Reason:** ${r.reason}

---
`).join('\n')}

## Next Steps

1. ✅ Review auto-fixed changes and run tests
2. 📝 Manually migrate the ${manualReview.length} complex buttons listed above
3. 🧪 Run property-based test: \`npm run test -- tests/unit/properties/button-component-usage.property.test.ts --run\`
4. 🔍 Verify no visual regressions

## Button Component API Reference

\`\`\`tsx
<Button
  variant="primary" | "secondary" | "outline" | "ghost" | "tonal" | "danger" | "gradient" | "link"
  size="sm" | "md" | "lg" | "xl" | "pill"
  loading={boolean}
  disabled={boolean}
  onClick={handler}
  type="button" | "submit" | "reset"
  // ... all other standard button props
>
  Button Text
</Button>
\`\`\`
`;
}

main().catch(console.error);
