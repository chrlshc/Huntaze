#!/usr/bin/env node

/**
 * AWS Amplify Environment Variables Management - Simple CLI
 * Standalone version that works without complex dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simple logger
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`)
};

// Simple AWS CLI wrapper
class SimpleAWSCLI {
  executeCommand(command) {
    try {
      return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
      throw new Error(`AWS CLI command failed: ${error.message}`);
    }
  }

  async getEnvironmentVariables(appId, branchName) {
    try {
      const command = `aws amplify get-branch --app-id ${appId} --branch-name ${branchName}`;
      const result = this.executeCommand(command);
      const branch = JSON.parse(result);
      return branch.branch.environmentVariables || {};
    } catch (error) {
      throw new Error(`Failed to get environment variables: ${error.message}`);
    }
  }

  async setEnvironmentVariable(appId, branchName, key, value) {
    try {
      const command = `aws amplify update-branch --app-id ${appId} --branch-name ${branchName} --environment-variables ${key}=${value}`;
      this.executeCommand(command);
      return true;
    } catch (error) {
      throw new Error(`Failed to set environment variable: ${error.message}`);
    }
  }

  async listApps() {
    try {
      const command = 'aws amplify list-apps';
      const result = this.executeCommand(command);
      const apps = JSON.parse(result);
      return apps.apps || [];
    } catch (error) {
      throw new Error(`Failed to list apps: ${error.message}`);
    }
  }
}

// CLI Commands
const commands = {
  async listApps() {
    logger.info('Listing Amplify apps...');
    const awsCli = new SimpleAWSCLI();
    
    try {
      const apps = await awsCli.listApps();
      
      if (apps.length === 0) {
        logger.warn('No Amplify apps found');
        return;
      }

      console.log('\n📱 Amplify Apps:');
      apps.forEach((app, index) => {
        console.log(`${index + 1}. ${app.name} (${app.appId})`);
        console.log(`   Repository: ${app.repository || 'N/A'}`);
        console.log(`   Platform: ${app.platform || 'N/A'}`);
        console.log('');
      });
    } catch (error) {
      logger.error(error.message);
      process.exit(1);
    }
  },

  async getVariables(appId, branchName) {
    logger.info(`Getting environment variables for ${appId}/${branchName}...`);
    const awsCli = new SimpleAWSCLI();
    
    try {
      const variables = await awsCli.getEnvironmentVariables(appId, branchName);
      
      if (Object.keys(variables).length === 0) {
        logger.warn('No environment variables found');
        return;
      }

      console.log('\n🔧 Environment Variables:');
      Object.entries(variables).forEach(([key, value]) => {
        // Mask sensitive values
        const maskedValue = key.toLowerCase().includes('secret') || 
                           key.toLowerCase().includes('key') || 
                           key.toLowerCase().includes('password') 
                           ? '***MASKED***' 
                           : value;
        console.log(`${key}=${maskedValue}`);
      });
    } catch (error) {
      logger.error(error.message);
      process.exit(1);
    }
  },

  async setVariable(appId, branchName, key, value) {
    logger.info(`Setting environment variable ${key} for ${appId}/${branchName}...`);
    const awsCli = new SimpleAWSCLI();
    
    try {
      await awsCli.setEnvironmentVariable(appId, branchName, key, value);
      logger.success(`Environment variable ${key} set successfully`);
    } catch (error) {
      logger.error(error.message);
      process.exit(1);
    }
  },

  showHelp() {
    console.log(`
🚀 AWS Amplify Environment Variables Management - Simple CLI

USAGE:
  node amplify-env-vars-simple.js <command> [options]

COMMANDS:
  list-apps                           List all Amplify apps
  get <app-id> <branch>              Get environment variables
  set <app-id> <branch> <key> <value> Set environment variable
  help                               Show this help

EXAMPLES:
  node amplify-env-vars-simple.js list-apps
  node amplify-env-vars-simple.js get d1234567890 main
  node amplify-env-vars-simple.js set d1234567890 main API_KEY "your-key"

PREREQUISITES:
  - AWS CLI installed and configured
  - Proper IAM permissions for Amplify operations

For full functionality, use the complete CLI tools in this directory.
`);
  }
};

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    commands.showHelp();
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'list-apps':
        await commands.listApps();
        break;
        
      case 'get':
        if (args.length < 3) {
          logger.error('Usage: get <app-id> <branch>');
          process.exit(1);
        }
        await commands.getVariables(args[1], args[2]);
        break;
        
      case 'set':
        if (args.length < 5) {
          logger.error('Usage: set <app-id> <branch> <key> <value>');
          process.exit(1);
        }
        await commands.setVariable(args[1], args[2], args[3], args[4]);
        break;
        
      default:
        logger.error(`Unknown command: ${command}`);
        commands.showHelp();
        process.exit(1);
    }
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { SimpleAWSCLI, commands };