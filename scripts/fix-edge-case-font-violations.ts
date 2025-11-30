#!/usr/bin/env tsx

/**
 * Fix Edge Case Font Violations
 * 
 * Handles special patterns like !important, template literals, etc.
 * 
 * Usage: npx tsx scripts/fix-edge-case-font-violations.ts [--dry-run]
 */

import * as fs from 'fs';
import { glob } from 'glob';

interface Fix {
  file: string;
  line: number;
  original: string;
  replacement: string;
}

const fixes: Fix[] = [];
let filesProcessed = 0;
let violationsFixed = 0;

const FONT_SIZE_MAP: Record<string, string> = {
  '11px': 'var(--text-xs)',
  '12px': 'var(--text-xs)',
  '13px': 'var(--text-sm)',
  '14px': 'var(--text-sm)',
  '15px': 'var(--text-base)',
  '16px': 'var(--text-base)',
  '18px': 'var(--text-lg)',
  '20px': 'var(--text-xl)',
  '24px': 'var(--text-2xl)',
  '28px': 'var(--text-3xl)',
  '30px': 'var(--text-3xl)',
  '32px': 'var(--text-4xl)',
  '36px': 'var(--text-4xl)',
  '48px': 'var(--text-5xl)',
  '0.875rem': 'var(--text-sm)',
  '1rem': 'var(--text-base)',
  '1.125rem': 'var(--text-lg)',
  '1.25rem': 'var(--text-xl)',
  '1.5rem': 'var(--text-2xl)',
  '2rem': 'var(--text-4xl)',
  '3rem': 'var(--text-5xl)',
  '3.75rem': 'var(--text-6xl)',
};

function fixFile(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Fix font-size with !important
    const importantRegex = /font-size:\s*([^;!]+)\s*!important/g;
    let match;
    
    while ((match = importantRegex.exec(line)) !== null) {
      const value = match[1].trim();
      const replacement = FONT_SIZE_MAP[value];
      
      if (replacement) {
        const original = match[0];
        const newValue = `font-size: ${replacement} !important`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue
        });
        
        violationsFixed++;
      }
    }
    
    // Fix template literal font sizes like `${fontSize}px`
    if (line.includes('fontSize: `${') && line.includes('}px`')) {
      // This is dynamic, we'll document it but not change it
      // These are typically calculated values
    }
    
    // Fix remaining standard font-size declarations
    const standardRegex = /font-size:\s*([^;]+);/g;
    let standardMatch;
    
    while ((standardMatch = standardRegex.exec(line)) !== null) {
      const value = standardMatch[1].trim();
      const replacement = FONT_SIZE_MAP[value];
      
      if (replacement && !value.startsWith('var(') && !value.includes('!important')) {
        const original = standardMatch[0];
        const newValue = `font-size: ${replacement};`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue
        });
        
        violationsFixed++;
      }
    }
    
    // Fix inline fontSize in TSX
    const inlineRegex = /fontSize:\s*['"]([^'"]+)['"]/g;
    let inlineMatch;
    
    while ((inlineMatch = inlineRegex.exec(line)) !== null) {
      const value = inlineMatch[1].trim();
      const replacement = FONT_SIZE_MAP[value];
      
      if (replacement && !value.startsWith('var(')) {
        const original = inlineMatch[0];
        const newValue = `fontSize: '${replacement}'`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue
        });
        
        violationsFixed++;
      }
    }
    
    // Fix font-family declarations
    if (line.includes('font-family:') && !line.includes('var(--font')) {
      if (line.includes('monospace') || line.includes('Monaco')) {
        const original = line;
        modified = modified.replace(/font-family:[^;]+;/, 'font-family: var(--font-mono);');
        
        if (original !== modified) {
          fixes.push({
            file: filePath,
            line: index + 1,
            original: 'font-family: (monospace)',
            replacement: 'font-family: var(--font-mono)'
          });
          violationsFixed++;
        }
      } else if (line.includes('system-ui') || line.includes('inherit')) {
        // Keep inherit, fix system-ui
        if (!line.includes('inherit')) {
          const original = line;
          modified = modified.replace(/font-family:[^;]+;/, 'font-family: var(--font-sans);');
          
          if (original !== modified) {
            fixes.push({
              file: filePath,
              line: index + 1,
              original: 'font-family: (system fonts)',
              replacement: 'font-family: var(--font-sans)'
            });
            violationsFixed++;
          }
        }
      }
    }
  });
  
  return modified;
}

async function processFile(filePath: string, dryRun: boolean): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const modified = fixFile(content, filePath);
    
    if (modified !== content && !dryRun) {
      fs.writeFileSync(filePath, modified, 'utf-8');
    }
    
    filesProcessed++;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔧 Edge Case Font Violations Fixer\n');
  console.log('================================================================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Get all files
  const patterns = [
    'app/**/*.{css,tsx,ts}',
    'components/**/*.{css,tsx,ts}',
    'styles/**/*.css',
    'lib/**/*.{css,tsx,ts}',
  ];
  
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    });
    files.push(...matches);
  }
  
  console.log(`📁 Found ${files.length} files to process\n`);
  
  // Process each file
  for (const file of files) {
    await processFile(file, dryRun);
  }
  
  // Generate report
  console.log('\n================================================================================\n');
  console.log('📊 Fix Summary\n');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Violations fixed: ${violationsFixed}\n`);
  
  if (fixes.length > 0) {
    console.log('✅ Fixes applied:\n');
    
    // Group by file
    const fixesByFile = fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) {
        acc[fix.file] = [];
      }
      acc[fix.file].push(fix);
      return acc;
    }, {} as Record<string, Fix[]>);
    
    Object.entries(fixesByFile).forEach(([file, fileFixes]) => {
      console.log(`📄 ${file} (${fileFixes.length} fixes)`);
      fileFixes.slice(0, 3).forEach(fix => {
        console.log(`   Line ${fix.line}: ${fix.original} → ${fix.replacement}`);
      });
      if (fileFixes.length > 3) {
        console.log(`   ... and ${fileFixes.length - 3} more`);
      }
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply these fixes\n');
  } else {
    console.log('\n✨ All fixes have been applied!\n');
  }
}

main().catch(console.error);
