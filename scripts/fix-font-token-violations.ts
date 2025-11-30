#!/usr/bin/env tsx

/**
 * Automatic Font Token Violation Fixer
 * 
 * This script automatically fixes font-family and font-size violations
 * by replacing hardcoded values with design tokens.
 * 
 * Usage: npx tsx scripts/fix-font-token-violations.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Font size mapping: hardcoded value -> design token
const FONT_SIZE_MAP: Record<string, string> = {
  // Pixel values
  '11px': 'var(--text-xs)',      // 12px token is closest
  '12px': 'var(--text-xs)',      // 12px
  '13px': 'var(--text-sm)',      // 14px token is closest
  '14px': 'var(--text-sm)',      // 14px
  '15px': 'var(--text-base)',    // 16px token is closest
  '16px': 'var(--text-base)',    // 16px
  '18px': 'var(--text-lg)',      // 18px
  '20px': 'var(--text-xl)',      // 20px
  '22px': 'var(--text-2xl)',     // 24px token is closest
  '24px': 'var(--text-2xl)',     // 24px
  '28px': 'var(--text-3xl)',     // 30px token is closest
  '30px': 'var(--text-3xl)',     // 30px
  '32px': 'var(--text-4xl)',     // 36px token is closest
  '36px': 'var(--text-4xl)',     // 36px
  '48px': 'var(--text-5xl)',     // 48px
  
  // Rem values
  '0.75rem': 'var(--text-xs)',   // 12px
  '0.875rem': 'var(--text-sm)',  // 14px
  '1rem': 'var(--text-base)',    // 16px
  '1.125rem': 'var(--text-lg)',  // 18px
  '1.25rem': 'var(--text-xl)',   // 20px
  '1.5rem': 'var(--text-2xl)',   // 24px
  '1.875rem': 'var(--text-3xl)', // 30px
  '2rem': 'var(--text-4xl)',     // 36px (closest to 2rem = 32px)
  '2.25rem': 'var(--text-4xl)',  // 36px
  '2.5rem': 'var(--text-5xl)',   // 48px (closest to 2.5rem = 40px)
  '3rem': 'var(--text-5xl)',     // 48px
  '3.5rem': 'var(--text-6xl)',   // 60px (closest to 3.5rem = 56px)
  '3.75rem': 'var(--text-6xl)',  // 60px
};

// Font family mapping: hardcoded value -> design token
const FONT_FAMILY_MAP: Record<string, string> = {
  'system-ui': 'var(--font-sans)',
  'Inter': 'var(--font-sans)',
  'Arial, sans-serif': 'var(--font-sans)',
  'monospace': 'var(--font-mono)',
  'inherit': 'inherit', // Keep inherit as-is
};

interface Fix {
  file: string;
  line: number;
  original: string;
  replacement: string;
  type: 'font-size' | 'font-family' | 'inline-font-size' | 'inline-font-family';
}

const fixes: Fix[] = [];
let filesProcessed = 0;
let violationsFixed = 0;

function fixFontSizeInCSS(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match font-size: <value>; patterns
    const fontSizeRegex = /font-size:\s*([^;]+);/g;
    let match;
    
    while ((match = fontSizeRegex.exec(line)) !== null) {
      const value = match[1].trim();
      const replacement = FONT_SIZE_MAP[value];
      
      if (replacement && !value.startsWith('var(')) {
        const original = match[0];
        const newValue = `font-size: ${replacement};`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue,
          type: 'font-size'
        });
        
        violationsFixed++;
      }
    }
  });
  
  return modified;
}

function fixFontFamilyInCSS(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match font-family: <value>; patterns
    const fontFamilyRegex = /font-family:\s*([^;]+);/g;
    let match;
    
    while ((match = fontFamilyRegex.exec(line)) !== null) {
      const value = match[1].trim();
      
      // Skip if already using a CSS variable
      if (value.startsWith('var(')) continue;
      
      // Check for system font stacks
      if (value.includes('-apple-system') || value.includes('BlinkMacSystemFont')) {
        const original = match[0];
        const newValue = `font-family: var(--font-sans);`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue,
          type: 'font-family'
        });
        
        violationsFixed++;
      }
      // Check for monospace fonts
      else if (value.toLowerCase().includes('monospace') || value.includes('Monaco')) {
        const original = match[0];
        const newValue = `font-family: var(--font-mono);`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue,
          type: 'font-family'
        });
        
        violationsFixed++;
      }
    }
  });
  
  return modified;
}

function fixInlineStylesInTSX(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match fontSize: '<value>' or fontSize: "<value>" patterns
    const fontSizeRegex = /fontSize:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = fontSizeRegex.exec(line)) !== null) {
      const value = match[1].trim();
      const replacement = FONT_SIZE_MAP[value];
      
      if (replacement && !value.startsWith('var(')) {
        const original = match[0];
        const newValue = `fontSize: '${replacement}'`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue,
          type: 'inline-font-size'
        });
        
        violationsFixed++;
      }
    }
    
    // Match fontFamily: '<value>' or fontFamily: "<value>" patterns
    const fontFamilyRegex = /fontFamily:\s*['"]([^'"]+)['"]/g;
    let familyMatch;
    
    while ((familyMatch = fontFamilyRegex.exec(line)) !== null) {
      const value = familyMatch[1].trim();
      
      // Skip if already using a CSS variable
      if (value.startsWith('var(')) continue;
      
      // Check for system font stacks
      if (value.includes('-apple-system') || value.includes('system-ui')) {
        const original = familyMatch[0];
        const newValue = `fontFamily: 'var(--font-sans)'`;
        modified = modified.replace(original, newValue);
        
        fixes.push({
          file: filePath,
          line: index + 1,
          original,
          replacement: newValue,
          type: 'inline-font-family'
        });
        
        violationsFixed++;
      }
    }
  });
  
  return modified;
}

async function processFile(filePath: string, dryRun: boolean): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    // Apply fixes based on file type
    if (filePath.endsWith('.css')) {
      modified = fixFontSizeInCSS(modified, filePath);
      modified = fixFontFamilyInCSS(modified, filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      modified = fixInlineStylesInTSX(modified, filePath);
    }
    
    // Write back if changes were made and not in dry-run mode
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
  
  console.log('🔧 Font Token Violation Fixer\n');
  console.log('================================================================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Get all files that need to be processed
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
  console.log('📊 Migration Summary\n');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Violations fixed: ${violationsFixed}\n`);
  
  if (fixes.length > 0) {
    console.log('✅ Fixes applied:\n');
    
    // Group fixes by file
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
    console.log('Next steps:');
    console.log('1. Review the changes with: git diff');
    console.log('2. Run property tests: npm run test -- tests/unit/properties/font-token-usage.property.test.ts --run');
    console.log('3. Commit the changes if tests pass\n');
  }
}

main().catch(console.error);
