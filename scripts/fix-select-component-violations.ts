#!/usr/bin/env tsx

/**
 * Select Component Violation Fixer
 * 
 * Automatically migrates raw <select> elements to use the Select component
 * from the design system.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Fix {
  file: string;
  changes: number;
  success: boolean;
  error?: string;
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

/**
 * Files to fix based on the violation report
 */
const filesToFix = [
  'app/(app)/schedule/page.tsx',
  'app/(app)/repost/page.tsx',
  'app/(app)/design-system/page.tsx',
  'app/api/onboarding/complete/example-usage.tsx',
  'app/(app)/onlyfans/ppv/page.tsx',
  'app/(marketing)/platforms/onlyfans/analytics/page.tsx',
  'components/layout/SkeletonScreen.example.tsx',
  'components/content/AIAssistant.tsx',
  'src/components/product-mockups.tsx',
];

/**
 * Checks if a file already imports Select
 */
function hasSelectImport(content: string): boolean {
  return /import\s+{[^}]*\bSelect\b[^}]*}\s+from\s+['"]@\/components\/ui\/export-all['"]/.test(content);
}

/**
 * Adds Select import to the file
 */
function addSelectImport(content: string): string {
  const lines = content.split('\n');
  
  // Find existing import from export-all
  const exportAllImportIndex = lines.findIndex(line => 
    line.includes('from "@/components/ui/export-all"') || 
    line.includes("from '@/components/ui/export-all'")
  );

  if (exportAllImportIndex !== -1) {
    // Add Select to existing import
    const importLine = lines[exportAllImportIndex];
    if (!importLine.includes('Select')) {
      lines[exportAllImportIndex] = importLine.replace(
        /import\s+{([^}]*)}/,
        (match, imports) => {
          const trimmedImports = imports.trim();
          const newImports = trimmedImports ? `${trimmedImports}, Select` : 'Select';
          return `import { ${newImports} }`;
        }
      );
    }
  } else {
    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    // Add new import after last import
    const importStatement = 'import { Select } from "@/components/ui/export-all";';
    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, importStatement);
    } else {
      // No imports found, add at the beginning
      lines.unshift(importStatement, '');
    }
  }

  return lines.join('\n');
}

/**
 * Replaces <select> with <Select>
 */
function replaceSelectTags(content: string): { content: string; changes: number } {
  let changes = 0;
  
  // Replace opening tags
  content = content.replace(/<select(\s|>)/g, (match) => {
    changes++;
    return match.replace('select', 'Select');
  });
  
  // Replace closing tags
  content = content.replace(/<\/select>/g, (match) => {
    return '</Select>';
  });
  
  return { content, changes };
}

/**
 * Fixes a single file
 */
function fixFile(filePath: string): Fix {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        file: filePath,
        changes: 0,
        success: false,
        error: 'File not found'
      };
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let totalChanges = 0;

    // Add import if needed
    if (!hasSelectImport(content)) {
      content = addSelectImport(content);
      totalChanges++;
    }

    // Replace select tags
    const { content: newContent, changes } = replaceSelectTags(content);
    content = newContent;
    totalChanges += changes;

    // Write back to file
    if (totalChanges > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    return {
      file: filePath,
      changes: totalChanges,
      success: true
    };
  } catch (error) {
    return {
      file: filePath,
      changes: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}${colors.blue}Select Component Migration${colors.reset}\n`);
  console.log(`Fixing ${filesToFix.length} files...\n`);

  const results: Fix[] = [];
  let totalChanges = 0;
  let successCount = 0;
  let failCount = 0;

  for (const file of filesToFix) {
    const result = fixFile(file);
    results.push(result);

    if (result.success) {
      successCount++;
      totalChanges += result.changes;
      console.log(`${colors.green}✓${colors.reset} ${file} (${result.changes} changes)`);
    } else {
      failCount++;
      console.log(`${colors.red}✗${colors.reset} ${file} - ${result.error}`);
    }
  }

  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Files processed: ${filesToFix.length}`);
  console.log(`  ${colors.green}Successful: ${successCount}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`  Total changes: ${colors.cyan}${totalChanges}${colors.reset}\n`);

  if (failCount > 0) {
    console.log(`${colors.yellow}Some files failed to process. Please review manually.${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}${colors.bold}✓ Migration complete!${colors.reset}\n`);
  console.log(`Next steps:`);
  console.log(`  1. Run: ${colors.cyan}npx tsx scripts/check-select-component-violations.ts${colors.reset}`);
  console.log(`  2. Run: ${colors.cyan}npm run test -- tests/unit/properties/select-component-usage.property.test.ts --run${colors.reset}\n`);
}

main();
