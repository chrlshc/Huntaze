#!/usr/bin/env tsx

/**
 * Legacy Font Token Migrator
 * 
 * Migrates old custom font tokens to the unified design system tokens
 * 
 * Usage: npx tsx scripts/migrate-legacy-font-tokens.ts [--dry-run]
 */

import * as fs from 'fs';
import { glob } from 'glob';

// Map legacy tokens to new unified tokens
const LEGACY_TOKEN_MAP: Record<string, string> = {
  // Font size tokens
  'var(--font-size-xs)': 'var(--text-xs)',
  'var(--font-size-sm)': 'var(--text-sm)',
  'var(--font-size-small)': 'var(--text-sm)',
  'var(--font-size-body)': 'var(--text-base)',
  'var(--font-size-base)': 'var(--text-base)',
  'var(--font-size-md)': 'var(--text-base)',
  'var(--font-size-lg)': 'var(--text-lg)',
  'var(--font-size-xl)': 'var(--text-xl)',
  'var(--font-size-2xl)': 'var(--text-2xl)',
  'var(--font-size-3xl)': 'var(--text-3xl)',
  'var(--font-size-4xl)': 'var(--text-4xl)',
  'var(--font-size-5xl)': 'var(--text-5xl)',
  'var(--font-size-label)': 'var(--text-xs)',
  'var(--font-size-welcome)': 'var(--text-3xl)',
  'var(--font-size-h1)': 'var(--text-4xl)',
  'var(--font-size-h2)': 'var(--text-3xl)',
  'var(--font-size-h3)': 'var(--text-2xl)',
  
  // Font family tokens
  'var(--font-heading)': 'var(--font-sans)',
  'var(--font-body)': 'var(--font-sans)',
  'var(--font-inter)': 'var(--font-sans)',
};

interface Migration {
  file: string;
  line: number;
  original: string;
  replacement: string;
}

const migrations: Migration[] = [];
let filesProcessed = 0;
let tokensReplaced = 0;

function migrateTokensInFile(content: string, filePath: string): string {
  let modified = content;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    Object.entries(LEGACY_TOKEN_MAP).forEach(([oldToken, newToken]) => {
      if (line.includes(oldToken)) {
        const original = line;
        modified = modified.replace(new RegExp(oldToken.replace(/[()]/g, '\\$&'), 'g'), newToken);
        
        migrations.push({
          file: filePath,
          line: index + 1,
          original: oldToken,
          replacement: newToken
        });
        
        tokensReplaced++;
      }
    });
  });
  
  return modified;
}

async function processFile(filePath: string, dryRun: boolean): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const modified = migrateTokensInFile(content, filePath);
    
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
  
  console.log('🔄 Legacy Font Token Migrator\n');
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
  console.log('📊 Migration Summary\n');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Legacy tokens replaced: ${tokensReplaced}\n`);
  
  if (migrations.length > 0) {
    console.log('✅ Migrations applied:\n');
    
    // Group by file
    const migrationsByFile = migrations.reduce((acc, migration) => {
      if (!acc[migration.file]) {
        acc[migration.file] = [];
      }
      acc[migration.file].push(migration);
      return acc;
    }, {} as Record<string, Migration[]>);
    
    Object.entries(migrationsByFile).forEach(([file, fileMigrations]) => {
      console.log(`📄 ${file} (${fileMigrations.length} replacements)`);
      const uniqueMigrations = Array.from(new Set(fileMigrations.map(m => `${m.original} → ${m.replacement}`)));
      uniqueMigrations.slice(0, 3).forEach(migration => {
        console.log(`   ${migration}`);
      });
      if (uniqueMigrations.length > 3) {
        console.log(`   ... and ${uniqueMigrations.length - 3} more`);
      }
      console.log('');
    });
  }
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply these migrations\n');
  } else {
    console.log('\n✨ All migrations have been applied!\n');
  }
}

main().catch(console.error);
