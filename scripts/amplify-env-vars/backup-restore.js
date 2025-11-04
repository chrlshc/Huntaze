#!/usr/bin/env node

/**
 * Backup and Restore Script for Amplify Environment Variables
 * Provides comprehensive backup, restore, and management capabilities
 */

const { BackupRestoreService } = require('../../lib/amplify-env-vars/backupRestoreService');
const { AWSCLIWrapper } = require('../../lib/amplify-env-vars/awsCliWrapper');
const { logger } = require('../../lib/amplify-env-vars/logger');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

// Initialize services
const awsCli = new AWSCLIWrapper();
const backupService = new BackupRestoreService(awsCli);

// Configure CLI
program
  .name('backup-restore')
  .description('Backup and restore Amplify environment variables')
  .version('1.0.0');

// Create backup command
program
  .command('backup')
  .description('Create a backup of environment variables')
  .requiredOption('-a, --app-id <appId>', 'Amplify app ID')
  .requiredOption('-b, --branch <branch>', 'Branch name')
  .option('-d, --description <description>', 'Backup description')
  .option('-t, --tags <tags>', 'Backup tags (JSON format)')
  .option('--auto', 'Automated backup (adds automated tag)')
  .action(async (options) => {
    try {
      console.log(`📦 Creating backup for app ${options.appId}, branch ${options.branch}...`);

      let tags = {};
      if (options.tags) {
        try {
          tags = JSON.parse(options.tags);
        } catch (error) {
          console.error('❌ Invalid tags JSON format');
          process.exit(1);
        }
      }

      if (options.auto) {
        tags.automated = 'true';
        tags.type = 'scheduled';
      }

      const backup = await backupService.createBackup(
        options.appId,
        options.branch,
        options.description,
        tags
      );

      console.log('✅ Backup created successfully!');
      console.log(`   Backup ID: ${backup.backupId}`);
      console.log(`   Variables: ${backup.variableCount}`);
      console.log(`   Size: ${formatBytes(backup.size)}`);
      console.log(`   File: ${backup.filePath}`);
      console.log(`   Checksum: ${backup.checksum.substring(0, 16)}...`);
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message);
      process.exit(1);
    }
  });

// Restore backup command
program
  .command('restore')
  .description('Restore environment variables from a backup')
  .requiredOption('-i, --backup-id <backupId>', 'Backup ID to restore')
  .option('-a, --app-id <appId>', 'Target app ID (if different from backup)')
  .option('-b, --branch <branch>', 'Target branch (if different from backup)')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--selective <variables>', 'Comma-separated list of variables to restore')
  .option('--exclude <variables>', 'Comma-separated list of variables to exclude')
  .option('--confirm', 'Confirm the restore operation')
  .action(async (options) => {
    try {
      if (!options.dryRun && !options.confirm) {
        console.log('⚠️  This will overwrite existing environment variables.');
        console.log('   Use --dry-run to preview changes or --confirm to proceed.');
        return;
      }

      console.log(`🔄 Restoring from backup: ${options.backupId}...`);

      const restoreOptions = {
        dryRun: options.dryRun,
        selective: options.selective ? options.selective.split(',').map(v => v.trim()) : undefined,
        excludeVariables: options.exclude ? options.exclude.split(',').map(v => v.trim()) : undefined
      };

      const result = await backupService.restoreFromBackup(
        options.backupId,
        options.appId,
        options.branch,
        restoreOptions
      );

      if (options.dryRun) {
        console.log('🔍 Dry run results:');
        console.log(`   Target: ${result.targetAppId}/${result.targetBranch}`);
        console.log(`   Variables to restore: ${result.variablesRestored.length}`);
        result.variablesRestored.forEach(variable => {
          console.log(`     - ${variable}`);
        });
        console.log(`   Pre-restore backup: ${result.preRestoreBackupId}`);
      } else {
        if (result.success) {
          console.log('✅ Restore completed successfully!');
          console.log(`   Target: ${result.targetAppId}/${result.targetBranch}`);
          console.log(`   Variables restored: ${result.variablesRestored.length}`);
          console.log(`   Pre-restore backup: ${result.preRestoreBackupId}`);
        } else {
          console.log('❌ Restore failed verification');
          console.log('   The restore operation completed but verification failed.');
          console.log(`   You can restore from the pre-restore backup: ${result.preRestoreBackupId}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to restore backup:', error.message);
      process.exit(1);
    }
  });

// List backups command
program
  .command('list')
  .description('List available backups')
  .option('-a, --app-id <appId>', 'Filter by app ID')
  .option('-b, --branch <branch>', 'Filter by branch')
  .option('-n, --limit <number>', 'Limit number of results', '20')
  .option('--format <format>', 'Output format (table|json)', 'table')
  .action(async (options) => {
    try {
      const backups = backupService.listBackups(options.appId, options.branch);
      
      if (backups.length === 0) {
        console.log('📋 No backups found');
        return;
      }

      const limit = parseInt(options.limit);
      const displayBackups = backups.slice(0, limit);

      if (options.format === 'json') {
        console.log(JSON.stringify(displayBackups, null, 2));
        return;
      }

      console.log(`📋 Available Backups (${displayBackups.length}/${backups.length})\n`);
      
      displayBackups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.backupId}`);
        console.log(`   App: ${backup.appId}`);
        console.log(`   Branch: ${backup.branchName}`);
        console.log(`   Created: ${new Date(backup.timestamp).toLocaleString()}`);
        console.log(`   Description: ${backup.description}`);
        console.log(`   Variables: ${backup.variableCount}`);
        console.log(`   Size: ${formatBytes(backup.size)}`);
        console.log('');
      });

      if (backups.length > limit) {
        console.log(`... and ${backups.length - limit} more backups`);
        console.log(`Use --limit ${backups.length} to see all backups`);
      }
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      process.exit(1);
    }
  });

// Verify backup command
program
  .command('verify')
  .description('Verify backup integrity')
  .requiredOption('-i, --backup-id <backupId>', 'Backup ID to verify')
  .action(async (options) => {
    try {
      console.log(`🔍 Verifying backup: ${options.backupId}...`);

      const result = await backupService.verifyBackup(options.backupId);

      if (result.isValid) {
        console.log('✅ Backup verification passed!');
        if (result.metadata) {
          console.log(`   App: ${result.metadata.appId}`);
          console.log(`   Branch: ${result.metadata.branchName}`);
          console.log(`   Created: ${new Date(result.metadata.timestamp).toLocaleString()}`);
          console.log(`   Variables: ${result.metadata.variableCount}`);
          console.log(`   Checksum: ${result.metadata.checksum.substring(0, 16)}...`);
        }
      } else {
        console.log('❌ Backup verification failed!');
        console.log('   Errors:');
        result.errors.forEach(error => {
          console.log(`     - ${error}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to verify backup:', error.message);
      process.exit(1);
    }
  });

// Delete backup command
program
  .command('delete')
  .description('Delete a backup')
  .requiredOption('-i, --backup-id <backupId>', 'Backup ID to delete')
  .option('--confirm', 'Confirm the deletion')
  .action(async (options) => {
    try {
      if (!options.confirm) {
        console.log('⚠️  This will permanently delete the backup.');
        console.log('   Use --confirm to proceed with deletion.');
        return;
      }

      console.log(`🗑️  Deleting backup: ${options.backupId}...`);

      const deleted = backupService.deleteBackup(options.backupId);

      if (deleted) {
        console.log('✅ Backup deleted successfully!');
      } else {
        console.log('❌ Backup not found or could not be deleted');
      }
    } catch (error) {
      console.error('❌ Failed to delete backup:', error.message);
      process.exit(1);
    }
  });

// Cleanup old backups command
program
  .command('cleanup')
  .description('Clean up old backups')
  .option('--days <days>', 'Delete backups older than N days', '30')
  .option('--max <max>', 'Keep maximum N backups', '100')
  .option('--dry-run', 'Preview what would be deleted')
  .option('--confirm', 'Confirm the cleanup operation')
  .action(async (options) => {
    try {
      if (!options.dryRun && !options.confirm) {
        console.log('⚠️  This will permanently delete old backups.');
        console.log('   Use --dry-run to preview or --confirm to proceed.');
        return;
      }

      const retentionDays = parseInt(options.days);
      const maxBackups = parseInt(options.max);

      console.log(`🧹 Cleaning up backups older than ${retentionDays} days or exceeding ${maxBackups} total...`);

      if (options.dryRun) {
        const backups = backupService.listBackups();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const oldBackups = backups.filter(backup => 
          new Date(backup.timestamp) < cutoffDate
        );
        const excessBackups = backups.length > maxBackups 
          ? backups.slice(maxBackups) 
          : [];

        const toDelete = [...oldBackups, ...excessBackups];

        console.log(`🔍 Dry run results:`);
        console.log(`   Total backups: ${backups.length}`);
        console.log(`   Would delete: ${toDelete.length}`);
        
        if (toDelete.length > 0) {
          console.log('   Backups to delete:');
          toDelete.forEach(backup => {
            console.log(`     - ${backup.backupId} (${new Date(backup.timestamp).toLocaleDateString()})`);
          });
        }
      } else {
        const deletedCount = backupService.cleanupOldBackups(retentionDays, maxBackups);
        console.log(`✅ Cleanup completed! Deleted ${deletedCount} backups.`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup backups:', error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show backup system status')
  .action(async () => {
    try {
      console.log('📊 Backup System Status\n');

      const backups = backupService.listBackups();
      
      if (backups.length === 0) {
        console.log('📋 No backups found');
        return;
      }

      // Group by app and branch
      const byApp = {};
      let totalSize = 0;

      backups.forEach(backup => {
        if (!byApp[backup.appId]) {
          byApp[backup.appId] = {};
        }
        if (!byApp[backup.appId][backup.branchName]) {
          byApp[backup.appId][backup.branchName] = [];
        }
        byApp[backup.appId][backup.branchName].push(backup);
        totalSize += backup.size;
      });

      console.log(`📋 Total backups: ${backups.length}`);
      console.log(`💾 Total size: ${formatBytes(totalSize)}`);
      console.log(`📅 Latest backup: ${new Date(backups[0].timestamp).toLocaleString()}`);
      console.log(`📅 Oldest backup: ${new Date(backups[backups.length - 1].timestamp).toLocaleString()}\n`);

      console.log('📊 Backups by App/Branch:');
      Object.entries(byApp).forEach(([appId, branches]) => {
        console.log(`\n  ${appId}:`);
        Object.entries(branches).forEach(([branchName, branchBackups]) => {
          const latestBackup = branchBackups[0];
          console.log(`    ${branchName}: ${branchBackups.length} backups (latest: ${new Date(latestBackup.timestamp).toLocaleDateString()})`);
        });
      });

      // Check backup directory
      const backupDir = 'backups/amplify-env-vars';
      if (fs.existsSync(backupDir)) {
        const stats = fs.statSync(backupDir);
        console.log(`\n📁 Backup directory: ${backupDir}`);
        console.log(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
      }

    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  });

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}