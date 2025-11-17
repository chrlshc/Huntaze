#!/usr/bin/env node

/**
 * CLI script to analyze layout files and identify redundant layouts
 * 
 * Usage:
 *   npm run layouts:analyze
 *   npm run layouts:analyze -- --verbose
 *   npm run layouts:analyze -- --json
 */

import { LayoutAnalyzer } from './layout-analyzer';
import { Logger } from './utils/logger';
import { ensureDirectory } from './utils/file-operations';
import fs from 'fs/promises';
import path from 'path';

interface CliOptions {
  verbose: boolean;
  json: boolean;
  help: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  
  return {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(`
Layout Analyzer - Identify redundant layout files

USAGE:
  npm run layouts:analyze [OPTIONS]

OPTIONS:
  --verbose, -v    Show detailed analysis information
  --json           Output results in JSON format only
  --help, -h       Show this help message

EXAMPLES:
  npm run layouts:analyze
  npm run layouts:analyze -- --verbose
  npm run layouts:analyze -- --json

OUTPUT:
  Analysis report is saved to: .kiro/reports/layout-analysis.json
  Logs are saved to: .kiro/build-logs/

CATEGORIES:
  - Redundant:  Layouts that only return children (can be removed)
  - Necessary:  Layouts with logic, styles, or wrapping (must keep)
  - Review:     Layouts that need manual review
  `);
}

/**
 * Display analysis results in human-readable format
 */
function displayResults(report: any, verbose: boolean): void {
  console.log('\n' + '='.repeat(60));
  console.log('LAYOUT ANALYSIS REPORT');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('SUMMARY:');
  console.log(`  Total Layouts: ${report.total}`);
  console.log(`  Redundant: ${report.redundant.length} (can be removed)`);
  console.log(`  Necessary: ${report.necessary.length} (must keep)`);
  console.log(`  Review: ${report.review.length} (manual review needed)`);
  console.log('');
  
  if (report.redundant.length > 0) {
    console.log('REDUNDANT LAYOUTS (can be removed):');
    report.redundant.forEach((layout: any) => {
      console.log(`  ❌ ${layout.path}`);
      if (verbose) {
        console.log(`     Reason: ${layout.reason}`);
      }
    });
    console.log('');
  }
  
  if (report.necessary.length > 0 && verbose) {
    console.log('NECESSARY LAYOUTS (must keep):');
    report.necessary.forEach((layout: any) => {
      console.log(`  ✅ ${layout.path}`);
      if (verbose) {
        console.log(`     Reason: ${layout.reason}`);
      }
    });
    console.log('');
  }
  
  if (report.review.length > 0) {
    console.log('LAYOUTS NEEDING REVIEW:');
    report.review.forEach((layout: any) => {
      console.log(`  ⚠️  ${layout.path}`);
      if (verbose) {
        console.log(`     Reason: ${layout.reason}`);
      }
    });
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`Report saved to: .kiro/reports/layout-analysis.json`);
  console.log('='.repeat(60));
  console.log('');
  
  if (report.redundant.length > 0) {
    console.log('💡 Next steps:');
    console.log('   1. Review the redundant layouts above');
    console.log('   2. Run: npm run layouts:cleanup -- --dry-run');
    console.log('   3. If satisfied, run: npm run layouts:cleanup');
    console.log('');
  } else {
    console.log('✨ No redundant layouts found! Your codebase is clean.');
    console.log('');
  }
}

/**
 * Save report to file
 */
async function saveReport(report: any): Promise<void> {
  const reportDir = '.kiro/reports';
  const reportPath = path.join(reportDir, 'layout-analysis.json');
  
  await ensureDirectory(reportDir);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
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
    await logger.initialize();
    
    if (!options.json) {
      console.log('🔍 Analyzing layout files...\n');
    }
    
    // Create analyzer and run analysis
    const analyzer = new LayoutAnalyzer('app', logger);
    const report = await analyzer.analyzeAll();
    
    // Save report to file
    await saveReport(report);
    
    // Display results
    if (options.json) {
      // JSON output only
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Human-readable output
      displayResults(report, options.verbose);
    }
    
    // Exit with appropriate code
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the script
main();
