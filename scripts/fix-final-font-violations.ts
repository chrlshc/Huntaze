#!/usr/bin/env tsx

/**
 * Fix Final Font Violations
 * 
 * Last pass to catch any remaining violations
 * 
 * Usage: npx tsx scripts/fix-final-font-violations.ts [--dry-run]
 */

import * as fs from 'fs';
import { glob } from 'glob';

const fixes: string[] = [];

async function fixFile(filePath: string, dryRun: boolean): Promise<void> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    
    // Fix 0.75rem -> var(--text-xs)
    content = content.replace(/font-size:\s*0\.75rem/g, 'font-size: var(--text-xs)');
    
    // Fix remaining email font-families (keep for email compatibility but standardize)
    // These are in email templates and need to stay as inline styles for email clients
    if (filePath.includes('email') || filePath.includes('ses') || filePath.includes('magic-link') ||
        filePath.includes('contentNotificationService') || filePath.includes('email-verification') ||
        filePath.includes('signup-optimization') || filePath.includes('validationReporter')) {
      // For email templates, we keep system fonts but ensure they're complete
      // Email clients don't support CSS variables
      content = content.replace(
        /font-family:\s*Arial,\s*sans-serif/g,
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
      );
    }
    
    // Fix design-system.css special cases
    if (filePath.includes('design-system.css')) {
      // font-family: inherit is intentional, keep it
      // font-family: system-ui should use var(--font-sans)
      content = content.replace(/font-family:\s*system-ui;/g, 'font-family: var(--font-sans);');
    }
    
    // Fix hydrationDevtools.ts
    if (filePath.includes('hydrationDevtools.ts')) {
      content = content.replace(
        /font-family:\s*-apple-system[^;]+;/g,
        "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"
      );
    }
    
    if (content !== original && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf-8');
      fixes.push(filePath);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔧 Final Font Violations Fixer\n');
  console.log('================================================================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
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
  
  console.log(`📁 Processing ${files.length} files...\n`);
  
  for (const file of files) {
    await fixFile(file, dryRun);
  }
  
  console.log('\n================================================================================\n');
  console.log(`✅ Fixed ${fixes.length} files\n`);
  
  if (fixes.length > 0) {
    console.log('Files modified:');
    fixes.forEach(f => console.log(`  - ${f}`));
    console.log('');
  }
  
  if (!dryRun) {
    console.log('✨ All fixes applied!\n');
  }
}

main().catch(console.error);
