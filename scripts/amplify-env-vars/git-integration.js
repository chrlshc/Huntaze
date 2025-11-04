#!/usr/bin/env node

/**
 * Git Integration Script for Amplify Environment Variables
 * Provides Git-based version control and change tracking for configuration files
 */

const { GitIntegrationService } = require('../../lib/amplify-env-vars/gitIntegration');
const { logger } = require('../../lib/amplify-env-vars/logger');
const { program } = require('commander');
const path = require('path');

// Configure CLI
program
  .name('git-integration')
  .description('Git integration for Amplify environment variables')
  .version('1.0.0');

// Initialize Git integration
program
  .command('init')
  .description('Initialize Git integration for configuration tracking')
  .option('--config-dir <dir>', 'Configuration directory', 'config/amplify-env-vars')
  .action(async (options) => {
    try {
      const gitService = new GitIntegrationService(options.configDir);
      await gitService.initialize();
      console.log('✅ Git integration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Git integration:', error.message);
      process.exit(1);
    }
  });

// Track configuration change
program
  .command('track')
  .description('Track a configuration change in Git')
  .requiredOption('-f, --file <file>', 'Configuration file path')
  .requiredOption('-e, --env <environment>', 'Environment name')
  .requiredOption('-m, --message <message>', 'Change description')
  .option('-a, --author <author>', 'Change author')
  .action(async (options) => {
    try {
      const gitService = new GitIntegrationService();
      const commitInfo = await gitService.trackConfigurationChange(
        options.file,
        options.env,
        options.message,
        options.author
      );
      
      console.log('✅ Configuration change tracked successfully');
      console.log(`   Commit: ${commitInfo.hash}`);
      console.log(`   Author: ${commitInfo.author}`);
      console.log(`   Time: ${commitInfo.timestamp}`);
    } catch (error) {
      console.error('❌ Failed to track configuration change:', error.message);
      process.exit(1);
    }
  });

// Show change history
program
  .command('history')
  .description('Show configuration change history')
  .option('-e, --env <environment>', 'Filter by environment')
  .option('-f, --file <file>', 'Filter by configuration file')
  .option('-n, --limit <number>', 'Limit number of entries', '10')
  .action(async (options) => {
    try {
      const gitService = new GitIntegrationService();
      const history = gitService.getChangeHistory(options.env, options.file);
      
      if (history.length === 0) {
        console.log('No configuration changes found');
        return;
      }

      const limit = parseInt(options.limit);
      const entries = history.slice(0, limit);

      console.log(`\n📋 Configuration Change History (${entries.length}/${history.length} entries)\n`);
      
      entries.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.changeDescription}`);
        console.log(`   Environment: ${entry.environment}`);
        console.log(`   File: ${entry.configFile}`);
        console.log(`   Author: ${entry.author}`);
        console.log(`   Commit: ${entry.commitHash.substring(0, 8)}`);
        console.log(`   Time: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Failed to get change history:', error.message);
      process.exit(1);
    }
  });

// Setup Git hooks
program
  .command('setup-hooks')
  .description('Setup Git hooks for configuration validation')
  .action(async () => {
    try {
      const gitService = new GitIntegrationService();
      await gitService.setupPreCommitHook();
      console.log('✅ Git hooks setup successfully');
      console.log('   Pre-commit hook will validate configuration files before commits');
    } catch (error) {
      console.error('❌ Failed to setup Git hooks:', error.message);
      process.exit(1);
    }
  });

// Validate before commit (used by pre-commit hook)
program
  .command('validate-commit')
  .description('Validate configuration files before commit (internal use)')
  .action(async () => {
    try {
      const gitService = new GitIntegrationService();
      const isValid = await gitService.validateBeforeCommit();
      
      if (isValid) {
        console.log('✅ Configuration validation passed');
        process.exit(0);
      } else {
        console.log('❌ Configuration validation failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      process.exit(1);
    }
  });

// Show configuration diff
program
  .command('diff')
  .description('Show configuration changes diff')
  .option('-c, --commit <hash>', 'Show diff for specific commit')
  .action(async (options) => {
    try {
      const gitService = new GitIntegrationService();
      const diff = gitService.getConfigurationDiff(options.commit);
      
      if (!diff) {
        console.log('No configuration changes found');
        return;
      }

      console.log('📊 Configuration Changes:\n');
      console.log(diff);
    } catch (error) {
      console.error('❌ Failed to get configuration diff:', error.message);
      process.exit(1);
    }
  });

// Revert configuration
program
  .command('revert')
  .description('Revert configuration to a specific commit')
  .requiredOption('-c, --commit <hash>', 'Commit hash to revert to')
  .option('-f, --file <file>', 'Specific file to revert (optional)')
  .option('--confirm', 'Confirm the revert operation')
  .action(async (options) => {
    try {
      if (!options.confirm) {
        console.log('⚠️  This will revert configuration changes. Use --confirm to proceed.');
        return;
      }

      const gitService = new GitIntegrationService();
      await gitService.revertToCommit(options.commit, options.file);
      
      console.log('✅ Configuration reverted successfully');
      console.log(`   Reverted to commit: ${options.commit}`);
      if (options.file) {
        console.log(`   File: ${options.file}`);
      }
    } catch (error) {
      console.error('❌ Failed to revert configuration:', error.message);
      process.exit(1);
    }
  });

// Create configuration branch
program
  .command('create-branch')
  .description('Create a new branch for configuration changes')
  .requiredOption('-e, --env <environment>', 'Environment name')
  .option('-b, --base <branch>', 'Base branch', 'main')
  .action(async (options) => {
    try {
      const gitService = new GitIntegrationService();
      const branchName = await gitService.createConfigurationBranch(options.env, options.base);
      
      console.log('✅ Configuration branch created successfully');
      console.log(`   Branch: ${branchName}`);
      console.log(`   Environment: ${options.env}`);
      console.log(`   Base: ${options.base}`);
    } catch (error) {
      console.error('❌ Failed to create configuration branch:', error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show Git integration status')
  .action(async () => {
    try {
      const gitService = new GitIntegrationService();
      
      console.log('📊 Git Integration Status\n');
      
      // Check if in Git repository
      try {
        const { execSync } = require('child_process');
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        console.log(`✅ Git repository: ${currentBranch} branch`);
      } catch {
        console.log('❌ Not in a Git repository');
        return;
      }

      // Check change history
      const history = gitService.getChangeHistory();
      console.log(`📋 Change history: ${history.length} entries`);

      // Check for staged configuration files
      try {
        const { execSync } = require('child_process');
        const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
          .split('\n')
          .filter(file => file.startsWith('config/amplify-env-vars') && file.length > 0);
        
        if (stagedFiles.length > 0) {
          console.log(`📝 Staged config files: ${stagedFiles.length}`);
          stagedFiles.forEach(file => console.log(`   - ${file}`));
        } else {
          console.log('📝 No staged configuration files');
        }
      } catch {
        console.log('📝 Unable to check staged files');
      }

      // Check for Git hooks
      const fs = require('fs');
      const hookPath = '.git/hooks/pre-commit';
      if (fs.existsSync(hookPath)) {
        console.log('🪝 Pre-commit hook: Installed');
      } else {
        console.log('🪝 Pre-commit hook: Not installed (run setup-hooks)');
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