#!/usr/bin/env node

const { securityTokenGenerator } = require('../lib/security/securityTokenGenerator');
const { tokenBackupService } = require('../lib/security/tokenBackupService');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class SecurityTokenCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Main CLI entry point
   */
  async run() {
    try {
      console.log(`${colors.cyan}${colors.bright}🔐 Huntaze Security Token Generator${colors.reset}\n`);
      
      const action = await this.selectAction();
      
      switch (action) {
        case 'generate':
          await this.generateNewTokens();
          break;
        case 'validate':
          await this.validateExistingTokens();
          break;
        case 'backup':
          await this.createBackup();
          break;
        case 'restore':
          await this.restoreFromBackup();
          break;
        case 'list':
          await this.listBackups();
          break;
        default:
          console.log(`${colors.red}Invalid action selected${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Select action to perform
   */
  async selectAction() {
    console.log('What would you like to do?');
    console.log('1. Generate new security tokens');
    console.log('2. Validate existing tokens');
    console.log('3. Create backup of current tokens');
    console.log('4. Restore tokens from backup');
    console.log('5. List available backups');
    
    const choice = await this.question('\nEnter your choice (1-5): ');
    
    const actions = {
      '1': 'generate',
      '2': 'validate',
      '3': 'backup',
      '4': 'restore',
      '5': 'list',
    };
    
    return actions[choice] || 'invalid';
  }

  /**
   * Generate new security tokens
   */
  async generateNewTokens() {
    console.log(`\n${colors.yellow}🔄 Generating new security tokens...${colors.reset}`);
    
    // Check if tokens already exist
    const existingTokens = await this.getCurrentTokens();
    if (existingTokens.adminToken && existingTokens.debugToken) {
      const overwrite = await this.question(
        `${colors.yellow}⚠️  Existing tokens found. Do you want to create a backup before generating new ones? (y/n): ${colors.reset}`
      );
      
      if (overwrite.toLowerCase() === 'y') {
        await this.createBackupFromExisting(existingTokens);
      }
    }

    // Generate new tokens
    const tokens = securityTokenGenerator.generateSecurityTokens();
    
    // Display tokens
    this.displayTokens(tokens);
    
    // Ask if user wants to save to environment file
    const saveToFile = await this.question('\nDo you want to save these tokens to a .env file? (y/n): ');
    
    if (saveToFile.toLowerCase() === 'y') {
      await this.saveTokensToEnvFile(tokens);
    }

    // Ask if user wants to create a backup
    const createBackup = await this.question('Do you want to create a backup of these tokens? (y/n): ');
    
    if (createBackup.toLowerCase() === 'y') {
      const environment = await this.question('Enter environment name (default: production): ') || 'production';
      const backupId = await tokenBackupService.createBackup(tokens, environment);
      console.log(`${colors.green}✅ Backup created with ID: ${backupId}${colors.reset}`);
    }

    console.log(`\n${colors.green}✅ Security tokens generated successfully!${colors.reset}`);
  }

  /**
   * Validate existing tokens
   */
  async validateExistingTokens() {
    console.log(`\n${colors.yellow}🔍 Validating existing tokens...${colors.reset}`);
    
    const tokens = await this.getCurrentTokens();
    
    if (!tokens.adminToken || !tokens.debugToken) {
      console.log(`${colors.red}❌ Missing tokens in environment variables${colors.reset}`);
      console.log('Please ensure ADMIN_TOKEN and DEBUG_TOKEN are set');
      return;
    }

    const validation = securityTokenGenerator.validateExistingTokens(
      tokens.adminToken,
      tokens.debugToken
    );

    console.log('\n📊 Validation Results:');
    console.log('─'.repeat(50));
    
    // Admin token validation
    console.log(`\n${colors.bright}Admin Token:${colors.reset}`);
    this.displayValidationResult(validation.admin);
    
    // Debug token validation
    console.log(`\n${colors.bright}Debug Token:${colors.reset}`);
    this.displayValidationResult(validation.debug);
    
    // Overall result
    console.log(`\n${colors.bright}Overall Status:${colors.reset}`);
    if (validation.overall) {
      console.log(`${colors.green}✅ All tokens are valid and secure${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ One or more tokens need to be regenerated${colors.reset}`);
      
      const regenerate = await this.question('\nWould you like to generate new tokens? (y/n): ');
      if (regenerate.toLowerCase() === 'y') {
        await this.generateNewTokens();
      }
    }
  }

  /**
   * Create backup of current tokens
   */
  async createBackup() {
    console.log(`\n${colors.yellow}💾 Creating backup of current tokens...${colors.reset}`);
    
    const tokens = await this.getCurrentTokens();
    
    if (!tokens.adminToken || !tokens.debugToken) {
      console.log(`${colors.red}❌ No tokens found to backup${colors.reset}`);
      return;
    }

    const environment = await this.question('Enter environment name (default: production): ') || 'production';
    
    const securityTokens = {
      adminToken: tokens.adminToken,
      debugToken: tokens.debugToken,
      generatedAt: new Date(),
      entropy: securityTokenGenerator.calculateEntropy(tokens.adminToken),
    };

    const backupId = await tokenBackupService.createBackup(securityTokens, environment);
    console.log(`${colors.green}✅ Backup created with ID: ${backupId}${colors.reset}`);
  }

  /**
   * Restore tokens from backup
   */
  async restoreFromBackup() {
    console.log(`\n${colors.yellow}📥 Restoring tokens from backup...${colors.reset}`);
    
    const backups = await tokenBackupService.listBackups();
    
    if (backups.length === 0) {
      console.log(`${colors.red}❌ No backups found${colors.reset}`);
      return;
    }

    console.log('\nAvailable backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.id} (${backup.environment}) - ${backup.createdAt}`);
    });

    const choice = await this.question('\nEnter backup number to restore: ');
    const backupIndex = parseInt(choice) - 1;
    
    if (backupIndex < 0 || backupIndex >= backups.length) {
      console.log(`${colors.red}❌ Invalid backup selection${colors.reset}`);
      return;
    }

    const selectedBackup = backups[backupIndex];
    const tokens = await tokenBackupService.restoreFromBackup(selectedBackup.id);
    
    this.displayTokens(tokens);
    
    const saveToFile = await this.question('\nDo you want to save these restored tokens to .env file? (y/n): ');
    
    if (saveToFile.toLowerCase() === 'y') {
      await this.saveTokensToEnvFile(tokens);
    }

    console.log(`${colors.green}✅ Tokens restored successfully!${colors.reset}`);
  }

  /**
   * List available backups
   */
  async listBackups() {
    console.log(`\n${colors.yellow}📋 Available backups:${colors.reset}`);
    
    const backups = await tokenBackupService.listBackups();
    
    if (backups.length === 0) {
      console.log(`${colors.red}❌ No backups found${colors.reset}`);
      return;
    }

    console.log('\n📦 Backup List:');
    console.log('─'.repeat(80));
    
    backups.forEach((backup, index) => {
      const status = backup.hasAdminToken && backup.hasDebugToken ? 
        `${colors.green}✅ Complete${colors.reset}` : 
        `${colors.red}❌ Incomplete${colors.reset}`;
      
      console.log(`${index + 1}. ${colors.bright}${backup.id}${colors.reset}`);
      console.log(`   Environment: ${backup.environment}`);
      console.log(`   Created: ${backup.createdAt}`);
      console.log(`   Status: ${status}`);
      console.log('');
    });
  }

  /**
   * Get current tokens from environment
   */
  async getCurrentTokens() {
    // Try to load from .env file first
    try {
      const envPath = path.join(process.cwd(), '.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      const envVars = this.parseEnvFile(envContent);
      
      return {
        adminToken: envVars.ADMIN_TOKEN || process.env.ADMIN_TOKEN || '',
        debugToken: envVars.DEBUG_TOKEN || process.env.DEBUG_TOKEN || '',
      };
    } catch {
      // Fall back to process.env
      return {
        adminToken: process.env.ADMIN_TOKEN || '',
        debugToken: process.env.DEBUG_TOKEN || '',
      };
    }
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
    const vars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return vars;
  }

  /**
   * Display tokens securely
   */
  displayTokens(tokens) {
    console.log('\n🔑 Generated Security Tokens:');
    console.log('─'.repeat(50));
    console.log(`${colors.bright}Admin Token:${colors.reset}`);
    console.log(`${colors.green}${tokens.adminToken}${colors.reset}`);
    console.log(`\n${colors.bright}Debug Token:${colors.reset}`);
    console.log(`${colors.green}${tokens.debugToken}${colors.reset}`);
    console.log(`\n${colors.bright}Generated:${colors.reset} ${tokens.generatedAt}`);
    console.log(`${colors.bright}Entropy:${colors.reset} ${tokens.entropy.toFixed(2)} bits`);
  }

  /**
   * Display validation result
   */
  displayValidationResult(result) {
    if (result.isValid) {
      console.log(`${colors.green}✅ Valid${colors.reset} (Length: ${result.length}, Entropy: ${result.entropy.toFixed(2)} bits)`);
    } else {
      console.log(`${colors.red}❌ Invalid${colors.reset}`);
      result.errors.forEach(error => {
        console.log(`   • ${colors.red}${error}${colors.reset}`);
      });
    }
  }

  /**
   * Save tokens to .env file
   */
  async saveTokensToEnvFile(tokens) {
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      // Try to read existing .env file
      try {
        envContent = await fs.readFile(envPath, 'utf8');
      } catch {
        // File doesn't exist, start with empty content
      }

      // Update or add token variables
      envContent = this.updateEnvVariable(envContent, 'ADMIN_TOKEN', tokens.adminToken);
      envContent = this.updateEnvVariable(envContent, 'DEBUG_TOKEN', tokens.debugToken);
      
      // Write updated content
      await fs.writeFile(envPath, envContent, 'utf8');
      
      console.log(`${colors.green}✅ Tokens saved to .env file${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to save tokens to .env file: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Update environment variable in .env content
   */
  updateEnvVariable(content, key, value) {
    const lines = content.split('\n');
    let found = false;
    
    // Update existing variable
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    
    // Add new variable if not found
    if (!found) {
      lines.push(`${key}=${value}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Create backup from existing tokens
   */
  async createBackupFromExisting(tokens) {
    const securityTokens = {
      adminToken: tokens.adminToken,
      debugToken: tokens.debugToken,
      generatedAt: new Date(),
      entropy: securityTokenGenerator.calculateEntropy(tokens.adminToken),
    };

    const backupId = await tokenBackupService.createBackup(securityTokens, 'pre-regeneration');
    console.log(`${colors.green}✅ Backup created: ${backupId}${colors.reset}`);
  }

  /**
   * Prompt user for input
   */
  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new SecurityTokenCLI();
  cli.run().catch(console.error);
}

module.exports = { SecurityTokenCLI };