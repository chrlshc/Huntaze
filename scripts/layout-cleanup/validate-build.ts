#!/usr/bin/env node

/**
 * CLI script to validate Next.js build
 * 
 * Usage:
 *   npm run build:validate
 *   npm run build:validate -- --verbose
 */

import { BuildValidator, BuildResult } from './build-validator';
import { Logger } from './utils/logger';

interface CliOptions {
  verbose: boolean;
  help: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(`
Build Validator - Validate Next.js build and log results

USAGE:
  npm run build:validate [OPTIONS]

OPTIONS:
  --verbose, -v    Show detailed build information
  --help, -h       Show this help message

EXAMPLES:
  npm run build:validate
  npm run build:validate -- --verbose

OUTPUT:
  Build logs are saved to: .kiro/build-logs/
  Latest log symlink: .kiro/build-logs/latest.log

EXIT CODES:
  0 - Build successful
  1 - Build failed

USAGE IN GIT HOOKS:
  This script is designed to be used in pre-commit hooks to ensure
  only working code is committed. See .husky/pre-commit for example.
  `);
}

/**
 * Display build result with colors
 */
function displayResult(result: BuildResult, verbose: boolean): void {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('BUILD VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log('');
  
  // Status
  if (result.success) {
    console.log(`${colors.green}✓ BUILD SUCCESSFUL${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ BUILD FAILED${colors.reset}`);
  }
  console.log('');
  
  // Duration
  console.log(`Duration: ${result.duration.toFixed(2)}s`);
  console.log(`Timestamp: ${new Date(result.timestamp).toLocaleString()}`);
  console.log('');
  
  // Statistics
  if (result.stats.pages > 0 || result.stats.routes > 0) {
    console.log('BUILD STATISTICS:');
    if (result.stats.pages > 0) {
      console.log(`  Pages: ${result.stats.pages}`);
    }
    if (result.stats.routes > 0) {
      console.log(`  Routes: ${result.stats.routes}`);
      console.log(`    Static: ${result.stats.staticPages}`);
      console.log(`    Server: ${result.stats.serverPages}`);
      if (result.stats.edgePages > 0) {
        console.log(`    Edge: ${result.stats.edgePages}`);
      }
    }
    if (result.stats.bundleSize > 0) {
      console.log(`  Bundle Size: ${result.stats.bundleSize.toFixed(2)} MB`);
    }
    console.log('');
  }
  
  // Errors
  if (result.errors.length > 0) {
    console.log(`${colors.red}ERRORS (${result.errors.length}):${colors.reset}`);
    
    // Group errors by type
    const errorsByType = {
      layout: result.errors.filter(e => e.type === 'layout'),
      component: result.errors.filter(e => e.type === 'component'),
      type: result.errors.filter(e => e.type === 'type'),
      other: result.errors.filter(e => e.type === 'other'),
    };
    
    // Display layout errors first (highest priority)
    if (errorsByType.layout.length > 0) {
      console.log(`\n  ${colors.red}Layout Errors (${errorsByType.layout.length}):${colors.reset}`);
      errorsByType.layout.forEach(error => {
        console.log(`    ${colors.red}✗${colors.reset} ${error.file}:${error.line}:${error.column}`);
        console.log(`      ${error.message}`);
      });
    }
    
    // Display other errors if verbose
    if (verbose) {
      if (errorsByType.component.length > 0) {
        console.log(`\n  ${colors.red}Component Errors (${errorsByType.component.length}):${colors.reset}`);
        errorsByType.component.forEach(error => {
          console.log(`    ${colors.red}✗${colors.reset} ${error.file}:${error.line}:${error.column}`);
          console.log(`      ${error.message}`);
        });
      }
      
      if (errorsByType.type.length > 0) {
        console.log(`\n  ${colors.red}Type Errors (${errorsByType.type.length}):${colors.reset}`);
        errorsByType.type.forEach(error => {
          console.log(`    ${colors.red}✗${colors.reset} ${error.file}:${error.line}:${error.column}`);
          console.log(`      ${error.message}`);
        });
      }
      
      if (errorsByType.other.length > 0) {
        console.log(`\n  ${colors.red}Other Errors (${errorsByType.other.length}):${colors.reset}`);
        errorsByType.other.forEach(error => {
          console.log(`    ${colors.red}✗${colors.reset} ${error.file}:${error.line}:${error.column}`);
          console.log(`      ${error.message}`);
        });
      }
    } else if (errorsByType.component.length + errorsByType.type.length + errorsByType.other.length > 0) {
      console.log(`\n  ${colors.gray}... and ${errorsByType.component.length + errorsByType.type.length + errorsByType.other.length} more errors${colors.reset}`);
      console.log(`  ${colors.gray}Run with --verbose to see all errors${colors.reset}`);
    }
    
    console.log('');
  }
  
  // Warnings
  if (result.warnings.length > 0) {
    console.log(`${colors.yellow}WARNINGS (${result.warnings.length}):${colors.reset}`);
    
    if (verbose) {
      result.warnings.forEach(warning => {
        console.log(`  ${colors.yellow}⚠${colors.reset}  ${warning.message} ${colors.gray}(${warning.count}x)${colors.reset}`);
      });
    } else {
      // Show first 3 warnings
      result.warnings.slice(0, 3).forEach(warning => {
        console.log(`  ${colors.yellow}⚠${colors.reset}  ${warning.message} ${colors.gray}(${warning.count}x)${colors.reset}`);
      });
      
      if (result.warnings.length > 3) {
        console.log(`  ${colors.gray}... and ${result.warnings.length - 3} more warnings${colors.reset}`);
        console.log(`  ${colors.gray}Run with --verbose to see all warnings${colors.reset}`);
      }
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  
  // Next steps
  if (result.success) {
    console.log(`${colors.green}✓ Build validation passed${colors.reset}`);
    console.log('');
    console.log('Your code is ready to commit and push.');
  } else {
    console.log(`${colors.red}✗ Build validation failed${colors.reset}`);
    console.log('');
    console.log('Please fix the errors above before committing.');
    console.log('');
    console.log('Tips:');
    console.log('  - Check the error messages for file locations');
    console.log('  - Run npm run build locally to debug');
    console.log(`  - Check logs: ${colors.cyan}.kiro/build-logs/latest.log${colors.reset}`);
    console.log('  - Use git commit --no-verify to bypass (not recommended)');
  }
  
  console.log('');
}

/**
 * Display compact result (for git hooks)
 */
function displayCompactResult(result: BuildResult): void {
  if (result.success) {
    console.log('✅ Build validation passed');
  } else {
    console.log('❌ Build validation failed');
    console.log('');
    console.log(`Found ${result.errors.length} error(s):`);
    
    // Show first 5 errors
    result.errors.slice(0, 5).forEach(error => {
      console.log(`  ✗ ${error.file}:${error.line} - ${error.message.substring(0, 80)}`);
    });
    
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more errors`);
    }
    
    console.log('');
    console.log('Run "npm run build:validate -- --verbose" for details');
  }
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
    // Create logger
    const logger = new Logger('.kiro/build-logs', options.verbose);
    
    // Create validator and run validation
    const validator = new BuildValidator('.kiro/build-logs', logger);
    
    if (options.verbose) {
      console.log('🔍 Validating build...\n');
    }
    
    const result = await validator.validate();
    
    // Display results
    if (options.verbose) {
      displayResult(result, options.verbose);
    } else {
      displayCompactResult(result);
    }
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error during build validation:', error);
    process.exit(1);
  }
}

// Run the script
main();
