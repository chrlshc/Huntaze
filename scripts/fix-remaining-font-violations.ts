#!/usr/bin/env tsx

/**
 * Fix Remaining Font Violations
 * 
 * Handles special cases like email templates and inline HTML
 * 
 * Usage: npx tsx scripts/fix-remaining-font-violations.ts [--dry-run]
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

// Font size replacements for inline HTML (emails, etc.)
const INLINE_HTML_FONT_SIZES: Record<string, string> = {
  '11px': '12px',  // Round up to nearest standard size
  '12px': '12px',
  '13px': '14px',
  '14px': '14px',
  '15px': '16px',
  '16px': '16px',
  '18px': '18px',
  '20px': '20px',
  '22px': '24px',
  '24px': '24px',
  '28px': '28px',
  '30px': '30px',
  '32px': '32px',
  '36px': '36px',
  '48px': '48px',
};

function fixEmailTemplates(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Fix font-family in email templates
    if (line.includes('font-family:') && line.includes('-apple-system')) {
      const original = line;
      // Keep system fonts for email compatibility
      modified = modified.replace(
        /font-family:\s*-apple-system[^;]+;/g,
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
      );
      
      if (original !== modified) {
        fixes.push({
          file: filePath,
          line: index + 1,
          original: 'font-family: (system fonts)',
          replacement: 'font-family: (standardized system fonts)'
        });
        violationsFixed++;
      }
    }
    
    // Fix Arial, sans-serif to include more fallbacks
    if (line.includes('font-family: Arial, sans-serif')) {
      const original = line;
      modified = modified.replace(
        /font-family:\s*Arial,\s*sans-serif/g,
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
      );
      
      if (original !== modified) {
        fixes.push({
          file: filePath,
          line: index + 1,
          original: 'font-family: Arial, sans-serif',
          replacement: 'font-family: (system fonts with Arial fallback)'
        });
        violationsFixed++;
      }
    }
    
    // Standardize font sizes in inline styles
    Object.entries(INLINE_HTML_FONT_SIZES).forEach(([oldSize, newSize]) => {
      const regex = new RegExp(`font-size:\\s*${oldSize}`, 'g');
      if (regex.test(line) && oldSize !== newSize) {
        const original = line;
        modified = modified.replace(regex, `font-size: ${newSize}`);
        
        if (original !== modified) {
          fixes.push({
            file: filePath,
            line: index + 1,
            original: `font-size: ${oldSize}`,
            replacement: `font-size: ${newSize}`
          });
          violationsFixed++;
        }
      }
    });
  });
  
  return modified;
}

function fixComponentStyles(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Fix animations.css special cases
    if (filePath.includes('animations') && line.includes('font-size:')) {
      // These are animation keyframes, standardize to closest token value
      const sizeMap: Record<string, string> = {
        '2.5rem': '3rem',    // 40px → 48px (--text-5xl)
        '3rem': '3rem',      // 48px
        '3.5rem': '3.75rem', // 56px → 60px (--text-6xl)
      };
      
      Object.entries(sizeMap).forEach(([oldSize, newSize]) => {
        if (line.includes(`font-size: ${oldSize}`) && oldSize !== newSize) {
          const original = line;
          modified = modified.replace(`font-size: ${oldSize}`, `font-size: ${newSize}`);
          
          if (original !== modified) {
            fixes.push({
              file: filePath,
              line: index + 1,
              original: `font-size: ${oldSize}`,
              replacement: `font-size: ${newSize}`
            });
            violationsFixed++;
          }
        }
      });
    }
  });
  
  return modified;
}

async function processFile(filePath: string, dryRun: boolean): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    
    // Apply fixes based on file type and location
    if (filePath.includes('email') || filePath.includes('ses') || filePath.includes('magic-link') || 
        filePath.includes('contentNotificationService') || filePath.includes('email-verification')) {
      modified = fixEmailTemplates(modified, filePath);
    } else if (filePath.includes('animations') || filePath.includes('MobileOptimizations')) {
      modified = fixComponentStyles(modified, filePath);
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
  
  console.log('🔧 Remaining Font Violations Fixer\n');
  console.log('================================================================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Get all files
  const patterns = [
    'lib/**/*.ts',
    'components/**/*.tsx',
    'app/**/*.css',
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
