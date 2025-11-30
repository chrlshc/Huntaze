#!/usr/bin/env node
/**
 * Fix Typography Token Violations
 * 
 * This script fixes hardcoded font-size values and arbitrary Tailwind classes
 * by replacing them with standard typography tokens.
 * 
 * Usage:
 *   npx tsx scripts/fix-typography-token-violations.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

interface Fix {
  file: string;
  line: number;
  original: string;
  fixed: string;
  reason: string;
}

const fixes: Fix[] = [];

// Mapping of arbitrary sizes to standard Tailwind classes
const SIZE_MAPPINGS: Record<string, string> = {
  '10px': 'text-xs',    // 0.75rem = 12px, but 10px is close enough
  '11px': 'text-xs',    // 0.75rem = 12px, 11px is close enough
  '12px': 'text-xs',    // 0.75rem = 12px
  '13px': 'text-sm',    // 0.875rem = 14px, 13px is close
  '14px': 'text-sm',    // 0.875rem = 14px
  '15px': 'text-base',  // 1rem = 16px, 15px is close
  '16px': 'text-base',  // 1rem = 16px
  '18px': 'text-lg',    // 1.125rem = 18px
  '20px': 'text-xl',    // 1.25rem = 20px
  '24px': 'text-2xl',   // 1.5rem = 24px
  '30px': 'text-3xl',   // 1.875rem = 30px
  '36px': 'text-4xl',   // 2.25rem = 36px
  '48px': 'text-5xl',   // 3rem = 48px
  '60px': 'text-6xl',   // 3.75rem = 60px
  '72px': 'text-7xl',   // 4.5rem = 72px
  '96px': 'text-8xl',   // 6rem = 96px
  '128px': 'text-9xl',  // 8rem = 128px
};

function fixFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  let newContent = content;

  // Pattern to match arbitrary Tailwind text classes like text-[11px]
  const arbitraryClassPattern = /text-\[(\d+)px\]/g;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let newLine = line;
    let lineModified = false;

    // Find all arbitrary text classes in this line
    const matches = [...line.matchAll(arbitraryClassPattern)];
    
    for (const match of matches) {
      const fullMatch = match[0]; // e.g., "text-[11px]"
      const sizeValue = match[1] + 'px'; // e.g., "11px"
      const standardClass = SIZE_MAPPINGS[sizeValue];

      if (standardClass) {
        newLine = newLine.replace(fullMatch, standardClass);
        lineModified = true;
        
        fixes.push({
          file: filePath,
          line: lineNumber,
          original: fullMatch,
          fixed: standardClass,
          reason: `Replace arbitrary class with standard token`,
        });
      }
    }

    if (lineModified) {
      newContent = newContent.replace(line, newLine);
      modified = true;
    }
  });

  if (modified && !DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
}

// Files to fix based on test output
const filesToFix = [
  'components/onboarding/huntaze-onboarding/StepItem.tsx',
  'app/auth/auth-client.tsx',
];

console.log('🔧 Fixing Typography Token Violations\n');
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}\n`);

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📝 Processing: ${file}`);
    fixFile(file);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n📊 Summary\n');
console.log(`Total fixes applied: ${fixes.length}`);

if (fixes.length > 0) {
  console.log('\n✅ Fixes:\n');
  
  // Group by file
  const fixesByFile = fixes.reduce((acc, fix) => {
    if (!acc[fix.file]) {
      acc[fix.file] = [];
    }
    acc[fix.file].push(fix);
    return acc;
  }, {} as Record<string, Fix[]>);

  Object.entries(fixesByFile).forEach(([file, fileFixes]) => {
    console.log(`📄 ${file}`);
    fileFixes.forEach(fix => {
      console.log(`   Line ${fix.line}: ${fix.original} → ${fix.fixed}`);
      console.log(`   Reason: ${fix.reason}`);
    });
    console.log('');
  });
}

if (DRY_RUN) {
  console.log('💡 Run without --dry-run to apply these changes\n');
} else {
  console.log('✅ All fixes applied successfully!\n');
}
