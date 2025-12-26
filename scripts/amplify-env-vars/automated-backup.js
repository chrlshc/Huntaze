#!/usr/bin/env node

/**
 * Automated Backup Script for Amplify Environment Variables
 * Runs scheduled backups and cleanup operations
 */

const { BackupRestoreService } = require('../../lib/amplify-env-vars/backupRestoreService');
const { AWSCLIWrapper } = require('../../lib/amplify-env-vars/awsCliWrapper');
const { logger } = require('../../lib/amplify-env-vars/logger');
const { program } = require('commander');
const cron = require('node-cron');
const fs = require('fs');

// Initialize services
const awsCli = new AWSCLIWrapper();
const backupService = new BackupRestoreService(awsCli);

// Configuration for automated backups
const DEFAULT_CONFIG = {
  schedule: '0 2 * * *', // Daily at 2 AM
  retentionDays: 30,
  maxBackups: 100,
  apps: [] // Will be populated from config file or CLI
};

class AutomatedBackupManager {
  constructor(config = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = false;
    this.scheduledJobs = new Map();
  }

  /**
   * Load configuration from file
   */
  loadConfig(configPath) {
    try {
      if (fs.existsSync(configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.config = { ...this.config, ...fileConfig };
        console.log(`✅ Configuration loaded from ${configPath}`);
      } else {
        console.log(`⚠️  Configuration file not found: ${configPath}`);
        console.log('   Using default configuration');
      }
    } catch (error) {
      console.error(`❌ Failed to load configuration: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Create backup for a specific app and branch
   */
  async createBackup(appId, branchName, description) {
    try {
      console.log(`📦 Creating backup for ${appId}/${branchName}...`);
      
      const backup = await backupService.createBackup(
        appId,
        branchName,
        description || `Automated backup - ${new Date().toISOString()}`,
        { automated: 'true', scheduler: 'cron' }
      );

      console.log(`✅ Backup created: ${backup.backupId}`);
      return backup;
    } catch (error) {
      console.error(`❌ Failed to create backup for ${appId}/${branchName}:`, error.message);
      throw error;
    }
  }

  /**
   * Run backup for all configured apps
   */
  async runScheduledBackup() {
    if (this.isRunning) {
      console.log('⚠️  Backup already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`🚀 Starting scheduled backup at ${startTime.toISOString()}`);

    try {
      const results = [];
      
      for (const appConfig of this.config.apps) {
        const { appId, branches } = appConfig;
        
        for (const branchName of branches) {
          try {
            const backup = await this.createBackup(
              appId, 
              branchName, 
              `Scheduled backup - ${startTime.toISOString()}`
            );
            results.push({ appId, branchName, success: true, backupId: backup.backupId });
          } catch (error) {
            results.push({ appId, branchName, success: false, error: error.message });
          }
        }
      }

      // Run cleanup
      console.log('🧹 Running backup cleanup...');
      const deletedCount = backupService.cleanupOldBackups(
        this.config.retentionDays,
        this.config.maxBackups
      );

      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log(`✅ Scheduled backup completed in ${duration}s`);
      console.log(`   Backups created: ${results.filter(r => r.success).length}`);
      console.log(`   Failures: ${results.filter(r => !r.success).length}`);
      console.log(`   Old backups cleaned: ${deletedCount}`);

      // Log results
      results.forEach(result => {
        if (result.success) {
          console.log(`   ✅ ${result.appId}/${result.branchName}: ${result.backupId}`);
        } else {
          console.log(`   ❌ ${result.appId}/${result.branchName}: ${result.error}`);
        }
      });

    } catch (error) {
      console.error('❌ Scheduled backup failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the backup scheduler
   */
  startScheduler() {
    if (this.config.apps.length === 0) {
      console.error('❌ No apps configured for backup. Please add apps to configuration.');
      process.exit(1);
    }

    console.log('🕐 Starting automated backup scheduler...');
    console.log(`   Schedule: ${this.config.schedule}`);
    console.log(`   Retention: ${this.config.retentionDays} days`);
    console.log(`   Max backups: ${this.config.maxBackups}`);
    console.log(`   Apps: ${this.config.apps.length}`);

    // Validate cron expression
    if (!cron.validate(this.config.schedule)) {
      console.error(`❌ Invalid cron schedule: ${this.config.schedule}`);
      process.exit(1);
    }

    // Schedule the backup job
    const job = cron.schedule(this.config.schedule, () => {
      this.runScheduledBackup().catch(error => {
        console.error('❌ Scheduled backup error:', error);
      });
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.scheduledJobs.set('main', job);

    console.log('✅ Backup scheduler started successfully');
    console.log('   Press Ctrl+C to stop the scheduler');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping backup scheduler...');
      this.stopScheduler();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping backup scheduler...');
      this.stopScheduler();
      process.exit(0);
    });

    // Keep the process running
    setInterval(() => {
      // Heartbeat to keep process alive
    }, 60000);
  }

  /**
   * Stop the backup scheduler
   */
  stopScheduler() {
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      console.log(`✅ Stopped scheduler: ${name}`);
    });
    this.scheduledJobs.clear();
  }

  /**
   * Generate default configuration file
   */
  generateConfig(outputPath) {
    const config = {
      schedule: "0 2 * * *",
      retentionDays: 30,
      maxBackups: 100,
      apps: [
        {
          appId: "your-amplify-app-id",
          branches: ["main", "staging", "development"]
        }
      ]
    };

    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
    console.log(`✅ Configuration template created: ${outputPath}`);
    console.log('   Please edit the file and add your actual app IDs and branches');
  }
}

// CLI interface
program
  .name('automated-backup')
  .description('Automated backup system for Amplify environment variables')
  .version('1.0.0');

program
  .command('start')
  .description('Start the automated backup scheduler')
  .option('-c, --config <file>', 'Configuration file path', 'config/amplify-env-vars/backup-config.json')
  .action(async (options) => {
    try {
      const manager = new AutomatedBackupManager();
      manager.loadConfig(options.config);
      manager.startScheduler();
    } catch (error) {
      console.error('❌ Failed to start scheduler:', error.message);
      process.exit(1);
    }
  });

program
  .command('run-once')
  .description('Run backup once for all configured apps')
  .option('-c, --config <file>', 'Configuration file path', 'config/amplify-env-vars/backup-config.json')
  .action(async (options) => {
    try {
      const manager = new AutomatedBackupManager();
      manager.loadConfig(options.config);
      await manager.runScheduledBackup();
      console.log('✅ One-time backup completed');
    } catch (error) {
      console.error('❌ One-time backup failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('generate-config')
  .description('Generate a configuration template')
  .option('-o, --output <file>', 'Output file path', 'config/amplify-env-vars/backup-config.json')
  .action((options) => {
    try {
      const manager = new AutomatedBackupManager();
      manager.generateConfig(options.output);
    } catch (error) {
      console.error('❌ Failed to generate config:', error.message);
      process.exit(1);
    }
  });

program
  .command('test-schedule')
  .description('Test the backup schedule configuration')
  .option('-s, --schedule <cron>', 'Cron schedule to test', '0 2 * * *')
  .action((options) => {
    try {
      if (cron.validate(options.schedule)) {
        console.log(`✅ Valid cron schedule: ${options.schedule}`);
        
        // Show next few execution times
        const job = cron.schedule(options.schedule, () => {}, { scheduled: false });
        console.log('   Next executions:');
        
        // This is a simplified example - in real implementation you'd use a cron parser
        console.log('   (Use a cron calculator to see exact execution times)');
      } else {
        console.log(`❌ Invalid cron schedule: ${options.schedule}`);
        console.log('   Examples:');
        console.log('     "0 2 * * *"     - Daily at 2:00 AM');
        console.log('     "0 */6 * * *"   - Every 6 hours');
        console.log('     "0 0 * * 0"     - Weekly on Sunday');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Schedule test failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show backup system status')
  .action(() => {
    try {
      console.log('📊 Automated Backup System Status\n');
      
      // Check if config exists
      const configPath = 'config/amplify-env-vars/backup-config.json';
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`✅ Configuration: ${configPath}`);
        console.log(`   Schedule: ${config.schedule || 'Not set'}`);
        console.log(`   Retention: ${config.retentionDays || 'Not set'} days`);
        console.log(`   Max backups: ${config.maxBackups || 'Not set'}`);
        console.log(`   Apps configured: ${config.apps ? config.apps.length : 0}`);
      } else {
        console.log(`❌ Configuration not found: ${configPath}`);
        console.log('   Run: node scripts/amplify-env-vars/automated-backup.js generate-config');
      }

      // Check recent backups
      const backups = backupService.listBackups();
      const recentBackups = backups.filter(backup => {
        const backupDate = new Date(backup.timestamp);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return backupDate > dayAgo;
      });

      console.log(`\n📋 Recent backups (24h): ${recentBackups.length}`);
      if (recentBackups.length > 0) {
        recentBackups.slice(0, 5).forEach(backup => {
          console.log(`   - ${backup.backupId} (${new Date(backup.timestamp).toLocaleString()})`);
        });
      }

    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}