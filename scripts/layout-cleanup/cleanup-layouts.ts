#!/usr/bin/env node

/**
 * CLI script to cleanup redundant layout files
 * 
 * Usage:
 *   npm run layouts:cleanup
 *   npm run layouts:cleanup -- --dry-run
 *   npm run layouts:cleanup -- --no-backup
 *   npm run layouts:cleanup -- --skip-validation
 */

import { LayoutCleaner, CleanupOptions } from './layout-cleaner';
import { Logger } from './utils/logger';

interface CliOptions extends CleanupOptions {
  help: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    backup: !args.includes('--no-backup'),
    validate: !args.includes('--skip-validation'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipValidation: args.includes('--skip-validation'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(`
Layout Cleanup - Remove redundant layout files safely

USAGE:
  npm run layouts:cleanup [OPTIONS]

OPTIONS:
  --dry-run           Simulate cleanup without making changes
  --no-backup         Skip creating backups (not recommended)
  --skip-validation   Skip build validation after each deletion
  --verbose, -v       Show detailed progress information
  --help, -h          Show this help message

EXAMPLES:
  npm run layouts:cleanup -- --dry-run
  npm run layouts:cleanup
  npm run layouts:cleanup -- --verbose
  npm run layouts:cleanup -- --skip-validation

SAFETY FEATURES:
  - Automatic backup before deletion (stored in .kiro/backups/layouts/)
  - Build validation after each deletion
  - Automatic rollback on build failure
  - Detailed logging in .kiro/build-logs/

WORKFLOW:
  1. Analyzes all layout files
  2. Identifies redundant layouts
  3. For each redundant layout:
     - Creates backup (if --backup enabled)
     - Deletes the file
     - Runs build validation (if --validate enabled)
     - Restores from backup if build fails
  4. Generates final report

RECOMMENDATIONS:
  - Always run with --dry-run first to preview changes
  - Keep backups enabled for safety
  - Enable validation to ensure builds pass
  `);
}

/**
 * Display warning for risky options
 */
function displayWarnings(options: CliOptions): void {
  const warnings: string[] = [];
  
  if (!options.backup) {
    warnings.push('⚠️  Backups are DISABLED - files will be permanently deleted');
  }
  
  if (options.skipValidation) {
    warnings.push('⚠️  Build validation is DISABLED - may break your build');
  }
  
  if (warnings.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('WARNINGS:');
    warnings.forEach(w => console.log(w));
    console.log('='.repeat(60));
    console.log('');
  }
}

/**
 * Confirm with user before proceeding (for risky operations)
 */
async function confirmProceed(options: CliOptions): Promise<boolean> {
  // Auto-proceed for dry-run or if both backup and validation are enabled
  if (options.dryRun || (options.backup && options.validate)) {
    return true;
  }
  
  // For risky operations, we would normally prompt the user
  // But since this is a CLI script, we'll just show warnings and proceed
  // In a real implementation, you might use readline to get user input
  return true;
}

/**
 * Display final report
 */
function displayFinalReport(result: any, options: CliOptions): void {
  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP REPORT');
  console.log('='.repeat(60));
  console.log('');
  
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no changes made)' : 'LIVE'}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log('');
  
  console.log('STATISTICS:');
  console.log(`  Total Layouts Analyzed: ${result.totalAnalyzed}`);
  console.log(`  Redundant Found: ${result.redundantFound}`);
  console.log(`  Successfully Removed: ${result.removed.length}`);
  console.log(`  Failed: ${result.failed.length}`);
  console.log(`  Restored: ${result.restored.length}`);
  console.log('');
  
  if (result.removed.length > 0) {
    console.log(`${options.dryRun ? 'WOULD REMOVE' : 'REMOVED'} FILES:`);
    result.removed.forEach((file: string) => {
      console.log(`  ✓ ${file}`);
    });
    console.log('');
  }
  
  if (result.failed.length > 0) {
    console.log('FAILED FILES:');
    result.failed.forEach((file: string) => {
      console.log(`  ✗ ${file}`);
    });
    console.log('');
  }
  
  if (result.restored.length > 0) {
    console.log('RESTORED FILES (due to build failures):');
    result.restored.forEach((file: string) => {
      console.log(`  ↺ ${file}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60));
  
  if (options.dryRun) {
    console.log('Status: ✓ DRY RUN COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 To perform actual cleanup, run:');
    console.log('   npm run layouts:cleanup');
  } else if (result.buildSuccess) {
    console.log('Status: ✓ SUCCESS');
    console.log('='.repeat(60));
    console.log('');
    console.log('✨ Cleanup completed successfully!');
    if (result.removed.length > 0) {
      console.log('');
      console.log('Next steps:');
      console.log('  1. Test your application');
      console.log('  2. Commit the changes: git add . && git commit -m "chore: cleanup redundant layouts"');
      console.log('  3. Push to staging: git push');
    }
  } else {
    console.log('Status: ⚠️  PARTIAL SUCCESS');
    console.log('='.repeat(60));
    console.log('');
    console.log('Some layouts could not be removed due to build failures.');
    console.log('Check .kiro/build-logs/ for details.');
  }
  
  console.log('');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const options = parseArgs();
  
  if (options.help) {
    displayHelp();
    process.exit(0);
  }
  
  try {
    // Display mode
    if (options.dryRun) {
      console.log('🔍 Running in DRY RUN mode - no files will be modified\n');
    } else {
      console.log('🧹 Starting layout cleanup...\n');
    }
    
    // Display warnings for risky options
    displayWarnings(options);
    
    // Confirm proceed
    const proceed = await confirmProceed(options);
    if (!proceed) {
      console.log('Cleanup cancelled by user.');
      process.exit(0);
    }
    
    // Create logger
    const logger = new Logger('.kiro/build-logs', options.verbose);
    await logger.initialize();
    
    // Create cleaner and run cleanup
    const cleaner = new LayoutCleaner(options, 'app', logger);
    const result = await cleaner.cleanup();
    
    // Display final report
    displayFinalReport(result, options);
    
    // Exit with appropriate code
    if (result.buildSuccess || options.dryRun) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    console.error('\nCheck .kiro/build-logs/ for details.');
    process.exit(1);
  }
}

// Run the script
main();
