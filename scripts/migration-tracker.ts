#!/usr/bin/env ts-node
/**
 * Migration Tracker CLI
 * 
 * Command-line interface for managing the Linear UI migration tracking system.
 * 
 * Usage:
 *   npm run migration:status              - Show migration status
 *   npm run migration:report              - Generate full report
 *   npm run migration:next                - Show next components to migrate
 *   npm run migration:update <id> <status> - Update component status
 * 
 * Part of: linear-ui-performance-refactor
 * Requirements: 11.1, 11.2
 */

import {
  loadMigrationTracker,
  getMigrationSummary,
  getNextToMigrate,
  updateMigrationStatus,
  generateMigrationReport,
  filterMigrationEntries,
} from '../lib/utils/migration-tracker';
import type { MigrationStatus } from '../types/migration';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.blue}${text}${colors.reset}`);
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

function printInfo(text: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${text}`);
}

/**
 * Show migration status summary
 */
function showStatus() {
  printHeader('Linear UI Migration Status');
  
  const summary = getMigrationSummary();
  
  console.log(`\n${colors.bright}Overall Progress:${colors.reset}`);
  console.log(`  Total Components: ${summary.total}`);
  console.log(`  ${colors.green}Migrated: ${summary.migrated}${colors.reset}`);
  console.log(`  ${colors.yellow}In Progress: ${summary.inProgress}${colors.reset}`);
  console.log(`  ${colors.red}Legacy: ${summary.legacy}${colors.reset}`);
  console.log(`  Completion: ${summary.percentComplete}%`);
  
  // Progress bar
  const barLength = 40;
  const filled = Math.floor((summary.percentComplete / 100) * barLength);
  const empty = barLength - filled;
  const bar = `${colors.green}${'█'.repeat(filled)}${colors.reset}${'░'.repeat(empty)}`;
  console.log(`\n  [${bar}] ${summary.percentComplete}%\n`);
  
  console.log(`${colors.bright}By Category:${colors.reset}`);
  Object.entries(summary.byCategory).forEach(([category, stats]) => {
    const percent = stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0;
    console.log(`  ${category.padEnd(12)}: ${stats.migrated}/${stats.total} (${percent}%)`);
  });
  
  console.log(`\n${colors.bright}By Priority:${colors.reset}`);
  Object.entries(summary.byPriority).forEach(([priority, stats]) => {
    const percent = stats.total > 0 ? Math.round((stats.migrated / stats.total) * 100) : 0;
    const color = priority === 'high' ? colors.red : priority === 'medium' ? colors.yellow : colors.blue;
    console.log(`  ${color}${priority.padEnd(8)}${colors.reset}: ${stats.migrated}/${stats.total} (${percent}%)`);
  });
  
  if (summary.highPriorityRemaining > 0) {
    console.log(`\n${colors.yellow}⚠ ${summary.highPriorityRemaining} high-priority components remaining${colors.reset}`);
  } else {
    console.log(`\n${colors.green}✓ All high-priority components migrated!${colors.reset}`);
  }
}

/**
 * Show next components to migrate
 */
function showNext(limit: number = 5) {
  printHeader('Next Components to Migrate');
  
  const nextItems = getNextToMigrate(limit);
  
  if (nextItems.length === 0) {
    printSuccess('All components have been migrated!');
    return;
  }
  
  console.log(`\nShowing top ${limit} components by priority:\n`);
  
  nextItems.forEach((item, index) => {
    const priorityColor = item.priority === 'high' ? colors.red : 
                         item.priority === 'medium' ? colors.yellow : colors.blue;
    
    console.log(`${colors.bright}${index + 1}. ${item.name}${colors.reset}`);
    console.log(`   Path: ${colors.cyan}${item.path}${colors.reset}`);
    console.log(`   Priority: ${priorityColor}${item.priority}${colors.reset}`);
    console.log(`   Category: ${item.category}`);
    
    if (item.notes) {
      console.log(`   Notes: ${item.notes}`);
    }
    
    if (item.requirements && item.requirements.length > 0) {
      console.log(`   Requirements: ${item.requirements.join(', ')}`);
    }
    
    console.log('');
  });
}

/**
 * Update migration status
 */
function updateStatus(id: string, status: string, notes?: string) {
  printHeader('Update Migration Status');
  
  const validStatuses: MigrationStatus[] = ['legacy', 'in-progress', 'migrated'];
  
  if (!validStatuses.includes(status as MigrationStatus)) {
    printError(`Invalid status: ${status}`);
    console.log(`Valid statuses: ${validStatuses.join(', ')}`);
    process.exit(1);
  }
  
  try {
    updateMigrationStatus(id, status as MigrationStatus, notes);
    printSuccess(`Updated ${id} to status: ${status}`);
    
    if (status === 'migrated') {
      console.log(`\n${colors.green}🎉 Component migration completed!${colors.reset}`);
    }
  } catch (error) {
    printError(`Failed to update status: ${error}`);
    process.exit(1);
  }
}

/**
 * Generate and display full report
 */
function showReport() {
  const report = generateMigrationReport();
  console.log(report);
}

/**
 * List all components by status
 */
function listComponents(status?: MigrationStatus) {
  printHeader('Migration Components');
  
  const tracker = loadMigrationTracker();
  const entries = status 
    ? filterMigrationEntries({ status })
    : tracker.entries;
  
  if (entries.length === 0) {
    printInfo(`No components found${status ? ` with status: ${status}` : ''}`);
    return;
  }
  
  console.log(`\nShowing ${entries.length} component(s)${status ? ` (status: ${status})` : ''}:\n`);
  
  entries.forEach(entry => {
    const statusColor = entry.status === 'migrated' ? colors.green :
                       entry.status === 'in-progress' ? colors.yellow : colors.red;
    const statusIcon = entry.status === 'migrated' ? '✓' :
                      entry.status === 'in-progress' ? '⋯' : '○';
    
    console.log(`${statusColor}${statusIcon}${colors.reset} ${colors.bright}${entry.name}${colors.reset}`);
    console.log(`  ID: ${entry.id}`);
    console.log(`  Path: ${colors.cyan}${entry.path}${colors.reset}`);
    console.log(`  Status: ${statusColor}${entry.status}${colors.reset}`);
    console.log(`  Category: ${entry.category}`);
    console.log(`  Priority: ${entry.priority}`);
    
    if (entry.notes) {
      console.log(`  Notes: ${entry.notes}`);
    }
    
    console.log('');
  });
}

/**
 * Main CLI handler
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'status':
        showStatus();
        break;
      
      case 'next':
        const limit = args[1] ? parseInt(args[1], 10) : 5;
        showNext(limit);
        break;
      
      case 'update':
        if (args.length < 3) {
          printError('Usage: migration:update <id> <status> [notes]');
          process.exit(1);
        }
        updateStatus(args[1], args[2], args[3]);
        break;
      
      case 'report':
        showReport();
        break;
      
      case 'list':
        const status = args[1] as MigrationStatus | undefined;
        listComponents(status);
        break;
      
      case 'help':
      default:
        printHeader('Migration Tracker CLI');
        console.log('\nAvailable commands:\n');
        console.log('  status              Show migration status summary');
        console.log('  next [limit]        Show next components to migrate (default: 5)');
        console.log('  update <id> <status> [notes]  Update component status');
        console.log('  report              Generate full migration report');
        console.log('  list [status]       List all components (optionally filter by status)');
        console.log('  help                Show this help message');
        console.log('\nValid statuses: legacy, in-progress, migrated\n');
        break;
    }
  } catch (error) {
    printError(`Error: ${error}`);
    process.exit(1);
  }
}

// Run CLI
main();
