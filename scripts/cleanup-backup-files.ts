#!/usr/bin/env tsx
/**
 * Cleanup Script - Remove backup and redundant files
 * Part of design-system-unification spec cleanup phase
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CleanupResult {
  deleted: string[];
  errors: string[];
  totalSize: number;
}

const BACKUP_PATTERNS = [
  '*.backup',
  '*.old',
  '*.bak',
  '*-backup.*',
  '*-old.*',
  '*.v5-backup',
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
];

function findBackupFiles(): string[] {
  const files: string[] = [];
  
  for (const pattern of BACKUP_PATTERNS) {
    try {
      const excludeArgs = EXCLUDE_DIRS.map(dir => `-not -path "./${dir}/*"`).join(' ');
      const cmd = `find . -type f -name "${pattern}" ${excludeArgs} 2>/dev/null`;
      const output = execSync(cmd, { encoding: 'utf-8' });
      
      if (output.trim()) {
        files.push(...output.trim().split('\n'));
      }
    } catch (error) {
      // Continue with next pattern
    }
  }
  
  return [...new Set(files)]; // Remove duplicates
}

function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function deleteFile(filePath: string): boolean {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${filePath}:`, error);
    return false;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function cleanup(dryRun: boolean = false): Promise<CleanupResult> {
  const result: CleanupResult = {
    deleted: [],
    errors: [],
    totalSize: 0,
  };

  console.log('🔍 Scanning for backup files...\n');
  
  const backupFiles = findBackupFiles();
  
  if (backupFiles.length === 0) {
    console.log('✅ No backup files found!');
    return result;
  }

  console.log(`📋 Found ${backupFiles.length} backup files:\n`);
  
  for (const file of backupFiles) {
    const size = getFileSize(file);
    result.totalSize += size;
    
    console.log(`  ${file} (${formatBytes(size)})`);
    
    if (!dryRun) {
      if (deleteFile(file)) {
        result.deleted.push(file);
      } else {
        result.errors.push(file);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  
  if (dryRun) {
    console.log(`\n🔍 DRY RUN - Would delete ${backupFiles.length} files`);
    console.log(`💾 Total size: ${formatBytes(result.totalSize)}`);
    console.log('\n💡 Run without --dry-run to actually delete files');
  } else {
    console.log(`\n✅ Deleted ${result.deleted.length} files`);
    console.log(`💾 Freed up: ${formatBytes(result.totalSize)}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Failed to delete ${result.errors.length} files`);
    }
  }

  return result;
}

// Main execution
const dryRun = process.argv.includes('--dry-run');

cleanup(dryRun)
  .then(() => {
    console.log('\n✨ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
