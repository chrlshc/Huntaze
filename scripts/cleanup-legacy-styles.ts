#!/usr/bin/env ts-node
/**
 * Legacy Style Cleanup Script
 * 
 * Removes legacy styles and migration tracking system after migration is complete.
 * 
 * IMPORTANT: Only run this script when migration tracker shows 100% completion!
 * 
 * Usage:
 *   npm run cleanup:legacy-styles
 * 
 * Part of: linear-ui-performance-refactor
 * Requirements: 11.3
 */

import fs from 'fs';
import path from 'path';
import { loadMigrationTracker } from '../lib/utils/migration-tracker';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log('='.repeat(text.length));
}

function printSuccess(text: string) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function printWarning(text: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

function printError(text: string) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

/**
 * Check if migration is complete
 */
function checkMigrationStatus(): boolean {
  try {
    const tracker = loadMigrationTracker();
    return tracker.stats.percentComplete === 100;
  } catch (error) {
    printWarning('Could not load migration tracker. Proceeding with caution...');
    return false;
  }
}

/**
 * Remove a file if it exists
 */
function removeFile(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      printSuccess(`Removed: ${filePath}`);
      return true;
    } catch (error) {
      printError(`Failed to remove ${filePath}: ${error}`);
      return false;
    }
  } else {
    printWarning(`File not found (already removed?): ${filePath}`);
    return false;
  }
}

/**
 * Remove a directory if it exists
 */
function removeDirectory(dirPath: string): boolean {
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      printSuccess(`Removed directory: ${dirPath}`);
      return true;
    } catch (error) {
      printError(`Failed to remove ${dirPath}: ${error}`);
      return false;
    }
  } else {
    printWarning(`Directory not found (already removed?): ${dirPath}`);
    return false;
  }
}

/**
 * Update package.json to remove migration scripts
 */
function updatePackageJson(): boolean {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // Remove migration scripts
    const scriptsToRemove = [
      'migration:status',
      'migration:next',
      'migration:report',
      'migration:list',
      'migration:update',
    ];
    
    let removed = 0;
    scriptsToRemove.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        delete packageJson.scripts[script];
        removed++;
      }
    });
    
    if (removed > 0) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
      printSuccess(`Removed ${removed} migration scripts from package.json`);
      return true;
    } else {
      printWarning('No migration scripts found in package.json');
      return false;
    }
  } catch (error) {
    printError(`Failed to update package.json: ${error}`);
    return false;
  }
}

/**
 * Main cleanup function
 */
function main() {
  printHeader('Legacy Style Cleanup');
  
  // Check migration status
  console.log('\nChecking migration status...');
  const migrationComplete = checkMigrationStatus();
  
  if (!migrationComplete) {
    printError('Migration is not 100% complete!');
    console.log('\nPlease complete the migration before running this cleanup script.');
    console.log('Run: npm run migration:status');
    console.log('\nAborting cleanup...');
    process.exit(1);
  }
  
  printSuccess('Migration is 100% complete. Proceeding with cleanup...');
  
  // Phase 1: Remove backup files
  printHeader('Phase 1: Removing Backup Files');
  const backupFiles = [
    'app/layout-backup.tsx',
    'app/page-backup.tsx',
  ];
  
  backupFiles.forEach(removeFile);
  
  // Phase 2: Remove legacy CSS files
  printHeader('Phase 2: Removing Legacy CSS Files');
  const legacyCssFiles = [
    'app/animations.css',
    'app/glass.css',
    'app/mobile-emergency-fix.css',
    'app/mobile-optimized.css',
    'app/mobile.css',
    'app/nuclear-mobile-fix.css',
    'app/responsive-enhancements.css',
  ];
  
  legacyCssFiles.forEach(removeFile);
  
  // Phase 3: Remove migration tracking system
  printHeader('Phase 3: Removing Migration Tracking System');
  const migrationFiles = [
    '.kiro/specs/linear-ui-performance-refactor/migration-tracker.json',
    'lib/utils/migration-tracker.ts',
    'scripts/migration-tracker.ts',
    'types/migration.ts',
    '.kiro/specs/linear-ui-performance-refactor/MIGRATION_README.md',
    '.kiro/specs/linear-ui-performance-refactor/MIGRATION_TRACKING_GUIDE.md',
    '.kiro/specs/linear-ui-performance-refactor/MIGRATION_QUICK_REFERENCE.md',
  ];
  
  migrationFiles.forEach(removeFile);
  
  // Phase 4: Update package.json
  printHeader('Phase 4: Updating package.json');
  updatePackageJson();
  
  // Summary
  printHeader('Cleanup Complete');
  console.log('\n✅ Legacy styles have been removed!');
  console.log('\nNext steps:');
  console.log('1. Test all pages in development');
  console.log('2. Run visual regression tests');
  console.log('3. Verify mobile responsiveness');
  console.log('4. Run: npm test');
  console.log('5. Commit changes: git add . && git commit -m "chore: remove legacy styles"');
  console.log('\nIf you encounter any issues, you can rollback with: git revert HEAD\n');
}

// Run cleanup
main();

